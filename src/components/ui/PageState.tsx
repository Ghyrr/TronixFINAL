import { AlertTriangle, Loader2, PackageOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function LoadingState({ label }: { label?: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500" role="status">
      <Spinner />
      <span className="text-sm">{label ?? t('common.loading')}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center" role="alert">
      <AlertTriangle className="h-10 w-10 text-brand-600" aria-hidden="true" />
      <p className="text-sm text-slate-700">{message ?? t('common.error')}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary">
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <PackageOpen className="h-10 w-10 text-slate-300" aria-hidden="true" />
      <p className="text-sm text-slate-500">{message}</p>
      {action}
    </div>
  );
}

export function Notice({ tone, children }: { tone: 'error' | 'success' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'border-brand-200 bg-brand-50 text-brand-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-slate-200 bg-slate-50 text-slate-700',
  };
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${styles[tone]}`}>
      {children}
    </div>
  );
}

export function Badge({ tone, children }: { tone: 'red' | 'green' | 'amber' | 'slate' | 'blue'; children: ReactNode }) {
  const styles = {
    red: 'bg-brand-50 text-brand-700 ring-brand-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[tone]}`}>
      {children}
    </span>
  );
}
