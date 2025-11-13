import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

export default function RedirectPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    const redirect = async () => {
      if (!shortCode) {
        setError(true);
        return;
      }

      try {
        // Call RPC that validates the short code, increments clicks, and returns original_url
        const { data, error: rpcError } = await supabase.rpc('redirect_and_count', {
          p_short_code: shortCode,
        });

        // Supabase RPCs that return a table typically return an array of rows.
        const originalUrl = Array.isArray(data)
          ? data?.[0]?.original_url
          : (data as any)?.original_url;

        if (rpcError || !originalUrl) {
          setError(true);
          return;
        }

        window.location.href = originalUrl as string;
      } catch (err) {
        setError(true);
      }
    };

    redirect();
  }, [shortCode]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Not Found</h1>
          <p className="text-gray-600 mb-6">
            The short link you're looking for doesn't exist or has been removed.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">Redirecting...</p>
      </div>
    </div>
  );
}
