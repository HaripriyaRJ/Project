import { useState } from 'react';
import { QrCode, Download } from 'lucide-react';

export default function QrGenerator() {
  const [url, setUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [error, setError] = useState('');

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

    const encodedUrl = encodeURIComponent(url);
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedUrl}`;
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
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate QR Code</h2>
        <p className="text-gray-600 mb-6">Convert any URL into a scannable QR code</p>

        <form onSubmit={generateQrCode} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <QrCode className="w-5 h-5" />
              <span>Generate</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </form>
      </div>

      {qrCodeUrl && (
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your QR Code</h3>
              <p className="text-sm text-gray-600 break-all">{url}</p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl border-2 border-gray-200 mb-6 flex items-center justify-center">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-72 h-72 shadow-lg rounded-lg"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadQrCode}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-lg hover:shadow-xl"
              >
                <Download className="w-5 h-5" />
                <span>Download QR Code</span>
              </button>
              <button
                onClick={clearQrCode}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition"
              >
                Clear
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Tip:</span> You can scan this QR code with any smartphone camera to instantly open the URL.
              </p>
            </div>
          </div>
        </div>
      )}

      {!qrCodeUrl && (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No QR Code Yet</h3>
            <p className="text-gray-600">Enter a URL above and click generate to create your QR code</p>
          </div>
        </div>
      )}
    </div>
  );
}
