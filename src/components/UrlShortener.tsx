import { useState, useEffect } from 'react';
import { Link2, Copy, ExternalLink, Trash2, TrendingUp, Share2, Mail, Facebook, Instagram, Twitter, MessageCircle, AtSign } from 'lucide-react';
import { supabase, ShortenedUrl } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function UrlShortener() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const [shareItem, setShareItem] = useState<ShortenedUrl | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const [description, setDescription] = useState('');

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

      // Try insert including description; if column doesn't exist, retry without it
      let insertError: any = null;
      {
        const { error } = await supabase
          .from('shortened_urls')
          .insert({
            user_id: user.id,
            original_url: originalUrl,
            short_code: shortCode,
            title: title.trim() || null,
            description: description.trim() || null,
          });
        insertError = error;
      }
      if (insertError && String(insertError.message || '').toLowerCase().includes('description')) {
        const { error } = await supabase
          .from('shortened_urls')
          .insert({
            user_id: user.id,
            original_url: originalUrl,
            short_code: shortCode,
            title: title.trim() || null,
          });
        if (error) throw error;
      } else if (insertError) {
        throw insertError;
      }

      setSuccess('URL shortened successfully!');
      setOriginalUrl('');
      setCustomAlias('');
      setTitle('');
      setDescription('');
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

  const buildShareTargets = (shortUrl: string) => {
    const text = `${shortUrl}`;
    return [
      { name: 'WhatsApp', icon: <MessageCircle className="w-5 h-5 text-green-600" />, href: `https://wa.me/?text=${encodeURIComponent(text)}` },
      { name: 'Facebook', icon: <Facebook className="w-5 h-5 text-blue-600" />, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shortUrl)}` },
      { name: 'Instagram', icon: <Instagram className="w-5 h-5 text-pink-600" />, href: `https://www.instagram.com/?url=${encodeURIComponent(shortUrl)}` },
      { name: 'X', icon: <Twitter className="w-5 h-5 text-black" />, href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shortUrl)}` },
      { name: 'Threads', icon: <AtSign className="w-5 h-5 text-black" />, href: `https://www.threads.net/` },
      { name: 'Email', icon: <Mail className="w-5 h-5 text-amber-600" />, href: `mailto:?subject=${encodeURIComponent('Shared link')}&body=${encodeURIComponent(text)}` },
      { name: 'Copy Link', icon: <Copy className="w-5 h-5 text-gray-700" />, onClick: () => navigator.clipboard.writeText(shortUrl) },
    ] as Array<{ name: string; icon: JSX.Element; href?: string; onClick?: () => void }>;
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Shorten Your URL</h2>
        <p className="text-sky-100/80 mb-6">Transform long URLs into short, shareable links</p>

        <form onSubmit={(e)=>e.preventDefault()} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="url"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder="https://example.com/your-very-long-url"
                className="w-full px-4 py-3 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-sky-300/40 focus:border-transparent outline-none"
                required
              />
            </div>
            <button
              type="button"
              disabled={loading}
              className="px-6 py-3 bg-white text-sky-900 hover:bg-sky-50 font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl"
              onClick={()=> setShowMeta(true)}
            >
              <Link2 className="w-5 h-5" />
              <span>{loading ? 'Shortening...' : 'Shorten'}</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Optional custom alias field, full-width like URL */}
          <input
            type="text"
            value={customAlias}
            onChange={(e) => setCustomAlias(e.target.value)}
            placeholder="Optional: custom alias (e.g. my-link)"
            className="w-full px-4 py-3 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-sky-300/40 focus:border-transparent outline-none"
          />
          <p className="text-xs text-white/70">Allowed: letters, numbers, - and _. At least 3 characters.</p>

      {shareItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=> setShareItem(null)} />
          <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white shadow-2xl p-6 text-slate-900">
            <div className="flex items-start justify-between">
              <h4 className="text-lg font-semibold">Share your link</h4>
              <button className="p-2 rounded hover:bg-slate-100" onClick={()=> setShareItem(null)}>✕</button>
            </div>
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
              {buildShareTargets(shareItem ? `${window.location.origin}/r/${shareItem.short_code}` : '').map((s) => (
                <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                  {s.icon}
                  <span className="text-xs text-slate-600">{s.name}</span>
                </a>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-2">
              <input
                readOnly
                value={shareItem ? `${window.location.origin}/r/${shareItem.short_code}` : ''}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
              <button
                className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                onClick={async ()=> { await navigator.clipboard.writeText(`${window.location.origin}/r/${shareItem!.short_code}`); setCopiedShare(true); setTimeout(()=> setCopiedShare(false), 1200); }}
              >
                {copiedShare ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-400/30 rounded-lg">
              <p className="text-sm text-green-200">{success}</p>
            </div>
          )}
        </form>
      </div>

      {showMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>!loading && setShowMeta(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 text-slate-900">
            <h4 className="text-lg font-semibold mb-4">Add details</h4>
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-300 focus:border-sky-300 outline-none"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-300 focus:border-sky-300 outline-none"
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                onClick={()=> setShowMeta(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 font-semibold"
                onClick={async ()=> { await handleSubmit(); setShowMeta(false); }}
                disabled={loading}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {urls.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Your Shortened Links</h3>
          <div className="space-y-3">
            {urls.map((url) => (
              <div
                key={url.id}
                className="bg-white/10 border border-white/20 rounded-lg p-4 hover:bg-white/15 transition text-white"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-3 py-1 bg-sky-100 text-sky-700 text-sm font-mono rounded-md">
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
                    {url.title && (
                      <div className="text-sm font-semibold text-white/90 mb-1 truncate">{url.title}</div>
                    )}
                    <p className="text-sm text-white/80 truncate">{url.original_url}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-xs text-white/70">
                        <TrendingUp className="w-3 h-3" />
                        {url.clicks} clicks
                      </span>
                      <span className="text-xs text-white/70">
                        Created {new Date(url.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 relative">
                    <button
                      onClick={() => setShareItem(url)}
                      className="p-2 hover:bg-white/10 text-white rounded transition"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openOriginalUrl(url.original_url)}
                      className="p-2 hover:bg-white/10 text-sky-300 rounded transition"
                      title="Open original URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteUrl(url.id)}
                      className="p-2 hover:bg-white/10 text-red-300 rounded transition"
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

