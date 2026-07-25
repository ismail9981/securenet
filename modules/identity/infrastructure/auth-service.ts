import { authenticateUser } from "@/modules/identity/application/authenticate-user";
import { BcryptPasswordVerifier } from "@/modules/identity/infrastructure/bcrypt-password-verifier";
import { DemoUserRepository } from "@/modules/identity/infrastructure/demo-user-repository";

const users = new DemoUserRepository();
const passwords = new BcryptPasswordVerifier();

export async function authenticateDemoUser(email: string, password: string) {
  return authenticateUser({ email, password }, { users, passwords });
}
