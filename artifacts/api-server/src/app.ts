/**
 * artifacts/api-server/src/app.ts
 *
 * dotenv MUST load here — before lib/db/src creates the Pool.
 */
import 'dotenv/config';
import express, { type Express } from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import router from './routes';

const __dir = dirname(fileURLToPath(import.meta.url));
const app: Express = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', router);

// Serve built frontend (copied here during build — see Step 3)
const publicDir = join(__dir, '../public');
app.use(express.static(publicDir));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(join(publicDir, 'index.html'));
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: err.message ?? 'Internal server error' });
});

export default app;