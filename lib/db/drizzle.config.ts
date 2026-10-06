/**
 * lib/db/drizzle.config.ts
 */
import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load from monorepo root .env
config({ path: resolve(__dirname, '../../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in root .env');
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL },
});