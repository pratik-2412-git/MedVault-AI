/**
 * artifacts/medvault-ai/src/pages/DoctorDashboard.tsx
 *
 * Doctor dashboard — same layout, palette and card style as PatientDashboard
 * (slate-900 page, solid slate-800 cards, white / slate-200 body text, slate-400 meta).
 * Low-contrast tints (bg-white/5, text-slate-500/600) from the old version are gone.
 *
 * Behaviour is unchanged: patient search + list, View Patient, records, Add / Edit record,
 * Audit Log, Generate Fresh AI Summary. The list now contains ONLY the doctor's assigned
 * patients (enforced by the API), and every call carries ?doctorReg=….
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowLeft, BadgeCheck, Calendar, CheckCircle, ChevronDown, ChevronUp,
  Clock, FilePlus2, FileText, Loader2, MapPin, Pencil, Pill, Plus, RefreshCw, Search, Shield,
  Sparkles, Stethoscope, User, UserPlus, X,
} from 'lucide-react';
import {
  addRecord, createPatient, generatePatientSummary, getAuditLogs, getDoctorPatients, getPatient,
  listFacilities, getPatientRecords, getPatientSummary, updateRecord,
  type AiSummary, type AuditLog, type ClinicalRecord, type Doctor, type Facility,
  type NewPatientData, type Patient, type RecordFormData, type SummaryClaims,
} from '../lib/api';
import {
  RECORD_TYPE_OPTIONS, recordTypeColor, recordTypeIcon, recordTypeLabel,
} from '../lib/recordTypes';

// ─── Small helpers ────────────────────────────────────────────────────────────

const initials = (name: string) =>
  name.replace(/^Dr\.?\s+/i, '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

const fmtDate = (d: string) => String(d).slice(0, 10);

const INPUT =
  'w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm ' +
  'placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
const LABEL = 'block text-slate-200 text-xs font-semibold mb-1.5';
const CARD = 'bg-slate-800 border border-white/10 rounded-2xl';

type Notice = { kind: 'success' | 'error'; text: string } | null;

function NoticeBanner({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  if (!notice) return null;
  const ok = notice.kind === 'success';
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        ok ? 'bg-green-500/10 border-green-500/40 text-green-200' : 'bg-red-500/10 border-red-500/40 text-red-200'
      }`}
    >
      {ok ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
      <span className="flex-1">{notice.text}</span>
      <button onClick={onClose} aria-label="Dismiss" className="text-slate-300 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Record form (add + edit) ─────────────────────────────────────────────────

const EMPTY_FORM: RecordFormData = {
  title: '', recordType: 'diagnosis', date: '', description: '', verified: true,
};

function RecordForm({
  initial, mode, onSave, onCancel,
}: {
  initial?: Partial<RecordFormData>;
  mode: 'add' | 'edit';
  onSave: (data: RecordFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<RecordFormData>({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof RecordFormData>(key: K, value: RecordFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErr(null);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.description.trim()) {
      setErr('Title, date and clinical detail are required.');
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form, title: form.title.trim(), description: form.description.trim() });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : String(e2));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-4 mt-3">
      <h4 className="text-white font-semibold text-base">{mode === 'add' ? 'Add new record' : 'Edit record'}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL} htmlFor={`title-${mode}`}>Title *</label>
          <input id={`title-${mode}`} className={INPUT} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. HbA1c result" />
        </div>
        <div>
          <label className={LABEL} htmlFor={`type-${mode}`}>Record type *</label>
          <select id={`type-${mode}`} className={INPUT} value={form.recordType} onChange={(e) => set('recordType', e.target.value as RecordFormData['recordType'])}>
            {RECORD_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor={`date-${mode}`}>Record date *</label>
          <input id={`date-${mode}`} type="date" className={INPUT} value={form.date} onChange={(e) => set('date', e.target.value)} />
        </div>
        <div>
          <label className={LABEL} htmlFor={`status-${mode}`}>Verification status</label>
          <select id={`status-${mode}`} className={INPUT} value={form.verified ? 'yes' : 'no'} onChange={(e) => set('verified', e.target.value === 'yes')}>
            <option value="yes">Verified</option>
            <option value="no">Pending verification</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor={`desc-${mode}`}>Clinical detail *</label>
          <textarea id={`desc-${mode}`} rows={4} className={`${INPUT} resize-none`} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Enter clinical findings…" />
        </div>
      </div>
      {err && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3 text-red-200 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {err}
        </div>
      )}
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-200 border border-slate-600 hover:border-slate-400 text-sm">
          <X className="w-4 h-4" /> Cancel
        </button>
        <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white text-sm font-semibold">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {saving ? 'Saving…' : mode === 'add' ? 'Add record' : 'Update record'}
        </button>
      </div>
    </form>
  );
}

// ─── Create Health Record modal ───────────────────────────────────────────────
// A second, explicit entry point for adding a record, with diagnosis / treatment /
// notes captured as distinct fields (composed into the single `description`
// column the API and AI-summary pipeline already expect). The existing "Add
// Record" button and RecordForm above are untouched.

interface HealthRecordFormData {
  title: string;
  recordType: RecordFormData['recordType'];
  date: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  verified: boolean;
}

const EMPTY_HEALTH_RECORD: HealthRecordFormData = {
  title: '', recordType: 'diagnosis', date: '', diagnosis: '', treatment: '', notes: '', verified: true,
};

function composeDescription(d: Pick<HealthRecordFormData, 'diagnosis' | 'treatment' | 'notes'>): string {
  const parts: string[] = [];
  if (d.diagnosis.trim()) parts.push(`Diagnosis: ${d.diagnosis.trim()}`);
  if (d.treatment.trim()) parts.push(`Treatment: ${d.treatment.trim()}`);
  if (d.notes.trim()) parts.push(`Notes: ${d.notes.trim()}`);
  return parts.join('\n');
}

function CreateHealthRecordModal({
  onSave, onClose,
}: {
  onSave: (data: RecordFormData) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<HealthRecordFormData>(EMPTY_HEALTH_RECORD);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof HealthRecordFormData>(key: K, value: HealthRecordFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErr(null);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return; // guards against double-submit (e.g. double-click / double Enter)
    if (!form.title.trim() || !form.date) { setErr('Title and date are required.'); return; }
    if (!form.diagnosis.trim() && !form.treatment.trim() && !form.notes.trim()) {
      setErr('Enter at least one of diagnosis, treatment or notes.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: form.title.trim(),
        recordType: form.recordType,
        date: form.date,
        verified: form.verified,
        description: composeDescription(form),
      });
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : String(e2));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FilePlus2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white font-semibold">Create Health Record</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL} htmlFor="chr-title">Title *</label>
              <input id="chr-title" className={INPUT} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Annual check-up" />
            </div>
            <div>
              <label className={LABEL} htmlFor="chr-type">Record type *</label>
              <select id="chr-type" className={INPUT} value={form.recordType} onChange={(e) => set('recordType', e.target.value as RecordFormData['recordType'])}>
                {RECORD_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="chr-date">Date *</label>
              <input id="chr-date" type="date" className={INPUT} value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
            <div>
              <label className={LABEL} htmlFor="chr-status">Verification status</label>
              <select id="chr-status" className={INPUT} value={form.verified ? 'yes' : 'no'} onChange={(e) => set('verified', e.target.value === 'yes')}>
                <option value="yes">Verified</option>
                <option value="no">Pending verification</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="chr-diagnosis">Diagnosis</label>
              <textarea id="chr-diagnosis" rows={2} className={`${INPUT} resize-none`} value={form.diagnosis} onChange={(e) => set('diagnosis', e.target.value)} placeholder="Clinical diagnosis…" />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="chr-treatment">Treatment</label>
              <textarea id="chr-treatment" rows={2} className={`${INPUT} resize-none`} value={form.treatment} onChange={(e) => set('treatment', e.target.value)} placeholder="Treatment given or prescribed…" />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="chr-notes">Notes</label>
              <textarea id="chr-notes" rows={2} className={`${INPUT} resize-none`} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any other clinical notes…" />
            </div>
          </div>

          {err && (
            <div role="alert" className="flex items-start gap-2 bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3 text-red-200 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {err}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-200 border border-slate-600 hover:border-slate-400 text-sm">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white text-sm font-semibold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Health Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Record card ──────────────────────────────────────────────────────────────

function RecordCard({
  record, onSave,
}: {
  record: ClinicalRecord;
  onSave: (record: ClinicalRecord, data: RecordFormData) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const Icon = recordTypeIcon(record.recordType);

  return (
    <div className="bg-slate-800 border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 min-w-0 flex items-center gap-3 text-left"
          aria-expanded={expanded}
        >
          <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border shrink-0 ${recordTypeColor(record.recordType)}`}>
            <Icon className="w-4 h-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-white font-semibold text-sm truncate">{record.title}</span>
            <span className="block text-slate-300 text-xs mt-0.5">
              {recordTypeLabel(record.recordType)} · {fmtDate(record.date)}
            </span>
          </span>
        </button>
        <span className={`hidden sm:inline text-xs px-2.5 py-0.5 rounded-full border font-medium shrink-0 ${
          record.verified ? 'text-green-300 bg-green-500/20 border-green-500/30' : 'text-amber-300 bg-amber-500/20 border-amber-500/30'
        }`}>
          {record.verified ? 'Verified' : 'Pending'}
        </span>
        <button
          onClick={() => { setEditing((v) => !v); setExpanded(true); }}
          className="flex items-center gap-1.5 text-sm font-medium text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 hover:border-emerald-400 px-3 py-1.5 rounded-lg shrink-0"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit Record
        </button>
        <button onClick={() => setExpanded((v) => !v)} aria-label={expanded ? 'Collapse' : 'Expand'} className="shrink-0">
          {expanded ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
        </button>
      </div>

      {expanded && !editing && (
        <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-2">
          <p className="text-slate-200 text-sm leading-relaxed">{record.description}</p>
          <p className="text-slate-400 text-xs">
            Record #{record.id} · Last updated {new Date(record.updatedAt).toLocaleString('en-IN')}
          </p>
        </div>
      )}

      {editing && (
        <div className="px-4 pb-4 border-t border-white/10">
          <RecordForm
            mode="edit"
            initial={{
              title: record.title, recordType: record.recordType, date: fmtDate(record.date),
              description: record.description, verified: record.verified,
            }}
            onSave={async (data) => { await onSave(record, data); setEditing(false); }}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}
    </div>
  );
}

// ─── AI summary modal (doctor can generate) ───────────────────────────────────

const SECTIONS: { key: keyof SummaryClaims; label: string; box: string; title: string }[] = [
  { key: 'alerts',            label: 'Alerts',                   box: 'bg-red-500/10 border-red-500/30',       title: 'text-red-300' },
  { key: 'allergies',         label: 'Allergies',                box: 'bg-rose-500/10 border-rose-500/30',     title: 'text-rose-300' },
  { key: 'conditions',        label: 'Chronic conditions',       box: 'bg-blue-500/10 border-blue-500/30',     title: 'text-blue-300' },
  { key: 'medicines',         label: 'Medicines',                box: 'bg-green-500/10 border-green-500/30',   title: 'text-green-300' },
  { key: 'surgeries',         label: 'Surgeries',                box: 'bg-orange-500/10 border-orange-500/30', title: 'text-orange-300' },
  { key: 'labFindings',       label: 'Laboratory findings',      box: 'bg-purple-500/10 border-purple-500/30', title: 'text-purple-300' },
  { key: 'vaccinations',      label: 'Vaccinations',             box: 'bg-cyan-500/10 border-cyan-500/30',     title: 'text-cyan-300' },
  { key: 'needsVerification', label: 'Items requiring verification', box: 'bg-amber-500/10 border-amber-500/30', title: 'text-amber-300' },
];

function SummaryBody({ summary, records }: { summary: AiSummary; records: ClinicalRecord[] }) {
  const claims = summary.claims ?? {};
  const sources = claims.sources ?? [];
  const recById = new Map(records.map((r) => [r.id, r]));

  return (
    <>
      <div className="flex items-center gap-2 text-xs text-slate-300">
        <Clock className="w-3.5 h-3.5" />
        Generated {new Date(summary.generatedAt).toLocaleString('en-IN')} by {summary.generatedBy} · {summary.recordCount} records analysed
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS.map(({ key, label, box, title }) => {
          const items = (claims[key] as string[] | undefined) ?? [];
          if (items.length === 0) return null;
          return (
            <div key={key} className={`border rounded-xl p-4 ${key === 'alerts' ? 'md:col-span-2' : ''} ${box}`}>
              <p className={`font-semibold mb-2 text-xs uppercase tracking-wide ${title}`}>{label}</p>
              <ul className="space-y-2">
                {items.map((item, i) => {
                  const src = sources.find((s) => s.claim === item);
                  return (
                    <li key={i} className="text-sm text-slate-100">
                      • {item}
                      <span className={`block text-xs ml-3 mt-0.5 ${src ? 'text-slate-300' : 'text-amber-300'}`}>
                        {src ? `Source: ${src.recordTitle} · ${fmtDate(src.recordDate)} (record #${src.recordId})` : 'No source record cited — verify manually'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {(claims.timeline?.length ?? 0) > 0 && (
          <div className="md:col-span-2 bg-slate-900 border border-white/10 rounded-xl p-4">
            <p className="font-semibold mb-3 text-xs uppercase tracking-wide text-slate-200">Timeline</p>
            <div className="space-y-2">
              {claims.timeline!.map((t, i) => {
                const rec = t.recordId ? recById.get(t.recordId) : undefined;
                return (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="text-slate-300 font-mono w-24 shrink-0">{t.date}</span>
                    <span className="text-slate-100">
                      {t.event}
                      {rec && <span className="text-slate-400 text-xs"> — {rec.title}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {summary.disclaimer && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-100 text-xs leading-relaxed">
          ⚠ {summary.disclaimer}
        </div>
      )}
    </>
  );
}

function AiSummaryModal({
  patientId, doctorReg, records, onClose, onGenerated,
}: {
  patientId: string; doctorReg: string; records: ClinicalRecord[];
  onClose: () => void; onGenerated: () => void;
}) {
  const [summary, setSummary] = useState<AiSummary | null>(null);
  const [fetching, setFetching] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPatientSummary(patientId, doctorReg)
      .then(setSummary)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setFetching(false));
  }, [patientId, doctorReg]);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      setSummary(await generatePatientSummary(patientId, doctorReg));
      onGenerated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white font-semibold">AI Clinical Summary</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={generate}
              disabled={generating}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white text-sm font-semibold px-4 py-2 rounded-xl"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {generating ? 'Generating…' : summary ? 'Generate Fresh Summary' : 'Generate AI Summary'}
            </button>
            <button onClick={onClose} aria-label="Close" className="text-slate-300 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {(fetching || generating) && (
            <div className="flex items-center justify-center gap-3 py-10 text-slate-200">
              <Loader2 className="w-5 h-5 animate-spin" />
              {generating ? 'Reading the patient’s records and generating a summary — this can take up to a minute…' : 'Loading…'}
            </div>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-3 bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-4">
              <AlertTriangle className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-100 text-sm font-semibold">Could not generate the summary</p>
                <p className="text-red-200 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {!fetching && !generating && !summary && !error && (
            <div className="text-center py-10 text-slate-300">
              <Sparkles className="w-10 h-10 mx-auto mb-3 text-slate-500" />
              <p className="text-sm">No summary has been generated for this patient yet.</p>
            </div>
          )}

          {!generating && summary && <SummaryBody summary={summary} records={records} />}
        </div>
      </div>
    </div>
  );
}

// ─── Patient detail (assigned patient) ────────────────────────────────────────

function PatientDetail({ patientId, doctor, onBack }: { patientId: string; doctor: Doctor; onBack: () => void }) {
  const reg = doctor.registrationNumber;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showCreateRecord, setShowCreateRecord] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const flash = useCallback((n: Notice) => {
    setNotice(n);
    if (n?.kind === 'success') window.setTimeout(() => setNotice(null), 6000);
  }, []);

  const refreshAudit = useCallback(
    () => getAuditLogs(patientId, reg).then(setAuditLogs).catch(() => undefined),
    [patientId, reg],
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getPatient(patientId, reg), getPatientRecords(patientId, reg), getAuditLogs(patientId, reg)])
      .then(([p, r, a]) => { setPatient(p); setRecords(r); setAuditLogs(a); })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [patientId, reg]);

  async function handleAdd(data: RecordFormData) {
    const created = await addRecord(patientId, reg, data);
    setRecords((rs) => [created, ...rs].sort((a, b) => fmtDate(b.date).localeCompare(fmtDate(a.date))));
    setShowAdd(false);
    flash({ kind: 'success', text: `Record “${created.title}” added. An audit-log entry was recorded.` });
    void refreshAudit();
  }

  async function handleUpdate(record: ClinicalRecord, data: RecordFormData) {
    const updated = await updateRecord(record.id, patientId, reg, data);
    setRecords((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
    flash({ kind: 'success', text: `Record “${updated.title}” updated. An audit-log entry was recorded.` });
    void refreshAudit();
  }

  const timeline = useMemo(
    () => [...records].sort((a, b) => fmtDate(b.date).localeCompare(fmtDate(a.date))),
    [records],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-slate-200">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" /> Loading patient…
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className={`${CARD} p-10 text-center`}>
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-200 text-base mb-4">{error ?? 'Patient not found.'}</p>
        <button onClick={onBack} className="inline-flex items-center gap-2 text-slate-200 hover:text-white text-sm border border-slate-600 px-4 py-2 rounded-xl">
          <ArrowLeft className="w-4 h-4" /> Back to my patients
        </button>
      </div>
    );
  }

  const hasAllergies = patient.allergies.length > 0 && patient.allergies[0] !== 'None known';

  return (
    <div className="space-y-6">
      {showSummary && (
        <AiSummaryModal
          patientId={patientId} doctorReg={reg} records={records}
          onClose={() => setShowSummary(false)} onGenerated={() => void refreshAudit()}
        />
      )}

      {showCreateRecord && (
        <CreateHealthRecordModal onSave={handleAdd} onClose={() => setShowCreateRecord(false)} />
      )}

      <NoticeBanner notice={notice} onClose={() => setNotice(null)} />

      {/* Patient header — same structure as the patient dashboard */}
      <div className={`${CARD} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-2xl font-bold text-blue-200 shrink-0">
              {initials(patient.name)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{patient.name}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-200">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{patient.age} yrs · {patient.gender}</span>
                <span className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5 text-green-400" /><span className="font-mono text-xs text-blue-200">{patient.patientId}</span></span>
                <span className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5 text-blue-400" /><span className="font-mono text-xs text-blue-200">{patient.healthId}</span></span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{patient.facilityName ?? '—'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowAdd((v) => !v)} className="flex items-center gap-2 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-emerald-200 px-4 py-2 rounded-xl text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Record
            </button>
            <button onClick={() => setShowCreateRecord(true)} className="flex items-center gap-2 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-emerald-200 px-4 py-2 rounded-xl text-sm font-medium">
              <FilePlus2 className="w-4 h-4" /> Create Health Record
            </button>
            <button onClick={() => { setShowAudit((v) => !v); void refreshAudit(); }} className="flex items-center gap-2 border border-slate-500 hover:border-slate-300 text-slate-100 px-4 py-2 rounded-xl text-sm font-medium">
              <Clock className="w-4 h-4" /> Audit Log
            </button>
            <button onClick={() => setShowSummary(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold">
              <Sparkles className="w-4 h-4" /> Generate Fresh AI Summary
            </button>
          </div>
        </div>
      </div>

      {/* Critical info — identical cards to the patient dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-300" />
            <span className="text-rose-200 font-semibold text-sm uppercase tracking-wide">Critical Allergies</span>
          </div>
          {hasAllergies ? patient.allergies.map((a) => <p key={a} className="text-rose-100 text-sm">• {a}</p>) : <p className="text-slate-300 text-sm">None recorded</p>}
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Pill className="w-4 h-4 text-green-300" />
            <span className="text-green-200 font-semibold text-sm uppercase tracking-wide">Active Medicines</span>
          </div>
          {patient.currentMedicines.length > 0 ? patient.currentMedicines.map((m) => <p key={m} className="text-green-100 text-sm">• {m}</p>) : <p className="text-slate-300 text-sm">None recorded</p>}
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-blue-300" />
            <span className="text-blue-200 font-semibold text-sm uppercase tracking-wide">Chronic Conditions</span>
          </div>
          {patient.chronicConditions.length > 0 ? patient.chronicConditions.map((c) => <p key={c} className="text-blue-100 text-sm">• {c}</p>) : <p className="text-slate-300 text-sm">None recorded</p>}
        </div>
      </div>

      {showAdd && <RecordForm mode="add" onSave={handleAdd} onCancel={() => setShowAdd(false)} />}

      {showAudit && (
        <div className={`${CARD} p-5`}>
          <h3 className="text-white font-semibold text-base mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-300" /> Audit log</h3>
          {auditLogs.length === 0 ? (
            <p className="text-slate-300 text-sm">No audit events yet.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className={`rounded-xl border px-4 py-3 ${
                  log.tone === 'success' ? 'bg-green-500/10 border-green-500/30'
                    : log.tone === 'warning' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-900 border-white/10'
                }`}>
                  <p className="text-white text-sm font-semibold">{log.event.replace(/_/g, ' ')}</p>
                  <p className="text-slate-200 text-xs mt-0.5">{log.actor}{log.purpose ? ` · ${log.purpose}` : ''}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{new Date(log.timestamp).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Medical records */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-slate-300" />
          <h3 className="text-lg font-semibold text-white">Medical Records</h3>
          <span className="text-slate-300 text-sm">({records.length})</span>
        </div>
        {records.length === 0 ? (
          <div className={`${CARD} p-8 text-center text-slate-300`}>No medical records yet. Use “Add Record” to create the first one.</div>
        ) : (
          <div className="space-y-3">{records.map((r) => <RecordCard key={r.id} record={r} onSave={handleUpdate} />)}</div>
        )}
      </div>

      {/* Timeline — same as the patient dashboard */}
      {timeline.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-300" /> Medical Timeline
          </h3>
          <div className="relative pl-6 border-l-2 border-white/20 space-y-4">
            {timeline.map((r) => (
              <div key={r.id} className="relative">
                <span className="absolute -left-[1.85rem] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900" />
                <p className="text-slate-300 text-xs mb-0.5">{fmtDate(r.date)}</p>
                <p className="text-white text-sm font-medium">{r.title}</p>
                <p className="text-slate-300 text-xs">{recordTypeLabel(r.recordType)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Patient modal ─────────────────────────────────────────────────────────

const GENDER_OPTIONS: NewPatientData['gender'][] = ['Male', 'Female', 'Other'];

const EMPTY_NEW_PATIENT = {
  name: '', age: '', gender: 'Female' as NewPatientData['gender'],
  allergies: '', chronicConditions: '', currentMedicines: '', facilityId: '',
};

/** Comma-separated input → trimmed, non-empty string array. */
const splitList = (s: string): string[] => s.split(',').map((x) => x.trim()).filter(Boolean);

function AddPatientModal({
  doctorReg, onCreated, onClose,
}: {
  doctorReg: string;
  onCreated: (patient: Patient) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(EMPTY_NEW_PATIENT);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { listFacilities().then(setFacilities).catch(() => setFacilities([])); }, []);

  const set = <K extends keyof typeof EMPTY_NEW_PATIENT>(key: K, value: (typeof EMPTY_NEW_PATIENT)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErr(null);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return; // guards against double-submit creating two patients

    const name = form.name.trim();
    const age = Number(form.age);
    if (!name) { setErr('Patient name is required.'); return; }
    if (!Number.isInteger(age) || age < 0 || age > 130) { setErr('Enter a valid age between 0 and 130.'); return; }

    setSaving(true);
    try {
      const patient = await createPatient(doctorReg, {
        name,
        age,
        gender: form.gender,
        allergies: splitList(form.allergies),
        chronicConditions: splitList(form.chronicConditions),
        currentMedicines: splitList(form.currentMedicines),
        facilityId: form.facilityId ? Number(form.facilityId) : null,
      });
      onCreated(patient);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : String(e2));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white font-semibold">Add Patient</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="np-name">Full name *</label>
              <input id="np-name" className={INPUT} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Anita Sharma" />
            </div>
            <div>
              <label className={LABEL} htmlFor="np-age">Age *</label>
              <input id="np-age" type="number" min={0} max={130} className={INPUT} value={form.age} onChange={(e) => set('age', e.target.value)} placeholder="e.g. 42" />
            </div>
            <div>
              <label className={LABEL} htmlFor="np-gender">Gender *</label>
              <select id="np-gender" className={INPUT} value={form.gender} onChange={(e) => set('gender', e.target.value as NewPatientData['gender'])}>
                {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="np-facility">Facility</label>
              <select id="np-facility" className={INPUT} value={form.facilityId} onChange={(e) => set('facilityId', e.target.value)}>
                <option value="">— None —</option>
                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.city})</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="np-allergies">Allergies <span className="font-normal text-slate-400">(comma-separated)</span></label>
              <input id="np-allergies" className={INPUT} value={form.allergies} onChange={(e) => set('allergies', e.target.value)} placeholder="e.g. Penicillin, Peanuts" />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="np-conditions">Chronic conditions <span className="font-normal text-slate-400">(comma-separated)</span></label>
              <input id="np-conditions" className={INPUT} value={form.chronicConditions} onChange={(e) => set('chronicConditions', e.target.value)} placeholder="e.g. Type 2 Diabetes, Hypertension" />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="np-medicines">Current medicines <span className="font-normal text-slate-400">(comma-separated)</span></label>
              <input id="np-medicines" className={INPUT} value={form.currentMedicines} onChange={(e) => set('currentMedicines', e.target.value)} placeholder="e.g. Metformin 500 mg" />
            </div>
          </div>

          {err && (
            <div role="alert" className="flex items-start gap-2 bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3 text-red-200 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {err}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-200 border border-slate-600 hover:border-slate-400 text-sm">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white text-sm font-semibold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function DoctorDashboard({ doctor, onBack }: { doctor: Doctor; onBack: () => void }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [showAddPatient, setShowAddPatient] = useState(false);

  useEffect(() => {
    setLoading(true);
    setListError(null);
    getDoctorPatients(doctor.registrationNumber)
      .then(setPatients)
      .catch((e) => { setPatients([]); setListError(e instanceof Error ? e.message : String(e)); })
      .finally(() => setLoading(false));
  }, [doctor.registrationNumber]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return patients;
    return patients.filter((p) =>
      p.name.toLowerCase().includes(s) || p.patientId.toLowerCase().includes(s) ||
      p.healthId.toLowerCase().includes(s) || p.chronicConditions.some((c) => c.toLowerCase().includes(s)),
    );
  }, [patients, search]);

  function handlePatientCreated(patient: Patient) {
    setPatients((ps) => [...ps, patient].sort((a, b) => a.patientId.localeCompare(b.patientId)));
    setShowAddPatient(false);
    setSelected(patient.patientId); // open the new patient immediately
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {showAddPatient && (
        <AddPatientModal
          doctorReg={doctor.registrationNumber}
          onCreated={handlePatientCreated}
          onClose={() => setShowAddPatient(false)}
        />
      )}
      {/* Top bar — same as the patient dashboard */}
      <div className="bg-slate-800/80 border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-200 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Sign out
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-blue-200">MedVault AI</span>
          <span className="text-emerald-200 text-xs ml-2 border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 rounded-full">Doctor</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Doctor card */}
        <div className={`${CARD} p-6`}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Stethoscope className="w-8 h-8 text-emerald-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{doctor.name}</h1>
                {doctor.verified && (
                  <span className="text-xs text-green-200 bg-green-500/15 border border-green-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-200">
                <span className="font-mono text-xs text-blue-200">{doctor.registrationNumber}</span>
                <span>{doctor.specialization}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{doctor.facility ?? '—'}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{loading ? '…' : patients.length}</p>
              <p className="text-slate-300 text-xs">assigned patients</p>
            </div>
          </div>
        </div>

        {selected ? (
          <>
            <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-slate-200 hover:text-white text-sm">
              <ArrowLeft className="w-4 h-4" /> All my patients
            </button>
            <PatientDetail patientId={selected} doctor={doctor} onBack={() => setSelected(null)} />
          </>
        ) : (
          <>
            {/* Search + Add Patient */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search my patients by name, Patient ID (PAT-0001), Health ID or condition…"
                  aria-label="Search patients"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowAddPatient(true)}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-semibold shrink-0"
              >
                <UserPlus className="w-4 h-4" /> Add Patient
              </button>
            </div>

            {/* Patient list */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-slate-300" />
                <h3 className="text-lg font-semibold text-white">My Patients</h3>
                <span className="text-slate-300 text-sm">({filtered.length})</span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-3 py-16 text-slate-200">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400" /> Loading your patients…
                </div>
              ) : listError ? (
                <div role="alert" className={`${CARD} p-8 text-center text-red-200`}>{listError}</div>
              ) : filtered.length === 0 ? (
                <div className={`${CARD} p-8 text-center text-slate-300`}>
                  {patients.length === 0 ? 'No patients are assigned to you yet.' : 'No assigned patient matches your search.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((p) => (
                    <div key={p.patientId} className="bg-slate-800 border border-white/10 hover:border-emerald-500/40 rounded-xl p-4 flex flex-wrap items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center font-bold text-blue-200 shrink-0">
                        {initials(p.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-white font-semibold">{p.name}</span>
                          <span className="font-mono text-xs text-blue-200">{p.patientId}</span>
                        </div>
                        <p className="text-slate-300 text-sm mt-0.5">
                          {p.age} yrs · {p.gender} · {p.facilityName ?? '—'}
                        </p>
                        {p.chronicConditions.length > 0 && p.chronicConditions[0] !== 'None' && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {p.chronicConditions.slice(0, 3).map((c) => (
                              <span key={c} className="text-xs text-blue-100 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-full">{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSelected(p.patientId)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shrink-0"
                      >
                        View Patient
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}