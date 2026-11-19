"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
<<<<<<< HEAD
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
=======
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
>>>>>>> origin/main
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center" }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Something went wrong</h1>
      <p style={{ margin: 0, color: "#555", maxWidth: 340 }}>
        We ran into an unexpected error. Please try again.
      </p>
      <button
<<<<<<< HEAD
        type="button"
        className="btn btn-primary"
        onClick={() => reset()}
=======
        className="btn btn-primary"
        onClick={() => unstable_retry()}
>>>>>>> origin/main
        style={{ padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer" }}
      >
        Try again
      </button>
    </div>
  );
}
