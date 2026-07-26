import type { UserRole } from "@/modules/shared/domain/network";

export interface DemoAccount {
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
}

export const DEMO_ACCOUNTS = [
  {
    name: "Amina Al-Harthi",
    email: "admin@securenet.demo",
    role: "ADMIN",
  },
  {
    name: "Nasser Al-Balushi",
    email: "engineer@securenet.demo",
    role: "NETWORK_ENGINEER",
  },
  {
    name: "Maha Al-Rashdi",
    email: "viewer@securenet.demo",
    role: "VIEWER",
  },
] as const satisfies readonly DemoAccount[];
