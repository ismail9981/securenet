import { compare } from "bcryptjs";

import type { PasswordVerifier } from "@/modules/identity/application/password-verifier";

export class BcryptPasswordVerifier implements PasswordVerifier {
  async verify(
    plainTextPassword: string,
    passwordHash: string,
  ): Promise<boolean> {
    return compare(plainTextPassword, passwordHash);
  }
}
