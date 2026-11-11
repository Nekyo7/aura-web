import { db } from "@/server/db";
import type { Prisma, PrismaClient } from "@prisma/client";

export interface RustWardStatus {
  isActive: boolean;
  expiresAt: Date | null;
  remainingDays: number;
}

/**
 * Checks whether a Rust Ward is active for the user.
 * Evaluates both user.settings.rustWardUntil and recent CurrencyTransaction records.
 */
export async function getRustWardStatus(
  userId: string,
  tx: Prisma.TransactionClient | PrismaClient = db
): Promise<RustWardStatus> {
  const now = new Date();

  // 1. Check user.settings
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { settings: true },
  });

  const settings = user?.settings as Record<string, any> | null;
  if (settings?.rustWardUntil) {
    const expiresAt = new Date(settings.rustWardUntil);
    if (expiresAt > now) {
      const remainingMs = expiresAt.getTime() - now.getTime();
      const remainingDays = Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
      return {
        isActive: true,
        expiresAt,
        remainingDays,
      };
    }
  }

  // 2. Fallback check in CurrencyTransaction for any RECOVERY_SPEND with RUST_WARD in the last 7 days
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const wardTx = await tx.currencyTransaction.findFirst({
    where: {
      userId,
      reason: "RECOVERY_SPEND",
      createdAt: { gte: sevenDaysAgo },
    },
    orderBy: { createdAt: "desc" },
  });

  if (wardTx && (wardTx.meta as any)?.recoveryItem === "RUST_WARD") {
    const expiresAt = new Date(wardTx.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (expiresAt > now) {
      const remainingMs = expiresAt.getTime() - now.getTime();
      const remainingDays = Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
      return {
        isActive: true,
        expiresAt,
        remainingDays,
      };
    }
  }

  return {
    isActive: false,
    expiresAt: null,
    remainingDays: 0,
  };
}

/**
 * Activates or extends a Rust Ward for the given number of days.
 */
export async function activateRustWard(
  userId: string,
  days: number = 7,
  tx: Prisma.TransactionClient | PrismaClient = db
): Promise<Date> {
  const currentStatus = await getRustWardStatus(userId, tx);
  const baseTime = currentStatus.isActive && currentStatus.expiresAt ? currentStatus.expiresAt : new Date();
  const newExpiresAt = new Date(baseTime.getTime() + days * 24 * 60 * 60 * 1000);

  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { settings: true },
  });

  const settings = (user?.settings as Record<string, any>) || {};
  await tx.user.update({
    where: { id: userId },
    data: {
      settings: {
        ...settings,
        rustWardUntil: newExpiresAt.toISOString(),
      },
    },
  });

  return newExpiresAt;
}

