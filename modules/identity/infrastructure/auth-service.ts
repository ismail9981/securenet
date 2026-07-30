import { authenticateUser } from "@/modules/identity/application/authenticate-user";
import { BcryptPasswordVerifier } from "@/modules/identity/infrastructure/bcrypt-password-verifier";
import { DemoUserRepository } from "@/modules/identity/infrastructure/demo-user-repository";
import { isPublicDemoRoleAllowed } from "@/lib/runtime-environment";

const users = new DemoUserRepository();
const passwords = new BcryptPasswordVerifier();

export async function authenticateDemoUser(email: string, password: string) {
  const result = await authenticateUser(
    { email, password },
    { users, passwords },
  );
  if (result.ok && !isPublicDemoRoleAllowed(result.user.role)) {
    return { ok: false, code: "AUTH_INVALID_CREDENTIALS" } as const;
  }
  return result;
}
