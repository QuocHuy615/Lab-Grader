import { loadEnvFile } from "node:process";
import { createApp } from "./app.js";
import { createDemoDependencies } from "./demo.js";

try {
  loadEnvFile();
} catch (error) {
  // .env is optional in CI and deployments that provide environment variables.
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
    throw error;
  }
}

const portText = process.env.PORT ?? "3000";
if (!/^[0-9]+$/.test(portText) || Number(portText) > 65535) {
  throw new Error("PORT must be an integer between 0 and 65535.");
}
const demo = process.env.LAB_GRADER_DEMO === "1";
const app = createApp(
  demo
    ? createDemoDependencies()
    : { labs: [], reviews: [], authenticate: () => undefined },
);
const server = app.listen(Number(portText), "127.0.0.1", (error) => {
  if (error) throw error;
  const address = server.address();
  if (address && typeof address !== "string") {
    console.log(
      `LeeTKOB backend listening on http://127.0.0.1:${address.port}`,
    );
    if (demo) console.log("Demo mode: synthetic data only.");
  }
});
