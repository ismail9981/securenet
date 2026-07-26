import { hash } from "bcryptjs";

import type {
  UserRepository,
  UserWithPasswordHash,
} from "@/modules/identity/application/user-repository";
import { getDemoPassword } from "@/modules/identity/infrastructure/demo-password";

const BCRYPT_COST = 12;

const DEMO_USERS: readonly Omit<UserWithPasswordHash, "passwordHash">[] = [
  {
    id: "01f1c115-4481-4a6e-8d45-5b7510afbd1a",
    name: "Amina Al-Harthi",
    email: "admin@securenet.demo",
    role: "ADMIN",
    status: "ACTIVE",
  },
  {
    id: "6f3a8aa8-f6a1-4c24-9252-e49706dc973b",
    name: "Nasser Al-Balushi",
    email: "engineer@securenet.demo",
    role: "NETWORK_ENGINEER",
    status: "ACTIVE",
  },
  {
    id: "a8785311-78fa-4d3e-8f15-0511adb68597",
    name: "Maha Al-Rashdi",
    email: "viewer@securenet.demo",
    role: "VIEWER",
    status: "ACTIVE",
  },
] as const;

const passwordHashCache = new Map<
  string,
  { readonly password: string; readonly value: Promise<string> }
>();

function getPasswordHash(userId: string): Promise<string> {
  const password = getDemoPassword();
  const cached = passwordHashCache.get(userId);

  if (cached?.password === password) {
    return cached.value;
  }

  const value = hash(password, BCRYPT_COST);
  passwordHashCache.set(userId, { password, value });
  return value;
}

export class DemoUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserWithPasswordHash | null> {
    const user = DEMO_USERS.find((candidate) => candidate.email === email);

    if (!user) {
      return null;
    }

    return {
      ...user,
      passwordHash: await getPasswordHash(user.id),
    };
  }
}
