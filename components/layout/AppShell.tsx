import {
  Activity,
  Bell,
  CircleHelp,
  ListTree,
  Menu,
  Network,
  Radio,
  Search,
  Server,
  X,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { DemoDataBadge } from "@/components/foundation/DemoDataBadge";
import { RealtimeIndicator } from "@/components/realtime/RealtimeIndicator";
import { RealtimeProvider } from "@/components/realtime/RealtimeProvider";
import type { PublicUser } from "@/modules/identity/domain/user";
import { UserMenu } from "@/modules/identity/presentation/UserMenu";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/devices", label: "Devices", icon: Server },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/events", label: "Events", icon: ListTree },
  { href: "/topology", label: "Topology", icon: Network },
] as const;

function ProductMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="border-brand/30 bg-brand/10 text-brand grid size-9 place-items-center rounded-lg border">
        <Radio aria-hidden="true" className="size-5" />
      </div>
      <div>
        <p className="text-sm font-semibold tracking-wide">SecureNet</p>
        <p className="text-muted text-[0.68rem] tracking-[0.12em] uppercase">
          Monitoring center
        </p>
      </div>
    </div>
  );
}

function NavigationLinks({ onMobile = false }: { onMobile?: boolean }) {
  return (
    <nav
      aria-label={onMobile ? "Mobile primary navigation" : "Primary navigation"}
    >
      <ul className="space-y-1">
        {navigation.map(({ href, icon: Icon, label }) => (
          <li key={href}>
            <Link
              className="text-muted hover:bg-panel-raised hover:text-foreground flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              href={href}
            >
              <Icon aria-hidden="true" className="size-4.5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AppShell({
  children,
  user,
}: Readonly<{ children: ReactNode; user: PublicUser }>) {
  return (
    <RealtimeProvider>
      <div className="min-h-screen lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden border-r bg-[var(--surface-sidebar)] lg:flex lg:min-h-screen lg:flex-col lg:p-4">
          <div className="px-2 py-2">
            <ProductMark />
          </div>
          <div className="mt-8">
            <NavigationLinks />
          </div>
          <div className="bg-panel mt-auto rounded-xl border p-3">
            <div className="flex items-start gap-2.5">
              <CircleHelp
                aria-hidden="true"
                className="text-info mt-0.5 size-4 shrink-0"
              />
              <p className="text-muted text-xs leading-5">
                Demo environment. Device inventory, Alerts, and Events are
                persisted; realtime delivery is single-instance and non-durable.
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b bg-[rgb(7_16_24/92%)] backdrop-blur">
            <div className="flex min-h-16 items-center gap-3 px-4 md:px-6">
              <details className="group relative lg:hidden">
                <summary
                  aria-label="Toggle navigation"
                  className="bg-panel text-muted hover:text-foreground grid min-h-11 min-w-11 cursor-pointer list-none place-items-center rounded-lg border [&::-webkit-details-marker]:hidden"
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
                <div className="absolute top-13 left-0 w-[min(19rem,calc(100vw-2rem))] rounded-xl border bg-[var(--surface-sidebar)] p-4 shadow-2xl">
                  <div className="mb-5">
                    <ProductMark />
                  </div>
                  <NavigationLinks onMobile />
                </div>
              </details>

              <label className="bg-panel text-muted hidden max-w-md flex-1 items-center gap-2 rounded-lg border px-3 sm:flex">
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

          <main className="px-4 py-6 md:px-6 md:py-8">{children}</main>
        </div>
      </div>
    </RealtimeProvider>
  );
}
