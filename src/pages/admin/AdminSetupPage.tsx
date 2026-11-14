import { useEffect, useState, type FormEvent } from 'react';
import { Store, Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useRouter } from '@/lib/router';
import { fetchAdminsExist } from '@/api/admin';
import { bootstrapSuperAdmin, AdminApiError } from '@/api/adminUsers';
import { Field, TextInput } from '@/components/ui/FormFields';
import { Notice } from '@/components/ui/PageState';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import type { TranslationKey } from '@/i18n/translations';

export function AdminSetupPage() {
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null); // Changed to string to show real errors
  const [loading, setLoading] = useState(false);
  const [checkState, setCheckState] = useState<'checking' | 'needs_setup' | 'already_setup'>('checking');

  useDocumentMeta({ title: `${t('auth.setupTitle')} | TRONIX Admin` });

  useEffect(() => {
    fetchAdminsExist()
      .then((exists) => setCheckState(exists ? 'already_setup' : 'needs_setup'))
      .catch(() => setCheckState('needs_setup'));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError(t('checkout.shortName'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.passwordHint'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      await bootstrapSuperAdmin({ email: email.trim(), password, full_name: fullName.trim() });
      navigate('/admin/signin');
    } catch (err: any) {
      console.error("REAL ERROR:", err);
      if (err instanceof AdminApiError && err.code === 'already_initialized') {
        setCheckState('already_setup');
      } else {
        // Show the actual error message from the server or network
        setError(err.message || err.toString() || t('auth.invalid'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkState === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (checkState === 'already_setup') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <Notice tone="info">{t('auth.alreadySetup')}</Notice>
          <button
            type="button"
            onClick={() => navigate('/admin/signin')}
            className="btn-primary mt-6 w-full py-3"
          >
            {t('auth.backToSignIn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
            <Store className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('auth.setupTitle')}</h1>
          <p className="mt-2 text-sm text-slate-400">{t('auth.setupSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-4">
            {error && <Notice tone="error">{error}</Notice>}

            <Field label={t('auth.fullName')} required>
              {(id) => (
                <TextInput
                  id={id}
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoFocus
                />
              )}
            </Field>

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
                />
              )}
            </Field>

            <Field label={t('auth.password')} required hint={t('auth.passwordHint')}>
              {(id) => (
                <TextInput
                  id={id}
                  type="password"
                  autoComplete="new-password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              )}
            </Field>

            <Field label={t('auth.password')} required>
              {(id) => (
                <TextInput
                  id={id}
                  type="password"
                  autoComplete="new-password"
                  dir="ltr"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
                t('auth.createAccount')
              )}
            </button>

            <p className="text-center text-sm">
              <button
                type="button"
                onClick={() => navigate('/admin/signin')}
                className="font-medium text-brand-700 hover:underline"
              >
                {t('auth.backToSignIn')}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}