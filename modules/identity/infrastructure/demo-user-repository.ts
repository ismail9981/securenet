import type {
  UserRepository,
  UserWithPasswordHash,
} from "@/modules/identity/application/user-repository";

const DEMO_USERS: readonly UserWithPasswordHash[] = [
  {
    id: "01f1c115-4481-4a6e-8d45-5b7510afbd1a",
    name: "Amina Al-Harthi",
    email: "admin@securenet.demo",
    passwordHash:
      "$2b$12$.PjQuByGB13x9QiTrWnZP.HYc03EuJ8AjbDBc4wg/lny7lS62ybdq",
    role: "ADMIN",
    status: "ACTIVE",
  },
  {
    id: "6f3a8aa8-f6a1-4c24-9252-e49706dc973b",
    name: "Nasser Al-Balushi",
    email: "engineer@securenet.demo",
    passwordHash:
      "$2b$12$yaBhOamqY4/SXlRqhzIm1eSVtJr7XGjQBYWe8vd1Gi2NID0aDtMra",
    role: "NETWORK_ENGINEER",
    status: "ACTIVE",
  },
  {
    id: "a8785311-78fa-4d3e-8f15-0511adb68597",
    name: "Maha Al-Rashdi",
    email: "viewer@securenet.demo",
    passwordHash:
      "$2b$12$fWAiyXTSjQpfvxIVgP3EieDQ.2m2dCGEJMthCqd2IKKNQk9C9xfla",
    role: "VIEWER",
    status: "ACTIVE",
  },
] as const;

export class DemoUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserWithPasswordHash | null> {
    return DEMO_USERS.find((user) => user.email === email) ?? null;
  }
}
