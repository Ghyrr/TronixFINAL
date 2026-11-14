import { Megaphone } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSettings } from '@/context/SettingsContext';

const SPEED_DURATION: Record<string, string> = {
  slow: '40s',
  normal: '25s',
  fast: '15s',
};

export function AnnouncementBar() {
  const { lang, t } = useLanguage();
  const { general } = useSettings();
  const text = lang === 'ar' ? general.announcement_ar : general.announcement_en;
  if (!general.announcement_enabled) return null;

  const message = text || t('announcement.default');
  const duration = SPEED_DURATION[general.announcement_speed] ?? SPEED_DURATION.normal;

  return (
    <div className="overflow-hidden bg-steel-900 py-2 text-xs font-medium text-white sm:text-sm">
      <div className="marquee-track flex items-center gap-8 whitespace-nowrap" style={{ animationDuration: duration }}>
        <span className="inline-flex shrink-0 items-center gap-2">
          <Megaphone className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" />
          {message}
        </span>
        <span className="inline-flex shrink-0 items-center gap-2" aria-hidden="true">
          <Megaphone className="h-3.5 w-3.5 text-brand-400" />
          {message}
        </span>
        <span className="inline-flex shrink-0 items-center gap-2" aria-hidden="true">
          <Megaphone className="h-3.5 w-3.5 text-brand-400" />
          {message}
        </span>
      </div>
    </div>
  );
}
