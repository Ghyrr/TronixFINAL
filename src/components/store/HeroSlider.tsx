import { useEffect, useState, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useRouter } from '@/lib/router';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Banner } from '@/lib/types';

const AUTO_ADVANCE_MS = 6000;

export function HeroSlider({ banners }: { banners: Banner[] }) {
  const { lang, isRtl } = useLanguage();
  const { navigate } = useRouter();
  const [index, setIndex] = useState(0);
  const [query, setQuery] = useState('');
  const count = banners.length;

  useEffect(() => {
    if (count < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [count]);

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [index, count]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
    else navigate('/shop');
  };

  const defaultBanner = {
    id: 'default',
    image_url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=2000&auto=format&fit=crop',
    title_en: 'Premium Laptop Spare Parts',
    title_ar: 'قطع غيار لابتوب أصلية',
    subtitle_en: 'Genuine batteries, screens, and accessories delivered to your door.',
    subtitle_ar: 'بطاريات وشاشات وإكسسوارات أصلية تصلك حتى باب منزلك.',
    link_url: '/shop'
  };

  const activeBanner = count > 0 ? banners[Math.min(index, count - 1)] : defaultBanner;
  const title = lang === 'ar' ? activeBanner.title_ar : activeBanner.title_en;
  const subtitle = lang === 'ar' ? activeBanner.subtitle_ar : activeBanner.subtitle_en;
  const step = (delta: number) => setIndex((current) => (current + delta + count) % count);
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-3xl bg-steel-950 shadow-2xl sm:h-[550px] lg:h-[600px]">
      <img 
        key={activeBanner.id} 
        src={activeBanner.image_url} 
        alt={title || ''} 
        className="absolute inset-0 h-full w-full object-cover opacity-60 transition-all duration-1000 scale-105" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-steel-950 via-steel-950/60 to-transparent" />
      
      <div className="relative flex h-full flex-col items-center justify-center gap-6 px-4 text-center sm:px-12 lg:px-16">
        {title && <h2 className="max-w-4xl text-4xl font-extrabold leading-tight text-white drop-shadow-xl sm:text-5xl lg:text-6xl tracking-tight">{title}</h2>}
        {subtitle && <p className="max-w-2xl text-base text-steel-100 drop-shadow-md sm:text-lg lg:text-xl font-medium">{subtitle}</p>}
        
        <form onSubmit={handleSearch} className="mt-4 flex w-full max-w-2xl items-center gap-2 rounded-full bg-white p-2 shadow-2xl backdrop-blur-sm bg-white/95">
          <Search className="ms-3 h-6 w-6 text-steel-400" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'ابحث عن بطارية، شاشة، كيبورد...' : 'Search for batteries, screens, keyboards...'}
            className="flex-1 bg-transparent px-2 py-2 text-base text-steel-900 outline-none placeholder:text-steel-400"
          />
          <button type="submit" className="rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-brand-700 hover:shadow-lg">
            {lang === 'ar' ? 'بحث' : 'Search'}
          </button>
        </form>
      </div>

      {count > 1 && (
        <>
          <button type="button" aria-label="Previous" onClick={(e) => { e.preventDefault(); step(-1); }} className="absolute start-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-md transition-all hover:bg-white/40 hover:scale-110">
            <PrevIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Next" onClick={(e) => { e.preventDefault(); step(1); }} className="absolute end-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-md transition-all hover:bg-white/40 hover:scale-110">
            <NextIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="absolute bottom-6 start-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((item, dot) => (
              <button
                key={item.id}
                type="button"
                aria-label={`${dot + 1}`}
                onClick={(e) => { e.preventDefault(); setIndex(dot); }}
                className={`h-2.5 rounded-full transition-all duration-300 ${dot === index ? 'w-10 bg-brand-500' : 'w-2.5 bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}