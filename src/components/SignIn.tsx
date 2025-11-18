import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) setError(error.message || 'Failed to sign in');
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-950 via-emerald-950 to-amber-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Sign In</h1>
        <p className="text-sky-100/80 mb-6">Welcome back. Enter your credentials to continue.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">Email Address</label>
            <input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-sky-300/40 focus:border-transparent outline-none transition" required />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">Password</label>
            <input id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-sky-300/40 focus:border-transparent outline-none transition" required minLength={6} />
          </div>
          {error && <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-sm text-red-200">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-white text-sky-900 hover:bg-sky-50 font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
            {loading ? 'Please wait...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-6 text-center text-sm">
          <span className="text-sky-100/80">New here? </span>
          <Link to="/signup" className="text-sky-200 hover:text-white font-medium">Sign up for free</Link>
        </div>
      </div>
    </div>
  );
}
