import { useEffect, useState, type FormEvent } from 'react';
import { Store, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useRouter } from '@/lib/router';
import { fetchAdminsExist } from '@/api/admin';
import { Field, TextInput } from '@/components/ui/FormFields';
import { Notice } from '@/components/ui/PageState';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import type { TranslationKey } from '@/i18n/translations';

export function AdminSignInPage() {
  const { t } = useLanguage();
  const { signIn, status, admin, profileError } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<TranslationKey | null>(null);
  const [loading, setLoading] = useState(false);

  useDocumentMeta({ title: `${t('auth.signIn')} | TRONIX Admin` });

  useEffect(() => {
    if (status === 'signed_in' && admin?.is_active) {
      navigate('/admin');
    }
  }, [status, admin, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // onAuthStateChange will update status; navigate happens via effect
    } catch {
      setError('auth.invalid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
            <Store className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('auth.adminTitle')}</h1>
          <p className="mt-2 text-sm text-slate-400">{t('auth.adminSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-4">
            {error && <Notice tone="error">{t(error)}</Notice>}
            {profileError && !error && <Notice tone="error">{t('auth.noAccess')}</Notice>}
            {status === 'signed_in' && !admin?.is_active && !error && (
              <Notice tone="error">{t('auth.deactivated')}</Notice>
            )}

            <Field label={t('auth.email')} required>
              {(id) => (
                <TextInput
                  id={id}
                  type="email"
                  autoComplete="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              )}
            </Field>

            <Field label={t('auth.password')} required>
              {(id) => (
                <TextInput
                  id={id}
                  type="password"
                  autoComplete="current-password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              )}
            </Field>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('auth.signingIn')}
                </span>
              ) : (
                t('auth.signIn')
              )}
            </button>

            <AdminSetupLink />
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminSetupLink() {
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    fetchAdminsExist()
      .then(setExists)
      .catch(() => setExists(true));
  }, []);

  if (exists !== false) return null;

  return (
    <p className="text-center text-sm">
      <button
        type="button"
        onClick={() => navigate('/admin/setup')}
        className="font-medium text-brand-700 hover:underline"
      >
        {t('auth.setupLink')}
      </button>
    </p>
  );
}
