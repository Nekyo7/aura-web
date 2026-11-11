# AURA — project-context.md

> A Life Operating System disguised as an RPG. You don't just play the character, you become the character through what you do in real life.

This file is the single source of truth for architecture. Read it before proposing or writing any code.

## 0. How to read this file

Every design statement carries one of three tags. Never treat a PROPOSED or PLACEHOLDER item as confirmed.

| Tag | Meaning |
|---|---|
| **[CONFIRMED]** | From the original brief or an explicit decision |
| **[PROPOSED]** | Designed by the architect to fill a gap; needs sign-off |
| **[PLACEHOLDER]** | A number or formula used so the system runs; must be replaced with the real value |

### Decisions log

| # | Decision | Status |
|---|---|---|
| D1 | Godot/Android is replaced by a **mobile-first web app (installable PWA)** | CONFIRMED |
| D2 | **Online-only.** No offline queue, no sync conflicts | CONFIRMED |
| D3 | **No manual food / water / sleep logging.** Health needs a new system that keeps the Thriving/Neutral/Weakened tiers working | CONFIRMED |
| D4 | **Hybrid state:** immutable event ledger + cached counters | CONFIRMED |
| D5 | **Everything interacts:** one action can touch skills, attributes, kingdoms, quests, vitals, currencies, achievements | CONFIRMED |
| D6 | Replacement health model ("Vitality", section 5.3) | PROPOSED |
| D7 | Currency economy (section 5.4) | PROPOSED |
| D8 | Level curve and 19 rank thresholds (section 5.5) | PLACEHOLDER (replace with the already-designed curves) |
| D9 | Kingdoms are a **database table**, not an enum | PROPOSED |
| D10 | Alliance, Tavern, Treasury exist but their mechanics are **undefined**; do not invent them | CONFIRMED |

## 1. Product constraints that drive the architecture

1. **Real effort creates progression.** No meaningless button-press rewards.
2. **ADHD-friendly.** One-tap logging, instant visible feedback, graceful recovery, no guilt.
3. **Never destroy progress.** Skill hours, skill ranks, levels, and attributes never decrease. Penalties only ever reduce *future temporary* rewards.
4. **Health multiplier applies to XP and attribute rewards only.** Currencies and skill hours are never multiplied.
5. **Portrait mobile first**, pixel-art RPG UI, information-dense but readable.
6. **Template-generated text only** for Chronicle (no AI narrative).
7. **Modular and boring.** No microservices, no queues, no cron jobs unless a feature truly needs one.

## 2. Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript (strict) | One codebase for UI and API, PWA-capable |
| API | tRPC + Zod | End-to-end types; rules cannot drift between client and server |
| DB | PostgreSQL (Neon) + Prisma | Relational data; ledger and transactions need real ACID |
| Auth | Auth.js (Google provider, database sessions) | One-tap login |
| Server state | TanStack Query | Cache, optimistic updates, invalidation |
| Client state | Zustand | Celebration queue, modals, UI-only state |
| Styling | Tailwind + CSS variables as design tokens | Pixel fonts, tier colors, Kingdom palettes |
| Animation | `motion` + CSS `steps()` | Pixel-style level-up and bar fills |
| Charts | Hand-written SVG radar | Light, fully themeable |
| PWA | Serwist (service worker, manifest) | Installable on Android; app-shell caching only, not offline data |
| Push (Stage 2) | Web Push via service worker | Notifications on Android Chrome |
| Testing | Vitest (rules engine), Playwright (critical flows) | The rules engine is pure and must be heavily tested |
| Hosting | Vercel + Neon | No servers to run |

Use the latest stable version of each at build time.

## 3. High-level system architecture

```
┌────────────────────────── Android Chrome / Installed PWA ──────────────────────────┐
│  React UI (pixel RPG screens)                                                      │
│   ├─ TanStack Query cache  ← server truth (character, skills, quests, health)      │
│   ├─ Zustand store         ← UI only (celebration queue, modals, tab state)        │
│   └─ @/rules (shared pure TS) ← optimistic previews only, never authoritative      │
└───────────────────────────────────────┬────────────────────────────────────────────┘
                                        │ tRPC over HTTPS (Zod-validated)
┌───────────────────────────────────────▼────────────────────────────────────────────┐
│ Next.js server (Vercel)                                                            │
│  Routers (thin)  →  Services (transactions, locking)  →  Rules engine (pure)       │
│   character          activity.service  ← the ONLY write path for progression        │
│   skills             health.service     (lazy daily recompute, no cron)             │
│   quests             quest.service     (lazy period instances)                      │
│   kingdoms           wallet.service    (ledger-backed balances)                     │
│   health, wallet, achievements, chronicle                                           │
└───────────────────────────────────────┬────────────────────────────────────────────┘
                                        │ Prisma
┌───────────────────────────────────────▼────────────────────────────────────────────┐
│ PostgreSQL                                                                         │
│  LEDGERS (immutable):  ActivityEvent, AttributeDelta, CurrencyTransaction          │
│  CACHES (derived):     Character, CharacterAttribute, Skill.minutesLogged,         │
│                        UserKingdom.xp, Wallet.balance, HealthSnapshot              │
│  DEFINITIONS:          Kingdom, RankTier, Skill, Quest, Achievement, Reward        │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Request lifecycle (the golden path)

`User taps "Log 45 min Programming"` → `activity.log` mutation → server opens one DB transaction → locks the Character row → runs the reward pipeline (5.1) → writes ledger rows and updates caches atomically → returns a `RewardSummary` → client patches its caches, queues celebrations, and revalidates in the background.

**There is exactly one write path for progression: `activity.service.logActivity()`.** Nothing else may touch XP, attributes, skill minutes, wallets, or levels.

## 4. Core invariants (enforced in code and tests)

1. Ledger rows are never updated or deleted. Mistakes are fixed with a **reversal event**.
2. Every cache can be rebuilt by replaying the ledger (`rebuildCaches(userId)`).
3. Skill `minutesLogged` and `rankIndex` never decrease, except through an explicit reversal of the user's own mistaken log.
4. Currency is never multiplied by the health multiplier.
5. Rust (Stage 3) is a separate field and never modifies hours or rank.
6. All day and week boundaries use the user's timezone and `dayStartHour` (default 4 AM, so late-night work counts as "today"; PROPOSED).
7. Every mutation carries an `idempotencyKey`, so double taps and retries never double-reward.
8. Rewards are computed on the server. The client's copy of the rules is a preview only.

## 5. Domain systems

### 5.1 The Reward Engine (how everything interacts)

All progression flows through one pure function plus one transactional wrapper.

**Pure:** `computeReward(input, ctx, config) → RewardPlan` in `src/rules/reward.ts` (no DB, fully unit-tested).
**Transactional:** `activity.service.logActivity()` loads context, calls the pure function, persists the plan.

Pipeline for one action:

1. **Validate and dedupe** via `(userId, idempotencyKey)`.
2. **Lock** the user's Character row (`SELECT ... FOR UPDATE`).
3. **Resolve context:** skill, Kingdom (from skill or quest), and any open quest instances this action can advance.
4. **Health gate:** ensure today's HealthSnapshot is current, read the tier, get the multiplier (1.0 / 0.85 / 0.5). Apply the Comeback rule (5.3).
5. **Base XP:** `SKILL_LOG` = minutes × `xpPerMinute` [PLACEHOLDER]; `QUEST_COMPLETE` = `quest.baseXp`.
6. **Apply multiplier** to XP and attribute points. Currency and minutes are untouched.
7. **Attribute deltas:** skill minutes × the skill's weighted attribute split, plus the quest's explicit attribute rewards.
8. **Write ledger:** one `ActivityEvent` plus `AttributeDelta` rows.
9. **Update caches:** skill minutes then rank-up check; character XP then level-up check; attributes; Kingdom XP; skill `lastPracticedAt` and rust reset.
10. **Auto-advance quests:** quests with `SKILL_MINUTES` or `KINGDOM_MINUTES` criteria accumulate progress; completed ones emit their own `QUEST_COMPLETE` event (with `minutes = null` so time is never double-counted).
11. **Currency:** quest rewards, plus AP for level-ups and rank-ups, written to the currency ledger.
12. **Achievements** (Stage 2): evaluate unlock criteria against the new state.
13. **Recompute today's HealthSnapshot** so the player sees HP react immediately.
14. **Return `RewardSummary`:** XP, attribute deltas, level-ups, rank-ups, quests completed, currency gains, achievements, new HP, and tier.

#### Interaction map

| Player action | Skill | Attributes | Char XP/level | Kingdom | Quests | Health | Currency |
|---|---|---|---|---|---|---|---|
| Log time on a skill | +minutes, rank check, rust reset | weighted split | +XP | +XP | auto-progress matching quests | rhythm/body inputs | via completed quests, level/rank-ups |
| Complete a manual quest | +minutes if linked and timed | quest rewards + skill weights | +XP | +XP | instance completes | rhythm input | quest rewards |
| Daily check-in (optional) | no | no | no | no | no | spirit input | none |
| Spend currency | no | no | no | no | no | possible shield | debit |

**Quest and skill relationship [PROPOSED]:** a quest may link to a skill (`skillId`) and a Kingdom (`kingdomId`). A skill belongs to exactly one primary Kingdom. Quests with `criteriaType = SKILL_MINUTES` complete automatically when logged time reaches the target. One log can finish several quests.

### 5.2 Kingdoms

**[CONFIRMED]** Seven Kingdoms: Academy, Career, Alliance, Camp, Creativity, Tavern, Treasury.
**[CONFIRMED]** Academy, Career, Camp, Creativity have defined purposes. Alliance, Tavern, Treasury are **seeded with `definition = TBD`** and a neutral description. Their mechanics are deliberately not designed here.
**[PROPOSED]** Kingdoms live in a table so they can be re-themed or redefined without migrations. `UserKingdom` holds per-user state (XP now; momentum and surge fields reserved for Stage 3).

### 5.3 Health replacement: "Vitality" [PROPOSED]

**Problem:** manual hydration/hunger/energy logging is too tedious for a website, but the HP tiers must keep working.

**Idea:** HP is **derived from activity the player already logs**, with one optional 2-tap daily check-in. No extra chores.

**Four components, each 0–100, over a rolling 7-day window in the user's timezone:**

| Component | What it measures | Formula (all targets configurable) | Default weight |
|---|---|---|---|
| **Rhythm** | Showing up | `min(1, activeDays / 4) × 100` (4 of 7 days is full marks, so rest days are healthy) | 0.40 |
| **Body** | Physical activity | `min(1, bodyMinutes / bodyTarget) × 100`; `bodyMinutes` = minutes on skills flagged `countsAsBody` (default Camp skills); target 0 disables it | 0.30 |
| **Balance** | Life breadth | `min(1, distinctKingdomsActive / 3) × 100` | 0.15 |
| **Spirit** | Self-reported energy and mood | Average of the last 7 optional check-ins; **excluded if none exist** and the other weights renormalize | 0.15 |

`HP = max(HP_FLOOR, Σ weight × component)`, with `HP_FLOOR = 25` so HP never reaches zero.
**[CONFIRMED]** Tiers: **Thriving** HP ≥ 80 → ×1.00, **Neutral** 40–79 → ×0.85, **Weakened** < 40 → ×0.50 (XP and attributes only).

**Anti-guilt rules:**
- **Gentle decay:** HP falls only as active days age out of the 7-day window, so there are no sudden drops.
- **Grace period:** new accounts hold HP at 80 for 7 days (`Character.graceUntil`).
- **Comeback rule:** the first activity after 3+ inactive days is rewarded at 100% regardless of tier (`ActivityEvent.comebackBonus`).
- **Instant feedback:** any logged activity recomputes today's snapshot immediately.
- **Tier is locked at event time** and stored on the event, so the ledger is deterministic and replayable.

**Compute strategy (no cron):** `health.service.ensureUpToDate(userId)` runs on character fetch and before every reward. If `Character.healthComputedOn < today`, it backfills missing `HealthSnapshot` days from the ledger. Snapshots feed the Companion's 7–14 day average in Stage 3.

**UI:** the old vitals HUD becomes four bars (Rhythm, Body, Balance, Spirit) plus the HP number and tier badge.

### 5.4 Currency economy [PROPOSED]

All three currencies share one **generic ledger** (`CurrencyTransaction`) with cached `Wallet` balances. Earn and spend rules live in `src/rules/config/economy.ts` and can be rebalanced without schema changes. Currency is never affected by the health multiplier.

| Currency | Identity | Earned by | Spent on |
|---|---|---|---|
| **Aura Points (AP)** | Prestige tied to leveling | Level-ups, skill rank-ups, achievements | Permanent cosmetics: profile frames, titles, Kingdom banner themes, pixel-avatar parts. Never power, so progress stays honest |
| **Mew Bucks (MB)** | Everyday spendable | Quest completions | A **personal Reward Shop** where the player defines real-life treats ("episode of a show: 40 MB"). Turns discipline into guilt-free fun |
| **Chrono Chirals (CC)** | Rare, recovery-oriented | Major milestones: rank tier-ups (every III→I boundary), weekly Chronicle read, rare achievements. Hard cap on holdings (default 5) | Recovery tools: **Second Wind** (HP treated as Neutral for 24h), **Rust Ward** (freeze rust 7 days), **Rewind** (backfill a missed day within 48h) |

### 5.5 Progression curves [PLACEHOLDER]

The real curves are already designed. These values exist only so the system runs; replace them in `src/rules/config/progression.ts` and `prisma/seed/ranks.ts`.

- **Level curve:** `xpToReach(level) = round(100 × (level − 1)^1.6)`; level cap = unset (TBD).
- **Rank thresholds:** 19 tiers, `thresholdHours(i) = round(10000 × (i / 18)²)` for `i = 0..18`:

| i | Rank | Hours | | i | Rank | Hours |
|---|---|---|---|---|---|---|
| 0 | Origin I | 0 | | 10 | Archmage II | 3,086 |
| 1 | Origin II | 31 | | 11 | Archmage III | 3,735 |
| 2 | Origin III | 123 | | 12 | Prodigy I | 4,444 |
| 3 | Reaper I | 278 | | 13 | Prodigy II | 5,216 |
| 4 | Reaper II | 494 | | 14 | Prodigy III | 6,049 |
| 5 | Reaper III | 772 | | 15 | Sovereign I | 6,944 |
| 6 | Craftsman I | 1,111 | | 16 | Sovereign II | 7,901 |
| 7 | Craftsman II | 1,512 | | 17 | Sovereign III | 8,920 |
| 8 | Craftsman III | 1,975 | | 18 | Kanye | 10,000 |
| 9 | Archmage I | 2,500 | | | | |

- `xpPerMinute`, `attributePointsPerHour`, quest tier values: all [PLACEHOLDER] in config.

## 6. Database schema (Prisma)

Design notes:
- IDs are `cuid()` strings. Time spent is stored as **integer minutes** (10,000 h = 600,000 min fits in `Int`).
- **Ledger** models: `ActivityEvent`, `AttributeDelta`, `CurrencyTransaction`. **Cache** fields are commented `// CACHE`.
- Stage tags in comments show when each model is first used. All models can ship in the initial migration; later-stage tables simply stay empty.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Neon: pooled URL for runtime, direct URL for migrations
}

// ───────────────────────────── ENUMS ─────────────────────────────

enum AttributeKey {
  STR
  AGI
  INT
  CHA
  DEX
  WIS
}

enum Currency {
  AP // Aura Points
  MB // Mew Bucks
  CC // Chrono Chirals
}

enum HealthTier {
  THRIVING // HP >= 80, x1.00
  NEUTRAL  // HP 40-79, x0.85
  WEAKENED // HP < 40,  x0.50
}

enum RepeatRule {
  ONCE
  DAILY
  WEEKLY
}

enum QuestStatus {
  ACTIVE
  COMPLETED
  EXPIRED
}

enum CriteriaType {
  MANUAL         // player taps complete
  SKILL_MINUTES  // auto-completes when logged minutes on skillId reach criteriaMinutes
  KINGDOM_MINUTES
}

enum ActivityKind {
  SKILL_LOG
  QUEST_COMPLETE
  CHECK_IN_BONUS // reserved, optional
  ADJUSTMENT     // admin or rebalance corrections
  REVERSAL
}

enum CurrencyReason {
  QUEST_REWARD
  LEVEL_UP
  RANK_UP
  ACHIEVEMENT
  SHOP_PURCHASE
  RECOVERY_SPEND
  ADJUSTMENT
}

enum DefinitionStatus {
  DEFINED
  TBD // Alliance, Tavern, Treasury until their mechanics are designed
}

// ───────────────────────────── AUTH (Auth.js adapter) ─────────────────────────────

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?

  timezone     String @default("UTC") // IANA name, set during onboarding
  dayStartHour Int    @default(4)     // "today" starts at this local hour
  settings     Json   @default("{}")  // health targets, notification prefs, UI prefs

  createdAt DateTime @default(now())

  accounts     Account[]
  sessions     Session[]
  character    Character?
  skills       Skill[]
  quests       Quest[]
  questInstances QuestInstance[]
  userKingdoms UserKingdom[]
  events       ActivityEvent[]
  wallets      Wallet[]
  transactions CurrencyTransaction[]
  healthSnaps  HealthSnapshot[]
  checkIns     CheckIn[]
  achievements UserAchievement[]
  rewards      Reward[]
  chronicle    ChronicleEntry[]
  companion    Companion?
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ───────────────────────────── CHARACTER & ATTRIBUTES ─────────────────────────────

model Character {
  id     String @id @default(cuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  name      String
  avatarKey String @default("default")
  titleKey  String? // equipped title (AP cosmetic)

  // CACHE: derived from ActivityEvent.xpAwarded
  totalXp Int @default(0)
  level   Int @default(1)

  // CACHE: latest Vitality result (see HealthSnapshot)
  hp               Float      @default(80)
  healthTier       HealthTier @default(THRIVING)
  healthComputedOn DateTime?  @db.Date
  graceUntil       DateTime?  // new-account grace: HP held at 80
  healthShieldUntil DateTime? // Second Wind (CC): tier treated as at least NEUTRAL

  version   Int      @default(0) // optimistic concurrency, bumped on every progression write
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  attributes CharacterAttribute[]
}

model CharacterAttribute {
  id          String       @id @default(cuid())
  characterId String
  key         AttributeKey
  points      Float        @default(0) // CACHE: sum of AttributeDelta.points

  character Character @relation(fields: [characterId], references: [id], onDelete: Cascade)

  @@unique([characterId, key])
}

// ───────────────────────────── KINGDOMS ─────────────────────────────

model Kingdom {
  id         String           @id @default(cuid())
  slug       String           @unique // academy, career, alliance, camp, creativity, tavern, treasury
  name       String
  tagline    String?
  colorHex   String
  iconKey    String
  sortOrder  Int
  definition DefinitionStatus @default(DEFINED)
  isActive   Boolean          @default(true)

  skills       Skill[]
  quests       Quest[]
  userKingdoms UserKingdom[]
  events       ActivityEvent[]
}

model UserKingdom {
  id        String @id @default(cuid())
  userId    String
  kingdomId String

  xp Int @default(0) // CACHE: sum of ActivityEvent.xpAwarded for this Kingdom

  // Stage 3: Momentum & Surges (rolling baseline, auto-detected)
  baselineMinutesPerWeek Float     @default(0)
  surgeMultiplier        Float?
  surgeUntil             DateTime?

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  kingdom Kingdom @relation(fields: [kingdomId], references: [id])

  @@unique([userId, kingdomId])
}

// ───────────────────────────── SKILLS ─────────────────────────────

model RankTier {
  index            Int    @id // 0..18
  name             String // "Origin I" ... "Kanye"
  thresholdMinutes Int    // PLACEHOLDER values seeded from config
  colorHex         String

  skills Skill[]
}

model Skill {
  id        String @id @default(cuid())
  userId    String
  kingdomId String // one primary Kingdom per skill

  name         String
  iconKey      String?
  isCustom     Boolean @default(false)
  countsAsBody Boolean @default(false) // feeds the Vitality "Body" component

  // CACHE: sum of minutes from SKILL_LOG / timed QUEST_COMPLETE events (never decreases except via reversal)
  minutesLogged Int @default(0)
  rankIndex     Int @default(0)

  lastPracticedAt DateTime?
  rustLevel       Float     @default(0) // Stage 3. Independent of minutesLogged and rankIndex.

  archivedAt DateTime?
  createdAt  DateTime  @default(now())

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  kingdom Kingdom  @relation(fields: [kingdomId], references: [id])
  rank    RankTier @relation(fields: [rankIndex], references: [index])

  attributeWeights SkillAttributeWeight[]
  quests           Quest[]
  events           ActivityEvent[]

  @@unique([userId, name])
  @@index([userId, kingdomId])
}

model SkillAttributeWeight {
  id      String       @id @default(cuid())
  skillId String
  key     AttributeKey
  weight  Float        // relative; normalized at compute time (e.g. DEX 0.6, INT 0.4)

  skill Skill @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@unique([skillId, key])
}

// ───────────────────────────── QUESTS ─────────────────────────────

model Quest {
  id          String @id @default(cuid())
  userId      String
  kingdomId   String
  skillId     String? // optional link: timed completion logs minutes to this skill

  title       String
  description String?
  tier        Int     @default(1) // PLACEHOLDER: 1..5, scales default rewards
  repeat      RepeatRule   @default(ONCE)
  criteriaType    CriteriaType @default(MANUAL)
  criteriaMinutes Int?         // target for *_MINUTES criteria, or default minutes for manual timed quests

  baseXp   Int @default(0)
  apReward Int @default(0)
  mbReward Int @default(0)
  ccReward Int @default(0)

  templateKey String?  // set for seeded starter quests
  isArchived  Boolean  @default(false)
  createdAt   DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  kingdom Kingdom @relation(fields: [kingdomId], references: [id])
  skill   Skill?  @relation(fields: [skillId], references: [id], onDelete: SetNull)

  attributeRewards QuestAttributeReward[]
  instances        QuestInstance[]

  @@index([userId, isArchived])
}

model QuestAttributeReward {
  id      String       @id @default(cuid())
  questId String
  key     AttributeKey
  points  Float

  quest Quest @relation(fields: [questId], references: [id], onDelete: Cascade)

  @@unique([questId, key])
}

// One row per quest per period, created lazily on read (no cron needed for daily/weekly resets).
model QuestInstance {
  id       String      @id @default(cuid())
  questId  String
  userId   String
  periodKey String     // "ONCE", "2026-11-11" (daily), "2026-W46" (weekly); computed in user's timezone
  status   QuestStatus @default(ACTIVE)

  progressMinutes Int       @default(0)
  completedAt     DateTime?

  quest  Quest           @relation(fields: [questId], references: [id], onDelete: Cascade)
  user   User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  events ActivityEvent[]

  @@unique([questId, periodKey])
  @@index([userId, status])
}

// ───────────────────────────── EVENT LEDGER (immutable) ─────────────────────────────

model ActivityEvent {
  id             String       @id @default(cuid())
  userId         String
  kind           ActivityKind
  idempotencyKey String

  occurredAt DateTime // when it happened in the player's life (backfill limited to 48h)
  createdAt  DateTime @default(now()) // server time

  kingdomId       String?
  skillId         String?
  questInstanceId String?
  minutes         Int?

  baseXp           Int        @default(0)
  healthTier       HealthTier // locked at event time
  healthMultiplier Float
  comebackBonus    Boolean    @default(false)
  xpAwarded        Int        @default(0) // baseXp x multiplier
  ruleVersion      Int        // which rule config produced this event (enables replay/rebalance)
  note             String?

  // Undo / corrections: a reversal event points at the original
  reversalOfId String?        @unique
  reversalOf   ActivityEvent? @relation("Reversal", fields: [reversalOfId], references: [id])
  reversedBy   ActivityEvent? @relation("Reversal")

  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  kingdom       Kingdom?       @relation(fields: [kingdomId], references: [id])
  skill         Skill?         @relation(fields: [skillId], references: [id])
  questInstance QuestInstance? @relation(fields: [questInstanceId], references: [id])

  attributeDeltas AttributeDelta[]
  currencyTxns    CurrencyTransaction[]

  @@unique([userId, idempotencyKey])
  @@index([userId, occurredAt])
  @@index([userId, skillId, occurredAt])
  @@index([userId, kingdomId, occurredAt])
}

model AttributeDelta {
  id      String       @id @default(cuid())
  eventId String
  key     AttributeKey
  points  Float // already multiplied by healthMultiplier

  event ActivityEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([eventId])
}

// ───────────────────────────── CURRENCIES (ledger + cached wallet) ─────────────────────────────

model Wallet {
  id      String   @id @default(cuid())
  userId  String
  currency Currency
  balance Int      @default(0) // CACHE: sum of CurrencyTransaction.amount

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, currency])
}

model CurrencyTransaction {
  id           String         @id @default(cuid())
  userId       String
  currency     Currency
  amount       Int            // signed: + earn, - spend
  balanceAfter Int
  reason       CurrencyReason
  eventId      String?        // ActivityEvent that caused it
  rewardId     String?        // Reward Shop purchase
  meta         Json?          // e.g. { "recovery": "SECOND_WIND" }
  createdAt    DateTime       @default(now())

  user   User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  event  ActivityEvent? @relation(fields: [eventId], references: [id])
  reward Reward?        @relation(fields: [rewardId], references: [id])

  @@index([userId, currency, createdAt])
}

// Mew Bucks Reward Shop: player-defined real-life treats [PROPOSED]
model Reward {
  id         String   @id @default(cuid())
  userId     String
  name       String
  emoji      String?
  costMb     Int
  isArchived Boolean  @default(false)
  createdAt  DateTime @default(now())

  user         User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions CurrencyTransaction[]
}

// ───────────────────────────── VITALITY (replaces food/water/energy logging) ─────────────────────────────

model HealthSnapshot {
  id     String   @id @default(cuid())
  userId String
  date   DateTime @db.Date // user-local day

  hp      Float
  tier    HealthTier
  rhythm  Float
  body    Float
  balance Float
  spirit  Float? // null when no check-ins in window

  modelVersion Int
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
}

// Optional 2-tap daily check-in; never required, never punished when skipped
model CheckIn {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime @db.Date
  energy    Int      // 1..5
  mood      Int      // 1..5
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
}

// ───────────────────────────── ACHIEVEMENTS (Stage 2) ─────────────────────────────

model Achievement {
  id          String  @id @default(cuid())
  key         String  @unique // e.g. "seven_day_vitality", "deep_work"
  name        String
  description String
  criteria    Json    // declarative rule evaluated by rules/achievements.ts
  isSecret    Boolean @default(false)
  apReward    Int     @default(0)
  mbReward    Int     @default(0)
  ccReward    Int     @default(0)

  unlocked UserAchievement[]
}

model UserAchievement {
  id            String   @id @default(cuid())
  userId        String
  achievementId String
  unlockedAt    DateTime @default(now())

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement Achievement @relation(fields: [achievementId], references: [id])

  @@unique([userId, achievementId])
}

// ───────────────────────────── STAGE 3 ─────────────────────────────

// Weekly Chronicle: template + phrase-bank output stored as structured payload
model ChronicleEntry {
  id        String   @id @default(cuid())
  userId    String
  weekStart DateTime @db.Date
  payload   Json     // { dominantKingdom, skillChanges, healthTrend, highlights, text }
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, weekStart])
}

// Companion reflects the 7-14 day rolling HP average, not a single day
model Companion {
  id         String   @id @default(cuid())
  userId     String   @unique
  species    String
  stage      Int      @default(0)
  rollingHp  Float    @default(80)
  updatedAt  DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Removed from the Godot design:** per-vital values (Hydration, Hunger, Energy) and the consumables picker. Custom consumables are dropped. If food or water logging ever returns, it would feed the **Spirit** component rather than a separate system.

## 7. State management strategy (keeping RPG stats in sync)

### 7.1 Source of truth

| Data | Truth | Cache |
|---|---|---|
| XP, level | `ActivityEvent.xpAwarded` | `Character.totalXp`, `level` |
| Attributes | `AttributeDelta` | `CharacterAttribute.points` |
| Skill hours and rank | `ActivityEvent.minutes` | `Skill.minutesLogged`, `rankIndex` |
| Kingdom XP | `ActivityEvent` grouped by Kingdom | `UserKingdom.xp` |
| Currency | `CurrencyTransaction` | `Wallet.balance` |
| HP and tier | Ledger over the last 7 days | `HealthSnapshot`, `Character.hp` |

### 7.2 Server rules

- **One transaction per action.** Ledger rows and all cache updates commit together or not at all.
- **Concurrency:** lock the Character row with `FOR UPDATE`; `Character.version` backs a sanity check in tests.
- **Idempotency:** `(userId, idempotencyKey)` unique. The client generates a UUID per tap; a retry returns the original `RewardSummary`.
- **Lazy time-based state:** Vitality snapshots, quest periods (`QuestInstance`), and (Stage 3) rust are all computed on read from timestamps. There are no cron jobs in Stages 1–2.
- **Undo:** a `REVERSAL` event negates a mistaken log (offered for a short window in the UI). Reversals recompute caches by subtracting the original deltas.
- **Rebalance and repair:** `rebuildCaches(userId)` replays the ledger under the current rule config. `ruleVersion` on events lets us see which rules produced which rewards. Run it after any config change.
- **Drift check:** a test and an admin script compare caches against a ledger replay.

### 7.3 Client rules

- **Server state** (character, skills, quests, health, wallets) lives in TanStack Query under stable keys: `['character']`, `['skills']`, `['quests', periodKey]`, `['health']`, `['wallets']`.
- **Mutation flow for `activity.log`:**
  1. `onMutate`: use `@/rules` to produce an **optimistic preview** (bars fill, XP ticks up) and cancel in-flight queries.
  2. `onSuccess`: apply the authoritative `RewardSummary` directly into the caches (no refetch flicker) and push it onto the Zustand `celebrationQueue`.
  3. `onError`: roll back to the snapshot and show a gentle toast.
  4. `onSettled`: invalidate in the background for reconciliation.
- **Zustand holds UI-only state:** the celebration queue (level-up, rank-up, quest-complete, achievement, played in order), open modals, selected tab and Kingdom, and reduced-motion preference. It never stores game data.
- **Shared rules package:** `src/rules` is pure TypeScript with no imports from React, Prisma, or Next, so the same code powers server computation and client previews. Previews may disagree briefly; the server result always wins.
- **Online-only behavior:** if the network is down, the log button shows a calm "reconnecting" state and nothing is queued. This keeps conflict handling out of scope.

## 8. Core folder structure

```
aura/
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed/
│     ├─ index.ts
│     ├─ kingdoms.ts          # 7 Kingdoms (Alliance/Tavern/Treasury = TBD)
│     ├─ ranks.ts             # 19 RankTier rows from progression config
│     ├─ achievements.ts      # Stage 2
│     └─ starter-skills-quests.ts
├─ public/
│  ├─ manifest.webmanifest
│  ├─ fonts/                  # pixel fonts
│  └─ sprites/                # avatars, icons, Kingdom banners
├─ src/
│  ├─ app/                    # Next.js App Router
│  │  ├─ (auth)/login/
│  │  ├─ (game)/              # authenticated shell: HUD + bottom nav
│  │  │  ├─ layout.tsx
│  │  │  ├─ character/        # the character sheet (radar, attributes, rank)
│  │  │  ├─ quests/
│  │  │  ├─ skills/
│  │  │  ├─ kingdoms/
│  │  │  ├─ achievements/     # Stage 2
│  │  │  ├─ chronicle/        # Stage 3
│  │  │  └─ shop/             # MB Reward Shop, CC recovery
│  │  ├─ onboarding/
│  │  └─ api/
│  │     ├─ trpc/[trpc]/route.ts
│  │     └─ auth/[...nextauth]/route.ts
│  ├─ rules/                  # PURE TS, shared by client and server, 100% unit-tested
│  │  ├─ config/
│  │  │  ├─ progression.ts    # level curve, rank thresholds   [PLACEHOLDER]
│  │  │  ├─ economy.ts        # currency earn/spend rules      [PROPOSED]
│  │  │  ├─ vitality.ts       # weights, targets, floor, grace [PROPOSED]
│  │  │  └─ version.ts        # RULE_VERSION
│  │  ├─ reward.ts            # computeReward()
│  │  ├─ vitality.ts          # computeVitality(), tier + multiplier
│  │  ├─ level.ts             # level from XP, rank from minutes
│  │  ├─ periods.ts           # day/week keys in user's timezone
│  │  ├─ quests.ts            # criteria matching and auto-progress
│  │  ├─ achievements.ts      # Stage 2
│  │  ├─ rust.ts              # Stage 3
│  │  ├─ momentum.ts          # Stage 3
│  │  ├─ chronicle.ts         # Stage 3: template and phrase-bank engine
│  │  └─ __tests__/
│  ├─ server/
│  │  ├─ db.ts                # Prisma client singleton
│  │  ├─ auth.ts              # Auth.js config
│  │  ├─ trpc.ts              # context, procedures, auth middleware
│  │  ├─ routers/
│  │  │  ├─ _app.ts
│  │  │  ├─ character.ts
│  │  │  ├─ activity.ts       # log, undo
│  │  │  ├─ skills.ts
│  │  │  ├─ quests.ts
│  │  │  ├─ kingdoms.ts
│  │  │  ├─ health.ts         # checkIn, summary
│  │  │  ├─ wallet.ts         # balances, shop, recovery spend
│  │  │  └─ achievements.ts
│  │  ├─ services/            # transactional logic; the only code that writes progression
│  │  │  ├─ activity.service.ts
│  │  │  ├─ health.service.ts
│  │  │  ├─ quest.service.ts
│  │  │  ├─ wallet.service.ts
│  │  │  ├─ rebuild.service.ts   # replay ledger → caches
│  │  │  └─ onboarding.service.ts
│  │  └─ jobs/                # Stage 2+: only what truly needs scheduling
│  │     └─ weekly-chronicle.ts
│  ├─ client/
│  │  ├─ trpc.ts              # tRPC + TanStack Query setup
│  │  ├─ stores/
│  │  │  ├─ celebration.store.ts
│  │  │  └─ ui.store.ts
│  │  ├─ hooks/               # useCharacter, useLogActivity, useQuests, ...
│  │  └─ providers.tsx
│  ├─ components/
│  │  ├─ pixel/               # design system: PixelButton, PixelCard, PixelBar, NineSlice, TierBadge
│  │  ├─ hud/                 # persistent HP/Vitality HUD, bottom nav
│  │  ├─ character/           # RadarChart (SVG), AttributeRow, RankPlate
│  │  ├─ skills/              # SkillCard (tier-colored), LogTimeSheet
│  │  ├─ quests/              # QuestCard, QuestList
│  │  ├─ kingdoms/            # KingdomBanner, KingdomDetail
│  │  └─ feedback/            # LevelUpOverlay, RewardToast, CelebrationHost
│  ├─ styles/
│  │  ├─ tokens.css           # colors, Kingdom palettes, tier colors, spacing
│  │  └─ globals.css
│  └─ lib/                    # small utilities (ids, time, zod schemas)
├─ scripts/
│  ├─ rebuild-caches.ts       # CLI wrapper for rebuild.service
│  └─ check-drift.ts          # compares caches vs ledger replay
├─ tests/
│  └─ e2e/                    # Playwright: onboarding, log skill, complete quest, level-up
├─ project-context.md
├─ .env.example
└─ package.json
```

## 9. Staged delivery mapped to the schema

| Stage | Features | Tables and modules in active use |
|---|---|---|
| **1. Core Foundation** | Auth, onboarding, character, attributes, skills and ranks, quests (incl. auto-progress), Vitality, currencies, ledger, rebuild | `User`, `Character`, `CharacterAttribute`, `Kingdom`, `UserKingdom`, `RankTier`, `Skill`, `SkillAttributeWeight`, `Quest`, `QuestAttributeReward`, `QuestInstance`, `ActivityEvent`, `AttributeDelta`, `Wallet`, `CurrencyTransaction`, `HealthSnapshot`, `CheckIn` |
| **2. Complete RPG Experience** | Polished character sheet, Kingdom screens, quest management, skill visualization, achievements, notifications, Reward Shop, recovery items | `Achievement`, `UserAchievement`, `Reward`, Web Push |
| **3. Personal Development Ecosystem** | Chronicle, Skill Rust, Kingdom Momentum and Surges, Companion | `ChronicleEntry`, `Companion`, `Skill.rustLevel`, `UserKingdom` momentum fields |
| **4. World and Presentation** | Kingdom visual evolution, richer animation, immersive UI | Presentation layer only; no schema changes expected |

## 10. Open items (need your input before or during Stage 1)

1. **Real progression curves:** level formula, level cap, and the 19 rank thresholds (D8 is a placeholder).
2. **Vitality tuning:** are the four components, weights, 7-day window, 4-of-7 active days, and HP floor of 25 right? Should Body be on by default for everyone?
3. **Currency rules:** approve or rewrite section 5.4 (AP as cosmetics currency, MB shop, CC recovery items, CC cap).
4. **Alliance, Tavern, Treasury:** what are they? Until defined they stay `TBD` and have no special mechanics.
5. **Quest tiers:** how many tiers and what do they change (reward size, color, difficulty label)?
6. **Skill → attribute conversion:** how many attribute points per hour of a skill, and do quest attribute rewards stack on top of skill-derived points?

## 11. Rules for any AI collaborating on AURA

1. Preserve the philosophy: real-life development drives RPG progression.
2. Think like a game designer and architect, not just a code generator.
3. Keep systems consistent with this document; do not invent confirmed features.
4. Always label work as implemented, planned, or experimental.
5. Prefer modular, boring, maintainable code. No overengineering.
6. Mobile-first in every UI and technical decision.
7. Never add friction: no extra mandatory logging, no guilt mechanics, no loss of progress.
8. When proposing a feature, explain how it plugs into the Reward Engine and the rest of the ecosystem.
