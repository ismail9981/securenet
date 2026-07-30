import { Radio } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DemoDataBadge } from "@/components/foundation/DemoDataBadge";
import { getDemoPassword } from "@/modules/identity/infrastructure/demo-password";
import { DEMO_ACCOUNTS } from "@/modules/identity/infrastructure/demo-accounts";
import { getServerSession } from "@/modules/identity/infrastructure/server-session";
import { LoginForm } from "@/modules/identity/presentation/LoginForm";
import { isPublicDemoRoleAllowed } from "@/lib/runtime-environment";

export const metadata: Metadata = {
  title: "Demo sign in",
};

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) redirect("/dashboard");

  const demoPassword = getDemoPassword();
  const demoAccounts = DEMO_ACCOUNTS.filter((account) =>
    isPublicDemoRoleAllowed(account.role),
  );

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:grid lg:place-items-center">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="border-brand/30 bg-brand/10 text-brand grid size-10 place-items-center rounded-lg border">
                <Radio aria-hidden="true" className="size-5" />
              </div>
              <div>
                <p className="font-semibold tracking-wide">SecureNet</p>
                <p className="text-muted text-xs tracking-[0.12em] uppercase">
                  Network Monitoring Center
                </p>
              </div>
            </div>
            <DemoDataBadge />
          </div>
          <p className="text-brand text-xs font-semibold tracking-[0.16em] uppercase">
            Authorized Demo access
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Monitor a simulated network environment
          </h1>
          <p className="text-muted mt-3 max-w-2xl text-sm leading-6 sm:text-base">
            Sign in with a deterministic Demo account to inspect the static
            Sprint 1 dashboard. Authentication is intentionally Demo-only and is
            not a production account system.
          </p>
        </header>
        <LoginForm demoAccounts={demoAccounts} demoPassword={demoPassword} />
      </div>
    </main>
  );
}
