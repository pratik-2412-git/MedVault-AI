/**
 * artifacts/medvault-ai/src/pages/DoctorLogin.tsx
 *
 * FIX: onLogin now passes the full Doctor object fetched from the API,
 * so App.tsx can forward it to DoctorDashboard without a second fetch.
 */

import { useState } from 'react';
import { ArrowLeft, CreditCard, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import type { Doctor } from '@/lib/api';

interface DoctorLoginProps {
  onLogin: (doctor: Doctor) => void;   // ← full Doctor, not string
  onBack: () => void;
}

const REG_REGEX = /^DOC-REG-\d{4}$/i;

export default function DoctorLogin({ onLogin, onBack }: DoctorLoginProps) {
  const [regNumber, setRegNumber] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = regNumber.trim().toUpperCase();

    if (!REG_REGEX.test(trimmed)) {
      setError('Registration number must be in the format DOC-REG-0001.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/doctors/${encodeURIComponent(trimmed)}`);

      if (res.status === 404) {
        setError(`No doctor found with registration number "${trimmed}".`);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? `Server error ${res.status}`);
        return;
      }

      const doctor = await res.json() as Doctor;

      if (!doctor.verified) {
        setError('This doctor account is pending verification. Contact admin.');
        return;
      }

      onLogin(doctor);   // ← pass full object up to App
    } catch {
      setError('Unable to reach the server. Make sure the API is running on port 3000.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center gap-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-slate-600">|</span>
        <span className="text-white font-medium">Doctor Access</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Doctor login</h1>
            <p className="text-slate-400 text-sm">
              Enter your Medical Council registration number.
            </p>
          </div>

          {/* Registration number form */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Enter Registration Number</p>
                <p className="text-slate-500 text-xs">Format: DOC-REG-0001</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={regNumber}
                onChange={(e) => { setRegNumber(e.target.value); setError(null); }}
                placeholder="DOC-REG-0001"
                maxLength={12}
                autoFocus
                disabled={loading}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3
                           text-white placeholder-slate-500 font-mono text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                           transition-colors"
              />

              {error && (
                <div className="flex items-start gap-2 text-red-400 text-xs bg-red-500/10
                                border border-red-500/20 rounded-lg px-3 py-2.5">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !regNumber.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700
                           disabled:text-slate-500 text-white rounded-lg py-3 text-sm font-medium
                           transition-colors flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                  : 'Access doctor portal'}
              </button>
            </form>
          </div>

          {/* Scan card — disabled MVP placeholder */}
          <div className="relative bg-slate-900/50 border border-slate-800 rounded-2xl p-6 opacity-60">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-slate-400 font-medium text-sm">Scan Doctor Card</p>
                <p className="text-slate-600 text-xs">NFC / QR</p>
              </div>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Coming soon — scanning will be enabled in the next version.
            </p>
            <div className="absolute inset-0 rounded-2xl cursor-not-allowed" />
          </div>

          <p className="mt-6 text-center text-slate-600 text-xs">
            Demo numbers: DOC-REG-0001 through DOC-REG-0012
          </p>
        </div>
      </main>
    </div>
  );
}