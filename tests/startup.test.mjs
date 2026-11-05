import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import test from "node:test";

for (const demo of [false, true]) {
  test(
    `entry point serves HTTP with demo mode ${demo ? "on" : "off"}`,
    { timeout: 15_000 },
    async () => {
      const child = spawn(
        process.execPath,
        ["--import", "tsx", "src/index.ts"],
        {
          cwd: fileURLToPath(new URL("../", import.meta.url)),
          env: { ...process.env, PORT: "0", LAB_GRADER_DEMO: demo ? "1" : "0" },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      const closed = once(child, "close");
      let stderr = "";
      child.stderr.setEncoding("utf8").on("data", (chunk) => {
        stderr += chunk;
      });
      try {
        const baseUrl = await new Promise((resolve, reject) => {
          let output = "";
          const timer = setTimeout(
            () => reject(new Error(`Startup timed out: ${stderr}`)),
            10_000,
          );
          child.once("error", (error) => {
            clearTimeout(timer);
            reject(error);
          });
          child.once("exit", () => {
            clearTimeout(timer);
            reject(new Error(`Server exited: ${stderr}`));
          });
          child.stdout.setEncoding("utf8").on("data", (chunk) => {
            output += chunk;
            const match = /listening on (http:\/\/127\.0\.0\.1:\d+)/.exec(
              output,
            );
            if (match) {
              clearTimeout(timer);
              resolve(match[1]);
            }
          });
        });
        const response = await fetch(`${baseUrl}/labs/lab-01/review-queue`, {
          headers: { Authorization: "Bearer demo-ta" },
          signal: AbortSignal.timeout(5000),
        });
        assert.equal(response.status, demo ? 200 : 401);
        const body = await response.json();
        if (demo) assert.equal(body.items[0].reviewId, "review-001");
        else assert.equal(body.type, "urn:leetkob:problem:unauthenticated");
        assert.equal(stderr, "");
      } finally {
        child.kill();
        await closed;
      }
    },
  );
}
