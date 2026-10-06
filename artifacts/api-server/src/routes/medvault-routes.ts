/**
 * artifacts/api-server/src/routes/medvault-routes.ts
 *
 * All MedVault API endpoints.
 * Doctor auth via ?doctorReg=DOC-REG-XXXX query param.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  addAuditEvent,
  addRecord,
  generateAiSummary,
  getAllPatients,
  getAuditLogs,
  getDoctorByRegNumber,
  getLatestSummary,
  getPatientByStringId,
  getRecords,
  serializeAuditEvent,
  serializeSummary,
  updateRecord,
} from '../lib/medvault';

const router = Router();

type DoctorRow = NonNullable<Awaited<ReturnType<typeof getDoctorByRegNumber>>>;

// ─── Doctor auth middleware ───────────────────────────────────────────────────

async function requireDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
  const doctorReg = (req.query['doctorReg'] ?? req.body?.doctorReg) as string | undefined;
  if (!doctorReg) {
    res.status(401).json({ error: 'Doctor authorisation required. Pass ?doctorReg=DOC-REG-XXXX' });
    return;
  }
  const doctor = await getDoctorByRegNumber(doctorReg);
  if (!doctor) {
    res.status(403).json({ error: 'Invalid or unrecognised doctor registration number.' });
    return;
  }
  if (!doctor.verified) {
    res.status(403).json({ error: 'Doctor account is not verified.' });
    return;
  }
  res.locals['doctor'] = doctor;
  next();
}

// ─── Health ───────────────────────────────────────────────────────────────────

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'medvault-api', timestamp: new Date().toISOString() });
});

// ─── Patients ─────────────────────────────────────────────────────────────────

router.get('/patients', async (_req, res): Promise<void> => {
  try {
    res.json(await getAllPatients());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/patients/:patientId', async (req, res): Promise<void> => {
  try {
    const { patientId } = req.params;
    if (!patientId.startsWith('PAT-')) {
      res.status(400).json({ error: 'Invalid Patient ID format. Expected PAT-XXXX.' });
      return;
    }
    const patient = await getPatientByStringId(patientId);
    if (!patient) {
      res.status(404).json({ error: `Patient "${patientId}" not found.` });
      return;
    }
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/patients/:patientId/records', async (req, res): Promise<void> => {
  try {
    const { patientId } = req.params;
    const patient = await getPatientByStringId(patientId);
    if (!patient) {
      res.status(404).json({ error: `Patient "${patientId}" not found.` });
      return;
    }
    res.json(await getRecords(patient.id));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/patients/:patientId/records', requireDoctor, async (req, res): Promise<void> => {
  try {
    const { patientId } = req.params;
    const doctor = res.locals['doctor'] as DoctorRow;
    const patient = await getPatientByStringId(patientId);
    if (!patient) { res.status(404).json({ error: `Patient "${patientId}" not found.` }); return; }

    const { recordType, title, description, date, verified } = req.body ?? {};
    if (!recordType || !title || !date || !description) {
      res.status(400).json({ error: 'Missing required fields: recordType, title, description, date' });
      return;
    }

    const record = await addRecord(patient.id, doctor.id, { recordType, title, description, date, verified: verified ?? false }, doctor.id);
    await addAuditEvent(patient.id, 'RECORD_ADDED', doctor.name, `Added ${recordType} record: ${title}`, 'success');
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/records/:recordId', requireDoctor, async (req, res): Promise<void> => {
  try {
    const recordId = parseInt(req.params['recordId'] ?? '', 10);
    const doctor = res.locals['doctor'] as DoctorRow;
    const patientId = req.query['patientId'] as string | undefined;

    if (isNaN(recordId)) { res.status(400).json({ error: 'Invalid record ID.' }); return; }
    if (!patientId) { res.status(400).json({ error: 'Query param ?patientId=PAT-XXXX is required.' }); return; }

    const patient = await getPatientByStringId(patientId);
    if (!patient) { res.status(404).json({ error: `Patient "${patientId}" not found.` }); return; }

    const { recordType, title, description, date, verified } = req.body ?? {};
    const updated = await updateRecord(recordId, patient.id, { recordType, title, description, date, verified }, doctor.id);
    if (!updated) { res.status(404).json({ error: 'Record not found or does not belong to this patient.' }); return; }

    await addAuditEvent(patient.id, 'RECORD_UPDATED', doctor.name, `Updated record ID ${recordId}: ${updated.title}`, 'success');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── AI Summary ───────────────────────────────────────────────────────────────

router.get('/patients/:patientId/summary', async (req, res): Promise<void> => {
  try {
    const { patientId } = req.params;
    const patient = await getPatientByStringId(patientId);
    if (!patient) { res.status(404).json({ error: `Patient "${patientId}" not found.` }); return; }

    const summary = await getLatestSummary(patient.id);
    res.json(summary ? serializeSummary(summary) : null);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/patients/:patientId/summary/generate', requireDoctor, async (req, res): Promise<void> => {
  try {
    const { patientId } = req.params;
    const doctor = res.locals['doctor'] as DoctorRow;

    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({ error: 'AI service is not configured. Add GEMINI_API_KEY to your .env file.' });
      return;
    }

    const patient = await getPatientByStringId(patientId);
    if (!patient) { res.status(404).json({ error: `Patient "${patientId}" not found.` }); return; }

    const records = await getRecords(patient.id);
    if (records.length === 0) { res.status(400).json({ error: 'No clinical records found for this patient.' }); return; }

    const summary = await generateAiSummary(patient, records, doctor.name);
    await addAuditEvent(patient.id, 'AI_SUMMARY_GENERATED', doctor.name, `Generated AI summary from ${records.length} records`, 'success');
    res.json(serializeSummary(summary));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── Audit logs ───────────────────────────────────────────────────────────────

router.get('/patients/:patientId/audit-logs', async (req, res): Promise<void> => {
  try {
    const { patientId } = req.params;
    const patient = await getPatientByStringId(patientId);
    if (!patient) { res.status(404).json({ error: `Patient "${patientId}" not found.` }); return; }

    const logs = await getAuditLogs(patient.id);
    res.json(logs.map(serializeAuditEvent));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── Doctors ──────────────────────────────────────────────────────────────────

router.get('/doctors/:registrationNumber', async (req, res): Promise<void> => {
  try {
    const { registrationNumber } = req.params;
    const doctor = await getDoctorByRegNumber(registrationNumber);
    if (!doctor) { res.status(404).json({ error: `Doctor "${registrationNumber}" not found.` }); return; }
    res.json({
      id:                 doctor.id,
      registrationNumber: doctor.registrationNumber,
      name:               doctor.name,
      specialization:     doctor.specialization,
      facilityId:         doctor.facilityId,
      email:              doctor.email,
      role:               doctor.role,
      verified:           doctor.verified,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/doctors/:doctorId/patients', async (_req, res): Promise<void> => {
  try {
    res.json(await getAllPatients());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;