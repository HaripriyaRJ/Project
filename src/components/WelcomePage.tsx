import { useState } from 'react';
import { Link2, QrCode, Sparkles, Users, Zap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WelcomePage() {
  // Welcome page no longer handles auth directly; use header links to /signin and /signup
  const [pulse, setPulse] = useState<string | null>(null);
  const handleFeatureClick = (id: string) => {
    setPulse(id);
    window.setTimeout(() => setPulse((p) => (p === id ? null : p)), 220);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 via-emerald-950 to-amber-950 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-500/25 via-emerald-500/15 to-transparent" />

      {/* Top-right Auth buttons */}
      <header className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-500 rounded-lg text-white"><Sparkles className="w-5 h-5" /></div>
          <span className="text-white font-semibold">LinkSpark</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/signin" className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition">Sign in</Link>
          <Link to="/signup" className="px-4 py-2 text-sm font-semibold bg-white text-sky-700 rounded-md hover:bg-sky-50 transition">Sign up for free</Link>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-white space-y-8 pt-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-sky-500 rounded-xl shadow-lg shadow-sky-900/40">
                <Sparkles className="w-8 h-8" />
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight">LinkSpark</h1>
            </div>
            <p className="text-xl text-sky-100/90 max-w-xl">
              Shorten links. Generate beautiful QR codes. Redirect instantly. Built for speed and simplicity.
            </p>
          </div>



          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div
              onClick={() => handleFeatureClick('links')}
              className={`flex items-start gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 cursor-pointer select-none transition-transform duration-200 ${
                pulse === 'links' ? 'scale-[1.03] ring-2 ring-white/30' : 'hover:scale-[1.02] active:scale-[0.99]'
              }`}
            >
              <div className="p-2 bg-sky-500 rounded-lg mt-1">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">One‑click short links</h3>
                <p className="text-sky-100/90 text-sm">Shareable, branded, and trackable.</p>
              </div>
            </div>
            <div
              onClick={() => handleFeatureClick('qr')}
              className={`flex items-start gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 cursor-pointer select-none transition-transform duration-200 ${
                pulse === 'qr' ? 'scale-[1.03] ring-2 ring-white/30' : 'hover:scale-[1.02] active:scale-[0.99]'
              }`}
            >
              <div className="p-2 bg-emerald-500 rounded-lg mt-1">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">QR codes that pop</h3>
                <p className="text-emerald-100/90 text-sm">Multiple styles, perfect for print.</p>
              </div>
            </div>
            <div
              onClick={() => handleFeatureClick('redirects')}
              className={`flex items-start gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 cursor-pointer select-none transition-transform duration-200 ${
                pulse === 'redirects' ? 'scale-[1.03] ring-2 ring-white/30' : 'hover:scale-[1.02] active:scale-[0.99]'
              }`}
            >
              <div className="p-2 bg-amber-500 rounded-lg mt-1">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Instant redirects</h3>
                <p className="text-amber-100/90 text-sm">Server‑side 302 with no loading screen.</p>
              </div>
            </div>
            <div
              onClick={() => handleFeatureClick('secure')}
              className={`flex items-start gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 cursor-pointer select-none transition-transform duration-200 ${
                pulse === 'secure' ? 'scale-[1.03] ring-2 ring-white/30' : 'hover:scale-[1.02] active:scale-[0.99]'
              }`}
            >
              <div className="p-2 bg-emerald-600 rounded-lg mt-1">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Secure by default</h3>
                <p className="text-emerald-100/90 text-sm">Private, per‑user data with RLS.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="rounded-xl bg-white/10 border border-white/20 p-4 text-center">
              <div className="text-2xl font-bold">12,000+</div>
              <div className="text-xs text-sky-100/90">Links created</div>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/20 p-4 text-center">
              <div className="text-2xl font-bold">40,000+</div>
              <div className="text-xs text-emerald-100/90">QR scans</div>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/20 p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold"><Users className="w-5 h-5" /> 3,500+</div>
              <div className="text-xs text-amber-100/90">Happy users</div>
            </div>
          </div>

          <div className="p-4 bg-white/10 border border-white/20 rounded-xl">
            <p className="italic text-emerald-100/90">“So easy to use. I created a custom short link and matching QR in seconds.”</p>
          </div>
        </div>
      </div>
    </div>
  );
}
