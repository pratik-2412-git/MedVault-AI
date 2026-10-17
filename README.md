# MedVault AI

**Smart India Hackathon 2026 · Healthcare Track**

A role-based medical records platform with AI-powered clinical summaries. Doctors manage patient records and generate AI clinical summaries; patients get secure, read-only access to their own history. Every sensitive action is audit-logged.

**Live demo:** _add your Railway URL here once deployed_

---

## Problem statement

India's medical records are fragmented across hospitals, clinics, labs, and paper files. MedVault AI gives every patient a lifelong digital health record accessible via a unique Patient ID, with verified doctor uploads, AI-generated clinical summaries, and full consent/audit tracking.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript (run via `tsx`, no compile step) |
| Database | PostgreSQL + Drizzle ORM |
| AI | Google Gemini API (clinical summary generation) |
| Monorepo | pnpm workspaces |

---

## Project structure

```
MedVault-AI/
├── artifacts/
│   ├── api-server/        # Express backend
│   └── medvault-ai/       # React + Vite frontend
├── lib/
│   └── db/
│       ├── schema.sql              # Core tables
│       ├── migrations/
│       │   └── 002_dedupe_and_assignments.sql   # Adds doctor_patient_assignments
│       ├── seed.sql                # 25 patients, 12 doctors, clinical records
│       └── seed-assignments.sql    # Doctor ↔ patient relationships
└── scripts/
    └── copy-frontend.mjs   # Copies built frontend into api-server/public for single-service deploy
```

---

## Roles

| Role | Login | Access |
|---|---|---|
| Patient | Patient ID (e.g. `PAT-0001`) | Read-only — own records, own AI summary |
| Doctor | Registration Number (e.g. `DOC-REG-0001`) | Full access to assigned patients — add/edit records, generate AI summaries |

Demo patient: **Ananya Sen** — `PAT-0001` — Type 2 Diabetes & Hypertension, allergic to Penicillin.

---

## Local development

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| pnpm | 10+ (check with `pnpm --version` — must match `packageManager` in root `package.json`) |
| PostgreSQL | 15+ (local) |

### 1. Clone and install

```bash
git clone https://github.com/pratik-2412-git/MedVault-AI.git
cd MedVault-AI
pnpm install
```

### 2. Set environment variables

Create a `.env` at the repo root (and copy into `artifacts/api-server/.env` if needed — the server loads from both locations):

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/medvault
NODE_ENV=development
PORT=3000
GEMINI_API_KEY=your_key_from_aistudio_google_com
GEMINI_MODEL=gemini-3.6-flash
```

Get a free Gemini key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).

### 3. Create the database

```bash
psql -U postgres -c "CREATE DATABASE medvault;"
```

### 4. Apply schema, migration, and seed data — **in this exact order**

```bash
psql -U postgres -d medvault -f lib/db/schema.sql
psql -U postgres -d medvault -f lib/db/migrations/002_dedupe_and_assignments.sql
psql -U postgres -d medvault -f lib/db/seed.sql
psql -U postgres -d medvault -f lib/db/seed-assignments.sql
```

> ⚠️ All four files are required. Skipping the migration or `seed-assignments.sql` leaves the `doctor_patient_assignments` table missing or empty, and doctor dashboards will show 0 assigned patients or a `relation does not exist` error.

### 5. Run the app

```bash
pnpm dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:3000](http://localhost:3000)

---

## Deployment (Railway)

This repo is set up to deploy as a **single Railway service** — the backend serves the built frontend as static files, so there's no separate frontend deployment or CORS configuration needed.

### Setup

1. **New Project → Deploy from GitHub repo**, root directory `/`
2. **Add a PostgreSQL plugin** to the same project
3. **Service Settings:**
   - Build Command: `pnpm install && pnpm build`
   - Start Command: `pnpm start`
4. **Service Variables:**
   ```
   NODE_ENV=production
   GEMINI_API_KEY=your_real_key
   GEMINI_MODEL=gemini-3.6-flash
   DATABASE_URL=${{Postgres.DATABASE_URL}}   # reference, not a pasted string
   ```
5. **Settings → Networking → Generate Domain** to get a public URL

### Seeding the deployed database

Use `railway connect Postgres` (opens a secure psql tunnel, no public network exposure needed) from a terminal in the repo root:

```bash
railway connect Postgres
```

Then inside the `psql` prompt, run the same four files in order:
```sql
\i lib/db/schema.sql
\i lib/db/migrations/002_dedupe_and_assignments.sql
\i lib/db/seed.sql
\i lib/db/seed-assignments.sql
```

Verify with `\dt` (lists tables) and `\q` to exit.

---

## API endpoints

| Method | Path | Access |
|---|---|---|
| GET | `/api/health` | Public |
| GET | `/api/doctors/:registrationNumber` | Public (login lookup) |
| GET | `/api/doctors/:doctorId/patients` | Doctor |
| GET | `/api/facilities` | Public |
| GET | `/api/patients/:patientId` | Patient (own) / assigned doctor |
| GET | `/api/patients/:patientId/records` | Patient (own) / assigned doctor |
| GET | `/api/patients/:patientId/summary` | Patient (own) / assigned doctor |
| POST | `/api/patients/:patientId/records` | Assigned doctor only |
| PATCH | `/api/records/:recordId` | Assigned doctor only |
| POST | `/api/patients/:patientId/summary/generate` | Assigned doctor only |
| GET | `/api/patients/:patientId/audit-logs` | Assigned doctor only |

---

## AI safety

AI-generated clinical summaries are clearly disclaimed and never presented as diagnosis:

> "AI-generated summary. Verify important information against the original medical records. This tool does not diagnose or prescribe treatment."

Every claim in a summary links back to its source record, date, and provider. If `GEMINI_API_KEY` is not set, the app disables AI summary generation with a clear message rather than failing silently.

---

## Known gotchas

- **`packageManager` field matters.** The root `package.json` pins an exact pnpm version (`pnpm@<version>`) to match `pnpm-lock.yaml`. If you regenerate the lockfile with a different pnpm major version, update this field too, or Railway's frozen-lockfile install will fail.
- **No TypeScript compile step for the backend.** `artifacts/api-server` runs directly via `tsx` in both dev and production (`pnpm start` → `tsx src/index.ts`). This avoids Node's ESM/NodeNext import-extension requirements, which the existing codebase doesn't follow.
- **Seeding order matters** — see the four-file sequence above. Running `seed-assignments.sql` before the migration, or skipping either, breaks the doctor dashboard.

---

## License

Built for Smart India Hackathon 2026. Educational/demo use — all patient and doctor data is fictional.