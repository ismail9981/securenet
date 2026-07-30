import { spawn } from "node:child_process";

import { config } from "dotenv";

import { logEvent } from "../lib/logger";
import { validateRuntimeEnvironment } from "../lib/runtime-environment";

config({ path: ".env.local", quiet: true });
validateRuntimeEnvironment();

const web = spawn(
  "node_modules/.bin/next",
  ["start", ...process.argv.slice(2)],
  {
    env: process.env,
    stdio: "inherit",
  },
);

let stopping = false;
function shutdown(signal: NodeJS.Signals): void {
  if (stopping) return;
  stopping = true;
  logEvent("info", "web.lifecycle.stopping", { signal });
  web.kill(signal);
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

web.once("spawn", () => logEvent("info", "web.lifecycle.started"));
web.once("error", (error) => {
  logEvent("error", "web.lifecycle.failed", { errorName: error.name });
  process.exitCode = 1;
});
web.once("exit", (code, signal) => {
  logEvent("info", "web.lifecycle.stopped", {
    exitCode: code,
    signal,
  });
  process.exitCode = code ?? (signal ? 0 : 1);
});
