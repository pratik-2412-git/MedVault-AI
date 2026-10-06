/**
 * artifacts/medvault-ai/src/pages/DoctorDashboard.tsx
 *
 * Rewritten to match the real api.ts types:
 *   ClinicalRecord uses recordType / description / date / verified (not category/detail/sourceDocument/status)
 *   Patient uses allergies[] / chronicConditions[] / currentMedicines[] (not allergy/conditions/medicines)
 *   AiSummary.claims is ONE object { allergies, medicines, conditions, surgeries, labFindings,
 *     vaccinations, timeline, alerts, needsVerification } — not an array of claim objects.
 */

import { useEffect, useState, useCallback } from "react";
import {
  Shield, ArrowLeft, Loader2, AlertCircle, Search, User,
  Activity, Pill, FlaskConical, Syringe, Scissors, FileText,
  Heart, Calendar, BadgeCheck, Stethoscope, Plus,
  Pencil, Sparkles, ChevronDown, ChevronUp, CheckCircle,
  Clock, X, RefreshCw, ShieldAlert,
} from "lucide-react";
import {
  getDoctorPatients,
  getPatient,
  getPatientRecords,
  addRecord,
  updateRecord,
  getPatientSummary,
  generatePatientSummary,
  getAuditLogs,
  type Doctor,
  type Patient,
  type PatientSummary,
  type ClinicalRecord,
  type RecordFormData,
  type AiSummary,
  type AuditLog,
} from "../lib/api";

// ─── Category maps (keyed by recordType, e.g. "lab_report", "hospital_visit") ─

const CATEGORY_ICON: Record<string, React.ElementType> = {
  surgery: Scissors,
  diagnosis: Activity,
  lab_report: FlaskConical,
  prescription: Pill,
  vaccination: Syringe,
  radiology: FileText,
  consultation: Heart,
  allergy_note: ShieldAlert,
  hospital_visit: Calendar,
};

const CATEGORY_COLOR: Record<string, string> = {
  surgery: "text-red-400 bg-red-500/10 border-red-500/20",
  diagnosis: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  lab_report: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  prescription: "text-green-400 bg-green-500/10 border-green-500/20",
  vaccination: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  radiology: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  consultation: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  allergy_note: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  hospital_visit: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
};

const CATEGORIES = [
  "Diagnosis", "Prescription", "Lab Report", "Surgery", "Vaccination",
  "Radiology", "Consultation", "Allergy Note", "Hospital Visit",
];

const STATUS_OPTIONS = ["Verified", "Pending", "Unverified"];

function formatCategory(recordType: string | undefined): string {
  if (!recordType) return "—";
  return recordType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function CategoryIcon({ recordType }: { recordType: string }) {
  const key = recordType?.toLowerCase() ?? "";
  const Icon = CATEGORY_ICON[key] ?? FileText;
  const colorClass = CATEGORY_COLOR[key] ?? "text-slate-400 bg-slate-500/10 border-slate-500/20";
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 ${colorClass}`}>
      <Icon className="w-4 h-4" />
    </span>
  );
}

// ─── Record form ──────────────────────────────────────────────────────────────

const EMPTY_FORM: RecordFormData = {
  title: "", category: "Diagnosis", recordDate: "", detail: "", sourceDocument: "", status: "Verified",
};

interface RecordFormProps {
  initial?: Partial<RecordFormData>;
  onSave: (data: RecordFormData) => Promise<void>;
  onCancel: () => void;
  mode: "add" | "edit";
}

function RecordForm({ initial, onSave, onCancel, mode }: RecordFormProps) {
  const [form, setForm] = useState<RecordFormData>({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set(key: keyof RecordFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErr(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.recordDate || !form.detail) {
      setErr("Title, date, and clinical detail are required.");
      return;
    }
    setSaving(true);
    try { await onSave(form); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setSaving(false); }
  }

  const inputCls = "w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all";
  const labelCls = "block text-slate-300 text-xs mb-1.5 font-medium";

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4 mt-4">
      <h4 className="text-white font-semibold text-sm">
        {mode === "add" ? "➕ Add New Record" : "✏️ Edit Record"}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Title *</label>
          <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. HbA1c Test" />
        </div>
        <div>
          <label className={labelCls}>Category *</label>
          <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Record Date *</label>
          <input type="date" className={inputCls} value={form.recordDate} onChange={(e) => set("recordDate", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Clinical Detail *</label>
          <textarea rows={4} className={`${inputCls} resize-none`} value={form.detail} onChange={(e) => set("detail", e.target.value)} placeholder="Enter detailed clinical findings…" />
        </div>
      </div>
      {err && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {err}
        </div>
      )}
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-400 hover:text-white border border-white/10 hover:border-white/20 text-sm transition-all">
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
        <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-sm font-medium transition-all">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          {saving ? "Saving…" : "Save Record"}
        </button>
      </div>
    </form>
  );
}

// ─── Doctor record card (with inline edit) ────────────────────────────────────

interface DoctorRecordCardProps {
  record: ClinicalRecord;
  doctorReg: string;
  patientId: string;
  onUpdated: (r: ClinicalRecord) => void;
}

function DoctorRecordCard({ record, doctorReg, patientId, onUpdated }: DoctorRecordCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSave(data: RecordFormData) {
    const updated = await updateRecord(record.id, patientId, doctorReg, data);
    onUpdated(updated);
    setEditing(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4">
        <CategoryIcon recordType={record.recordType} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">{record.title}</p>
          <p className="text-slate-400 text-xs mt-0.5">
            {formatCategory(record.recordType)} · {record.date ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${record.verified ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20"}`}>
            {record.verified ? "Verified" : "Pending"}
          </span>
          {success && <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />Saved</span>}
          <button
            onClick={() => { setEditing((v) => !v); setExpanded(true); }}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40 px-2.5 py-1 rounded-lg transition-all"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
          <button onClick={() => { setExpanded((v) => !v); setEditing(false); }}>
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>
      {expanded && !editing && (
        <div className="px-5 pb-4 border-t border-white/5">
          <p className="text-slate-300 text-sm leading-relaxed mt-3">{record.description}</p>
          {record.updatedBy != null && <p className="text-slate-600 text-xs mt-2">Last updated by doctor #{record.updatedBy}</p>}
        </div>
      )}
      {editing && (
        <div className="px-5 pb-4 border-t border-white/5">
          <RecordForm
            initial={{
              title: record.title,
              category: formatCategory(record.recordType),
              recordDate: record.date,
              detail: record.description,
              status: record.verified ? "Verified" : "Pending",
            }}
            onSave={handleSave}
            onCancel={() => { setEditing(false); setExpanded(false); }}
            mode="edit"
          />
        </div>
      )}
    </div>
  );
}

// ─── AI Summary panel ─────────────────────────────────────────────────────────
// Renders the single structured object Gemini returns, not a list of discrete claims.

interface AiSummaryPanelProps {
  patientId: string;
  doctorReg: string;
  onClose: () => void;
}

function SummarySection({
  title, items, colorClass,
}: { title: string; items?: string[]; colorClass: string }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className={`font-semibold mb-1 text-sm ${colorClass}`}>{title}</p>
      <ul className="space-y-0.5">
        {items.map((it, i) => (
          <li key={i} className="text-slate-300 text-xs">• {it}</li>
        ))}
      </ul>
    </div>
  );
}

function AiSummaryPanel({ patientId, doctorReg, onClose }: AiSummaryPanelProps) {
  const [summary, setSummary] = useState<AiSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPatientSummary(patientId)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setFetching(false));
  }, [patientId]);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const s = await generatePatientSummary(patientId, doctorReg);
      setSummary(s);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const claims = summary?.claims;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white font-semibold">AI Clinical Summary</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              {loading ? "Generating…" : "Generate Fresh Summary"}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {fetching && (
            <div className="flex items-center justify-center gap-3 py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading…
            </div>
          )}
          {!fetching && error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-4 text-red-300 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}
          {!fetching && !summary && !error && (
            <div className="text-center py-12 text-slate-500">
              <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="mb-4">No summary generated yet.</p>
              <button onClick={generate} disabled={loading} className="flex items-center gap-2 mx-auto bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate AI Summary
              </button>
            </div>
          )}
          {summary && claims && (
            <>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                {new Date(summary.generatedAt).toLocaleString("en-IN")} · by {summary.generatedBy} · {summary.recordCount} records
              </div>

              {claims.alerts && claims.alerts.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <p className="text-red-300 font-semibold mb-1 text-sm">⚠ Alerts</p>
                  {claims.alerts.map((a, i) => <p key={i} className="text-red-200 text-xs">• {a}</p>)}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummarySection title="Allergies" items={claims.allergies} colorClass="text-rose-300" />
                <SummarySection title="Medicines" items={claims.medicines} colorClass="text-green-300" />
                <SummarySection title="Conditions" items={claims.conditions} colorClass="text-blue-300" />
                <SummarySection title="Surgeries" items={claims.surgeries} colorClass="text-orange-300" />
                <SummarySection title="Lab Findings" items={claims.labFindings} colorClass="text-purple-300" />
                <SummarySection title="Vaccinations" items={claims.vaccinations} colorClass="text-cyan-300" />
              </div>

              {claims.timeline && claims.timeline.length > 0 && (
                <div>
                  <p className="text-slate-300 font-semibold mb-2 text-sm">Timeline</p>
                  <div className="space-y-1">
                    {claims.timeline.map((t, i) => (
                      <div key={i} className="flex gap-3 text-xs">
                        <span className="text-slate-500 font-mono w-24 shrink-0">{t.date}</span>
                        <span className="text-slate-300">{t.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {claims.needsVerification && claims.needsVerification.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                  <p className="text-amber-300 font-semibold mb-1 text-sm">Needs Verification</p>
                  {claims.needsVerification.map((n, i) => <p key={i} className="text-amber-200 text-xs">• {n}</p>)}
                </div>
              )}

              {claims.raw && (
                <div className="bg-slate-800 border border-white/10 rounded-xl p-3">
                  <p className="text-slate-400 font-semibold mb-1 text-xs">Raw response (could not parse as structured JSON)</p>
                  <pre className="text-slate-400 text-xs whitespace-pre-wrap">{claims.raw}</pre>
                </div>
              )}

              {summary.disclaimer && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-200/70 text-xs leading-relaxed">
                  ⚠️ {summary.disclaimer}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Patient detail panel ─────────────────────────────────────────────────────

interface PatientDetailProps {
  patientId: string;
  doctor: Doctor;
  onBack: () => void;
}

function PatientDetail({ patientId, doctor, onBack }: PatientDetailProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, r, a] = await Promise.all([
        getPatient(patientId),
        getPatientRecords(patientId),
        getAuditLogs(patientId),
      ]);
      setPatient(p);
      setRecords(r);
      setAuditLogs(a);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  async function handleAddRecord(data: RecordFormData) {
    await addRecord(patientId, doctor.registrationNumber, data);
    setShowAddForm(false);
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 3000);
    await load();
  }

  function handleRecordUpdated(updated: ClinicalRecord) {
    setRecords((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-16 text-slate-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading patient…
    </div>
  );

  if (error || !patient) return (
    <div className="flex-1 flex items-center justify-center py-16 text-center">
      <div>
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">{error ?? "Patient not found."}</p>
        <button onClick={onBack} className="mt-4 text-blue-400 text-sm hover:underline">← Back to list</button>
      </div>
    </div>
  );

  const initials = patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="space-y-6">
      {showSummary && (
        <AiSummaryPanel patientId={patientId} doctorReg={doctor.registrationNumber} onClose={() => setShowSummary(false)} />
      )}

      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> All Patients
        </button>
        <div className="ml-auto flex flex-wrap gap-2">
          {addSuccess && <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />Record added</span>}
          <button onClick={() => setShowAudit((v) => !v)} className="flex items-center gap-1.5 text-xs border border-white/10 hover:border-white/20 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-all">
            <Clock className="w-3.5 h-3.5" /> Audit Log
          </button>
          <button onClick={() => setShowAddForm((v) => !v)} className="flex items-center gap-1.5 text-xs border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg transition-all">
            <Plus className="w-3.5 h-3.5" /> Add Record
          </button>
          <button onClick={() => setShowSummary(true)} className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-all">
            <Sparkles className="w-3.5 h-3.5" /> Generate Fresh AI Summary
          </button>
        </div>
      </div>

      {/* Patient profile */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-lg font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-white text-xl font-bold">{patient.name}</h3>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">{patient.patientId}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{patient.age} yrs · {patient.gender}</span>
              <span className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5 text-green-400" />{patient.healthId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <h4 className="text-red-300 text-xs font-semibold flex items-center gap-2 mb-2"><AlertCircle className="w-3.5 h-3.5" />Critical Allergies</h4>
          {patient.allergies.length > 0
            ? patient.allergies.map((a) => <p key={a} className="text-white text-sm">{a}</p>)
            : <p className="text-slate-500 text-sm">None documented</p>}
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
          <h4 className="text-blue-300 text-xs font-semibold flex items-center gap-2 mb-2"><Activity className="w-3.5 h-3.5" />Chronic Conditions</h4>
          {patient.chronicConditions.length > 0
            ? patient.chronicConditions.map((c) => <p key={c} className="text-white text-sm">{c}</p>)
            : <p className="text-slate-500 text-sm">None documented</p>}
        </div>
        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
          <h4 className="text-green-300 text-xs font-semibold flex items-center gap-2 mb-2"><Pill className="w-3.5 h-3.5" />Active Medicines</h4>
          {patient.currentMedicines.length > 0
            ? patient.currentMedicines.map((m) => <p key={m} className="text-white text-sm">{m}</p>)
            : <p className="text-slate-500 text-sm">None documented</p>}
        </div>
      </div>

      {/* Add record form */}
      {showAddForm && (
        <RecordForm mode="add" onSave={handleAddRecord} onCancel={() => setShowAddForm(false)} />
      )}

      {/* Audit log */}
      {showAudit && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h4 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" /> Audit Log
          </h4>
          {auditLogs.length === 0 ? (
            <p className="text-slate-500 text-sm">No audit events yet.</p>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${log.tone === "success" ? "bg-green-500/5 border-green-500/20" : log.tone === "warning" ? "bg-amber-500/5 border-amber-500/20" : "bg-white/5 border-white/10"}`}>
                  <span className={`text-xs font-bold mt-0.5 ${log.tone === "success" ? "text-green-400" : log.tone === "warning" ? "text-amber-400" : "text-slate-400"}`}>
                    {log.tone === "success" ? "✓" : log.tone === "warning" ? "⚠" : "ℹ"}
                  </span>
                  <div>
                    <p className="text-white text-sm font-medium">{log.event}</p>
                    <p className="text-slate-400 text-xs">{log.actor} · {log.purpose}</p>
                    <p className="text-slate-600 text-xs">{new Date(log.timestamp).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Records */}
      <div>
        <h4 className="text-white font-semibold text-base flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-emerald-400" />
          Medical Records
          <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">{records.length}</span>
        </h4>
        {records.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No records. Click "Add Record" to create the first one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <DoctorRecordCard key={r.id} record={r} doctorReg={doctor.registrationNumber} patientId={patientId} onUpdated={handleRecordUpdated} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Doctor Dashboard ────────────────────────────────────────────────────

interface DoctorDashboardProps {
  doctor: Doctor;
  onBack: () => void;
}

export default function DoctorDashboard({ doctor, onBack }: DoctorDashboardProps) {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  useEffect(() => {
    getDoctorPatients(doctor.registrationNumber)
      .then(setPatients)
      .catch(() => setPatients([]))
      .finally(() => setLoadingPatients(false));
  }, [doctor.registrationNumber]);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.patientId.toLowerCase().includes(q) ||
      p.healthId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900">
      {/* Header */}
      <header className="px-6 py-4 flex items-center gap-3 border-b border-white/10 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30">
          <Shield className="w-4 h-4 text-emerald-400" />
        </div>
        <span className="text-white font-bold text-base">MedVault AI</span>
        <span className="text-slate-500 text-sm hidden sm:inline">/ Doctor Dashboard</span>
        <button onClick={onBack} className="ml-auto flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Sign Out
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Doctor info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 shrink-0">
            <Stethoscope className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-white text-lg font-bold">{doctor.name}</h2>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">{doctor.registrationNumber}</span>
              {doctor.verified && <span className="text-xs text-green-300 flex items-center gap-1"><BadgeCheck className="w-3 h-3" />Verified</span>}
            </div>
            <p className="text-slate-400 text-sm">{doctor.specialization}{doctor.facility ? ` · ${doctor.facility}` : ""}</p>
          </div>
        </div>

        {selectedPatientId ? (
          <PatientDetail patientId={selectedPatientId} doctor={doctor} onBack={() => setSelectedPatientId(null)} />
        ) : (
          <>
            {/* Search */}
            <div className="mb-6 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, Patient ID, or Health ID…"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Patient list */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" /> Patients
                <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">{filtered.length}</span>
              </h3>
            </div>

            {loadingPatients ? (
              <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading patients…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No patients match your search.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((p) => {
                  const initials = p.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                  return (
                    <button
                      key={p.patientId}
                      onClick={() => setSelectedPatientId(p.patientId)}
                      className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 rounded-xl px-5 py-4 text-left transition-all group"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-bold shrink-0 group-hover:bg-emerald-500/20 transition-all">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-white text-sm font-medium">{p.name}</span>
                          <span className="text-xs text-slate-500">{p.patientId}</span>
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5 truncate">
                          {p.age} yrs · {p.gender}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.chronicConditions.slice(0, 2).map((c) => (
                          <span key={c} className="hidden sm:inline text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full">
                            {c}
                          </span>
                        ))}
                        <span className="text-slate-400 group-hover:text-emerald-400 text-xs transition-colors">View →</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}