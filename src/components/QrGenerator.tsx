import { useEffect, useState } from 'react';
import { QrCode, Download, Trash2, ExternalLink, Clock } from 'lucide-react';
import { supabase, QrCodeItem } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function QrGenerator() {
  const [url, setUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [error, setError] = useState('');
  const [styleKey, setStyleKey] = useState<'classic' | 'blue' | 'inverted' | 'navy'>('classic');
  const [history, setHistory] = useState<QrCodeItem[]>([]);
  const { user } = useAuth();

  const styles: Record<string, { label: string; color: string; bgcolor: string }> = {
    classic: { label: 'Classic', color: '0-0-0', bgcolor: '255-255-255' }, // black on white
    blue: { label: 'Blue', color: '0-102-255', bgcolor: '255-255-255' },   // blue on white
    inverted: { label: 'Inverted', color: '255-255-255', bgcolor: '0-0-0' }, // white on black
    navy: { label: 'Navy', color: '10-28-61', bgcolor: '225-239-255' },    // navy on pale blue
  };

  const loadHistory = async () => {
    try {
      if (!user?.id) { setHistory([]); return; }
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load QR history', err);
    }
  };

  const deleteHistory = async (id: string) => {
    try {
      if (!user?.id) return;
      const { error } = await supabase.from('qr_codes').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await loadHistory();
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
      setTimeout(() => setError(''), 3000);
    }
  };

  useEffect(() => {
    if (user) loadHistory(); else setHistory([]);
  }, [user]);

  const buildQrUrl = (value: string, key: keyof typeof styles) => {
    const s = styles[key];
    const encoded = encodeURIComponent(value);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}&color=${s.color}&bgcolor=${s.bgcolor}&format=png`;
  };

  const generateQrCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    const qrApiUrl = buildQrUrl(url, styleKey);
    setQrCodeUrl(qrApiUrl);

    // Optimistically add to history so it shows immediately
    if (user?.id) {
      const tempId = (globalThis as any).crypto?.randomUUID?.() || `tmp-${Date.now()}`;
      const optimistic = { id: tempId, user_id: user.id, original_url: url, style: styleKey, qr_url: qrApiUrl, created_at: new Date().toISOString() } as QrCodeItem;
      setHistory((prev) => [optimistic, ...prev]);
    }

    // Save history for signed-in users
    (async () => {
      try {
        if (!user?.id) return;
        const { error: insErr } = await supabase.from('qr_codes').insert({
          user_id: user.id,
          original_url: url,
          style: styleKey,
          qr_url: qrApiUrl,
        });
        if (insErr) throw insErr;
        await loadHistory(); // refresh to get real IDs
      } catch (err) {
        // non-blocking
        console.warn('QR history insert failed', err);
      }
    })();
  };

  const downloadQrCode = () => {
    if (!qrCodeUrl) return;

    // Download via Blob to avoid cross-origin restrictions on the download attribute
    (async () => {
      try {
        const response = await fetch(qrCodeUrl, { mode: 'cors' });
        if (!response.ok) throw new Error('Failed to fetch QR image');
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'qrcode.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (err: any) {
        setError(err?.message || 'Failed to download QR code');
        setTimeout(() => setError(''), 3000);
      }
    })();
  };

  const clearQrCode = () => {
    setUrl('');
    setQrCodeUrl('');
    setError('');
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Generate QR Code</h2>
        <p className="text-sky-100/80 mb-6">Convert any URL into a scannable QR code</p>

        <form onSubmit={generateQrCode} className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(styles).map(([key, s]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setStyleKey(key as any);
                  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                    setQrCodeUrl(buildQrUrl(url, key as any));
                  }
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border transition ${
                  styleKey === key ? 'bg-white text-gray-900 border-sky-400 shadow-sm' : 'bg-white/80 hover:bg-white border-gray-200 text-gray-800'
                }`}
                title={s.label}
              >
                <span
                  className="inline-block w-5 h-5 rounded-sm border"
                  style={{
                    background: `rgb(${s.bgcolor.split('-').join(',')})`,
                    boxShadow: `inset 0 0 0 8px rgb(${s.color.split('-').join(',')})`,
                  }}
                />
                <span className="text-sm text-gray-700">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-sky-300/40 focus:border-transparent outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-white text-sky-900 hover:bg-sky-50 font-semibold rounded-lg transition flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <QrCode className="w-5 h-5" />
              <span>Generate</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}
        </form>
      </div>

      {qrCodeUrl && (
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl p-8 text-white">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Your QR Code</h3>
              <p className="text-sm text-white/80 break-all">{url}</p>
            </div>

            <div className="p-8 rounded-xl border-2 border-white/30 bg-white/10 mb-6 flex items-center justify-center">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-72 h-72 shadow-lg rounded-lg"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadQrCode}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-sky-900 hover:bg-sky-50 font-semibold rounded-lg transition shadow-lg hover:shadow-xl"
              >
                <Download className="w-5 h-5" />
                <span>Download QR Code</span>
              </button>
              <button
                onClick={clearQrCode}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition"
              >
                Clear
              </button>
            </div>

            <div className="mt-6 p-4 bg-white/10 rounded-lg border border-white/20">
              <p className="text-sm text-sky-100/90">
                <span className="font-semibold text-white">Tip:</span> You can scan this QR code with any smartphone camera to instantly open the URL.
              </p>
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Your QR History</h3>
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="bg-white/10 border border-white/20 rounded-lg p-4 hover:bg-white/15 transition text-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-md">{item.style}</span>
                    </div>
                    <p className="text-sm text-white/80 truncate">{item.original_url}</p>
                    <div className="flex items-center gap-4 mt-2 text-white/70 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>Created {new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={item.qr_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/10 rounded text-sky-300" title="Open image">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button onClick={() => deleteHistory(item.id)} className="p-2 hover:bg-white/10 rounded text-red-300" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!qrCodeUrl && (
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl p-12 text-center text-white">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No QR Code Yet</h3>
            <p className="text-white/80">Enter a URL above and click generate to create your QR code</p>
          </div>
        </div>
      )}
    </div>
  );
}
