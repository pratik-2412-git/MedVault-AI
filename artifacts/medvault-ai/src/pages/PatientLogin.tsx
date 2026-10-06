// medvault-ai/src/pages/PatientLogin.tsx
// ✅ Fix: bg-gradient-to-br  → bg-linear-to-br  (Tailwind v4 canonical)
// ✅ Fix: bg-white/[0.02]    → bg-white/[2%]     (Tailwind v4 canonical)
//    (If still flagged, replace with bg-white/5 which is a named step)
import { useState } from 'react';
import { ArrowLeft, ShieldCheck, CreditCard, Loader2 } from 'lucide-react';

interface Props {
  onBack:  () => void;
  onLogin: (patientId: string) => void;
}

export default function PatientLogin({ onBack, onLogin }: Props) {
  const [patientId, setPatientId] = useState('');
  const [error,     setError]     = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async () => {
    const trimmed = patientId.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter your Patient ID');
      return;
    }
    // Basic format check: PAT-XXXX
    if (!/^PAT-\d{4}$/.test(trimmed)) {
      setError('Invalid format. Use PAT-0001 through PAT-0025');
      return;
    }
    setError(null);
    setLoading(true);
    // Small delay for UX
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    onLogin(trimmed);
  };

  return (
    <div
      // ✅ Tailwind v4: bg-linear-to-br replaces bg-gradient-to-br
      className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-6"
    >
      <div className="w-full max-w-md">

        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Card */}
        <div
          // ✅ bg-white/5 (named step) instead of bg-white/[0.02]
          className="bg-white/5 border border-white/10 rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Patient Access</h1>
              <p className="text-xs text-slate-400">Enter your Patient ID to continue</p>
            </div>
          </div>

          {/* Patient ID input */}
          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-1.5">Patient ID</label>
            <input
              type="text"
              placeholder="e.g. PAT-0001"
              value={patientId}
              onChange={(e) => { setPatientId(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none transition-colors"
            />
            {error && (
              <p className="text-xs text-red-400 mt-1.5">{error}</p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
              : 'View My Records'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Scan — disabled / coming soon */}
          <div className="relative">
            <button
              disabled
              className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-500 cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Scan Health Card
            </button>
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-900/60">
              <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-white/10">
                Coming soon — scanning will be enabled in the next version
              </span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Demo Patient IDs: PAT-0001 through PAT-0025
        </p>
      </div>
    </div>
  );
}