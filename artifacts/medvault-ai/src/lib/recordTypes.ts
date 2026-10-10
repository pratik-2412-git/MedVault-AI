/**
 * artifacts/medvault-ai/src/lib/recordTypes.ts
 * One place for record-type labels / icons / colours (same palette as the patient dashboard).
 */
import {
  Activity, AlertTriangle, FileText, FlaskConical, Heart, Pill, Scissors, Syringe,
  type LucideIcon,
} from 'lucide-react';
import type { RecordType } from './api';

export const RECORD_TYPE_OPTIONS: { value: RecordType; label: string }[] = [
  { value: 'diagnosis',      label: 'Diagnosis' },
  { value: 'prescription',   label: 'Prescription' },
  { value: 'lab_report',     label: 'Lab Report' },
  { value: 'surgery',        label: 'Surgery' },
  { value: 'vaccination',    label: 'Vaccination' },
  { value: 'hospital_visit', label: 'Hospital Visit' },
  { value: 'allergy_note',   label: 'Allergy Note' },
];

const ICONS: Record<string, LucideIcon> = {
  surgery: Scissors, diagnosis: Activity, lab_report: FlaskConical, prescription: Pill,
  vaccination: Syringe, hospital_visit: Heart, allergy_note: AlertTriangle,
};

const COLORS: Record<string, string> = {
  surgery:        'text-red-300 bg-red-500/20 border-red-500/30',
  diagnosis:      'text-blue-300 bg-blue-500/20 border-blue-500/30',
  lab_report:     'text-purple-300 bg-purple-500/20 border-purple-500/30',
  prescription:   'text-green-300 bg-green-500/20 border-green-500/30',
  vaccination:    'text-cyan-300 bg-cyan-500/20 border-cyan-500/30',
  hospital_visit: 'text-indigo-300 bg-indigo-500/20 border-indigo-500/30',
  allergy_note:   'text-yellow-300 bg-yellow-500/20 border-yellow-500/30',
};

export const recordTypeLabel = (t: string) =>
  RECORD_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t;
export const recordTypeIcon = (t: string): LucideIcon => ICONS[t] ?? FileText;
export const recordTypeColor = (t: string) => COLORS[t] ?? 'text-slate-300 bg-slate-700 border-slate-600';