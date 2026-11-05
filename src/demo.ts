import type { AppDependencies } from "./app.js";

// Synthetic data and a public demonstration credential, enabled only by opt-in.
export function createDemoDependencies(): AppDependencies {
  return {
    labs: [{ labId: "lab-01", classId: "class-01" }],
    reviews: [
      {
        reviewId: "review-001",
        labId: "lab-01",
        submissionId: "submission-001",
        status: "pending",
        submittedAt: "2026-11-05T00:00:00.000Z",
      },
    ],
    authenticate: (token) =>
      token === "demo-ta" ? { role: "ta", classIds: ["class-01"] } : undefined,
  };
}
