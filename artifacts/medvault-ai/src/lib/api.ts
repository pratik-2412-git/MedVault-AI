/**
 * artifacts/medvault-ai/src/lib/api.ts
 *
 * Typed fetch helpers. Field names match what medvault-routes.ts actually returns.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Facility {
  id: number;
  name: string;
  city: string;
  state: string;
}

/** Matches GET /api/patients/:patientId response exactly */
export interface Patient {
  id: number;
  patientId: string;
  name: string;
  age: number;
  gender: string;
  healthId: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedicines: string[];
  facilityId: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Matches GET /api/patients/:patientId/records response exactly */
export interface ClinicalRecord {
  id: number;
  patientId: number;
  recordType: string;    // e.g. "diagnosis", "surgery", "lab_report"
  title: string;
  description: string;
  date: string;          // "2025-08-10"
  verified: boolean;
  verifiedBy: number | null;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Matches GET /api/doctors/:registrationNumber response exactly */
export interface Doctor {
  id: number;
  registrationNumber: string;
  name: string;
  specialization: string;
  facilityId: number | null;
  facility?: string;   // present when backend joins facility name (doctors.ts route does this)
  city?: string;
  email: string;
  role: string;
  verified: boolean;
}

/**
 * Matches the JSON shape produced by generateAiSummary() in lib/medvault.ts.
 * Gemini returns ONE object, not an array of claims.
 */
export interface AiSummaryClaims {
  allergies?: string[];
  medicines?: string[];
  conditions?: string[];
  surgeries?: string[];
  labFindings?: string[];
  vaccinations?: string[];
  timeline?: { date: string; event: string }[];
  alerts?: string[];
  needsVerification?: string[];
  raw?: string; // fallback if Gemini's response wasn't valid JSON
}

/** Matches GET /api/patients/:patientId/summary */
export interface AiSummary {
  id: number;
  patientId: number;
  generatedAt: string;
  generatedBy: string;
  claims: AiSummaryClaims | null;
  disclaimer: string | null;
  recordCount: number;
}

export interface AuditLog {
  id: number;
  event: string;
  actor: string;
  purpose: string | null;
  timestamp: string;
  tone: string;
}

export type PatientSummary = Patient;

/** Form shape used by the Add/Edit record UI. Mapped to backend fields on submit. */
export interface RecordFormData {
  title: string;
  category: string;     // UI label → mapped to recordType
  recordDate: string;    // UI label → mapped to date
  detail: string;        // UI label → mapped to description
  sourceDocument: string; // UI-only; not persisted (no sourceDocument column)
  status: string;         // "Verified" | "Pending" | "Unverified" → mapped to verified boolean
}

// ─── Base fetch ───────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const b = await res.json();
      message = b.error ?? b.message ?? message;
    } catch {
      /* ignore parse failure */
    }
    throw new Error(message);
  }
  // 204 No Content etc.
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

// ─── Patient ─────────────────────────────────────────────────────────────────

export const getPatient = (id: string) =>
  apiFetch<Patient>(`/patients/${encodeURIComponent(id)}`);

export const getPatientRecords = (id: string) =>
  apiFetch<ClinicalRecord[]>(`/patients/${encodeURIComponent(id)}/records`);

export const getPatientSummary = (id: string) =>
  apiFetch<AiSummary | null>(`/patients/${encodeURIComponent(id)}/summary`);

export const getAuditLogs = (id: string) =>
  apiFetch<AuditLog[]>(`/patients/${encodeURIComponent(id)}/audit-logs`);

// ─── Doctor ───────────────────────────────────────────────────────────────────

export const getDoctor = (regNum: string) =>
  apiFetch<Doctor>(`/doctors/${encodeURIComponent(regNum)}`);

/** GET /api/doctors/:registrationNumber/patients — the real endpoint, not a flat /patients list */
export const getDoctorPatients = (regNum: string) =>
  apiFetch<Patient[]>(`/doctors/${encodeURIComponent(regNum)}/patients`);

// ─── Records (doctor-only writes) ─────────────────────────────────────────────

function toRecordType(category: string): string {
  return category.toLowerCase().replace(/\s+/g, '_');
}

export const addRecord = (patientId: string, doctorReg: string, data: RecordFormData) =>
  apiFetch<ClinicalRecord>(
    `/patients/${encodeURIComponent(patientId)}/records?doctorReg=${encodeURIComponent(doctorReg)}`,
    {
      method: 'POST',
      body: JSON.stringify({
        recordType:  toRecordType(data.category),
        title:       data.title,
        description: data.detail,
        date:        data.recordDate,
        verified:    data.status === 'Verified',
      }),
    },
  );

export const updateRecord = (
  recordId: number,
  patientId: string,
  doctorReg: string,
  data: Partial<RecordFormData>,
) =>
  apiFetch<ClinicalRecord>(
    `/records/${recordId}?doctorReg=${encodeURIComponent(doctorReg)}&patientId=${encodeURIComponent(patientId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        // FIX: category was previously dropped on update, silently reverting recordType
        ...(data.category !== undefined ? { recordType: toRecordType(data.category) } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.detail !== undefined ? { description: data.detail } : {}),
        ...(data.recordDate !== undefined ? { date: data.recordDate } : {}),
        ...(data.status !== undefined ? { verified: data.status === 'Verified' } : {}),
      }),
    },
  );

export const generatePatientSummary = (patientId: string, doctorReg: string) =>
  apiFetch<AiSummary>(
    `/patients/${encodeURIComponent(patientId)}/summary/generate?doctorReg=${encodeURIComponent(doctorReg)}`,
    { method: 'POST' },
  );