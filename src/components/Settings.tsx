import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { user, profile } = useAuth();

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
      <div>
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600">Manage your profile information</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg border">
              {initials}
            </div>
          )}
          <div>
            <div className="text-lg font-semibold text-gray-900">{displayName}</div>
            <div className="text-sm text-gray-600">{email}</div>
            <div className="flex items-center gap-2 mt-1">
              {emailVerified ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-700">Email verified</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-600">Email not verified</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
