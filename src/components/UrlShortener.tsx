import { useState, useEffect } from 'react';
import { Link2, Copy, ExternalLink, Trash2, TrendingUp } from 'lucide-react';
import { supabase, ShortenedUrl } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function UrlShortener() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUrls();
    } else {
      setUrls([]);
    }
  }, [user]);

  const loadUrls = async () => {
    try {
      if (!user?.id) {
        setUrls([]);
        return;
      }

      const { data, error } = await supabase
        .from('shortened_urls')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUrls(data || []);
    } catch (err) {
      console.error('Error loading URLs:', err);
    }
  };

  const generateShortCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!user?.id) {
        setError('Please sign in to shorten URLs.');
        setLoading(false);
        return;
      }
      if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
        setError('Please enter a valid URL starting with http:// or https://');
        setLoading(false);
        return;
      }

      const shortCode = generateShortCode();

      const { error: insertError } = await supabase
        .from('shortened_urls')
        .insert({
          user_id: user.id,
          original_url: originalUrl,
          short_code: shortCode,
        });

      if (insertError) throw insertError;

      setSuccess('URL shortened successfully!');
      setOriginalUrl('');
      loadUrls();
    } catch (err: any) {
      setError(err.message || 'Failed to shorten URL');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (shortCode: string) => {
    const shortUrl = `${window.location.origin}/r/${shortCode}`;
    navigator.clipboard.writeText(shortUrl);
    setSuccess('Link copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const deleteUrl = async (id: string) => {
    try {
      if (!user?.id) return;
      const { error } = await supabase
        .from('shortened_urls')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      loadUrls();
      setSuccess('Link deleted successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete URL');
    }
  };

  const openOriginalUrl = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shorten Your URL</h2>
        <p className="text-gray-600 mb-6">Transform long URLs into short, shareable links</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="url"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder="https://example.com/your-very-long-url"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Link2 className="w-5 h-5" />
              <span>{loading ? 'Shortening...' : 'Shorten'}</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}
        </form>
      </div>

      {urls.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Shortened Links</h3>
          <div className="space-y-3">
            {urls.map((url) => (
              <div
                key={url.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-mono rounded-md">
                        {window.location.origin}/r/{url.short_code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(url.short_code)}
                        className="p-1.5 hover:bg-gray-100 rounded transition"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{url.original_url}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <TrendingUp className="w-3 h-3" />
                        {url.clicks} clicks
                      </span>
                      <span className="text-xs text-gray-500">
                        Created {new Date(url.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openOriginalUrl(url.original_url)}
                      className="p-2 hover:bg-blue-50 text-blue-600 rounded transition"
                      title="Open original URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteUrl(url.id)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
