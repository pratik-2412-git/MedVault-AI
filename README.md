# MedVault AI

**Smart India Hackathon 2026 · Healthcare Track**

Role-based medical records platform with AI-powered clinical summaries. Doctors manage and generate insights; patients have read-only access. Every change is audit-logged.

---

## Quick start (local, Windows)

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18 or 20 |
| pnpm | 8+ |
| PostgreSQL | 15+ (local) |
| VS Code | any |

---

### 1. Clone and install

```cmd
cd your-project-folder
pnpm install
```

---

### 2. Set environment variables

Copy the template and fill it in:

```cmd
copy .env.example .env
```

Edit `.env` at the **monorepo root**:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/medvault
GEMINI_API_KEY=your_key_from_aistudio_google_com
PORT=3000
```

Get a free Gemini key at: https://aistudio.google.com/app/apikey

---

### 3. Create the database

```cmd
psql -U postgres -c "CREATE DATABASE medvault;"
```

---

### 4. Apply schema

```cmd
psql -U postgres -d medvault -f db/schema.sql
```

This creates all 8 tables:
`facilities`, `patients`, `doctors`, `clinical_records`, `documents`, `ai_summaries`, `ai_summary_claims`, `audit_logs`

---

### 5. Seed demo data

```cmd
psql -U postgres -d medvault -f db/seed.sql
```

This inserts:
- **12 facilities** across India
- **25 fictional patients** (PAT-0001 to PAT-0025)
- **12 fictional doctors** (DOC-REG-0001 to DOC-REG-0012)
- **125 clinical records** (5 per patient, varied types)

Safe to re-run — uses `ON CONFLICT DO NOTHING`.

Verify the seed worked:

```cmd
psql -U postgres -d medvault -c "SELECT COUNT(*) FROM patients;"
psql -U postgres -d medvault -c "SELECT COUNT(*) FROM clinical_records;"
psql -U postgres -d medvault -c "SELECT COUNT(*) FROM doctors;"
```

Expected output: 25 / 125 / 12

---

### 6. Start the API server

```cmd
cd artifacts\api-server
pnpm install
pnpm run dev:tsx
```

Confirm it's running:

```
[env] Loaded C:\..\.env
[api] MedVault API running on http://localhost:3000
[api] GEMINI_API_KEY: SET ✓
```

Test the health endpoint:

```cmd
curl http://localhost:3000/api/health
```

Expected: `{"status":"ok","db":"connected"}`

---

### 7. Start the frontend

Open a second terminal:

```cmd
cd artifacts\medvault-ai
pnpm run dev
```

Open: **http://localhost:5173**

---

## Demo credentials

### Patients

| Patient ID | Name | Conditions |
|------------|------|-----------|
| PAT-0001 | Ananya Sen | Type 2 Diabetes, Hypertension |
| PAT-0002 | Rajesh Bhatia | Coronary Artery Disease |
| PAT-0003 | Deepa Krishnan | Asthma |
| PAT-0004 | Mohan Iyer | Chronic Kidney Disease |
| PAT-0005 | Priya Kapoor | Rheumatoid Arthritis |
| PAT-0006 | Suresh Nambiar | Type 2 Diabetes + Neuropathy |
| … | … | … |
| PAT-0025 | Kaveri Nair | Healthy — preventive care |

### Doctors

| Registration Number | Name | Specialization |
|--------------------|------|----------------|
| DOC-REG-0001 | Dr. Arjun Mehta | Cardiology |
| DOC-REG-0002 | Dr. Priya Nair | Endocrinology |
| DOC-REG-0003 | Dr. Rohan Sharma | General Surgery |
| DOC-REG-0004 | Dr. Sunita Reddy | Neurology |
| DOC-REG-0005 | Dr. Vikram Patel | Orthopedics |
| DOC-REG-0006 | Dr. Kavitha Iyer | Pulmonology |
| DOC-REG-0007 | Dr. Anil Kumar | Gastroenterology |
| DOC-REG-0008 | Dr. Meena Joshi | Obstetrics & Gynecology |
| DOC-REG-0009 | Dr. Sanjay Bose | Internal Medicine |
| DOC-REG-0010 | Dr. Lakshmi Varma | Dermatology |
| DOC-REG-0011 | Dr. Rahul Gupta | Nephrology |
| DOC-REG-0012 | Dr. Anjali Desai | Oncology |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 Browser (Vite)                   │
│        artifacts/medvault-ai  :5173              │
│                                                  │
│  Landing → PatientLogin / DoctorLogin            │
│         → PatientDashboard (read-only)           │
│         → DoctorDashboard (CRUD + AI)            │
└──────────────────┬──────────────────────────────┘
                   │  /api  (Vite proxy)
                   ▼
┌─────────────────────────────────────────────────┐
│           Express API  :3000                     │
│        artifacts/api-server                      │
│                                                  │
│  routes/patients.ts   — GET/POST patient data    │
│  routes/doctors.ts    — GET doctor, GET patients │
│  routes/records.ts    — PATCH records            │
│  services/ai.ts       — Gemini integration       │
└──────────────────┬──────────────────────────────┘
                   │  pg Pool
                   ▼
┌─────────────────────────────────────────────────┐
│           PostgreSQL  :5432                      │
│           Database: medvault                     │
│                                                  │
│  facilities · patients · doctors                 │
│  clinical_records · documents                    │
│  ai_summaries · ai_summary_claims                │
│  audit_logs                                      │
└─────────────────────────────────────────────────┘
```

---

## API reference

All endpoints are under `/api`. Vite proxies `/api → localhost:3000` in development.

### Health

```
GET /api/health
→ { status: "ok", db: "connected", ts: "..." }
```

### Patients

```
GET  /api/patients                              List all patients
GET  /api/patients/:patientId                   Get patient profile (e.g. PAT-0001)
GET  /api/patients/:patientId/records           Get clinical records
POST /api/patients/:patientId/records           Add record  [doctor only — body: doctorId]
GET  /api/patients/:patientId/summary           Get latest AI summary (null if none)
POST /api/patients/:patientId/summary/generate  Generate fresh AI summary  [doctor only]
GET  /api/patients/:patientId/audit-logs        Audit trail for this patient
```

### Doctors

```
GET /api/doctors/:registrationNumber   Get doctor by reg number (e.g. DOC-REG-0001)
GET /api/doctors/:doctorId/patients    List all patients accessible to this doctor
```

### Records

```
PATCH /api/records/:recordId           Update a record  [doctor only — body: doctorId]
```

### Access control

| Action | Patient | Doctor |
|--------|---------|--------|
| View own records | ✓ | ✓ |
| View any patient's records | ✗ | ✓ |
| Add / edit records | ✗ | ✓ |
| Generate AI summary | ✗ | ✓ |
| View AI summary | ✓ (if exists) | ✓ |
| Audit log | ✗ | ✓ |

Write endpoints enforce doctor authorisation by requiring `doctorId` in the request body and verifying it against the `doctors` table (`verified = TRUE`).

---

## Database tables

| Table | Purpose |
|-------|---------|
| `facilities` | Hospitals / clinics |
| `patients` | Patient profiles (PAT-0001 … PAT-0025) |
| `doctors` | Doctor profiles (DOC-REG-0001 … DOC-REG-0012) |
| `clinical_records` | All medical records — never deleted, only updated |
| `documents` | File attachments (future) |
| `ai_summaries` | AI-generated summaries (not seeded — generated on demand) |
| `ai_summary_claims` | Structured claims extracted from each summary |
| `audit_logs` | Every sensitive action — RECORD_CREATED, RECORD_UPDATED, AI_SUMMARY_GENERATED, etc. |

---

## Seed commands reference

```cmd
# Full reset and re-seed (drops + recreates all tables)
psql -U postgres -d medvault -f db/schema.sql
psql -U postgres -d medvault -f db/seed.sql

# Re-seed only (safe — ON CONFLICT DO NOTHING)
psql -U postgres -d medvault -f db/seed.sql

# Verify counts
psql -U postgres -d medvault -c "\dt"
psql -U postgres -d medvault -c "SELECT patient_id, name FROM patients ORDER BY patient_id;"
psql -U postgres -d medvault -c "SELECT registration_number, name, specialization FROM doctors;"
```

---

## File structure

```
medvault-ai/                     ← monorepo root
├── .env                         ← YOUR secrets (not committed)
├── .env.example                 ← template
├── db/
│   ├── schema.sql               ← CREATE TABLE statements
│   └── seed.sql                 ← 25 patients, 12 doctors, 125 records
├── artifacts/
│   ├── medvault-ai/             ← React frontend (Vite)
│   │   └── src/
│   │       ├── App.tsx          ← Wouter router
│   │       ├── lib/api.ts       ← Typed fetch helpers
│   │       └── pages/
│   │           ├── Landing.tsx
│   │           ├── PatientLogin.tsx
│   │           ├── PatientDashboard.tsx
│   │           ├── DoctorLogin.tsx
│   │           └── DoctorDashboard.tsx
│   └── api-server/              ← Express backend
│       └── src/
│           ├── index.ts         ← Server entry, DB pool
│           ├── routes/
│           │   ├── patients.ts
│           │   ├── doctors.ts
│           │   └── records.ts
│           └── services/
│               └── ai.ts        ← Gemini integration
└── README.md
```

---

## Acceptance checklist

- [x] Landing shows only "I'm a Patient" and "I'm an Authorised Doctor"
- [x] No sidebar, no history box on landing
- [x] Patient login: Patient ID input + disabled Scan Health Card
- [x] Doctor login: Registration Number input + disabled Scan Doctor Card
- [x] 25 seeded patients, 12 doctors, 5 records each (125 total)
- [x] Each Patient ID opens that patient's own dashboard
- [x] Patient dashboard is read-only (no edit/delete buttons)
- [x] Doctor dashboard has Add Record, Edit Record, Update buttons
- [x] Only doctors can generate AI summaries
- [x] AI summaries not seeded — generated on demand from live records
- [x] Gemini key never exposed to frontend
- [x] Every doctor write action creates an audit_log entry
- [x] Invalid Patient ID shows error, does not crash
- [x] Invalid Doctor Registration Number shows error
- [x] Responsive layout suitable for SIH screenshots

---

## Notes

- All data is **fictional** — no real Aadhaar numbers, ABHA IDs, phone numbers, or medical information.
- AI summaries include a mandatory disclaimer and do not diagnose or prescribe.
- The Scan Health Card and Scan Doctor Card options are visible but disabled (MVP). They will be enabled in the next version using NFC/QR.