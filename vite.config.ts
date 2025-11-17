import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createClient } from '@supabase/supabase-js';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      // Dev-only middleware to 302 redirect /r/:shortCode immediately
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          try {
            const url = req.url || '';
            if (!url.startsWith('/r/')) return next();

            const shortCode = decodeURIComponent(url.replace(/^\/r\//, '').split('?')[0]);
            if (!shortCode) return next();

            const supabaseUrl = env.VITE_SUPABASE_URL;
            const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
            if (!supabaseUrl || !supabaseAnonKey) return next();

            const supabase = createClient(supabaseUrl, supabaseAnonKey);
            const { data, error } = await supabase.rpc('redirect_and_count', {
              p_short_code: shortCode,
            });

            const originalUrl = Array.isArray(data) ? data?.[0]?.original_url : (data as any)?.original_url;
            if (error || !originalUrl) return next();

            res.statusCode = 302;
            res.setHeader('Location', originalUrl as string);
            return res.end();
          } catch (_) {
            return next();
          }
        });
      },
    },
  };
});
