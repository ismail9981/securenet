import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:https";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

const worker = spawn("npm", ["run", "simulation:worker"], {
  env: process.env,
  stdio: "inherit",
});
const web = spawn("npm", ["run", "start", "--", "--port", "3101"], {
  env: process.env,
  stdio: "inherit",
});
const certificateDirectory = mkdtempSync(join(tmpdir(), "securenet-e2e-tls-"));
const certificatePath = join(certificateDirectory, "certificate.pem");
const keyPath = join(certificateDirectory, "key.pem");
execFileSync(
  "openssl",
  [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    keyPath,
    "-out",
    certificatePath,
    "-days",
    "1",
    "-subj",
    "/CN=localhost",
    "-addext",
    "subjectAltName=DNS:localhost,IP:127.0.0.1",
  ],
  { stdio: "ignore" },
);

const proxy = createServer(
  {
    cert: readFileSync(certificatePath),
    key: readFileSync(keyPath),
  },
  (incoming, outgoing) => {
    const upstream = request(
      {
        headers: {
          ...incoming.headers,
          "x-forwarded-proto": "https",
        },
        hostname: "127.0.0.1",
        method: incoming.method,
        path: incoming.url,
        port: 3101,
      },
      (response) => {
        outgoing.writeHead(response.statusCode ?? 502, response.headers);
        response.pipe(outgoing);
      },
    );
    upstream.on("error", () => {
      if (!outgoing.headersSent) outgoing.writeHead(502);
      outgoing.end();
    });
    outgoing.on("close", () => upstream.destroy());
    incoming.pipe(upstream);
  },
);
proxy.listen(3100, "127.0.0.1");

let stopping = false;
function stop(signal: NodeJS.Signals = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  worker.kill(signal);
  web.kill(signal);
  proxy.close();
  rmSync(certificateDirectory, { force: true, recursive: true });
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
