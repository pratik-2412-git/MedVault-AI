/**
 * artifacts/medvault-ai/src/lib/api.ts
 *
 * Typed fetch helpers. Field names match what the Express API really returns.
 * Every doctor-initiated call sends ?doctorReg=… — the backend then checks the
 * doctor↔patient assignment (403 if the patient is not assigned to that doctor).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

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
  facilityName: string | null;
}

export type RecordType =
  | 'diagnosis' | 'surgery' | 'lab_report' | 'prescription'
  | 'vaccination' | 'hospital_visit' | 'allergy_note';

export interface ClinicalRecord {
  id: number;
  patientId: number;
  recordType: RecordType;
  title: string;
  description: string;
  date: string;
  verified: boolean;
  verifiedBy: number | null;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Doctor {
  id: number;
  registrationNumber: string;
  name: string;
  specialization: string;
  facilityId: number | null;
  facility: string | null;
  email: string;
  role: string;
  verified: boolean;
}

export interface SummarySource {
  claim: string;
  recordId: number;
  recordTitle: string;
  recordDate: string;
}

export interface SummaryClaims {
  allergies?: string[];
  medicines?: string[];
  conditions?: string[];
  surgeries?: string[];
  labFindings?: string[];
  vaccinations?: string[];
  timeline?: { date: string; event: string; recordId?: number | null }[];
  alerts?: string[];
  needsVerification?: string[];
  sources?: SummarySource[];
}

export interface AiSummary {
  id: number;
  patientId: number;
  generatedAt: string;
  generatedBy: string;
  claims: SummaryClaims | null;
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

/** What the add/edit form edits (maps 1:1 onto the DB columns). */
export interface RecordFormData {
  title: string;
  recordType: RecordType;
  date: string;
  description: string;
  verified: boolean;
}

export interface Facility {
  id: number;
  name: string;
  city: string;
  state: string;
}

/** What the "Add Patient" form submits. */
export interface NewPatientData {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  allergies: string[];
  chronicConditions: string[];
  currentMedicines: string[];
  facilityId: number | null;
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
      const b = (await res.json()) as { error?: string; message?: string };
      message = b.error ?? b.message ?? message;
    } catch { /* non-JSON error body */ }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

const q = (doctorReg: string) => `doctorReg=${encodeURIComponent(doctorReg)}`;
/** Query string for reads: doctor mode when a reg number is given, patient-portal mode otherwise. */
const qOpt = (doctorReg?: string) => (doctorReg ? `?${q(doctorReg)}` : '');
const pid = (id: string) => encodeURIComponent(id);

// ─── Doctor-scoped reads ──────────────────────────────────────────────────────

export const getDoctor = (regNum: string) =>
  apiFetch<Doctor>(`/doctors/${encodeURIComponent(regNum)}`);

/** ONLY this doctor's assigned patients. */
export const getDoctorPatients = (doctorReg: string) =>
  apiFetch<Patient[]>(`/doctors/${encodeURIComponent(doctorReg)}/patients?${q(doctorReg)}`);

/** doctorReg omitted → patient-portal read (own data, read-only). */
export const getPatient = (id: string, doctorReg?: string) =>
  apiFetch<Patient>(`/patients/${pid(id)}${qOpt(doctorReg)}`);

export const getPatientRecords = (id: string, doctorReg?: string) =>
  apiFetch<ClinicalRecord[]>(`/patients/${pid(id)}/records${qOpt(doctorReg)}`);

export const getPatientSummary = (id: string, doctorReg?: string) =>
  apiFetch<AiSummary | null>(`/patients/${pid(id)}/summary${qOpt(doctorReg)}`);

export const getAuditLogs = (id: string, doctorReg: string) =>
  apiFetch<AuditLog[]>(`/patients/${pid(id)}/audit-logs?${q(doctorReg)}`);

// ─── Doctor-only writes ───────────────────────────────────────────────────────

export const addRecord = (id: string, doctorReg: string, data: RecordFormData) =>
  apiFetch<ClinicalRecord>(`/patients/${pid(id)}/records?${q(doctorReg)}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateRecord = (recordId: number, id: string, doctorReg: string, data: RecordFormData) =>
  apiFetch<ClinicalRecord>(`/records/${recordId}?${q(doctorReg)}&patientId=${pid(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const generatePatientSummary = (id: string, doctorReg: string) =>
  apiFetch<AiSummary>(`/patients/${pid(id)}/summary/generate?${q(doctorReg)}`, { method: 'POST' });

// ─── Facilities ───────────────────────────────────────────────────────────────

export const listFacilities = () => apiFetch<Facility[]>('/facilities');

// ─── Add Patient (doctor-only) ─────────────────────────────────────────────────

/** Creates a patient and auto-assigns the creating doctor to them. */
export const createPatient = (doctorReg: string, data: NewPatientData) =>
  apiFetch<Patient>(`/patients?${q(doctorReg)}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });