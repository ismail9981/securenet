import { CircleHelp, Menu, Radio, Search, X } from "lucide-react";
import type { ReactNode } from "react";

import { DemoDataBadge } from "@/components/foundation/DemoDataBadge";
import { PortfolioDemoDisclosure } from "@/components/foundation/PortfolioDemoDisclosure";
import { RealtimeIndicator } from "@/components/realtime/RealtimeIndicator";
import { RealtimeProvider } from "@/components/realtime/RealtimeProvider";
import { OperationalNavigation } from "@/components/layout/OperationalNavigation";
import { isPortfolioMode } from "@/lib/runtime-environment";
import type { PublicUser } from "@/modules/identity/domain/user";
import { UserMenu } from "@/modules/identity/presentation/UserMenu";

function ProductMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="text-brand relative grid size-9 place-items-center border">
        <Radio aria-hidden="true" className="size-5" />
        <span className="bg-brand absolute -top-px -right-px size-1.5" />
      </div>
      <div>
        <p className="text-sm font-semibold tracking-[0.08em] uppercase">
          SecureNet
        </p>
        <p className="text-muted font-mono text-[0.58rem] tracking-[0.1em] uppercase">
          NOC / System 01
        </p>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  user,
}: Readonly<{ children: ReactNode; user: PublicUser }>) {
  const portfolioMode = isPortfolioMode();

  return (
    <RealtimeProvider>
      <div className="min-h-screen lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)]">
        <aside className="hidden border-r bg-[var(--surface-sidebar)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:px-5 lg:py-6">
          <div>
            <ProductMark />
          </div>
          <p className="text-muted mt-10 mb-3 font-mono text-[0.58rem] tracking-[0.12em] uppercase">
            Operations index
          </p>
          <div>
            <OperationalNavigation />
          </div>
          <div className="mt-auto border-t pt-4">
            <dl className="mb-4 grid grid-cols-2 gap-y-3 font-mono text-[0.58rem] uppercase">
              <div>
                <dt className="text-muted">Mode</dt>
                <dd className="text-success mt-1">Demo</dd>
              </div>
              <div>
                <dt className="text-muted">Region</dt>
                <dd className="mt-1">OM-01</dd>
              </div>
              <div>
                <dt className="text-muted">Runtime</dt>
                <dd className="mt-1">Single</dd>
              </div>
              <div>
                <dt className="text-muted">Data</dt>
                <dd className="mt-1">Fixture</dd>
              </div>
            </dl>
            <div className="flex items-start gap-2.5">
              <CircleHelp
                aria-hidden="true"
                className="text-info mt-0.5 size-4 shrink-0"
              />
              <p className="text-muted text-[0.66rem] leading-5">
                Persisted demonstration data. Single-instance, non-durable
                realtime delivery.
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b bg-[rgb(10_11_13/92%)] backdrop-blur-xl">
            <div className="flex min-h-14 items-center gap-3 px-4 md:px-7">
              <details className="group relative lg:hidden">
                <summary
                  aria-label="Toggle navigation"
                  className="bg-panel text-muted hover:text-foreground grid min-h-11 min-w-11 cursor-pointer list-none place-items-center border [&::-webkit-details-marker]:hidden"
                >
                  <Menu
                    aria-hidden="true"
                    className="size-5 group-open:hidden"
                  />
                  <X
                    aria-hidden="true"
                    className="hidden size-5 group-open:block"
                  />
                  <span className="sr-only">Toggle navigation</span>
                </summary>
                <div className="absolute top-13 left-0 w-[min(19rem,calc(100vw-2rem))] border bg-[var(--surface-sidebar)] p-5 shadow-2xl">
                  <div className="mb-5">
                    <ProductMark />
                  </div>
                  <OperationalNavigation onMobile />
                </div>
              </details>

              <label className="text-muted hidden max-w-sm flex-1 items-center gap-2 border-b px-1 sm:flex">
                <Search aria-hidden="true" className="size-4" />
                <span className="sr-only">Global search</span>
                <input
                  aria-describedby="search-foundation-note"
                  className="min-h-10 w-full bg-transparent text-sm placeholder:text-[var(--text-subtle)] disabled:cursor-not-allowed"
                  disabled
                  placeholder="Global search — planned"
                  type="search"
                />
              </label>
              <span className="sr-only" id="search-foundation-note">
                Global search is not implemented in Sprint 0.
              </span>

              <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
                <RealtimeIndicator />
                <DemoDataBadge />
                <UserMenu user={user} />
              </div>
            </div>
          </header>

          <main className="px-4 py-7 md:px-8 md:py-10">
            {portfolioMode ? (
              <div className="mx-auto mb-6 w-full max-w-7xl">
                <PortfolioDemoDisclosure />
              </div>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </RealtimeProvider>
  );
}
