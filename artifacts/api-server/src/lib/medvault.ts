/**
 * artifacts/api-server/src/lib/medvault.ts
 *
 * Data layer for MedVault AI (Drizzle only — no raw SQL).
 *
 * CHANGES in this version
 *  - Doctor <-> patient assignments (isDoctorAssigned / getAssignedPatients)
 *  - Patient + doctor lookups include the facility NAME
 *  - Gemini integration fixed: gemini-1.5-flash is retired, so the model is
 *    configurable (GEMINI_MODEL) with fallbacks; API key sent in a header;
 *    real, readable errors; claims carry source records.
 */

import {
  db,
  patientsTable,
  clinicalRecordsTable,
  doctorsTable,
  facilitiesTable,
  aiSummariesTable,
  auditLogsTable,
  doctorPatientAssignmentsTable,
} from '../../../../lib/db/src';
import { eq, desc, and, isNull } from 'drizzle-orm';

// ─── Types ────────────────────────────────────────────────────────────────────

type PatientRow     = typeof patientsTable.$inferSelect;
type DoctorRow      = typeof doctorsTable.$inferSelect;
type ClinicalRecord = typeof clinicalRecordsTable.$inferSelect;
type AiSummary      = typeof aiSummariesTable.$inferSelect;
type AuditLog       = typeof auditLogsTable.$inferSelect;

export type PatientWithFacility = PatientRow & { facilityName: string | null };
export type DoctorWithFacility  = DoctorRow & { facility: string | null };

// ─── Patients ─────────────────────────────────────────────────────────────────

export async function getPatientByStringId(patientId: string): Promise<PatientWithFacility | null> {
  const rows = await db
    .select({ patient: patientsTable, facilityName: facilitiesTable.name })
    .from(patientsTable)
    .leftJoin(facilitiesTable, eq(patientsTable.facilityId, facilitiesTable.id))
    .where(eq(patientsTable.patientId, patientId))
    .limit(1);
  const r = rows[0];
  return r ? { ...r.patient, facilityName: r.facilityName } : null;
}

// ─── Doctors & assignments ────────────────────────────────────────────────────

export async function getDoctorByRegNumber(regNum: string): Promise<DoctorWithFacility | null> {
  const rows = await db
    .select({ doctor: doctorsTable, facility: facilitiesTable.name })
    .from(doctorsTable)
    .leftJoin(facilitiesTable, eq(doctorsTable.facilityId, facilitiesTable.id))
    .where(eq(doctorsTable.registrationNumber, regNum.trim().toUpperCase()))
    .limit(1);
  const r = rows[0];
  return r ? { ...r.doctor, facility: r.facility } : null;
}

/** True only if an assignment row links this doctor to this patient. */
export async function isDoctorAssigned(doctorId: number, patientDbId: number): Promise<boolean> {
  const rows = await db
    .select({ id: doctorPatientAssignmentsTable.id })
    .from(doctorPatientAssignmentsTable)
    .where(
      and(
        eq(doctorPatientAssignmentsTable.doctorId, doctorId),
        eq(doctorPatientAssignmentsTable.patientId, patientDbId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/** Only the patients assigned to this doctor. */
export async function getAssignedPatients(doctorId: number): Promise<PatientWithFacility[]> {
  const rows = await db
    .select({ patient: patientsTable, facilityName: facilitiesTable.name })
    .from(doctorPatientAssignmentsTable)
    .innerJoin(patientsTable, eq(doctorPatientAssignmentsTable.patientId, patientsTable.id))
    .leftJoin(facilitiesTable, eq(patientsTable.facilityId, facilitiesTable.id))
    .where(eq(doctorPatientAssignmentsTable.doctorId, doctorId))
    .orderBy(patientsTable.patientId);
  return rows.map((r) => ({ ...r.patient, facilityName: r.facilityName }));
}

/** Validation error whose message is safe to show the doctor in the UI. */
export class ValidationError extends Error {
  constructor(message: string, public httpStatus = 400) {
    super(message);
    this.name = 'ValidationError';
  }
}

async function nextSequentialCode(prefix: 'PAT' | 'HLT-IND-2048', width: number, column: typeof patientsTable.patientId | typeof patientsTable.healthId): Promise<string> {
  const rows = await db.select({ code: column }).from(patientsTable);
  let max = 0;
  for (const r of rows) {
    const m = /(\d+)$/.exec(r.code);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${String(max + 1).padStart(width, '0')}`;
}

/**
 * Creates a new patient AND assigns them to the creating doctor in one transaction,
 * so the doctor can see the patient they just added (access control requires an
 * assignment row — see isDoctorAssigned). patientId / healthId are generated
 * server-side; on a rare unique-constraint race the insert is retried once.
 */
export async function createPatient(
  data: {
    name: string;
    age: number;
    gender: string;
    allergies?: string[];
    chronicConditions?: string[];
    currentMedicines?: string[];
    facilityId?: number | null;
  },
  createdByDoctorId: number,
): Promise<PatientWithFacility> {
  if (!data.name.trim()) throw new ValidationError('Patient name is required.');
  if (!Number.isInteger(data.age) || data.age < 0 || data.age > 130) {
    throw new ValidationError('Age must be a whole number between 0 and 130.');
  }
  if (!['Male', 'Female', 'Other'].includes(data.gender)) {
    throw new ValidationError('Gender must be Male, Female or Other.');
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const patientId = await nextSequentialCode('PAT', 4, patientsTable.patientId);
    const healthId = await nextSequentialCode('HLT-IND-2048', 5, patientsTable.healthId);
    try {
      const [created] = await db
        .insert(patientsTable)
        .values({
          patientId,
          healthId,
          name: data.name.trim(),
          age: data.age,
          gender: data.gender,
          allergies: data.allergies ?? [],
          chronicConditions: data.chronicConditions ?? [],
          currentMedicines: data.currentMedicines ?? [],
          facilityId: data.facilityId ?? null,
        })
        .returning();

      await db.insert(doctorPatientAssignmentsTable).values({ doctorId: createdByDoctorId, patientId: created.id });

      const facility = created.facilityId
        ? (await db.select({ name: facilitiesTable.name }).from(facilitiesTable).where(eq(facilitiesTable.id, created.facilityId)).limit(1))[0]
        : undefined;
      return { ...created, facilityName: facility?.name ?? null };
    } catch (err) {
      if (isUniqueViolation(err) && attempt < 2) continue; // another insert took this code — retry
      throw err;
    }
  }
  throw new Error('Could not generate a unique Patient ID after several attempts. Please try again.');
}

export async function listFacilities() {
  return db.select({ id: facilitiesTable.id, name: facilitiesTable.name, city: facilitiesTable.city, state: facilitiesTable.state }).from(facilitiesTable).orderBy(facilitiesTable.name);
}

// ─── Clinical records ─────────────────────────────────────────────────────────

export async function getRecords(patientDbId: number): Promise<ClinicalRecord[]> {
  return db
    .select()
    .from(clinicalRecordsTable)
    .where(and(eq(clinicalRecordsTable.patientId, patientDbId), isNull(clinicalRecordsTable.deletedAt)))
    .orderBy(desc(clinicalRecordsTable.date), desc(clinicalRecordsTable.id));
}

export async function addRecord(
  patientDbId: number,
  data: { recordType: string; title: string; description: string; date: string; verified?: boolean },
  doctorDbId: number,
) {
  const rows = await db
    .insert(clinicalRecordsTable)
    .values({
      patientId:   patientDbId,
      recordType:  data.recordType,
      title:       data.title,
      description: data.description,
      date:        data.date,
      verified:    data.verified ?? false,
      createdBy:   doctorDbId,
      verifiedBy:  data.verified ? doctorDbId : null,
    })
    .returning();
  return rows[0];
}

export async function updateRecord(
  recordId: number,
  patientDbId: number,
  data: Partial<{ recordType: string; title: string; description: string; date: string; verified: boolean }>,
  doctorDbId: number,
) {
  const rows = await db
    .update(clinicalRecordsTable)
    .set({
      ...data,
      verifiedBy: data.verified === true ? doctorDbId : data.verified === false ? null : undefined,
      updatedBy:  doctorDbId,
      updatedAt:  new Date(),
    })
    .where(
      and(
        eq(clinicalRecordsTable.id, recordId),
        eq(clinicalRecordsTable.patientId, patientDbId),
        isNull(clinicalRecordsTable.deletedAt),
      ),
    )
    .returning();
  return rows[0] ?? null;
}

/** Postgres unique_violation (23505) — works with or without a driver wrapper. */
export function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === '23505' || e?.cause?.code === '23505';
}

// ─── AI summaries ─────────────────────────────────────────────────────────────

export async function getLatestSummary(patientDbId: number): Promise<AiSummary | null> {
  const rows = await db
    .select()
    .from(aiSummariesTable)
    .where(eq(aiSummariesTable.patientId, patientDbId))
    .orderBy(desc(aiSummariesTable.generatedAt))
    .limit(1);
  return rows[0] ?? null;
}

/** Error whose message is safe to show the doctor in the UI. */
export class AiServiceError extends Error {
  constructor(message: string, public httpStatus = 502) {
    super(message);
    this.name = 'AiServiceError';
  }
}

const DISCLAIMER =
  'AI-generated summary. Verify important information against the original medical records. This tool does not diagnose or prescribe treatment.';

// gemini-1.5-* and (since mid-2026) gemini-2.5-* return 404, so try the configured
// model first, then current fallbacks. Override with GEMINI_MODEL in .env.
const FALLBACK_MODELS = ['gemini-3-flash-preview', 'gemini-3.5-flash', 'gemini-flash-latest'];

function modelCandidates(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim();
  return [...new Set([configured, ...FALLBACK_MODELS].filter((m): m is string => !!m))];
}

async function callGemini(prompt: string): Promise<{ text: string; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new AiServiceError(
      'AI service is not configured. Add GEMINI_API_KEY to your .env file and restart the backend.',
      503,
    );
  }

  const tried: string[] = [];
  for (const model of modelCandidates()) {
    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          // key in a header (not the URL) so it never ends up in logs
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 8192, responseMimeType: 'application/json' },
          }),
        },
      );
    } catch {
      throw new AiServiceError('Could not reach the Gemini API. Check the backend machine\'s internet connection.');
    }

    if (res.status === 404) { tried.push(model); continue; } // retired / unknown model → next
    const raw = await res.text();

    if (res.status === 400 && /api key not valid|API_KEY_INVALID/i.test(raw)) {
      throw new AiServiceError('Gemini rejected the API key. Check GEMINI_API_KEY in .env and restart the backend.');
    }
    if (res.status === 401 || res.status === 403) {
      throw new AiServiceError('Gemini denied access (invalid key or API not enabled for this key). Check GEMINI_API_KEY.');
    }
    if (res.status === 429) {
      throw new AiServiceError('Gemini quota/rate limit reached. Wait a minute and try again.', 429);
    }
    if (res.status === 503) {
      throw new AiServiceError('Gemini is temporarily overloaded. Please try again shortly.', 503);
    }
    if (!res.ok) {
      throw new AiServiceError(`Gemini API error ${res.status}: ${raw.slice(0, 200)}`);
    }

    const data = JSON.parse(raw) as {
      candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[];
      promptFeedback?: { blockReason?: string };
    };
    const cand = data.candidates?.[0];
    const text = (cand?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? '').join('').trim();
    if (!text) {
      throw new AiServiceError(
        `Gemini returned no content (${data.promptFeedback?.blockReason ?? cand?.finishReason ?? 'empty response'}).`,
      );
    }
    return { text, model };
  }

  throw new AiServiceError(
    `No available Gemini model (tried: ${tried.join(', ')}). Set GEMINI_MODEL in .env to a current model ` +
      'listed at https://ai.google.dev/gemini-api/docs/models and restart the backend.',
  );
}

const asStrings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];

export async function generateAiSummary(
  patient: PatientRow,
  records: ClinicalRecord[],
  doctorName: string,
): Promise<AiSummary> {
  const recordText = records
    .map(
      (r) =>
        `[#${r.id}] ${r.date} | ${r.recordType} | ${r.verified ? 'VERIFIED' : 'UNVERIFIED'} | ${r.title}: ${r.description}`,
    )
    .join('\n');

  const prompt = `You are a clinical summarisation assistant for a doctor. Summarise ONLY facts stated in the records below.
Do NOT diagnose, do NOT suggest or prescribe treatment, do NOT invent anything.
Facts that come only from UNVERIFIED records must be listed under "needsVerification", not in the other sections.

Patient: ${patient.name}, age ${patient.age}, ${patient.gender}
Allergies on file: ${patient.allergies.join(', ') || 'None'}
Chronic conditions on file: ${patient.chronicConditions.join(', ') || 'None'}
Current medicines on file: ${patient.currentMedicines.join(', ') || 'None'}

Records (format: [#recordId] date | type | verification | title: details):
${recordText}

Return ONLY a JSON object with exactly these keys:
{
  "allergies": ["..."], "medicines": ["..."], "conditions": ["..."], "surgeries": ["..."],
  "labFindings": ["..."], "vaccinations": ["..."],
  "timeline": [{"date": "YYYY-MM-DD", "event": "...", "recordId": 0}],
  "alerts": ["..."], "needsVerification": ["..."],
  "sources": [{"claim": "<exact text of one item above>", "recordId": 0}]
}
"sources" must cite, for every item in the lists above, the numeric record id (the number after #) it came from.`;

  const { text } = await callGemini(prompt);

  let parsed: Record<string, unknown>;
  try {
    const cleaned = text.replace(/^```(?:json)?|```$/gim, '').trim();
    parsed = JSON.parse(cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1)) as Record<string, unknown>;
  } catch {
    throw new AiServiceError('Gemini returned a response that could not be read. Please click Generate again.');
  }

  const byId = new Map(records.map((r) => [r.id, r]));
  const sources = (Array.isArray(parsed.sources) ? parsed.sources : [])
    .map((s) => s as { claim?: unknown; recordId?: unknown })
    .filter((s) => typeof s.claim === 'string' && typeof s.recordId === 'number' && byId.has(s.recordId))
    .map((s) => {
      const rec = byId.get(s.recordId as number)!;
      return { claim: s.claim as string, recordId: rec.id, recordTitle: rec.title, recordDate: String(rec.date) };
    });

  const timeline = (Array.isArray(parsed.timeline) ? parsed.timeline : [])
    .map((t) => t as { date?: unknown; event?: unknown; recordId?: unknown })
    .filter((t) => typeof t.date === 'string' && typeof t.event === 'string')
    .map((t) => ({
      date: t.date as string,
      event: t.event as string,
      recordId: typeof t.recordId === 'number' && byId.has(t.recordId) ? t.recordId : null,
    }));

  const claims = {
    allergies:         asStrings(parsed.allergies),
    medicines:         asStrings(parsed.medicines),
    conditions:        asStrings(parsed.conditions),
    surgeries:         asStrings(parsed.surgeries),
    labFindings:       asStrings(parsed.labFindings),
    vaccinations:      asStrings(parsed.vaccinations),
    timeline,
    alerts:            asStrings(parsed.alerts),
    needsVerification: asStrings(parsed.needsVerification),
    sources,
  };

  const rows = await db
    .insert(aiSummariesTable)
    .values({ patientId: patient.id, generatedBy: doctorName, claims, disclaimer: DISCLAIMER, recordCount: records.length })
    .returning();
  return rows[0];
}

export function serializeSummary(s: AiSummary) {
  return {
    id: s.id,
    patientId: s.patientId,
    generatedAt: s.generatedAt,
    generatedBy: s.generatedBy,
    claims: s.claims,
    disclaimer: s.disclaimer,
    recordCount: s.recordCount,
  };
}

// ─── Audit logs ───────────────────────────────────────────────────────────────

export async function addAuditEvent(
  patientDbId: number,
  event: string,
  actor: string,
  purpose: string,
  tone: 'success' | 'info' | 'warning' = 'info',
) {
  await db.insert(auditLogsTable).values({ patientId: patientDbId, event, actor, purpose, tone });
}

export async function getAuditLogs(patientDbId: number): Promise<AuditLog[]> {
  return db
    .select()
    .from(auditLogsTable)
    .where(eq(auditLogsTable.patientId, patientDbId))
    .orderBy(desc(auditLogsTable.timestamp), desc(auditLogsTable.id));
}

export function serializeAuditEvent(e: AuditLog) {
  return { id: e.id, event: e.event, actor: e.actor, purpose: e.purpose, timestamp: e.timestamp, tone: e.tone };
}