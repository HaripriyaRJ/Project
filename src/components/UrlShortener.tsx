import { useState, useEffect } from 'react';
import { Link2, Copy, ExternalLink, Trash2, TrendingUp, Share2, Send, Mail, MoreHorizontal } from 'lucide-react';
import { supabase, ShortenedUrl } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function UrlShortener() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const [shareOpenId, setShareOpenId] = useState<string | null>(null);

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

      // Decide short code: custom alias if provided, otherwise random
      let shortCode = customAlias.trim();
      if (shortCode) {
        // normalize and validate
        const alias = shortCode
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^A-Za-z0-9-_]/g, '')
          .slice(0, 30); // limit length

        if (alias.length < 3) {
          setError('Custom alias must be at least 3 characters (letters, numbers, - or _)');
          setLoading(false);
          return;
        }

        // Check uniqueness
        const { data: existing, error: checkErr } = await supabase
          .from('shortened_urls')
          .select('id')
          .eq('short_code', alias)
          .maybeSingle();

        if (checkErr) {
          setError(checkErr.message || 'Failed to check alias availability');
          setLoading(false);
          return;
        }

        if (existing) {
          setError('That custom link is already taken. Please choose another.');
          setLoading(false);
          return;
        }

        shortCode = alias;
      } else {
        shortCode = generateShortCode();
      }

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
      setCustomAlias('');
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

  const buildShareTargets = (shortUrl: string, original: string) => {
    const text = `${shortUrl}`; // share only the short URL for easy sending
    return [
      { name: 'WhatsApp', icon: <Share2 className="w-4 h-4 text-green-600" />, href: `https://wa.me/?text=${encodeURIComponent(text)}` },
      { name: 'Telegram', icon: <Send className="w-4 h-4 text-sky-600" />, href: `https://t.me/share/url?url=${encodeURIComponent(shortUrl)}&text=${encodeURIComponent(text)}` },
      { name: 'Facebook', icon: <Share2 className="w-4 h-4 text-blue-600" />, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shortUrl)}` },
      { name: 'LinkedIn', icon: <Share2 className="w-4 h-4 text-blue-700" />, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shortUrl)}` },
      { name: 'Email', icon: <Mail className="w-4 h-4 text-amber-600" />, href: `mailto:?subject=${encodeURIComponent('Shared link')}&body=${encodeURIComponent(text)}` },
      {
        name: 'Copy Link',
        icon: <Copy className="w-4 h-4 text-gray-600" />,
        onClick: () => {
          navigator.clipboard.writeText(shortUrl);
          setSuccess('Link copied to clipboard!');
          setTimeout(() => setSuccess(''), 2000);
          setShareOpenId(null);
        },
      },
      {
        name: 'More…',
        icon: <MoreHorizontal className="w-4 h-4 text-gray-700" />,
        onClick: async () => {
          const nav: any = navigator;
          if (nav.share) {
            try {
              await nav.share({ title: 'Share link', text, url: shortUrl });
            } catch {}
          } else {
            navigator.clipboard.writeText(shortUrl);
            setSuccess('Link copied to clipboard!');
            setTimeout(() => setSuccess(''), 2000);
          }
          setShareOpenId(null);
        },
      },
    ] as Array<{ name: string; icon: JSX.Element; href?: string; onClick?: () => void }>;
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

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                placeholder="Optional: custom alias (e.g. my-link)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Allowed: letters, numbers, - and _. At least 3 characters.
              </p>
            </div>
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
                  <div className="flex gap-2 relative">
                    <button
                      onClick={() => setShareOpenId(shareOpenId === url.id ? null : url.id)}
                      className="p-2 hover:bg-gray-100 text-gray-700 rounded transition"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    {shareOpenId === url.id && (
                      <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg w-48 p-2">
                        {buildShareTargets(`${window.location.origin}/r/${url.short_code}`, url.original_url).map((item) => (
                          <div key={item.name}>
                            {item.href ? (
                              <a
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                                onClick={() => setShareOpenId(null)}
                              >
                                {item.icon}
                                <span>{item.name}</span>
                              </a>
                            ) : (
                              <button
                                onClick={item.onClick}
                                className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                              >
                                {item.icon}
                                <span>{item.name}</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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

