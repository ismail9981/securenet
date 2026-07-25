import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { requireServerSession } from "@/modules/identity/infrastructure/server-session";

export default async function OperationsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await requireServerSession();

  return <AppShell user={session.user}>{children}</AppShell>;
}
