import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Link } from '@/lib/router';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { localized } from '@/lib/format';
import { Logo } from '@/components/store/Logo';

function whatsappHref(number: string): string {
  return `https://wa.me/${number.replace(/\D/g, '')}`;
}

export function Footer() {
  const { t, lang } = useLanguage();
  const { general, categories } = useSettings();
  const whatsapp = general.whatsapp_number.replace(/\D/g, '');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-steel-800 bg-steel-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="flex flex-col gap-4">
          <Logo light />
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-brand-400">
            Powering Your Technology
          </p>
          <p className="max-w-xs text-sm leading-relaxed text-steel-400">
            {lang === 'ar'
              ? 'قطع غيار وإكسسوارات لأجهزة اللابتوب بجودة موثوقة وتوصيل لجميع أنحاء البلاد.'
              : 'Laptop spare parts and accessories with dependable quality and nationwide delivery.'}
          </p>
          <div className="flex items-center gap-3 text-steel-400">
            {general.social.facebook && (
              <a href={general.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-full p-2 transition-colors hover:bg-steel-800 hover:text-white">
                <Facebook className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            {general.social.instagram && (
              <a href={general.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full p-2 transition-colors hover:bg-steel-800 hover:text-white">
                <Instagram className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            {whatsapp && (
              <a href={whatsappHref(whatsapp)} target="_blank" rel="noopener noreferrer" aria-label={t('footer.whatsapp')} className="rounded-full p-2 transition-colors hover:bg-steel-800 hover:text-white">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white">{t('footer.shop')}</h3>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm text-steel-400">
            {categories.slice(0, 6).map((category) => (
              <li key={category.id}>
                <Link to={`/category/${category.slug}`} className="transition-colors hover:text-brand-400">
                  {localized(category, 'name', lang)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white">{t('footer.company')}</h3>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm text-steel-400">
            <li><Link to="/about" className="transition-colors hover:text-brand-400">{t('nav.about')}</Link></li>
            <li><Link to="/contact" className="transition-colors hover:text-brand-400">{t('nav.contact')}</Link></li>
            <li><Link to="/privacy" className="transition-colors hover:text-brand-400">{t('footer.privacy')}</Link></li>
            <li><Link to="/terms" className="transition-colors hover:text-brand-400">{t('footer.terms')}</Link></li>
            <li><Link to="/returns" className="transition-colors hover:text-brand-400">{t('footer.returns')}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white">{t('footer.contact')}</h3>
          <ul className="mt-4 flex flex-col gap-3 text-sm text-steel-400">
            {general.phone && (
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />
                <a href={`tel:${general.phone}`} dir="ltr" className="transition-colors hover:text-white">{general.phone}</a>
              </li>
            )}
            {general.email && (
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />
                <a href={`mailto:${general.email}`} className="break-all transition-colors hover:text-white">{general.email}</a>
              </li>
            )}
            {(lang === 'ar' ? general.address_ar : general.address_en) && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />
                <span>{lang === 'ar' ? general.address_ar : general.address_en}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-steel-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-steel-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {year} {t('brand.name')}. {t('footer.rights')}</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-brand-400">{t('footer.privacy')}</Link>
            <Link to="/terms" className="hover:text-brand-400">{t('footer.terms')}</Link>
            <Link to="/returns" className="hover:text-brand-400">{t('footer.returns')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
