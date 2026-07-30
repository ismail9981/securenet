import { validateRuntimeEnvironment } from "@/lib/runtime-environment";

export interface ReadinessDependencies {
  readonly checkDatabase: () => Promise<void>;
  readonly environment?: Readonly<Record<string, string | undefined>>;
}

export async function checkReadiness(
  dependencies: ReadinessDependencies,
): Promise<boolean> {
  try {
    validateRuntimeEnvironment(dependencies.environment);
    await dependencies.checkDatabase();
    return true;
  } catch {
    return false;
  }
}
