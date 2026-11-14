import { CheckCircle2, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { Link, useSearchParams } from '@/lib/router';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { whatsappLink } from '@/lib/whatsapp';
import { EmptyState } from '@/components/ui/PageState';

export function OrderSuccessPage() {
  const { t } = useLanguage();
  const { general } = useSettings();
  const [params] = useSearchParams();
  const number = params.get('number');
  const method = params.get('method');

  useDocumentMeta({ title: `${t('success.title')} | TRONIX`, description: t('success.title') });

  if (!number) {
    return <EmptyState message={t('notfound.body')} action={<Link to="/shop" className="btn-primary">{t('product.backToShop')}</Link>} />;
  }

  const whatsappUrl = method === 'whatsapp' ? whatsappLink(general.whatsapp_number, t('checkout.whatsappMessage', { number })) : null;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
      </span>
      <h1 className="text-3xl font-bold text-steel-900">{t('success.title')}</h1>
      <p className="text-steel-600">{t('success.body')}</p>
      <div className="w-full rounded-2xl border border-steel-200 bg-white p-5">
        <p className="text-sm text-steel-500">{t('success.number')}</p>
        <p className="mt-1 font-mono text-xl font-bold tracking-wide text-steel-900" dir="ltr">{number}</p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {t('success.whatsapp')}
          </a>
        )}
        <Link to="/shop" className="btn-secondary">{t('success.keepShopping')}</Link>
      </div>
    </div>
  );
}
