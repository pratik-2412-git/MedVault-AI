/**
 * lib/db/src/index.ts
 *
 * Drizzle db instance + all table exports.
 * No .ts extension on imports — allowImportingTsExtensions is not enabled.
 * The legacy schema/ folder must be deleted so './schema' resolves to schema.ts
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });

export {
  facilitiesTable,
  patientsTable,
  doctorsTable,
  clinicalRecordsTable,
  documentsTable,
  aiSummariesTable,
  auditLogsTable,
  consentsTable,
} from './schema';