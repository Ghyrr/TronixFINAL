import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/lib/router';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Banner } from '@/lib/types';

const AUTO_ADVANCE_MS = 6000;

export function HeroSlider({ banners }: { banners: Banner[] }) {
  const { lang, t, isRtl } = useLanguage();
  const [index, setIndex] = useState(0);
  const count = banners.length;

  useEffect(() => {
    if (count < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [count]);

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [index, count]);

  if (count === 0) return null;
  const banner = banners[Math.min(index, count - 1)];
  const title = lang === 'ar' ? banner.title_ar : banner.title_en;
  const subtitle = lang === 'ar' ? banner.subtitle_ar : banner.subtitle_en;
  const step = (delta: number) => setIndex((current) => (current + delta + count) % count);
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  const content = (
    <div className="relative h-[340px] w-full overflow-hidden rounded-2xl bg-steel-950 sm:h-[460px] lg:h-[520px]">
      <img key={banner.id} src={banner.image_url} alt={title || ''} className="absolute inset-0 h-full w-full object-cover opacity-75 transition-opacity duration-700" />
      <div className="absolute inset-0 bg-gradient-to-r from-steel-950/95 via-steel-950/60 to-steel-950/20" />
      <div className="relative flex h-full max-w-2xl flex-col justify-center gap-5 px-6 sm:px-12 lg:px-16">
        {title && <h2 className="text-3xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-4xl lg:text-5xl">{title}</h2>}
        {subtitle && <p className="text-base text-steel-100 drop-shadow sm:text-lg lg:text-xl">{subtitle}</p>}
        <Link to={banner.link_url || '/shop'} className="btn-primary mt-2 w-fit px-7 py-3 text-base">
          {t('home.hero.shopNow')}
        </Link>
      </div>
      {count > 1 && (
        <>
          <button type="button" aria-label="Previous" onClick={(e) => { e.preventDefault(); step(-1); }} className="absolute start-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-steel-800 shadow-lg transition-all hover:bg-white hover:scale-110">
            <PrevIcon className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Next" onClick={(e) => { e.preventDefault(); step(1); }} className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-steel-800 shadow-lg transition-all hover:bg-white hover:scale-110">
            <NextIcon className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="absolute bottom-4 start-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((item, dot) => (
              <button
                key={item.id}
                type="button"
                aria-label={`${dot + 1}`}
                onClick={(e) => { e.preventDefault(); setIndex(dot); }}
                className={`h-2 rounded-full transition-all ${dot === index ? 'w-8 bg-brand-500' : 'w-2 bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  return banner.link_url ? (
    <Link to={banner.link_url} className="block">{content}</Link>
  ) : (
    content
  );
}
