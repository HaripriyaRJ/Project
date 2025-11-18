import { useState } from 'react';
import { QrCode, Download } from 'lucide-react';

export default function QrGenerator() {
  const [url, setUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [error, setError] = useState('');
  const [styleKey, setStyleKey] = useState<'classic' | 'blue' | 'inverted' | 'navy'>('classic');

  const styles: Record<string, { label: string; color: string; bgcolor: string }> = {
    classic: { label: 'Classic', color: '0-0-0', bgcolor: '255-255-255' }, // black on white
    blue: { label: 'Blue', color: '0-102-255', bgcolor: '255-255-255' },   // blue on white
    inverted: { label: 'Inverted', color: '255-255-255', bgcolor: '0-0-0' }, // white on black
    navy: { label: 'Navy', color: '10-28-61', bgcolor: '225-239-255' },    // navy on pale blue
  };

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
