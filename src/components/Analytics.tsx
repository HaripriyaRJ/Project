import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BarChart2 } from 'lucide-react';

type Row = {
  id: string;
  short_code: string;
  original_url: string;
  clicks: number;
  created_at: string;
  updated_at?: string;
};

export default function Analytics() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [qrLinkedRows, setQrLinkedRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError('');
      try {
        // Links with clicks
        const { data: links, error: linksErr } = await supabase
          .from('shortened_urls')
          .select('id, short_code, original_url, clicks, created_at, updated_at')
          .eq('user_id', user.id)
          .order('clicks', { ascending: false });
        if (linksErr) throw linksErr;
        setRows((links || []) as Row[]);

        // Links that have QR codes generated (match by original_url)
        const { data: qrs, error: qrErr } = await supabase
          .from('qr_codes')
          .select('original_url')
          .eq('user_id', user.id);
        if (qrErr) throw qrErr;
        const qrUrlSet = new Set<string>((qrs || []).map((r: any) => r.original_url));
        setQrLinkedRows((links || []).filter((r: any) => qrUrlSet.has(r.original_url)) as Row[]);
      } catch (e: any) {
        setError(e?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const totalClicks = useMemo(() => rows.reduce((s, r) => s + (r.clicks || 0), 0), [rows]);
  // For now, treat QR scans as part of redirects (same counter)

  const ClicksBarChart = ({ data }: { data: Row[] }) => {
    const top = data.slice(0, 8); // show top 8
    const max = Math.max(1, ...top.map((d) => d.clicks || 0));
    const barW = 28;
    const gap = 14;
    const width = top.length * (barW + gap) + gap;
    const height = 160;
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44">
        {top.map((d, i) => {
          const h = Math.round(((d.clicks || 0) / max) * (height - 30));
          const x = gap + i * (barW + gap);
          const y = height - h - 20;
          return (
            <g key={d.id}>
              <rect x={x} y={y} width={barW} height={h} rx={6} className="fill-sky-300/90" />
              <text x={x + barW / 2} y={height - 6} textAnchor="middle" className="fill-white/80 text-[10px] font-mono">
                {d.short_code}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const QrClicksChart = ({ data }: { data: Row[] }) => {
    const top = data.slice(0, 8);
    const max = Math.max(1, ...top.map((d) => d.clicks || 0));
    const barW = 28;
    const gap = 14;
    const width = top.length * (barW + gap) + gap;
    const height = 160;
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44">
        {top.map((d, i) => {
          const h = Math.round(((d.clicks || 0) / max) * (height - 30));
          const x = gap + i * (barW + gap);
          const y = height - h - 20;
          return (
            <g key={d.id}>
              <rect x={x} y={y} width={barW} height={h} rx={6} className="fill-emerald-300/90" />
              <text x={x + barW / 2} y={height - 6} textAnchor="middle" className="fill-white/80 text-[10px] font-mono">
                {d.short_code}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-sky-300" />
        <h2 className="text-xl font-bold text-white">Analytics</h2>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}
      {loading && (
        <div className="p-2 text-sm text-gray-500">Loading analytics…</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 border border-white/20 rounded-xl bg-white/10 backdrop-blur text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-white/70">Total link redirects</p>
            <p className="text-2xl font-bold text-white">{totalClicks}</p>
          </div>
          <ClicksBarChart data={rows} />
          <p className="text-xs text-white/60 mt-2">Top links by clicks</p>
        </div>
        <div className="p-5 border border-white/20 rounded-xl bg-white/10 backdrop-blur text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-white/70">Total QR Redirects</p>
            <p className="text-2xl font-bold text-white">{qrLinkedRows.reduce((s, r) => s + (r.clicks || 0), 0)}</p>
          </div>
          <QrClicksChart data={qrLinkedRows} />
          <p className="text-xs text-white/60 mt-2">Top links by scan</p>
        </div>
      </div>

    </div>
  );
}
