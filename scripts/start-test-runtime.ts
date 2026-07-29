import { spawn } from "node:child_process";

const worker = spawn("npm", ["run", "simulation:worker"], {
  env: process.env,
  stdio: "inherit",
});
const web = spawn("npm", ["run", "start", "--", "--port", "3100"], {
  env: process.env,
  stdio: "inherit",
});

let stopping = false;
function stop(signal: NodeJS.Signals = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  worker.kill(signal);
  web.kill(signal);
}

process.once("SIGINT", () => stop("SIGINT"));
process.once("SIGTERM", () => stop("SIGTERM"));
worker.once("exit", (code) => {
  if (!stopping && code !== 0) {
    stop();
    process.exitCode = code ?? 1;
  }
});
web.once("exit", (code) => {
  stop();
  process.exitCode = code ?? 0;
});
