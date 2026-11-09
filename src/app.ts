import express, { type ErrorRequestHandler } from "express";
import { authenticateTa, reviewQueue } from "./review-queue.js";
import { problem } from "./problem.js";

export interface Principal {
  role: "ta" | "student" | "admin";
  classIds: readonly string[];
}
export interface Lab {
  labId: string;
  classId: string;
}
export interface Review {
  reviewId: string;
  labId: string;
  submissionId: string;
  status: "pending" | "in_review" | "completed";
  submittedAt: string;
}
export interface AppDependencies {
  labs: readonly Lab[];
  reviews: readonly Review[];
  // Resolve opaque credentials server-side; never trust roles supplied by callers.
  authenticate: (token: string) => Principal | undefined;
}

export function createApp(dependencies: AppDependencies) {
  const app = express();
  app.disable("x-powered-by");
  app.disable("etag");
  app.enable("case sensitive routing");
  app.enable("strict routing");

  // Match without capturing/decoding params so authentication precedes validation.
  app.all(
    /^\/labs\/[^/]+\/review-queue$/,
    (request, response, next) => {
      if (request.method !== "GET") {
        problem(
          response,
          request.path,
          "method-not-allowed",
          "Use GET for this endpoint.",
        );
        return;
      }
      next();
    },
    authenticateTa(dependencies),
  );
  app.get("/labs/:labId/review-queue", reviewQueue(dependencies));

  app.use((request, response) => {
    problem(response, request.path, "not-found", "Route not found.");
  });

  const handleError: ErrorRequestHandler = (
    error: unknown,
    request,
    response,
    next,
  ) => {
    if (response.headersSent) {
      next(error);
      return;
    }
    if (
      error instanceof URIError &&
      "status" in error &&
      error.status === 400
    ) {
      problem(
        response,
        request.path,
        "invalid-request",
        "labId must be a valid encoded identifier.",
      );
      return;
    }
    problem(response, "/", "internal-error", "An unexpected error occurred.");
  };
  app.use(handleError);
  return app;
}
