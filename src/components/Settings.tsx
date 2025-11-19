import { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const { user, profile, updateDisplayName } = useAuth();
  const [name, setName] = useState<string>(profile?.username || (user as any)?.user_metadata?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [verified, setVerified] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const displayName = profile?.username || (user as any)?.user_metadata?.full_name || 'User';
  const email = user?.email || '—';
  const emailVerified = Boolean(
    (user as any)?.email_confirmed_at ||
    (user as any)?.confirmed_at ||
    (user as any)?.user_metadata?.email_verified
  );

  const avatarUrl = (profile as any)?.avatar_url || (user as any)?.user_metadata?.avatar_url || '';
  const initials = (displayName || email || 'U')
    .split(' ')
    .map((s: string) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-white/30" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-sm border border-white/30">
            {initials}
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-white leading-tight">Profile</h2>
          <p className="text-sky-100/80">Manage your user profile and preferences</p>
        </div>
      </div>

      <main className="space-y-6">
        <section className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Preferences</h3>
          </div>
          <div className="p-6">
            <div className="max-w-xl">
              <label className="block text-sm text-white/80 mb-2">Display name</label>
              <input
                type="text"
                value={name}
                onChange={(e)=>setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-sky-300/40 focus:border-transparent outline-none"
              />
              <div className="mt-3 flex items-center gap-3">
                <button
                  disabled={saving || !name.trim()}
                  onClick={async()=>{
                    setMsg(null); setSaving(true);
                    const { error } = await updateDisplayName(name.trim());
                    if (error) { setMsg({type:'error', text: error.message || 'Failed to update'}); }
                    else { setMsg({type:'success', text: 'Display name updated'}); }
                    setSaving(false);
                  }}
                  className="px-4 py-2 rounded-md bg-white text-sky-900 hover:bg-sky-50 font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Update display name'}
                </button>
                {msg && (
                  <span className={msg.type==='success' ? 'text-green-200 text-sm' : 'text-red-200 text-sm'}>
                    {msg.text}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Email addresses</h3>
            <p className="text-sm text-white/70">Your email status</p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-white/70">
                    <th className="py-2 pr-4">Email address</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Primary</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-white/90">
                    <td className="py-2 pr-4">{email}</td>
                    <td className="py-2 pr-4">
                      {emailVerified ? (
                        <span className="inline-flex items-center gap-1 text-green-200">
                          <CheckCircle2 className="w-4 h-4" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-white/70">
                          <AlertCircle className="w-4 h-4" /> Not verified
                        </span>
                      )}
                    </td>
                    <td className="py-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-sky-300 align-middle" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-6 max-w-xl space-y-3">
              <label className="block text-sm text-white/80">Add new email (will become your login email after verification)</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e)=>{ setNewEmail(e.target.value); setEmailMsg(null); }}
                  placeholder="name@example.com"
                  className="flex-1 px-4 py-3 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-sky-300/40 focus:border-transparent outline-none"
                />
                <button
                  disabled={sending || !newEmail.trim()}
                  onClick={async()=>{
                    setEmailMsg(null); setSending(true);
                    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
                    if (error) setEmailMsg({ type:'error', text: error.message || 'Failed to send verification' });
                    else setEmailMsg({ type:'success', text: 'Verification email sent. Please check your inbox and confirm.' });
                    setSending(false);
                  }}
                  className="px-4 py-2 rounded-md bg-white text-sky-900 hover:bg-sky-50 font-medium disabled:opacity-50"
                >
                  {sending ? 'Sending…' : 'Send verification'}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async()=>{
                    setChecking(true);
                    const { data } = await supabase.auth.getUser();
                    // Verified if current session user email equals newEmail
                    const isVerified = (data?.user?.email || '') === newEmail.trim();
                    setVerified(isVerified);
                    setChecking(false);
                    setEmailMsg({ type: isVerified ? 'success' : 'error', text: isVerified ? 'Email is verified' : 'Not verified yet' });
                  }}
                  className="px-3 py-2 rounded-md bg-white/10 text-white hover:bg-white/20 border border-white/20"
                >
                  {checking ? 'Checking…' : 'Refresh status'}
                </button>
                {emailMsg && (
                  <span className={emailMsg.type==='success' ? 'text-green-200 text-sm' : 'text-red-200 text-sm'}>
                    {emailMsg.text}
                  </span>
                )}
              </div>
              {verified && (
                <div className="flex items-center gap-2 text-green-200 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Verified
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
