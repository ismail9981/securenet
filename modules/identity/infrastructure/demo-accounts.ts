import type { UserRole } from "@/modules/shared/domain/network";

export interface DemoAccount {
  readonly email: string;
  readonly name: string;
  readonly password: string;
  readonly role: UserRole;
}

export const DEMO_ACCOUNTS = [
  {
    name: "Amina Al-Harthi",
    email: "admin@securenet.demo",
    password: "SecureNet-Demo-Admin-2026!",
    role: "ADMIN",
  },
  {
    name: "Nasser Al-Balushi",
    email: "engineer@securenet.demo",
    password: "SecureNet-Demo-Engineer-2026!",
    role: "NETWORK_ENGINEER",
  },
  {
    name: "Maha Al-Rashdi",
    email: "viewer@securenet.demo",
    password: "SecureNet-Demo-Viewer-2026!",
    role: "VIEWER",
  },
] as const satisfies readonly DemoAccount[];
