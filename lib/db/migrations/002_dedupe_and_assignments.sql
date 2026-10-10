-- MedVault AI — migration 002
--   1. Remove the ROOT CAUSE of duplicate records (no uniqueness rule on clinical_records)
--   2. Soft-delete existing exact duplicates (kept in DB + audit-logged, never hard-deleted)
--   3. Add doctor_patient_assignments (who may access which patient)
-- Idempotent: safe to run more than once, on a fresh or an existing database.

BEGIN;

-- 1a. Facility names must be unique, otherwise seeding creates duplicate facilities
--     and every "(SELECT id FROM facilities WHERE name=...)" breaks.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM facilities GROUP BY name HAVING COUNT(*) > 1) THEN
    RAISE NOTICE 'facilities contains duplicate names - unique index NOT created. Fix manually.';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS ux_facilities_name ON facilities (name);
  END IF;
END $$;

-- 1b. Soft-delete exact duplicate records (same patient + type + title + date).
--     The lowest id is kept. Rows stay in the table (deleted_at is set), so nothing is
--     silently lost, and each removal is written to audit_logs.
WITH ranked AS (
  SELECT id, patient_id, title,
         ROW_NUMBER() OVER (
           PARTITION BY patient_id, record_type, title, date
           ORDER BY id
         ) AS rn
  FROM clinical_records
  WHERE deleted_at IS NULL
),
removed AS (
  UPDATE clinical_records c
     SET deleted_at = NOW(), updated_at = NOW()
    FROM ranked r
   WHERE c.id = r.id AND r.rn > 1
  RETURNING c.id, c.patient_id, c.title
)
INSERT INTO audit_logs (patient_id, event, actor, purpose, tone)
SELECT patient_id,
       'DUPLICATE_RECORD_REMOVED',
       'system-migration',
       'Soft-deleted duplicate record #' || id || ': ' || title,
       'warning'
FROM removed;

-- 1c. The actual fix: a record is unique per patient + type + title + date
--     (partial index, so soft-deleted rows never block a legitimate re-entry).
CREATE UNIQUE INDEX IF NOT EXISTS ux_clinical_records_natural
  ON clinical_records (patient_id, record_type, title, date)
  WHERE deleted_at IS NULL;

-- 1d. Review aid (not auto-deleted): different titles on the same day for one patient.
--     Often legitimate (e.g. injury + tetanus booster), so a human should decide.
CREATE OR REPLACE VIEW v_possible_duplicate_records AS
SELECT p.patient_id, r.date,
       COUNT(*)                         AS records_on_date,
       array_agg(r.id    ORDER BY r.id) AS record_ids,
       array_agg(r.title ORDER BY r.id) AS titles
FROM clinical_records r
JOIN patients p ON p.id = r.patient_id
WHERE r.deleted_at IS NULL
GROUP BY p.patient_id, r.date
HAVING COUNT(*) > 1;

-- 2. Doctor <-> patient assignments (many-to-many).
CREATE TABLE IF NOT EXISTS doctor_patient_assignments (
  id          SERIAL PRIMARY KEY,
  doctor_id   INTEGER NOT NULL REFERENCES doctors(id),
  patient_id  INTEGER NOT NULL REFERENCES patients(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_doctor_patient UNIQUE (doctor_id, patient_id)
);
CREATE INDEX IF NOT EXISTS idx_dpa_patient ON doctor_patient_assignments (patient_id);

COMMIT;