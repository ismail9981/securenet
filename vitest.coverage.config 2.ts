import { defineConfig, mergeConfig } from "vitest/config";

import baseConfig from "./vitest.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      coverage: {
        provider: "v8",
        reporter: ["text", "json-summary"],
        include: [
          "modules/**/domain/**/*.ts",
          "modules/**/application/**/*.ts",
        ],
        exclude: [
          "**/*.test.{ts,tsx}",
          "**/*-contracts.ts",
          "**/*-repository.ts",
        ],
        thresholds: {
          lines: 80,
          functions: 80,
          statements: 80,
          branches: 80,
        },
      },
    },
  }),
);
