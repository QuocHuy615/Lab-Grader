import type { Response } from "express";

const problems = {
  "invalid-request": [400, "Invalid request"],
  unauthenticated: [401, "Authentication required"],
  forbidden: [403, "Access denied"],
  "not-found": [404, "Resource not found"],
  "method-not-allowed": [405, "Method not allowed"],
  "internal-error": [500, "Internal server error"],
} as const;

export function problem(
  response: Response,
  instance: string,
  code: keyof typeof problems,
  detail: string,
) {
  const [status, title] = problems[code];
  response.set("Cache-Control", "no-store");
  if (status === 401) response.set("WWW-Authenticate", "Bearer");
  if (status === 405) response.set("Allow", "GET");
  response
    .status(status)
    .type("application/problem+json")
    .json({
      type: `urn:leetkob:problem:${code}`,
      title,
      status,
      detail,
      instance,
    });
}
