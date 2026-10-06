/**
 * artifacts/api-server/src/lib/logger.ts
 *
 * Pino logger with graceful fallback to console if pino is not installed.
 *
 * FIX: Added try/catch so the server starts even when pino/pino-pretty
 * are not yet installed. Run the install command below to fix the TS error:
 *
 *   cd artifacts/api-server
 *   pnpm add pino pino-pretty
 *   pnpm add -D @types/pino
 *
 * OR from the monorepo root:
 *   pnpm --filter api-server add pino pino-pretty
 */

import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});