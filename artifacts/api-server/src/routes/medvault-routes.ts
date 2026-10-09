/**
 * artifacts/api-server/src/routes/medvault-routes.ts
 *
 * ACCESS MODEL (enforced here, not in the UI)
 *   Patient portal : reads its OWN data by Patient ID. Read-only — no write route accepts it.
 *   Doctor         : identified by ?doctorReg=DOC-REG-XXXX. A doctor can touch a patient ONLY if a
 *                    doctor_patient_assignments row links them; otherwise 403 + an ACCESS_DENIED
 *                    audit entry. Writes, audit logs and AI summaries are doctor-only AND assigned-only.
 *
 * MVP LIMITATION: there are no passwords/tokens — a registration number (and a Patient ID) is the
 * only credential, as specified for the demo. Before real use, replace ?doctorReg= with a signed
 * session token issued at login.
 */

import { Router, type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import {
  AiServiceError,
  addAuditEvent,
  addRecord,
  generateAiSummary,
  getAssignedPatients,
  getAuditLogs,
  getDoctorByRegNumber,
  getLatestSummary,
  getPatientByStringId,
  getRecords,
  isDoctorAssigned,
  isUniqueViolation,
  serializeAuditEvent,
  serializeSummary,
  updateRecord,
  type DoctorWithFacility,
  type PatientWithFacility,
} from '../lib/medvault';

const router = Router();

const RECORD_TYPES = ['diagnosis', 'surgery', 'lab_report', 'prescription', 'vaccination', 'hospital_visit', 'allergy_note'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PATIENT_ID_RE = /^PAT-\d{4}$/;

// Express 4 does not catch rejected promises — wrap every async handler.
const wrap = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => { fn(req, res, next).catch(next); };

// ─── Middleware ───────────────────────────────────────────────────────────────

/** Is the caller claiming to be a doctor? (?doctorReg= present, even if empty) */
const claimsDoctor = (req: Request) => req.query['doctorReg'] !== undefined;

/** Validates ?doctorReg= against the doctors table → res.locals.doctor */
async function authenticateDoctor(req: Request, res: Response): Promise<DoctorWithFacility | null> {
  const reg = req.query['doctorReg'];
  if (typeof reg !== 'string' || reg.trim() === '') {
    res.status(401).json({ error: 'Doctor authorisation required. Pass ?doctorReg=DOC-REG-XXXX' });
    return null;
  }
  const doctor = await getDoctorByRegNumber(reg);
  if (!doctor) { res.status(403).json({ error: 'Invalid or unrecognised doctor registration number.' }); return null; }
  if (!doctor.verified) { res.status(403).json({ error: 'Doctor account is not verified.' }); return null; }
  res.locals['doctor'] = doctor;
  return doctor;
}

/** Validates :patientId → res.locals.patient */
const loadPatient = wrap(async (req, res, next) => {
  const patientId = String(req.params['patientId'] ?? '').toUpperCase();
  if (!PATIENT_ID_RE.test(patientId)) {
    res.status(400).json({ error: 'Invalid Patient ID format. Expected PAT-0001.' });
    return;
  }
  const patient = await getPatientByStringId(patientId);
  if (!patient) { res.status(404).json({ error: `Patient "${patientId}" not found.` }); return; }
  res.locals['patient'] = patient;
  next();
});

/** Assignment gate: authenticated doctor must be assigned to res.locals.patient. */
async function requireAssignment(res: Response, doctor: DoctorWithFacility): Promise<boolean> {
  const patient = res.locals['patient'] as PatientWithFacility;
  if (await isDoctorAssigned(doctor.id, patient.id)) return true;
  await addAuditEvent(
    patient.id, 'ACCESS_DENIED', doctor.name,
    `${doctor.registrationNumber} attempted to access a patient who is not assigned to them`, 'warning',
  );
  res.status(403).json({ error: 'Access denied: this patient is not assigned to you.' });
  return false;
}

/** Reads: patient portal (no doctorReg) OR an ASSIGNED doctor. */
const authorizeRead = wrap(async (req, res, next) => {
  if (!claimsDoctor(req)) { res.locals['viewer'] = 'patient'; next(); return; }
  const doctor = await authenticateDoctor(req, res);
  if (!doctor) return;
  if (!(await requireAssignment(res, doctor))) return;
  res.locals['viewer'] = 'doctor';
  next();
});

/** Doctor-only AND assigned-only (writes, audit logs, AI generation). */
const requireAssignedDoctor = wrap(async (req, res, next) => {
  const doctor = await authenticateDoctor(req, res);
  if (!doctor) return;
  if (!(await requireAssignment(res, doctor))) return;
  next();
});

// ─── Health ───────────────────────────────────────────────────────────────────

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'medvault-api', timestamp: new Date().toISOString() });
});

// ─── Doctors ──────────────────────────────────────────────────────────────────

router.get('/doctors/:registrationNumber', wrap(async (req, res) => {
  const doctor = await getDoctorByRegNumber(String(req.params['registrationNumber']));
  if (!doctor) { res.status(404).json({ error: `Doctor "${req.params['registrationNumber']}" not found.` }); return; }
  res.json({
    id: doctor.id, registrationNumber: doctor.registrationNumber, name: doctor.name,
    specialization: doctor.specialization, facilityId: doctor.facilityId, facility: doctor.facility,
    email: doctor.email, role: doctor.role, verified: doctor.verified,
  });
}));

/** The ONLY patient list. Returns just this doctor's assigned patients. */
router.get('/doctors/:doctorId/patients', wrap(async (req, res) => {
  const doctor = await authenticateDoctor(req, res);
  if (!doctor) return;
  const target = String(req.params['doctorId']);
  if (target !== String(doctor.id) && target.toUpperCase() !== doctor.registrationNumber) {
    res.status(403).json({ error: 'You can only list your own patients.' });
    return;
  }
  res.json(await getAssignedPatients(doctor.id));
}));

// ─── Patients (read) ──────────────────────────────────────────────────────────

router.get('/patients/:patientId', loadPatient, authorizeRead, (_req, res) => {
  res.json(res.locals['patient']);
});

router.get('/patients/:patientId/records', loadPatient, authorizeRead, wrap(async (_req, res) => {
  const patient = res.locals['patient'] as PatientWithFacility;
  if (res.locals['viewer'] === 'doctor') {
    const d = res.locals['doctor'] as DoctorWithFacility;
    await addAuditEvent(patient.id, 'RECORDS_VIEWED', d.name, `${d.registrationNumber} opened the patient's records`, 'info');
  }
  res.json(await getRecords(patient.id));
}));

router.get('/patients/:patientId/summary', loadPatient, authorizeRead, wrap(async (_req, res) => {
  const patient = res.locals['patient'] as PatientWithFacility;
  const summary = await getLatestSummary(patient.id);
  res.json(summary ? serializeSummary(summary) : null); // null = none generated yet
}));

// ─── Records (doctor-only, assigned-only) ─────────────────────────────────────

router.post('/patients/:patientId/records', loadPatient, requireAssignedDoctor, wrap(async (req, res) => {
  const patient = res.locals['patient'] as PatientWithFacility;
  const doctor = res.locals['doctor'] as DoctorWithFacility;
  const { recordType, title, description, date, verified } = req.body ?? {};

  if (!recordType || !title || !description || !date) {
    res.status(400).json({ error: 'Missing required fields: recordType, title, description, date' });
    return;
  }
  if (!RECORD_TYPES.includes(recordType)) {
    res.status(400).json({ error: `recordType must be one of: ${RECORD_TYPES.join(', ')}` });
    return;
  }
  if (!DATE_RE.test(String(date))) { res.status(400).json({ error: 'date must be YYYY-MM-DD' }); return; }

  try {
    const record = await addRecord(patient.id, { recordType, title: String(title).trim(), description: String(description).trim(), date, verified: verified === true }, doctor.id);
    await addAuditEvent(patient.id, 'RECORD_ADDED', doctor.name, `Added ${recordType} record: ${title}`, 'success');
    res.status(201).json(record);
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: 'An identical record (same type, title and date) already exists for this patient.' });
      return;
    }
    throw err;
  }
}));

router.patch('/records/:recordId', wrap(async (req, res, next) => {
  const recordId = parseInt(String(req.params['recordId']), 10);
  if (isNaN(recordId)) { res.status(400).json({ error: 'Invalid record ID.' }); return; }
  const patientId = String(req.query['patientId'] ?? '').toUpperCase();
  if (!PATIENT_ID_RE.test(patientId)) { res.status(400).json({ error: 'Query param ?patientId=PAT-XXXX is required.' }); return; }
  req.params['patientId'] = patientId; // reuse the same guards as every other patient route
  next();
}), loadPatient, requireAssignedDoctor, wrap(async (req, res) => {
  const recordId = parseInt(String(req.params['recordId']), 10);
  const patient = res.locals['patient'] as PatientWithFacility;
  const doctor = res.locals['doctor'] as DoctorWithFacility;
  const { title, description, date, verified, recordType } = req.body ?? {};

  if (recordType !== undefined && !RECORD_TYPES.includes(recordType)) { res.status(400).json({ error: 'Invalid recordType.' }); return; }
  if (date !== undefined && !DATE_RE.test(String(date))) { res.status(400).json({ error: 'date must be YYYY-MM-DD' }); return; }

  try {
    const updated = await updateRecord(recordId, patient.id, { recordType, title, description, date, verified }, doctor.id);
    if (!updated) { res.status(404).json({ error: 'Record not found or does not belong to this patient.' }); return; }
    await addAuditEvent(patient.id, 'RECORD_UPDATED', doctor.name, `Updated record #${recordId}: ${updated.title}`, 'success');
    res.json(updated);
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: 'Another record with the same type, title and date already exists.' });
      return;
    }
    throw err;
  }
}));

// ─── AI summary generation (doctor-only, assigned-only) ───────────────────────

router.post('/patients/:patientId/summary/generate', loadPatient, requireAssignedDoctor, wrap(async (_req, res) => {
  const patient = res.locals['patient'] as PatientWithFacility;
  const doctor = res.locals['doctor'] as DoctorWithFacility;

  const records = await getRecords(patient.id);
  if (records.length === 0) { res.status(400).json({ error: 'No clinical records found for this patient.' }); return; }

  try {
    const summary = await generateAiSummary(patient, records, doctor.name);
    await addAuditEvent(patient.id, 'AI_SUMMARY_GENERATED', doctor.name, `Generated AI summary from ${records.length} records`, 'success');
    res.json(serializeSummary(summary));
  } catch (err) {
    if (err instanceof AiServiceError) {
      await addAuditEvent(patient.id, 'AI_SUMMARY_FAILED', doctor.name, err.message.slice(0, 200), 'warning');
      res.status(err.httpStatus).json({ error: err.message });
      return;
    }
    throw err;
  }
}));

// ─── Audit logs (doctor-only, assigned-only) ──────────────────────────────────

router.get('/patients/:patientId/audit-logs', loadPatient, requireAssignedDoctor, wrap(async (_req, res) => {
  const patient = res.locals['patient'] as PatientWithFacility;
  res.json((await getAuditLogs(patient.id)).map(serializeAuditEvent));
}));

export default router;