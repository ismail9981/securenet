import type { PasswordVerifier } from "@/modules/identity/application/password-verifier";
import type { UserRepository } from "@/modules/identity/application/user-repository";
import { toPublicUser, type PublicUser } from "@/modules/identity/domain/user";

export interface AuthenticationCredentials {
  readonly email: string;
  readonly password: string;
}

export type AuthenticationResult =
  | { readonly ok: true; readonly user: PublicUser }
  | { readonly ok: false; readonly code: "AUTH_INVALID_CREDENTIALS" };

export async function authenticateUser(
  credentials: AuthenticationCredentials,
  dependencies: {
    readonly users: UserRepository;
    readonly passwords: PasswordVerifier;
  },
): Promise<AuthenticationResult> {
  const normalizedEmail = credentials.email.trim().toLowerCase();
  const user = await dependencies.users.findByEmail(normalizedEmail);

  if (!user || user.status !== "ACTIVE") {
    return { ok: false, code: "AUTH_INVALID_CREDENTIALS" };
  }

  const passwordMatches = await dependencies.passwords.verify(
    credentials.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    return { ok: false, code: "AUTH_INVALID_CREDENTIALS" };
  }

  return { ok: true, user: toPublicUser(user) };
}
