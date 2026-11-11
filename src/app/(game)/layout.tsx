import React from "react";
import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { GameShell } from "@/components/game/GameShell";

export const instant = false;

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/");
  }

  return <GameShell user={session.user}>{children}</GameShell>;
}
