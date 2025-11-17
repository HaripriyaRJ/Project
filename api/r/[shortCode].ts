import { createClient } from '@supabase/supabase-js';

// Serverless redirect handler: resolves short code via RPC and issues a 302 redirect
export default async function handler(req: any, res: any) {
  try {
    const { shortCode } = req.query || {};
    const isQr = req.query?.qr === '1' || req.query?.qr === 1;
    if (!shortCode || Array.isArray(shortCode)) {
      res.status(400).send('Bad Request: missing short code');
      return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;
    if (!supabaseUrl || !supabaseAnonKey) {
      res.status(500).send('Server misconfigured: Supabase env vars missing');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const rpcName = isQr ? 'redirect_and_count_qr' : 'redirect_and_count';
    const { data, error } = await supabase.rpc(rpcName, { p_short_code: shortCode });

    const originalUrl = Array.isArray(data) ? data?.[0]?.original_url : (data as any)?.original_url;

    if (error || !originalUrl) {
      res.status(404).send('Link not found');
      return;
    }

    // 302 redirect to destination
    res.status(302).setHeader('Location', originalUrl as string).end();
  } catch (e) {
    res.status(500).send('Internal Server Error');
  }
}
