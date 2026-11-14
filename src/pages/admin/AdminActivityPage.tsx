import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { fetchActivityLogs } from '@/api/admin';
import { formatDate } from '@/lib/format';
import { Badge, ErrorState, LoadingState } from '@/components/ui/PageState';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import type { ActivityLog } from '@/lib/types';
import type { TranslationKey } from '@/i18n/translations';

export function AdminActivityPage() {
  const { t, lang } = useLanguage();
  const { admin } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useDocumentMeta({ title: `${t('admin.activity.title')} | TRONIX Admin` });

  useEffect(() => {
    fetchActivityLogs()
      .then((data) => { setLogs(data); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (admin?.role !== 'super_admin') {
    return <div className="py-16 text-center text-slate-500">{t('admin.activity.forbidden')}</div>;
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState />;

  const actionLabel = (action: string): string => {
    const key = `admin.activity.action.${action}` as TranslationKey;
    const val = t(key);
    return val === key ? t('admin.activity.action.other') : val;
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('admin.activity.title')}</h1>

      {logs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">{t('admin.activity.empty')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3 text-start">{t('admin.activity.action')}</th>
                <th className="px-4 py-3 text-start">{t('admin.activity.entity')}</th>
                <th className="px-4 py-3 text-center">{t('common.date')}</th>
                <th className="px-4 py-3 text-start">{t('admin.activity.details')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Badge tone="blue">{actionLabel(log.action)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{log.entity}</td>
                  <td className="px-4 py-3 text-center text-slate-500">{formatDate(log.created_at, lang, true)}</td>
                  <td className="px-4 py-3">
                    <pre className="whitespace-pre-wrap break-all text-xs text-slate-500">
                      {Object.keys(log.details).length > 0 ? JSON.stringify(log.details) : '—'}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
