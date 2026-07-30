import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    include: ["**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["modules/**/domain/**/*.ts", "modules/**/application/**/*.ts"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*-contracts.ts",
        "**/*-repository.ts",
        "**/*-errors.ts",
        "**/*-verifier.ts",
        // Process integration orchestration; pure simulation rules remain included.
        "modules/simulation/application/simulation-runtime.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": new URL("./", import.meta.url).pathname,
    },
  },
});
