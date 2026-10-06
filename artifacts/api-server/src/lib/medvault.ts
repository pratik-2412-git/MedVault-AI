/**
 * artifacts/api-server/src/lib/medvault.ts
 *
 * All column names match schema.sql v2:
 *   patients:  allergies[], chronicConditions[], currentMedicines[]
 *   clinical_records: recordType, description, date, verified, verifiedBy, createdBy
 *
 * Gemini integration: stable model (default gemini-3-flash, override via
 * GEMINI_MODEL in .env), with automatic retry on 503 (overloaded) and on
 * MAX_TOKENS truncation (retries with a larger token budget).
 */
import {
  db,
  patientsTable,
  clinicalRecordsTable,
  doctorsTable,
  facilitiesTable,
  aiSummariesTable,
  auditLogsTable,
  consentsTable,
} from "../../../../lib/db/src";
import { eq, desc, and, isNull } from "drizzle-orm";

// ─── Inferred types ──────────────────────────────────────────────────────────
type Patient        = typeof patientsTable.$inferSelect;
type ClinicalRecord = typeof clinicalRecordsTable.$inferSelect;
type AiSummary       = typeof aiSummariesTable.$inferSelect;
type AuditLog        = typeof auditLogsTable.$inferSelect;
type Consent         = typeof consentsTable.$inferSelect;

// ─── Patients ────────────────────────────────────────────────────────────────

export async function getPatientByStringId(patientId: string): Promise<Patient | null> {
  const rows = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.patientId, patientId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAllPatients() {
  return db
    .select({
      id:                patientsTable.id,
      patientId:         patientsTable.patientId,
      name:              patientsTable.name,
      age:               patientsTable.age,
      gender:            patientsTable.gender,
      healthId:          patientsTable.healthId,
      allergies:         patientsTable.allergies,
      chronicConditions: patientsTable.chronicConditions,
      currentMedicines:  patientsTable.currentMedicines,
      facilityId:        patientsTable.facilityId,
    })
    .from(patientsTable)
    .orderBy(patientsTable.patientId);
}

// ─── Doctors ─────────────────────────────────────────────────────────────────

export async function getDoctorByRegNumber(regNum: string) {
  const rows = await db
    .select()
    .from(doctorsTable)
    .where(eq(doctorsTable.registrationNumber, regNum))
    .limit(1);
  return rows[0] ?? null;
}

// ─── Clinical Records ────────────────────────────────────────────────────────

export async function getRecords(patientDbId: number) {
  return db
    .select()
    .from(clinicalRecordsTable)
    .where(
      and(
        eq(clinicalRecordsTable.patientId, patientDbId),
        isNull(clinicalRecordsTable.deletedAt),
      ),
    )
    .orderBy(desc(clinicalRecordsTable.date));
}

export async function addRecord(
  patientDbId: number,
  doctorId: number,
  data: {
    recordType: string;
    title: string;
    description: string;
    date: string;
    verified?: boolean;
  },
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
  data: Partial<{
    recordType: string;
    title: string;
    description: string;
    date: string;
    verified: boolean;
  }>,
  doctorDbId: number,
) {
  const rows = await db
    .update(clinicalRecordsTable)
    .set({ ...data, updatedBy: doctorDbId, updatedAt: new Date() })
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

// ─── AI Summaries ────────────────────────────────────────────────────────────

export async function getLatestSummary(patientDbId: number): Promise<AiSummary | null> {
  const rows = await db
    .select()
    .from(aiSummariesTable)
    .where(eq(aiSummariesTable.patientId, patientDbId))
    .orderBy(desc(aiSummariesTable.generatedAt))
    .limit(1);
  return rows[0] ?? null;
}

const TOKEN_BUDGETS = [4000, 6000, 8000];

async function callGeminiOnce(
  model: string,
  apiKey: string,
  prompt: string,
  maxOutputTokens: number,
): Promise<{ text: string; truncated: boolean }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens },
      }),
    },
  );

  if (response.status === 503) {
    const err = new Error("OVERLOADED") as Error & { status?: number };
    err.status = 503;
    throw err;
  }

  if (!response.ok) {
    throw new Error(
      `Gemini API error (model="${model}"): ${response.status} ${await response.text()}`,
    );
  }

  const geminiData = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  };
  const candidate = geminiData?.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text ?? "{}";
  const truncated = candidate?.finishReason === "MAX_TOKENS";

  return { text, truncated };
}

async function callGemini(model: string, apiKey: string, prompt: string): Promise<string> {
  for (let i = 0; i < TOKEN_BUDGETS.length; i++) {
    const budget = TOKEN_BUDGETS[i];

    let result: { text: string; truncated: boolean } | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = await callGeminiOnce(model, apiKey, prompt, budget);
        break;
      } catch (e: unknown) {
        const isOverloaded = (e as { status?: number })?.status === 503;
        if (isOverloaded && attempt < 3) {
          await new Promise((r) => setTimeout(r, attempt * 1000));
          continue;
        }
        throw e;
      }
    }
    if (!result) throw new Error("Gemini call failed after retries.");

    if (!result.truncated) {
      return result.text;
    }
    // else: truncated — retry with the next, larger token budget
  }

  throw new Error(
    `Gemini's response kept getting cut off even at ${TOKEN_BUDGETS[TOKEN_BUDGETS.length - 1]} tokens. ` +
    "This patient may have too many records to summarise in one call.",
  );
}

export async function generateAiSummary(
  patient: Patient,
  records: ClinicalRecord[],
  doctorName: string,
): Promise<AiSummary> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured.");

  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

  const recordText = records
    .map(
      (r) =>
        `[${r.date}] ${r.recordType.toUpperCase()} — ${r.title}: ${r.description ?? ""} (Verified: ${r.verified})`,
    )
    .join("\n");

  const prompt = `You are a clinical summarisation assistant. Produce a structured JSON summary.
Do NOT diagnose or prescribe. Only summarise verified records.
Keep each array entry brief (under 12 words) so the full JSON fits in the response.

Patient: ${patient.name}, Age ${patient.age}, Gender ${patient.gender}
Known Allergies: ${(patient.allergies ?? []).join(", ") || "None"}
Chronic Conditions: ${(patient.chronicConditions ?? []).join(", ") || "None"}
Current Medicines: ${(patient.currentMedicines ?? []).join(", ") || "None"}

Clinical Records:
${recordText}

Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "allergies": ["..."],
  "medicines": ["..."],
  "conditions": ["..."],
  "surgeries": ["..."],
  "labFindings": ["..."],
  "vaccinations": ["..."],
  "timeline": [{"date":"YYYY-MM-DD","event":"..."}],
  "alerts": ["..."],
  "needsVerification": ["..."]
}`;

  const rawText = await callGemini(model, apiKey, prompt);
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    claims = { raw: cleaned };
  }

  const disclaimer =
    "AI-generated summary. Verify important information against the original medical records. This tool does not diagnose or prescribe treatment.";

  const rows = await db
    .insert(aiSummariesTable)
    .values({
      patientId:   patient.id,
      generatedBy: doctorName,
      claims,
      disclaimer,
      recordCount: records.length,
    })
    .returning();

  return rows[0];
}

export function serializeSummary(s: AiSummary) {
  return {
    id:          s.id,
    patientId:   s.patientId,
    generatedAt: s.generatedAt,
    generatedBy: s.generatedBy,
    claims:      s.claims,
    disclaimer:  s.disclaimer,
    recordCount: s.recordCount,
  };
}

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export async function addAuditEvent(
  patientDbId: number,
  event: string,
  actor: string,
  purpose: string,
  tone: "success" | "info" | "warning" = "info",
) {
  await db
    .insert(auditLogsTable)
    .values({ patientId: patientDbId, event, actor, purpose, tone });
}

export function serializeAuditEvent(e: AuditLog) {
  return {
    id:        e.id,
    event:     e.event,
    actor:     e.actor,
    purpose:   e.purpose,
    timestamp: e.timestamp,
    tone:      e.tone,
  };
}

export async function getAuditLogs(patientDbId: number) {
  return db
    .select()
    .from(auditLogsTable)
    .where(eq(auditLogsTable.patientId, patientDbId))
    .orderBy(desc(auditLogsTable.timestamp));
}

// ─── Consents ────────────────────────────────────────────────────────────────

export async function getConsent(consentId: number): Promise<Consent | null> {
  const rows = await db
    .select()
    .from(consentsTable)
    .where(eq(consentsTable.id, consentId))
    .limit(1);
  return rows[0] ?? null;
}

export function serializeConsent(c: Consent) {
  return {
    id:           c.id,
    patientId:    c.patientId,
    patientName:  c.patientName,
    provider:     c.provider,
    purpose:      c.purpose,
    sharedRecords:c.sharedRecords,
    durationDays: c.durationDays,
    status:       c.status,
    requestedAt:  c.requestedAt,
    expiresAt:    c.expiresAt,
  };
}

export async function updateConsentStatus(consentId: number, status: "Active" | "Revoked") {
  const rows = await db
    .update(consentsTable)
    .set({ status })
    .where(eq(consentsTable.id, consentId))
    .returning();
  return rows[0];
}

export async function updateConsentDuration(consentId: number, durationDays: number) {
  const [consent] = await db
    .select()
    .from(consentsTable)
    .where(eq(consentsTable.id, consentId))
    .limit(1);
  if (!consent || consent.status !== "Active") return null;
  const newExpiry = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  const [updated] = await db
    .update(consentsTable)
    .set({ durationDays, expiresAt: newExpiry })
    .where(eq(consentsTable.id, consentId))
    .returning();
  return updated;
}