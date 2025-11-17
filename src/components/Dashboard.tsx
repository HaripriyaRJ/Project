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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">LinkSpark</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm">
                <p className="text-gray-600">Welcome back,</p>
                <p className="font-semibold text-gray-900">{profile?.username}</p>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('shortener')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition ${
                  activeTab === 'shortener'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Link2 className="w-5 h-5" />
                <span>URL Shortener</span>
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition ${
                  activeTab === 'qr'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>QR Code Generator</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition ${
                  activeTab === 'analytics'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <BarChart2 className="w-5 h-5" />
                <span>Analytics</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'shortener' && <UrlShortener />}
            {activeTab === 'qr' && <QrGenerator />}
            {activeTab === 'analytics' && <Analytics />}
          </div>
        </div>
      </div>
    </div>
  );
}
