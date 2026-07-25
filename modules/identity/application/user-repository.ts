import type { User } from "@/modules/identity/domain/user";

export interface UserWithPasswordHash extends User {
  readonly passwordHash: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserWithPasswordHash | null>;
}
