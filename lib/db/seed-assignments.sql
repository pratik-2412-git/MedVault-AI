-- MedVault AI — fictional doctor <-> patient assignments
-- Each patient has 2-3 treating doctors chosen by specialty; no doctor sees every patient.
-- Idempotent. Run AFTER seed.sql and migrations/002_dedupe_and_assignments.sql.

BEGIN;

INSERT INTO doctor_patient_assignments (doctor_id, patient_id)
SELECT d.id, p.id
FROM (VALUES
  ('PAT-0001','DOC-REG-0002'),('PAT-0001','DOC-REG-0003'),('PAT-0001','DOC-REG-0009'),
  ('PAT-0002','DOC-REG-0001'),('PAT-0002','DOC-REG-0002'),
  ('PAT-0003','DOC-REG-0006'),('PAT-0003','DOC-REG-0009'),
  ('PAT-0004','DOC-REG-0001'),('PAT-0004','DOC-REG-0011'),
  ('PAT-0005','DOC-REG-0004'),('PAT-0005','DOC-REG-0009'),('PAT-0005','DOC-REG-0012'),
  ('PAT-0006','DOC-REG-0002'),('PAT-0006','DOC-REG-0004'),
  ('PAT-0007','DOC-REG-0002'),('PAT-0007','DOC-REG-0008'),
  ('PAT-0008','DOC-REG-0004'),('PAT-0008','DOC-REG-0009'),
  ('PAT-0009','DOC-REG-0005'),('PAT-0009','DOC-REG-0009'),
  ('PAT-0010','DOC-REG-0007'),('PAT-0010','DOC-REG-0009'),
  ('PAT-0011','DOC-REG-0001'),('PAT-0011','DOC-REG-0002'),
  ('PAT-0012','DOC-REG-0010'),('PAT-0012','DOC-REG-0012'),
  ('PAT-0013','DOC-REG-0001'),('PAT-0013','DOC-REG-0006'),
  ('PAT-0014','DOC-REG-0003'),('PAT-0014','DOC-REG-0005'),
  ('PAT-0015','DOC-REG-0004'),('PAT-0015','DOC-REG-0009'),
  ('PAT-0016','DOC-REG-0009'),('PAT-0016','DOC-REG-0011'),
  ('PAT-0017','DOC-REG-0002'),('PAT-0017','DOC-REG-0008'),
  ('PAT-0018','DOC-REG-0001'),('PAT-0018','DOC-REG-0004'),
  ('PAT-0019','DOC-REG-0004'),('PAT-0019','DOC-REG-0010'),('PAT-0019','DOC-REG-0011'),
  ('PAT-0020','DOC-REG-0002'),('PAT-0020','DOC-REG-0011'),
  ('PAT-0021','DOC-REG-0007'),('PAT-0021','DOC-REG-0009'),
  ('PAT-0022','DOC-REG-0009'),('PAT-0022','DOC-REG-0011'),
  ('PAT-0023','DOC-REG-0002'),('PAT-0023','DOC-REG-0007'),
  ('PAT-0024','DOC-REG-0001'),('PAT-0024','DOC-REG-0011'),
  ('PAT-0025','DOC-REG-0008'),('PAT-0025','DOC-REG-0009')
) AS m(pat, doc)
JOIN patients p ON p.patient_id = m.pat
JOIN doctors  d ON d.registration_number = m.doc
ON CONFLICT (doctor_id, patient_id) DO NOTHING;

COMMIT;