"use client";

import {
  Activity,
  Bell,
  BarChart3,
  ListTree,
  Network,
  Server,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/dashboard", index: "01", label: "Dashboard", icon: Activity },
  { href: "/devices", index: "02", label: "Devices", icon: Server },
  { href: "/alerts", index: "03", label: "Alerts", icon: Bell },
  { href: "/events", index: "04", label: "Events", icon: ListTree },
  { href: "/topology", index: "05", label: "Topology", icon: Network },
  { href: "/reports", index: "06", label: "Reports", icon: BarChart3 },
  { href: "/settings", index: "07", label: "Settings", icon: Settings },
] as const;

export function OperationalNavigation({
  onMobile = false,
}: {
  readonly onMobile?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={onMobile ? "Mobile primary navigation" : "Primary navigation"}
    >
      <ol className="operation-navigation">
        {navigation.map(({ href, icon: Icon, index, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link aria-current={active ? "page" : undefined} href={href}>
                <span className="operation-navigation__index">{index}</span>
                <Icon aria-hidden="true" className="size-4" />
                <span>{label}</span>
                <span
                  aria-hidden="true"
                  className="operation-navigation__line"
                />
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
