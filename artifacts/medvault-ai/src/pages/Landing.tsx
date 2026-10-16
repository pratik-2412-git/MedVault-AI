/**
 * artifacts/medvault-ai/src/pages/Landing.tsx
 *
 * Redesigned to match the "Clinical Telemetry Glass" reference
 * (stitch_medical_lab_ui_redesign). Same component contract as before —
 * onSelectRole('patient' | 'doctor') — so App.tsx needs no changes.
 *
 * Notes on adaptation from the reference HTML:
 *  - The reference uses Google "Material Symbols Outlined" + a Tailwind CDN
 *    config. This project already standardises on lucide-react everywhere
 *    else (DoctorDashboard, PatientDashboard, …), so every icon below is
 *    mapped to its closest lucide-react equivalent instead of pulling in a
 *    second icon system.
 *  - Space Grotesk / Plus Jakarta Sans / JetBrains Mono are loaded and scoped
 *    to THIS component only (via the <style> block below, using mv-font-*
 *    class names) so nothing here can collide with the app's existing
 *    `font-mono` usage elsewhere (e.g. Patient ID / audit-log timestamps).
 *  - All copy, layout, colours, chips and structure are reproduced from the
 *    supplied screen.png / code.html as closely as plain Tailwind allows.
 */

import {
  ArrowRight, Activity, BadgeCheck, CheckCircle2, Clock, CreditCard, Cross,
  FileLock2, FlaskConical, Headphones, Lock, PenLine, Pill, RefreshCw,
  ShieldCheck, ShieldPlus, Siren, Stethoscope, Syringe, TestTube2,
  TrendingUp,
} from 'lucide-react';

interface LandingProps {
  onSelectRole: (role: 'patient' | 'doctor') => void;
}

// ─── Clinical quick cards (telemetry strip) ───────────────────────────────────

const QUICK_CARDS = [
  {
    icon: Stethoscope,
    accent: 'emerald',
    tag: 'S1 / S2 Audio',
    title: 'Binaural Auscultation',
    desc: 'Acoustic pulse telemetry, phonocardiogram heart sounds, murmur analysis.',
    statIcon: Activity,
    statLabel: 'Rhythm Normal',
    statValue: '72 BPM',
    statValueClass: 'text-emerald-400',
  },
  {
    icon: FlaskConical,
    accent: 'sky',
    tag: 'Reagent Test',
    title: 'Rapid Lab Diagnostics',
    desc: 'Chemiluminescence panels, CRP/ESR acute indicators, automated CBC scan.',
    statIcon: TestTube2,
    statLabel: 'Blood Panel Ready',
    statValue: 'NABL Verified',
    statValueClass: 'text-sky-400',
  },
  {
    icon: Pill,
    accent: 'indigo',
    tag: 'ICD-11 Triage',
    title: 'AI Differential Copilot',
    desc: 'Instant drug-drug cross checks, contraindicated allergy warnings & triage score.',
    statIcon: Syringe,
    statLabel: 'Cross-Reaction Check',
    statValue: '0 Conflicts',
    statValueClass: 'text-emerald-400',
  },
  {
    icon: Siren,
    accent: 'rose',
    tag: 'Code Blue Path',
    title: 'Crash-Cart Sync',
    desc: 'Critical care telemetry broadcast, automated ER bed vitals relay & defibrillator link.',
    statIcon: Activity,
    statLabel: 'Waveform Latency',
    statValue: '< 12ms',
    statValueClass: 'text-rose-400',
  },
] as const;

const ACCENT = {
  emerald: { icon: 'text-emerald-400', iconBg: 'bg-emerald-950/60 border-emerald-500/30', tagText: 'text-emerald-300', tagBg: 'bg-emerald-900/40 border-emerald-700/40', hoverBorder: 'hover:border-emerald-400/60', hoverShadow: 'hover:shadow-emerald-950/40', hoverTitle: 'group-hover:text-emerald-300', corner: 'bg-emerald-500/5' },
  sky: { icon: 'text-sky-400', iconBg: 'bg-sky-950/60 border-sky-500/30', tagText: 'text-sky-300', tagBg: 'bg-sky-900/40 border-sky-700/40', hoverBorder: 'hover:border-sky-400/60', hoverShadow: 'hover:shadow-sky-950/40', hoverTitle: 'group-hover:text-sky-300', corner: 'bg-sky-500/5' },
  indigo: { icon: 'text-indigo-400', iconBg: 'bg-indigo-950/60 border-indigo-500/30', tagText: 'text-indigo-300', tagBg: 'bg-indigo-900/40 border-indigo-700/40', hoverBorder: 'hover:border-indigo-400/60', hoverShadow: 'hover:shadow-indigo-950/40', hoverTitle: 'group-hover:text-indigo-300', corner: 'bg-indigo-500/5' },
  rose: { icon: 'text-rose-400', iconBg: 'bg-rose-950/60 border-rose-500/30', tagText: 'text-rose-300', tagBg: 'bg-rose-900/40 border-rose-700/40', hoverBorder: 'hover:border-rose-400/60', hoverShadow: 'hover:shadow-rose-950/40', hoverTitle: 'group-hover:text-rose-300', corner: 'bg-rose-500/5' },
} as const;

// clamp to 2 lines without depending on the Tailwind line-clamp plugin/version
const clamp2: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

export default function Landing({ onSelectRole }: LandingProps) {
  return (
    <div className="mv-font-body min-h-screen bg-[#090e1a] text-slate-200 antialiased relative selection:bg-emerald-500 selection:text-white">
      {/* Scoped fonts + background grid pattern — isolated to this component */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');
        .mv-font-headline { font-family: 'Space Grotesk', sans-serif; }
        .mv-font-body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .mv-font-mono { font-family: 'JetBrains Mono', monospace; }
        .mv-grid-bg {
          background-image: radial-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 1px),
                            radial-gradient(rgba(16, 185, 129, 0.06) 1px, transparent 1px);
          background-size: 28px 28px, 56px 56px;
          background-position: 0 0, 14px 14px;
        }
      `}</style>

      {/* Ambient clinical dark telemetry backdrop */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 mv-grid-bg">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[460px] bg-gradient-to-b from-teal-500/15 via-cyan-500/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-1/3 -left-40 w-[520px] h-[520px] bg-emerald-500/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-12 -right-36 w-[560px] h-[480px] bg-sky-500/10 blur-[130px] rounded-full" />
      </div>

      <main className="relative z-10 w-full min-h-screen flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        {/* ── Header & branding ── */}
        <header className="flex flex-col items-center text-center space-y-5 pt-3 pb-6">
          {/* Regulatory badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#131b2e]/90 border border-slate-700/60 shadow-lg backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span className="mv-font-mono text-xs font-semibold text-slate-300 tracking-wider uppercase">
              SIH 2026 Enterprise Protocol &bull; ISO 27799 Medical Vault &bull; ABDM Certified
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] mv-font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-tight">
              Active
            </span>
          </div>

          {/* Insignia & title */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative group mt-1">
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl opacity-40 blur-lg group-hover:opacity-60 transition duration-300" />
              <div className="relative w-[4.5rem] h-[4.5rem] p-3 rounded-2xl bg-[#131b2e] border border-emerald-500/30 shadow-xl shadow-emerald-950/50 flex items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white shadow-md relative">
                  <Cross className="w-7 h-7" strokeWidth={2.5} />
                  <span className="absolute -bottom-1 -right-1 bg-[#131b2e] rounded-full p-0.5 border border-slate-700 shadow">
                    <ShieldPlus className="w-3.5 h-3.5 text-emerald-400 block" />
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <h1 className="mv-font-headline text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-white">
                MedVault <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">AI</span>
              </h1>
              <span className="inline-block text-[11px] mv-font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold self-start mt-1">
                v3.2 Dark Telemetry
              </span>
            </div>
            <p className="mv-font-body text-slate-400 text-base sm:text-lg max-w-2xl px-2 leading-relaxed">
              Clean, hospital-grade AI health record gateway &amp; longitudinal bio-telemetry infrastructure for authenticated patients and clinical teams.
            </p>
          </div>

          {/* Compliance pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-slate-300 mv-font-mono text-xs pt-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#131b2e] border border-slate-700/60 shadow-sm text-slate-300 hover:border-emerald-400/50 transition-colors">
              <ShieldCheck className="w-[18px] h-[18px] text-emerald-400" />
              <span className="font-medium">ABDM Compliant (M1-M3)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#131b2e] border border-slate-700/60 shadow-sm text-slate-300 hover:border-sky-400/50 transition-colors">
              <RefreshCw className="w-[18px] h-[18px] text-sky-400" />
              <span className="font-medium">HL7 FHIR v4.0.1 Data Pipe</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#131b2e] border border-slate-700/60 shadow-sm text-slate-300 hover:border-teal-400/50 transition-colors">
              <Lock className="w-[18px] h-[18px] text-teal-400" />
              <span className="font-medium">Zero-Knowledge AES-256 Vault</span>
            </div>
          </div>
        </header>

        {/* ── Clinical quick cards strip ── */}
        <section aria-label="Clinical Diagnostics Telemetry Flashcards" className="w-full max-w-6xl mx-auto my-3">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="mv-font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
                Clinical Quick Cards &bull; Real-time Diagnostic Telemetry
              </h3>
            </div>
            <span className="mv-font-mono text-[11px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-medium">
              Continuous Mesh Stream: Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {QUICK_CARDS.map((card) => {
              const a = ACCENT[card.accent];
              const Icon = card.icon;
              const StatIcon = card.statIcon;
              return (
                <div
                  key={card.title}
                  className={`group bg-[#131b2e] rounded-xl border border-slate-800/90 ${a.hoverBorder} p-4 shadow-sm hover:shadow-lg ${a.hoverShadow} transition-all duration-200 flex flex-col justify-between relative overflow-hidden backdrop-blur-sm`}
                >
                  <div className={`absolute top-0 right-0 w-16 h-16 ${a.corner} rounded-bl-full pointer-events-none`} />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`w-9 h-9 rounded-lg ${a.iconBg} ${a.icon} border flex items-center justify-center`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className={`mv-font-mono text-[10px] ${a.tagText} ${a.tagBg} border font-semibold px-2 py-0.5 rounded-full`}>
                        {card.tag}
                      </span>
                    </div>
                    <h4 className={`mv-font-headline text-sm font-bold text-white ${a.hoverTitle} transition-colors`}>
                      {card.title}
                    </h4>
                    <p className="mv-font-body text-xs text-slate-400 mt-1" style={clamp2}>
                      {card.desc}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between mv-font-mono text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <StatIcon className={`w-3.5 h-3.5 ${a.icon}`} />
                      {card.statLabel}
                    </span>
                    <span className={`font-semibold ${card.statValueClass}`}>{card.statValue}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Dual portal selection cards ── */}
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 my-5">
          {/* Patient portal */}
          <div className="group relative rounded-2xl bg-[#131b2e]/90 border border-slate-800 hover:border-teal-400/60 p-7 sm:p-8 flex flex-col justify-between shadow-2xl shadow-black/40 hover:shadow-teal-950/30 transition-all duration-300 hover:-translate-y-1 backdrop-blur-md">
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-teal-500/10 via-teal-500/5 to-transparent rounded-tr-2xl rounded-bl-[80px] pointer-events-none" />
            <div>
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-teal-950/60 border border-teal-500/30 text-teal-300 flex items-center justify-center shadow-inner group-hover:scale-105 group-hover:border-teal-400/50 transition-all duration-300">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <span className="mv-font-mono text-xs px-3 py-1 rounded-full bg-teal-950/60 text-teal-300 border border-teal-500/30 font-semibold tracking-wide">
                  Patient Gateway
                </span>
              </div>
              <h2 className="mv-font-headline text-2xl font-bold text-white mb-2">I&apos;m a Patient</h2>
              <p className="mv-font-body text-sm text-slate-400 leading-relaxed mb-6">
                Access encrypted medical records, longitudinal lab telemetry, medication schedule alerts, and verified Ayushman Bharat (ABDM) dossiers.
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="inline-flex items-center gap-1 mv-font-body text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#18233a] text-slate-300 border border-slate-700/60">
                  <Lock className="w-3.5 h-3.5 text-teal-400" /> Digital Health Locker
                </span>
                <span className="inline-flex items-center gap-1 mv-font-body text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#18233a] text-slate-300 border border-slate-700/60">
                  <CreditCard className="w-3.5 h-3.5 text-sky-400" /> ABHA Card Link
                </span>
                <span className="inline-flex items-center gap-1 mv-font-body text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#18233a] text-slate-300 border border-slate-700/60">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Lab Trend Charts
                </span>
                <span className="inline-flex items-center gap-1 mv-font-body text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#18233a] text-slate-300 border border-slate-700/60">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" /> Rx Reminders
                </span>
              </div>
            </div>
            <div>
              <button
                onClick={() => onSelectRole('patient')}
                className="w-full inline-flex items-center justify-between px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white mv-font-headline text-base font-semibold shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/50 transition-all duration-200 group/btn"
              >
                <span>Login as Patient</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover/btn:translate-x-1.5" />
              </button>
              <div className="flex items-center justify-between pt-3 px-1 mv-font-mono text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ABHA ID / OTP Enabled
                </span>
                <span className="font-medium text-slate-400">Zero-Trust Instant Decrypt</span>
              </div>
            </div>
          </div>

          {/* Doctor portal */}
          <div className="group relative rounded-2xl bg-[#131b2e]/90 border border-slate-800 hover:border-emerald-400/60 p-7 sm:p-8 flex flex-col justify-between shadow-2xl shadow-black/40 hover:shadow-emerald-950/30 transition-all duration-300 hover:-translate-y-1 backdrop-blur-md">
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-emerald-500/10 via-emerald-500/5 to-transparent rounded-tr-2xl rounded-bl-[80px] pointer-events-none" />
            <div>
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 flex items-center justify-center shadow-inner group-hover:scale-105 group-hover:border-emerald-400/50 transition-all duration-300">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="mv-font-mono text-xs px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-semibold tracking-wide">
                    Doctor Console
                  </span>
                  <span className="mv-font-mono text-[10px] px-2 py-1 rounded-md bg-[#18233a] text-slate-400 border border-slate-700 font-medium">
                    BioAuth Key
                  </span>
                </div>
              </div>
              <h2 className="mv-font-headline text-2xl font-bold text-white mb-2">I&apos;m a Doctor</h2>
              <p className="mv-font-body text-sm text-slate-400 leading-relaxed mb-5">
                Manage active hospital cohorts, review real-time pathology results, sign digital e-prescriptions, and run automated AI differential diagnostics.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center gap-1 mv-font-body text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#18233a] text-slate-300 border border-slate-700/60">
                  <ShieldPlus className="w-3.5 h-3.5 text-emerald-400" /> Cohort Triage
                </span>
                <span className="inline-flex items-center gap-1 mv-font-body text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#18233a] text-slate-300 border border-slate-700/60">
                  <PenLine className="w-3.5 h-3.5 text-sky-400" /> Digital E-Prescription (Rx)
                </span>
                <span className="inline-flex items-center gap-1 mv-font-body text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#18233a] text-slate-300 border border-slate-700/60">
                  <TestTube2 className="w-3.5 h-3.5 text-teal-400" /> NABL Direct Sync
                </span>
                <span className="inline-flex items-center gap-1 mv-font-body text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#18233a] text-slate-300 border border-slate-700/60">
                  <Headphones className="w-3.5 h-3.5 text-indigo-400" /> Auscultation Audio
                </span>
              </div>
            </div>
            <div>
              <button
                onClick={() => onSelectRole('doctor')}
                className="w-full inline-flex items-center justify-between px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white mv-font-headline text-base font-semibold shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/50 transition-all duration-200 group/btn"
              >
                <span>Login as Doctor</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover/btn:translate-x-1.5" />
              </button>
              <div className="flex items-center justify-between pt-3 px-1 mv-font-mono text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-slate-400">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" /> Requires Medical License Credential
                </span>
                <span className="font-medium text-emerald-300">SmartCard / Token Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer trust strip ── */}
        <footer className="w-full max-w-5xl mx-auto pt-6 pb-2 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-slate-400 mv-font-mono text-xs">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> NABL Lab Nodes Active (99.98% Uptime)
            </span>
            <span className="hidden md:inline text-slate-700">&bull;</span>
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <FileLock2 className="w-4 h-4 text-sky-400" /> Encrypted HL7 FHIR Pipe
            </span>
            <span className="hidden md:inline text-slate-700">&bull;</span>
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-teal-400" /> HIPAA &amp; Ayushman Bharat (ABDM) Compliant
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="mv-font-body font-medium">MedVault AI &bull; SIH 2026 Production Tier</span>
          </div>
        </footer>
      </main>
    </div>
  );
}