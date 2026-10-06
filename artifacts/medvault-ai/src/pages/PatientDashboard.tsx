/**
 * artifacts/medvault-ai/src/pages/PatientDashboard.tsx
 *
 * FIXED field names to match actual API response:
 *   allergies[]         (was: allergy string)
 *   chronicConditions[] (was: conditions[])
 *   currentMedicines[]  (was: medicines[])
 *   recordType          (was: category)
 *   description         (was: detail)
 *   date                (was: recordDate) — correct in current version
 *
 * AI Summary: handles null response (no 404 thrown — API returns null).
 */

import { useEffect, useState } from 'react';
import {
  ArrowLeft, Shield, Pill, AlertTriangle, Activity,
  FileText, Loader2, Sparkles, ChevronDown, ChevronUp,
  Calendar, BadgeCheck, MapPin, User, Clock, X,
  Scissors, FlaskConical, Syringe, Heart,
} from 'lucide-react';

// ─── Types exactly matching API response ──────────────────────────────────────

interface Patient {
  id: number;
  patientId: string;
  name: string;
  age: number;
  gender: string;
  healthId: string;
  allergies: string[];           // API returns allergies[]
  chronicConditions: string[];   // API returns chronicConditions[]
  currentMedicines: string[];    // API returns currentMedicines[]
  facilityId: number | null;
}

interface ClinicalRecord {
  id: number;
  recordType: string;   // "diagnosis" | "surgery" | "lab_report" etc.
  title: string;
  description: string;
  date: string;
  verified: boolean;
  createdBy: number | null;
  updatedBy: number | null;
}

interface AiSummary {
  id: number;
  generatedAt: string;
  generatedBy: string;
  claims: {
    allergies?: string[];
    medicines?: string[];
    conditions?: string[];
    surgeries?: string[];
    labFindings?: string[];
    vaccinations?: string[];
    timeline?: { date: string; event: string }[];
    alerts?: string[];
    needsVerification?: string[];
  } | null;
  disclaimer: string | null;
  recordCount: number;
}

interface Props {
  patientId: string;
  onBack: () => void;
}

// ─── Category display helpers ─────────────────────────────────────────────────

const RECORD_TYPE_LABEL: Record<string, string> = {
  diagnosis:      'Diagnosis',
  surgery:        'Surgery',
  lab_report:     'Lab Report',
  prescription:   'Prescription',
  vaccination:    'Vaccination',
  hospital_visit: 'Hospital Visit',
  allergy_note:   'Allergy Note',
};

const RECORD_TYPE_ICON: Record<string, React.ElementType> = {
  surgery:        Scissors,
  diagnosis:      Activity,
  lab_report:     FlaskConical,
  prescription:   Pill,
  vaccination:    Syringe,
  hospital_visit: Heart,
  allergy_note:   AlertTriangle,
};

const RECORD_TYPE_COLOR: Record<string, string> = {
  surgery:        'text-red-300 bg-red-500/20 border-red-500/30',
  diagnosis:      'text-blue-300 bg-blue-500/20 border-blue-500/30',
  lab_report:     'text-purple-300 bg-purple-500/20 border-purple-500/30',
  prescription:   'text-green-300 bg-green-500/20 border-green-500/30',
  vaccination:    'text-cyan-300 bg-cyan-500/20 border-cyan-500/30',
  hospital_visit: 'text-indigo-300 bg-indigo-500/20 border-indigo-500/30',
  allergy_note:   'text-yellow-300 bg-yellow-500/20 border-yellow-500/30',
};

// ─── Record card ──────────────────────────────────────────────────────────────

function RecordCard({ record }: { record: ClinicalRecord }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = RECORD_TYPE_ICON[record.recordType] ?? FileText;
  const color = RECORD_TYPE_COLOR[record.recordType] ?? 'text-slate-300 bg-slate-700 border-slate-600';
  const label = RECORD_TYPE_LABEL[record.recordType] ?? record.recordType;

  return (
    <div className="bg-slate-800 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 ${color}`}>
            <Icon className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">{record.title}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label} · {record.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
            record.verified
              ? 'text-green-300 bg-green-500/20 border-green-500/30'
              : 'text-amber-300 bg-amber-500/20 border-amber-500/30'
          }`}>
            {record.verified ? 'Verified' : 'Pending'}
          </span>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-2">
          <p className="text-slate-300 text-sm leading-relaxed">{record.description}</p>
          <p className="text-slate-500 text-xs">Date: {record.date}</p>
        </div>
      )}
    </div>
  );
}

// ─── AI Summary modal ─────────────────────────────────────────────────────────

function SummaryModal({ patientId, onClose }: { patientId: string; onClose: () => void }) {
  const [summary, setSummary] = useState<AiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/patients/${encodeURIComponent(patientId)}/summary`)
      .then(async res => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data = await res.json();
        setSummary(data);   // null = no summary yet; AiSummary = has one
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Failed to load summary.')
      )
      .finally(() => setLoading(false));
  }, [patientId]);

  const claims = summary?.claims;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-blue-500/30 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">AI Clinical Summary</h3>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Read-only</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center gap-3 py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading summary…
            </div>
          )}

          {!loading && error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-4">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && !summary && (
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-4">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-200 text-sm">
                No AI summary has been generated yet. Ask your doctor to generate one.
              </p>
            </div>
          )}

          {!loading && summary && claims && (
            <>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                Generated {new Date(summary.generatedAt).toLocaleString('en-IN')} by {summary.generatedBy} · {summary.recordCount} records
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {claims.alerts && claims.alerts.length > 0 && (
                  <div className="md:col-span-2 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-300 font-semibold mb-2 text-xs uppercase tracking-wide">⚠ Alerts</p>
                    {claims.alerts.map((a, i) => <p key={i} className="text-red-200 text-xs">• {a}</p>)}
                  </div>
                )}
                {claims.conditions && claims.conditions.length > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-blue-300 font-semibold mb-2 text-xs uppercase tracking-wide">Conditions</p>
                    {claims.conditions.map((c, i) => <p key={i} className="text-slate-300 text-xs">• {c}</p>)}
                  </div>
                )}
                {claims.medicines && claims.medicines.length > 0 && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <p className="text-green-300 font-semibold mb-2 text-xs uppercase tracking-wide">Medicines</p>
                    {claims.medicines.map((m, i) => <p key={i} className="text-slate-300 text-xs">• {m}</p>)}
                  </div>
                )}
                {claims.allergies && claims.allergies.length > 0 && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                    <p className="text-rose-300 font-semibold mb-2 text-xs uppercase tracking-wide">Allergies</p>
                    {claims.allergies.map((a, i) => <p key={i} className="text-slate-300 text-xs">• {a}</p>)}
                  </div>
                )}
                {claims.surgeries && claims.surgeries.length > 0 && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                    <p className="text-orange-300 font-semibold mb-2 text-xs uppercase tracking-wide">Surgeries</p>
                    {claims.surgeries.map((s, i) => <p key={i} className="text-slate-300 text-xs">• {s}</p>)}
                  </div>
                )}
                {claims.labFindings && claims.labFindings.length > 0 && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                    <p className="text-purple-300 font-semibold mb-2 text-xs uppercase tracking-wide">Lab Findings</p>
                    {claims.labFindings.map((l, i) => <p key={i} className="text-slate-300 text-xs">• {l}</p>)}
                  </div>
                )}
                {claims.vaccinations && claims.vaccinations.length > 0 && (
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                    <p className="text-cyan-300 font-semibold mb-2 text-xs uppercase tracking-wide">Vaccinations</p>
                    {claims.vaccinations.map((v, i) => <p key={i} className="text-slate-300 text-xs">• {v}</p>)}
                  </div>
                )}
                {claims.timeline && claims.timeline.length > 0 && (
                  <div className="md:col-span-2 bg-slate-800/50 border border-white/10 rounded-xl p-4">
                    <p className="text-slate-300 font-semibold mb-3 text-xs uppercase tracking-wide">Timeline</p>
                    <div className="space-y-2">
                      {claims.timeline.map((t, i) => (
                        <div key={i} className="flex gap-3 text-xs">
                          <span className="text-slate-500 font-mono w-24 shrink-0">{t.date}</span>
                          <span className="text-slate-300">{t.event}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {summary.disclaimer && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-200/70 text-xs leading-relaxed">
                  ⚠ {summary.disclaimer}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function PatientDashboard({ patientId, onBack }: Props) {
  const [patient, setPatient]   = useState<Patient | null>(null);
  const [records, setRecords]   = useState<ClinicalRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/patients/${encodeURIComponent(patientId)}`),
      fetch(`/api/patients/${encodeURIComponent(patientId)}/records`),
    ])
      .then(async ([pRes, rRes]) => {
        if (!pRes.ok) {
          const body = await pRes.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `Patient "${patientId}" not found.`);
        }
        const [p, r] = await Promise.all([pRes.json(), rRes.json()]);
        setPatient(p as Patient);
        setRecords(Array.isArray(r) ? (r as ClinicalRecord[]) : []);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load patient.'))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-sm">Loading patient records…</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 px-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-red-400 text-lg text-center">{error ?? `Patient "${patientId}" not found.`}</p>
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {showSummary && <SummaryModal patientId={patientId} onClose={() => setShowSummary(false)} />}

      {/* Top bar */}
      <div className="bg-slate-800/80 border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-blue-300">MedVault AI</span>
          <span className="text-slate-500 text-xs ml-2 border border-slate-600 px-2 py-0.5 rounded-full">Read Only</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Patient header */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-white/10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-2xl font-bold text-blue-300 shrink-0">
                {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{patient.name}</h1>
                <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{patient.age} yrs · {patient.gender}</span>
                  <span className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5 text-green-400" /><span className="font-mono text-xs text-blue-300">{patient.patientId}</span></span>
                  <span className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5 text-blue-400" /><span className="font-mono text-xs text-blue-300">{patient.healthId}</span></span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />Facility ID: {patient.facilityId ?? 'N/A'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSummary(true)}
              className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 px-4 py-2 rounded-xl transition-colors text-sm font-medium"
            >
              <Sparkles className="w-4 h-4" /> View AI Summary
            </button>
          </div>
        </div>

        {/* Critical info — use actual API field names */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span className="text-rose-300 font-semibold text-sm uppercase tracking-wide">Critical Allergies</span>
            </div>
            {patient.allergies.length > 0 && patient.allergies[0] !== 'None known'
              ? patient.allergies.map(a => <p key={a} className="text-rose-200 text-sm">• {a}</p>)
              : <p className="text-slate-500 text-sm">None recorded</p>}
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4 text-green-400" />
              <span className="text-green-300 font-semibold text-sm uppercase tracking-wide">Active Medicines</span>
            </div>
            {patient.currentMedicines.length > 0
              ? patient.currentMedicines.map(m => <p key={m} className="text-green-200 text-sm">• {m}</p>)
              : <p className="text-slate-500 text-sm">None recorded</p>}
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 font-semibold text-sm uppercase tracking-wide">Chronic Conditions</span>
            </div>
            {patient.chronicConditions.length > 0
              ? patient.chronicConditions.map(c => <p key={c} className="text-blue-200 text-sm">• {c}</p>)
              : <p className="text-slate-500 text-sm">None recorded</p>}
          </div>
        </div>

        {/* Medical Records */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-semibold">Medical Records</h3>
            <span className="text-slate-500 text-sm">({records.length})</span>
          </div>
          {records.length === 0
            ? <div className="bg-slate-800 rounded-xl p-8 text-center text-slate-500">No medical records found.</div>
            : <div className="space-y-3">{records.map(r => <RecordCard key={r.id} record={r} />)}</div>}
        </div>

        {/* Timeline */}
        {records.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-400" /> Medical Timeline
            </h3>
            <div className="relative pl-6 border-l-2 border-white/10 space-y-4">
              {[...records].sort((a, b) => b.date.localeCompare(a.date)).map(r => (
                <div key={r.id} className="relative">
                  <span className="absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900" />
                  <p className="text-slate-400 text-xs mb-0.5">{r.date}</p>
                  <p className="text-white text-sm font-medium">{r.title}</p>
                  <p className="text-slate-400 text-xs">{RECORD_TYPE_LABEL[r.recordType] ?? r.recordType}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}