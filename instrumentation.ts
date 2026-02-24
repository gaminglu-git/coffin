/**
 * Next.js Instrumentation - runs when the server starts.
 * Validates environment variables and can initialize error tracking.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("./src/lib/env");
    validateEnv();

    // Error tracking (e.g. Sentry) can be initialized here:
    // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    //   const Sentry = await import("@sentry/nextjs");
    //   Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, ... });
    // }
  }
}
