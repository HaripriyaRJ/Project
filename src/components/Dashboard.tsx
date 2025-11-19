import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, QrCode, LogOut, Sparkles, BarChart2, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UrlShortener from './UrlShortener';
import QrGenerator from './QrGenerator';
import Analytics from './Analytics';
import Settings from './Settings';
import LinksPanel from './LinksPanel';

type Tab = 'links' | 'shortener' | 'qr' | 'analytics' | 'settings';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('shortener');
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

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
                onClick={async () => {
                  try { await signOut(); } finally { navigate('/', { replace: true }); }
                }}
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl p-4 text-white">
            <div className="mb-4 rounded-lg border border-white/20 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/30 flex items-center justify-center font-bold">
                  {(profile?.username || user?.email || 'U')
                    ?.split(' ')
                    .map((s)=>s[0])
                    .join('')
                    .slice(0,2)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{profile?.username || '—'}</div>
                  <div className="text-xs text-white/70 truncate max-w-[160px]">{user?.email}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('links')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === 'links' ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5'
                }`}
              >
                <Link2 className="w-5 h-5" />
                <span className="text-sm whitespace-nowrap">Links</span>
              </button>

              <button
                onClick={() => setActiveTab('shortener')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === 'shortener' ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5'
                }`}
              >
                <Link2 className="w-5 h-5" />
                <span className="text-sm whitespace-nowrap">URL Shortener</span>
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === 'qr' ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-sm whitespace-nowrap">QR Code Generator</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === 'analytics' ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5'
                }`}
              >
                <BarChart2 className="w-5 h-5" />
                <span className="text-sm whitespace-nowrap">Analytics</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5'
                }`}
              >
                <SettingsIcon className="w-5 h-5" />
                <span className="text-sm whitespace-nowrap">Settings</span>
              </button>
            </div>
          </aside>

          <main className="lg:col-span-9 rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl p-6 text-white">
            {activeTab === 'links' && <LinksPanel />}
            {activeTab === 'shortener' && <UrlShortener />}
            {activeTab === 'qr' && <QrGenerator />}
            {activeTab === 'analytics' && <Analytics />}
            {activeTab === 'settings' && <Settings />}
          </main>
        </div>
      </div>
    </div>
  );
}
