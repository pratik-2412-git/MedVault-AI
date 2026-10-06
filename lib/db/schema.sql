-- MedVault AI — PostgreSQL Schema v2
-- Aligned with lib/db/src/schema.ts (Drizzle definitions)
-- Safe to run on a fresh database. Drop and recreate if migrating.

BEGIN;

-- ─── Facilities ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS facilities (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  city       TEXT NOT NULL,
  state      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Patients ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id                  SERIAL PRIMARY KEY,
  patient_id          TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  age                 INTEGER NOT NULL,
  gender              TEXT NOT NULL CHECK (gender IN ('Male','Female','Other')),
  health_id           TEXT NOT NULL UNIQUE,
  allergies           TEXT[] NOT NULL DEFAULT '{}',
  chronic_conditions  TEXT[] NOT NULL DEFAULT '{}',
  current_medicines   TEXT[] NOT NULL DEFAULT '{}',
  facility_id         INTEGER REFERENCES facilities(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Doctors ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id                  SERIAL PRIMARY KEY,
  registration_number TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  specialization      TEXT NOT NULL,
  facility_id         INTEGER REFERENCES facilities(id),
  email               TEXT NOT NULL UNIQUE,
  role                TEXT NOT NULL DEFAULT 'doctor',
  verified            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Clinical Records ─────────────────────────────────────────────────────────
-- deleted_at supports soft-delete (Drizzle queries filter isNull(deletedAt))
CREATE TABLE IF NOT EXISTS clinical_records (
  id           SERIAL PRIMARY KEY,
  patient_id   INTEGER NOT NULL REFERENCES patients(id),
  record_type  TEXT NOT NULL CHECK (record_type IN (
                 'diagnosis','surgery','lab_report','prescription',
                 'vaccination','hospital_visit','allergy_note')),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  date         DATE NOT NULL,
  verified     BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by  INTEGER REFERENCES doctors(id),
  created_by   INTEGER REFERENCES doctors(id),
  updated_by   INTEGER REFERENCES doctors(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ                         -- NULL = active, non-NULL = soft deleted
);

-- ─── Documents ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id          SERIAL PRIMARY KEY,
  record_id   INTEGER NOT NULL REFERENCES clinical_records(id),
  file_name   TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  uploaded_by INTEGER REFERENCES doctors(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── AI Summaries ─────────────────────────────────────────────────────────────
-- Stores Gemini JSON output as JSONB claims + plain-text disclaimer
-- generated_by = doctor name (string), not a FK — matches Drizzle schema
CREATE TABLE IF NOT EXISTS ai_summaries (
  id           SERIAL PRIMARY KEY,
  patient_id   INTEGER NOT NULL REFERENCES patients(id),
  generated_by TEXT NOT NULL,
  claims       JSONB,
  disclaimer   TEXT,
  record_count INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Audit Logs ───────────────────────────────────────────────────────────────
-- Uses event/actor/purpose/tone/timestamp columns — matches Drizzle auditLogsTable
CREATE TABLE IF NOT EXISTS audit_logs (
  id         SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id),
  event      TEXT NOT NULL,
  actor      TEXT NOT NULL,
  purpose    TEXT,
  tone       TEXT NOT NULL DEFAULT 'info',
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Consents ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consents (
  id             SERIAL PRIMARY KEY,
  patient_id     INTEGER NOT NULL REFERENCES patients(id),
  patient_name   TEXT NOT NULL,
  provider       TEXT NOT NULL,
  purpose        TEXT NOT NULL,
  shared_records TEXT[] NOT NULL DEFAULT '{}',
  duration_days  INTEGER NOT NULL DEFAULT 30,
  status         TEXT NOT NULL DEFAULT 'Pending',
  requested_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clinical_records_patient ON clinical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_patient       ON audit_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_patient     ON ai_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_consents_patient         ON consents(patient_id);

COMMIT;