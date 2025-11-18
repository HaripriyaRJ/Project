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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError('');
      try {
        const { data, error } = await supabase
          .from('shortened_urls')
          .select('id, short_code, original_url, clicks, created_at, updated_at')
          .eq('user_id', user.id)
          .order('clicks', { ascending: false });
        if (error) throw error;
        setRows((data || []) as Row[]);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-sky-600" />
        <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}
      {loading && (
        <div className="p-2 text-sm text-gray-500">Loading analytics…</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 border border-white/20 rounded-lg bg-white/10 backdrop-blur text-white">
          <p className="text-sm text-white/70">Total link redirects</p>
          <p className="text-3xl font-bold text-white mt-1">{totalClicks}</p>
        </div>
        <div className="p-4 border border-white/20 rounded-lg bg-white/10 backdrop-blur text-white">
          <p className="text-sm text-white/70">QR code scans</p>
          <p className="text-3xl font-bold text-white mt-1">{totalClicks}</p>
          <p className="text-xs text-white/60 mt-1">Included in total redirects</p>
        </div>
      </div>

    </div>
  );
}
