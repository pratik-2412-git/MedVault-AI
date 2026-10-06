/**
 * artifacts/api-server/src/app.ts
 *
 * dotenv MUST load here — before lib/db/src creates the Pool.
 */
import 'dotenv/config';

import express, { type Express } from 'express';
import cors from 'cors';
import router from './routes';

const app: Express = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', router);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: err.message ?? 'Internal server error' });
});

export default app;