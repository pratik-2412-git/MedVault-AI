import { cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const src = 'artifacts/medvault-ai/dist';
const dest = 'artifacts/api-server/public';

if (existsSync(dest)) await rm(dest, { recursive: true });
await cp(src, dest, { recursive: true });
console.log('Copied frontend build →', dest);