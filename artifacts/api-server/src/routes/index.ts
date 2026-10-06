/**
 * artifacts/api-server/src/routes/index.ts
 *
 * Route barrel. All API routes come from medvault-routes.ts.
 * Do NOT import health.ts / patients.ts / doctors.ts / records.ts here —
 * those old files conflict with the Drizzle architecture.
 */
import { Router } from 'express';
import medvaultRouter from './medvault-routes';

const router = Router();
router.use(medvaultRouter);

export default router;