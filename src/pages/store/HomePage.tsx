import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Truck, MessageCircle, Cpu, Keyboard, Battery, Monitor, Fan, Cable, MemoryStick, HardDrive, Mouse, Speaker, Zap, CircuitBoard, ArrowRight, Wrench } from 'lucide-react';
import { fetchActiveBanners, fetchProducts } from '@/api/catalog';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { Link } from '@/lib/router';
import { localized } from '@/lib/format';
import { HeroSlider } from '@/components/store/HeroSlider';
import { ProductGrid, SectionHeading, ViewAllLink } from '@/components/store/ProductGrid';
import type { Banner, Product } from '@/lib/types';
import { useDocumentMeta } from '@/lib/useDocumentMeta';

interface Section {
  products: Product[] | null;
  loading: boolean;
  error: boolean;
}

const EMPTY_SECTION: Section = { products: null, loading: true, error: false };

const CATEGORY_ICONS: Record<string, typeof Cpu> = {
  'laptop-batteries': Battery,
  'laptop-chargers': Zap,
  'cooling-fans': Fan,
  'keyboards': Keyboard,
  'screens-displays': Monitor,
  'hinges': Wrench,
  'dc-jacks': Zap,
  'cables-connectors': Cable,
  'speakers': Speaker,
  'touchpads': Mouse,
  'motherboards': CircuitBoard,
  'ram-ssd': MemoryStick,
  'laptop-accessories': HardDrive,
};

// RELIABLE BRAND LOGOS (Using SimpleIcons CDN with a grey color)
const BRAND_LOGOS: Record<string, string> = {
  'dell': 'https://cdn.simpleicons.org/dell/94a3b8',
  'hp': 'https://cdn.simpleicons.org/hp/94a3b8',
  'lenovo': 'https://cdn.simpleicons.org/lenovo/94a3b8',
  'asus': 'https://cdn.simpleicons.org/asus/94a3b8',
  'acer': 'https://cdn.simpleicons.org/acer/94a3b8',
  'msi': 'https://cdn.simpleicons.org/msi/94a3b8',
  'toshiba': 'https://cdn.simpleicons.org/toshiba/94a3b8',
};

export function HomePage() {
  const { t, lang } = useLanguage();
  const { categories, brands, homepage, general } = useSettings();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [featured, setFeatured] = useState<Section>(EMPTY_SECTION);
  const [bestSellers, setBestSellers] = useState<Section>(EMPTY_SECTION);

  useDocumentMeta({
    title: `${general.store_name} | ${lang === 'ar' ? 'قطع غيار اللابتوب' : 'Laptop Spare Parts'}`,
    description: lang === 'ar' ? 'قطع غيار وإكسسوارات اللابتوب مع الدفع عند الاستلام.' : 'Laptop spare parts and accessories with cash on delivery.',
  });

  const load = useCallback(() => {
    const run = (query: Parameters<typeof fetchProducts>[0], set: (s: Section) => void) => {
      set({ products: null, loading: true, error: false });
      fetchProducts(query)
        .then((products) => set({ products: products.slice(0, 10), loading: false, error: false }))
        .catch(() => set({ products: null, loading: false, error: true }));
    };
    run({ featuredOnly: true, limit: 10 }, setFeatured);
    run({ bestSellersOnly: true, limit: 10 }, setBestSellers);
  }, []);

  useEffect(() => {
    load();
    fetchActiveBanners().then(setBanners).catch(() => setBanners([]));
  }, [load]);

  const features = [
    { icon: Truck, title: t('home.trust.delivery'), desc: t('home.trust.delivery.desc') },
    { icon: ShieldCheck, title: t('home.trust.original'), desc: t('home.trust.original.desc') },
    { icon: MessageCircle, title: t('home.trust.support'), desc: t('home.trust.support.desc') },
  ];

  const promo1 = banners.length >= 2 ? banners[1] : null;
  const promo2 = banners.length >= 3 ? banners[2] : null;

  return (
    <div className="flex flex-col gap-16 pb-16 pt-4 sm:pt-6">
      
      {homepage.show_hero && (
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <HeroSlider banners={banners} />
        </div>
      )}

      <div className="border-y border-steel-200 bg-steel-50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-around gap-6 px-4 py-6 sm:px-6 lg:px-8">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm border border-steel-100">
                <feature.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-bold text-steel-900">{feature.title}</h3>
                <p className="text-sm text-steel-500">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {homepage.show_categories && categories.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={lang === 'ar' ? 'تسوق حسب القسم' : 'Shop by Category'} subtitle={lang === 'ar' ? 'كل ما تحتاجه لصيانة اللابتوب' : 'Everything you need for your laptop'} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.map((category) => {
              const Icon = CATEGORY_ICONS[category.slug] ?? Cpu;
              const hasImage = !!((category as unknown) as { image_url?: string }).image_url; 
              
              return (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="group relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-steel-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg"
                >
                  {hasImage ? (
                    <img src={((category as unknown) as { image_url?: string }).image_url} alt={localized(category, 'name', lang)} className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-steel-50 text-steel-600 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
                      <Icon className="h-8 w-8" aria-hidden="true" />
                    </div>
                  )}
                  <span className="text-center text-sm font-bold leading-tight text-steel-800 transition-colors group-hover:text-brand-600">
                    {localized(category, 'name', lang)}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Link to={promo1?.link_url || "/shop"} className="group relative flex h-64 items-center overflow-hidden rounded-3xl bg-brand-900 px-8 shadow-xl">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 transition-transform duration-700 group-hover:scale-110" />
            <div className="relative z-10 flex flex-col items-start gap-4">
              <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
                {promo1 ? (lang === 'ar' ? promo1.title_ar : promo1.title_en) : 'Black Friday Deals'}
              </span>
              <h3 className="text-3xl font-black text-white leading-tight">
                {promo1 ? (lang === 'ar' ? promo1.subtitle_ar : promo1.subtitle_en) : 'Up to 40% Off Laptop Batteries'}
              </h3>
              <span className="flex items-center gap-2 text-sm font-bold text-white transition-transform group-hover:translate-x-2">
                {lang === 'ar' ? 'تسوق الآن' : 'Shop Now'} <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
          
          <Link to={promo2?.link_url || "/shop"} className="group relative flex h-64 items-center overflow-hidden rounded-3xl bg-steel-900 px-8 shadow-xl">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1588702547919-26089e690ecc?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 transition-transform duration-700 group-hover:scale-110" />
            <div className="relative z-10 flex flex-col items-start gap-4">
              <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
                {promo2 ? (lang === 'ar' ? promo2.title_ar : promo2.title_en) : 'New Arrivals'}
              </span>
              <h3 className="text-3xl font-black text-white leading-tight">
                {promo2 ? (lang === 'ar' ? promo2.subtitle_ar : promo2.subtitle_en) : 'Premium Keyboards & Accessories'}
              </h3>
              <span className="flex items-center gap-2 text-sm font-bold text-white transition-transform group-hover:translate-x-2">
                {lang === 'ar' ? 'اكتشف المزيد' : 'Explore Collection'} <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {homepage.show_featured && (
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={t('home.featured.title')} action={<ViewAllLink to="/shop" />} />
          <ProductGrid products={featured.products} loading={featured.loading} error={featured.error} onRetry={load} emptyMessage={t('common.empty')} />
        </section>
      )}

      {brands.length > 0 && (
        <section className="border-y border-steel-200 bg-steel-50 py-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-10 text-center text-sm font-bold uppercase tracking-[0.2em] text-steel-400">
              {lang === 'ar' ? 'نوفر جميع قطع غيار الماركات العالمية' : 'We supply all parts for top brands'}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
              {brands.filter((b) => b.is_active && b.name.toLowerCase() !== 'apple').map((brand) => {
                
                const uploadedLogo = ((brand as unknown) as { image_url?: string }).image_url;
                const fallbackLogo = BRAND_LOGOS[brand.name.toLowerCase()];
                const logoSrc = uploadedLogo || fallbackLogo;

                return (
                  <Link
                    key={brand.id}
                    to={`/brand/${brand.slug}`}
                    className="grayscale transition-all duration-300 hover:grayscale-0 hover:scale-110 opacity-60 hover:opacity-100 flex items-center justify-center min-w-[80px]"
                  >
                    {logoSrc ? (
                      <img 
                        src={logoSrc} 
                        alt={brand.name} 
                        className="h-8 w-auto object-contain md:h-10" 
                        // If the image fails to load, hide it and show text instead
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const span = document.createElement('span');
                          span.className = 'text-3xl font-black text-steel-800 tracking-tighter';
                          span.innerText = brand.name;
                          e.currentTarget.parentElement?.appendChild(span);
                        }}
                      />
                    ) : (
                      <span className="text-3xl font-black text-steel-800 tracking-tighter">{brand.name}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {homepage.show_best_sellers && (
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={t('home.bestSellers.title')} action={<ViewAllLink to="/shop" />} />
          <ProductGrid products={bestSellers.products} loading={bestSellers.loading} error={bestSellers.error} onRetry={load} emptyMessage={t('common.empty')} />
        </section>
      )}
      
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="metallic-gradient overflow-hidden rounded-3xl p-10 sm:p-14 shadow-2xl">
          <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:justify-between sm:text-start">
            <div>
              <h2 className="text-3xl font-black text-white sm:text-4xl">
                {lang === 'ar' ? 'محتاج قطعة غيار معينة؟' : 'Looking for a specific part?'}
              </h2>
              <p className="mt-3 text-lg text-steel-300 font-medium">
                {lang === 'ar' ? 'تواصل معنا عبر واتساب وسنساعدك في العثور على ما تحتاجه' : 'Contact us on WhatsApp and we will help you find what you need'}
              </p>
            </div>
            <a
              href={`https://wa.me/${general.whatsapp_number.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-2xl bg-brand-600 px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:bg-brand-500 hover:scale-105 active:scale-95"
            >
              <MessageCircle className="h-6 w-6" aria-hidden="true" />
              {lang === 'ar' ? 'تواصل عبر واتساب' : 'Contact on WhatsApp'}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}