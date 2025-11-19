import { useEffect, useState } from 'react';
import { Copy, Calendar, ExternalLink, Pencil, Share2, Trash2, Facebook, Instagram, Twitter, MessageCircle, Mail, AtSign, Linkedin, Send } from 'lucide-react';
import { supabase, ShortenedUrl } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function LinksPanel() {
  const { user } = useAuth();
  const [items, setItems] = useState<ShortenedUrl[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<ShortenedUrl | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAlias, setEditAlias] = useState('');
  const [saving, setSaving] = useState(false);
  const [shareItem, setShareItem] = useState<ShortenedUrl | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setItems([]); return; }
      setLoading(true);
      setError('');
      try {
        const { data, error } = await supabase
          .from('shortened_urls')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setItems((data || []) as ShortenedUrl[]);
      } catch (e: any) {
        setError(e?.message || 'Failed to load links');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const makeTitle = (url: string) => {
    try {
      const u = new URL(url);
      return u.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const faviconFor = (url: string) => {
    try {
      const u = new URL(url);
      const host = u.hostname;
      // Use DuckDuckGo icons service for reliable favicons
      return `https://icons.duckduckgo.com/ip3/${host}.ico`;
    } catch {
      return '';
    }
  };

  const shortUrl = (code: string) => `${window.location.origin}/r/${code}`;

  const copyShort = async (code: string, id: string) => {
    await navigator.clipboard.writeText(shortUrl(code));
    setCopiedId(id);
    setTimeout(() => setCopiedId((v) => (v === id ? null : v)), 1400);
  };

  const buildShareTargets = (shortUrl: string) => {
    const text = `${shortUrl}`;
    return [
      { name: 'WhatsApp', icon: <MessageCircle className="w-5 h-5 text-green-600" />, href: `https://wa.me/?text=${encodeURIComponent(text)}` },
      { name: 'Telegram', icon: <Send className="w-5 h-5 text-sky-600" />, href: `https://t.me/share/url?url=${encodeURIComponent(shortUrl)}&text=${encodeURIComponent(text)}` },
      { name: 'Facebook', icon: <Facebook className="w-5 h-5 text-blue-600" />, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shortUrl)}` },
      { name: 'Instagram', icon: <Instagram className="w-5 h-5 text-pink-600" />, href: `https://www.instagram.com/?url=${encodeURIComponent(shortUrl)}` },
      { name: 'X', icon: <Twitter className="w-5 h-5 text-black" />, href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shortUrl)}` },
      { name: 'Threads', icon: <AtSign className="w-5 h-5 text-black" />, href: `https://www.threads.net/` },
      { name: 'LinkedIn', icon: <Linkedin className="w-5 h-5 text-blue-700" />, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shortUrl)}` },
      { name: 'Email', icon: <Mail className="w-5 h-5 text-amber-600" />, href: `mailto:?subject=${encodeURIComponent('Shared link')}&body=${encodeURIComponent(text)}` },
      {
        name: 'Copy Link',
        icon: <Copy className="w-5 h-5 text-gray-700" />,
        onClick: () => navigator.clipboard.writeText(shortUrl),
      },
    ] as Array<{ name: string; icon: JSX.Element; href?: string; onClick?: () => void }>;
  };

  const onDelete = async (id: string) => {
    if (!user?.id) return;
    try {
      await supabase.from('shortened_urls').delete().eq('id', id).eq('user_id', user.id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      // silent
    }
  };

  const openEdit = (it: ShortenedUrl) => {
    setEditItem(it);
    setEditTitle(it.title || '');
    setEditDescription((it as any).description || '');
    setEditAlias(it.short_code || '');
  };

  const saveEdit = async () => {
    if (!user?.id || !editItem) return;
    setSaving(true);
    try {
      let alias = editAlias.trim();
      if (alias && alias !== editItem.short_code) {
        alias = alias.replace(/\s+/g, '-').replace(/[^A-Za-z0-9-_]/g, '').slice(0, 30);
        if (alias.length < 3) throw new Error('Alias must be at least 3 characters');
        const { data: existing, error: checkErr } = await supabase
          .from('shortened_urls')
          .select('id')
          .eq('short_code', alias)
          .maybeSingle();
        if (checkErr) throw checkErr;
        if (existing && existing.id !== editItem.id) throw new Error('Alias already in use');
      } else {
        alias = editItem.short_code;
      }

      const { error: updErr } = await supabase
        .from('shortened_urls')
        .update({ title: editTitle.trim() || null, description: editDescription.trim() || null, short_code: alias })
        .eq('id', editItem.id)
        .eq('user_id', user.id);
      if (updErr) throw updErr;
      setItems((prev) => prev.map((x) => (x.id === editItem.id ? { ...x, title: editTitle.trim() || undefined, short_code: alias, description: editDescription.trim() || undefined } : x)));
      setEditItem(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-red-100 text-sm">{error}</div>
      )}

      {shareItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=> setShareItem(null)} />
          <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white shadow-2xl p-6 text-slate-900">
            <div className="flex items-start justify-between">
              <h4 className="text-lg font-semibold">Share your link</h4>
              <button className="p-2 rounded hover:bg-slate-100" onClick={()=> setShareItem(null)}>✕</button>
            </div>
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
              {buildShareTargets(shareItem ? shortUrl(shareItem.short_code) : '').map((s) => (
                <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                  {s.icon}
                  <span className="text-xs text-slate-600">{s.name}</span>
                </a>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-2">
              <input
                readOnly
                value={shareItem ? shortUrl(shareItem.short_code) : ''}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
              <button
                className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                onClick={async ()=> { await navigator.clipboard.writeText(shortUrl(shareItem!.short_code)); setCopiedShare(true); setTimeout(()=> setCopiedShare(false), 1200); }}
              >
                {copiedShare ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
      {loading && <div className="text-white/80 text-sm">Loading…</div>}

      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className="rounded-xl border border-white/20 bg-white/10 backdrop-blur p-4 text-white relative">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {/* Title */}
                <div className="text-base font-semibold truncate flex items-center gap-2">
                  <img
                    src={faviconFor(it.original_url)}
                    alt=""
                    className="w-4 h-4 rounded-sm bg-white/10 border border-white/20"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span className="truncate">{it.title || makeTitle(it.original_url)}</span>
                </div>
                {('description' in it) && (it as any).description && (
                  <div className="mt-1 text-sm text-white/80 truncate">{(it as any).description}</div>
                )}

                {/* Short link with copy */}
                <div className="mt-1 flex items-center gap-2">
                  <a
                    href={shortUrl(it.short_code)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded-md bg-sky-100 text-sky-800 text-sm font-mono hover:bg-sky-50"
                  >
                    {shortUrl(it.short_code)}
                  </a>
                  <button
                    onClick={() => copyShort(it.short_code, it.id)}
                    className="p-1.5 hover:bg-white/10 rounded"
                    title="Copy short link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {copiedId === it.id && <span className="text-xs text-emerald-200">Copied</span>}
                </div>

                {/* Original URL */}
                <div className="mt-2 flex items-center gap-2 text-sm text-white/80 truncate">
                  <span className="opacity-70">↳</span>
                  <a
                    href={it.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:underline"
                    title={it.original_url}
                  >
                    {it.original_url}
                  </a>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </div>

                {/* Date row */}
                <div className="mt-2 flex items-center gap-4 text-xs text-white/70">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(it.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-2 hover:bg-white/10 rounded" title="Edit" onClick={() => openEdit(it)}>
                  <Pencil className="w-4 h-4" />
                </button>
                <div className="relative">
                  <button className="p-2 hover:bg-white/10 rounded" title="Share" onClick={() => setShareItem(it)}>
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
                <button className="p-2 hover:bg-white/10 rounded" title="Delete" onClick={() => onDelete(it.id)}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div className="text-white/70 text-sm">No links yet. Create one in URL Shortener.</div>
        )}
      </div>
    </div>

      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=> !saving && setEditItem(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 text-slate-900">
            <h4 className="text-lg font-semibold mb-4">Edit link</h4>
            <div className="space-y-3">
              <input
                type="text"
                value={editTitle}
                onChange={(e)=> setEditTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-300 focus:border-sky-300 outline-none"
              />
              <textarea
                value={editDescription}
                onChange={(e)=> setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-300 focus:border-sky-300 outline-none"
              />
              <input
                type="text"
                value={editAlias}
                onChange={(e)=> setEditAlias(e.target.value)}
                placeholder="Custom alias (optional)"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-300 focus:border-sky-300 outline-none"
              />
              <p className="text-xs text-slate-500">Allowed: letters, numbers, - and _. At least 3 characters.</p>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200" onClick={()=> setEditItem(null)} disabled={saving}>Cancel</button>
              <button className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 font-semibold" onClick={saveEdit} disabled={saving}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
