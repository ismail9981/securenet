import { Radio } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DemoDataBadge } from "@/components/foundation/DemoDataBadge";
import { CursorGrid } from "@/components/foundation/CursorGrid";
import { PortfolioDemoDisclosure } from "@/components/foundation/PortfolioDemoDisclosure";
import { getDemoPassword } from "@/modules/identity/infrastructure/demo-password";
import { DEMO_ACCOUNTS } from "@/modules/identity/infrastructure/demo-accounts";
import { getServerSession } from "@/modules/identity/infrastructure/server-session";
import { LoginForm } from "@/modules/identity/presentation/LoginForm";
import {
  isPortfolioMode,
  isPublicDemoRoleAllowed,
} from "@/lib/runtime-environment";

export const metadata: Metadata = {
  title: "Demo sign in",
};

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) redirect("/dashboard");

  const demoPassword = getDemoPassword();
  const portfolioMode = isPortfolioMode();
  const demoAccounts = DEMO_ACCOUNTS.filter((account) =>
    isPublicDemoRoleAllowed(account.role),
  );

  return (
    <main className="min-h-screen p-3 sm:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-[96rem] border lg:grid-cols-[minmax(24rem,0.82fr)_minmax(34rem,1.18fr)]">
        <CursorGrid className="bg-panel hidden min-h-full border-r p-8 lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-brand relative grid size-10 place-items-center border">
                <Radio aria-hidden="true" className="size-5" />
                <span className="bg-brand absolute -top-px -right-px size-1.5" />
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
          <div className="my-16">
            <p className="section-kicker">SYS.01 / AUTHORIZED ACCESS</p>
            <h1 className="mt-5 max-w-[9ch] text-6xl leading-[0.92] font-medium tracking-[-0.065em] xl:text-7xl">
              Monitor a simulated network environment
            </h1>
            <p className="text-muted mt-7 max-w-lg text-sm leading-7">
              A controlled enterprise network-operations demonstration for
              inventory, telemetry, alert lifecycle, topology, and reporting.
            </p>
          </div>
          <dl className="grid grid-cols-2 border-t border-l font-mono text-[0.62rem] sm:grid-cols-4">
            {[
              ["MODE", "PORTFOLIO"],
              ["ACCESS", "VIEWER"],
              ["DATA", "SIMULATED"],
              ["REGION", "OM-01"],
            ].map(([label, value]) => (
              <div className="border-r border-b p-3" key={label}>
                <dt className="text-muted">{label}</dt>
                <dd className="mt-1">{value}</dd>
              </div>
            ))}
          </dl>
        </CursorGrid>

        <div className="flex min-w-0 flex-col justify-center px-4 py-8 sm:px-8 lg:px-10 xl:px-16">
          <header className="mb-8 lg:hidden">
            <div className="mb-7 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="text-brand grid size-10 place-items-center border">
                  <Radio aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <p className="font-semibold tracking-wide">SecureNet</p>
                  <p className="text-muted text-xs uppercase">
                    Network Monitoring Center
                  </p>
                </div>
              </div>
              <DemoDataBadge />
            </div>
            <p className="section-kicker">SYS.01 / AUTHORIZED ACCESS</p>
            <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em]">
              Monitor a simulated network environment
            </h1>
          </header>
          {portfolioMode ? (
            <div className="mb-6">
              <PortfolioDemoDisclosure />
            </div>
          ) : null}
          <LoginForm demoAccounts={demoAccounts} demoPassword={demoPassword} />
        </div>
      </div>
    </main>
  );
}
