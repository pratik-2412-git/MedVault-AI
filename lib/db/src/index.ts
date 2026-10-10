/**
 * lib/db/src/index.ts
 *
 * Drizzle db instance + all table exports.
 * DATABASE_URL must be set before this module loads.
 * api-server/src/app.ts loads dotenv first, so this is safe.
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
  doctorPatientAssignmentsTable,
} from './schema';