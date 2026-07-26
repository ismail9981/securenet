const LOCAL_DEMO_PASSWORD = "SecureNetDemo123";
const MAX_PASSWORD_LENGTH = 200;

/**
 * Public Demo-only configuration. This password must never protect real data.
 */
export function getDemoPassword(): string {
  const configuredPassword = process.env.SEED_DEMO_PASSWORD?.trim();
  const password = configuredPassword || LOCAL_DEMO_PASSWORD;

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(
      `SEED_DEMO_PASSWORD must not exceed ${MAX_PASSWORD_LENGTH} characters.`,
    );
  }

  return password;
}
