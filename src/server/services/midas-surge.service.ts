import { db } from "@/server/db";
import type { Prisma, PrismaClient } from "@prisma/client";

export interface MidasSurgeStatus {
  isActive: boolean;
  expiresAt: Date | null;
  remainingHours: number;
}

/**
 * Checks whether Midas Surge is active for the user.
 * Evaluates both user.settings.midasSurgeUntil and recent CurrencyTransaction records.
 */
export async function getMidasSurgeStatus(
  userId: string,
  tx: Prisma.TransactionClient | PrismaClient = db
): Promise<MidasSurgeStatus> {
  const now = new Date();

  // 1. Check user.settings
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { settings: true },
  });

  const settings = user?.settings as Record<string, any> | null;
  if (settings?.midasSurgeUntil) {
    const expiresAt = new Date(settings.midasSurgeUntil);
    if (expiresAt > now) {
      const remainingMs = expiresAt.getTime() - now.getTime();
      const remainingHours = Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60)));
      return {
        isActive: true,
        expiresAt,
        remainingHours,
      };
    }
  }

  // 2. Fallback check in CurrencyTransaction for any RECOVERY_SPEND with MIDAS_SURGE in the last 24 hours
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const surgeTx = await tx.currencyTransaction.findFirst({
    where: {
      userId,
      reason: "RECOVERY_SPEND",
      createdAt: { gte: oneDayAgo },
    },
    orderBy: { createdAt: "desc" },
  });

  if (surgeTx && (surgeTx.meta as any)?.recoveryItem === "MIDAS_SURGE") {
    const expiresAt = new Date(surgeTx.createdAt.getTime() + 24 * 60 * 60 * 1000);
    if (expiresAt > now) {
      const remainingMs = expiresAt.getTime() - now.getTime();
      const remainingHours = Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60)));
      return {
        isActive: true,
        expiresAt,
        remainingHours,
      };
    }
  }

  return {
    isActive: false,
    expiresAt: null,
    remainingHours: 0,
  };
}

/**
 * Activates or extends Midas Surge for the given number of hours (default 24h).
 */
export async function activateMidasSurge(
  userId: string,
  hours: number = 24,
  tx: Prisma.TransactionClient | PrismaClient = db
): Promise<Date> {
  const currentStatus = await getMidasSurgeStatus(userId, tx);
  const baseTime = currentStatus.isActive && currentStatus.expiresAt ? currentStatus.expiresAt : new Date();
  const newExpiresAt = new Date(baseTime.getTime() + hours * 60 * 60 * 1000);

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
        midasSurgeUntil: newExpiresAt.toISOString(),
      },
    },
  });

  return newExpiresAt;
}
