// medvault-ai/src/pages/Landing.tsx
// ✅ Fix tailwindcss(suggestCanonicalClasses): bg-gradient-to-br → bg-linear-to-br
import { ShieldCheck, Stethoscope } from 'lucide-react';

type Role = 'patient' | 'doctor';

interface LandingProps {
  onSelectRole: (role: Role) => void;
}

export default function Landing({ onSelectRole }: LandingProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-6">

      {/* ── Header ── */}
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            MedVault <span className="text-blue-400">AI</span>
          </h1>
        </div>
        <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
          Secure, AI-assisted health records management for patients and clinicians
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/40 border border-blue-700/40">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-blue-300 font-medium">SIH 2026 Demo</span>
        </div>
      </div>

      {/* ── Role cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-lg">

        {/* Patient */}
        <button
          onClick={() => onSelectRole('patient')}
          className="group bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/50 rounded-2xl p-7 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 group-hover:bg-blue-500/40 flex items-center justify-center mb-4 transition-colors">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">I'm a Patient</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            View your health records, medicines, and AI-generated summaries
          </p>
          <span className="mt-4 inline-block text-xs font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
            Continue →
          </span>
        </button>

        {/* Doctor */}
        <button
          onClick={() => onSelectRole('doctor')}
          className="group bg-white/5 hover:bg-emerald-600/20 border border-white/10 hover:border-emerald-500/50 rounded-2xl p-7 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500/40 flex items-center justify-center mb-4 transition-colors">
            <Stethoscope className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">I'm an Authorised Doctor</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Manage patient records, update diagnoses, and generate AI summaries
          </p>
          <span className="mt-4 inline-block text-xs font-medium text-emerald-400 group-hover:text-emerald-300 transition-colors">
            Continue →
          </span>
        </button>
      </div>

      {/* ── Footer ── */}
      <p className="mt-12 text-xs text-slate-600">
        MedVault AI · Smart India Hackathon 2026 · Fictional demo data only
      </p>
    </div>
  );
}