import { useState } from 'react';
import { Link2, QrCode, LogOut, Sparkles, BarChart2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UrlShortener from './UrlShortener';
import QrGenerator from './QrGenerator';
import Analytics from './Analytics';

type Tab = 'shortener' | 'qr' | 'analytics';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('shortener');
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 via-emerald-950 to-amber-950">
      <nav className="bg-white/10 backdrop-blur border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/10 border border-white/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">LinkSpark</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm">
                <p className="text-white/80">Welcome back,</p>
                <p className="font-semibold text-white">{profile?.username}</p>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="border-b border-white/20">
            <div className="flex">
              <button
                onClick={() => setActiveTab('shortener')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition ${
                  activeTab === 'shortener'
                    ? 'bg-white/10 text-white border-b-2 border-white/60'
                    : 'text-white/80 hover:bg-white/5'
                }`}
              >
                <Link2 className="w-5 h-5" />
                <span>URL Shortener</span>
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition ${
                  activeTab === 'qr'
                    ? 'bg-white/10 text-white border-b-2 border-white/60'
                    : 'text-white/80 hover:bg-white/5'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>QR Code Generator</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition ${
                  activeTab === 'analytics'
                    ? 'bg-white/10 text-white border-b-2 border-white/60'
                    : 'text-white/80 hover:bg-white/5'
                }`}
              >
                <BarChart2 className="w-5 h-5" />
                <span>Analytics</span>
              </button>
            </div>
          </div>

          <div className="p-6 text-white">
            {activeTab === 'shortener' && <UrlShortener />}
            {activeTab === 'qr' && <QrGenerator />}
            {activeTab === 'analytics' && <Analytics />}
          </div>
        </div>
      </div>
    </div>
  );
}
