import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Truck, MessageCircle, Wrench, Cpu, Keyboard, Battery, Monitor, Fan, Cable, MemoryStick, HardDrive, Mouse, Speaker, Zap, CircuitBoard } from 'lucide-react';
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

export function HomePage() {
  const { t, lang } = useLanguage();
  const { categories, brands, homepage, general } = useSettings();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [featured, setFeatured] = useState<Section>(EMPTY_SECTION);
  const [bestSellers, setBestSellers] = useState<Section>(EMPTY_SECTION);
  const [latest, setLatest] = useState<Section>(EMPTY_SECTION);

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
    run({ limit: 10, sort: 'newest' }, setLatest);
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

  return (
    <div className="flex flex-col gap-12 pb-16 pt-4 sm:pt-6">
      {/* Hero Slider */}
      {homepage.show_hero && (
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <HeroSlider banners={banners} />
        </div>
      )}

      {/* Feature Bar */}
      <div className="border-y border-steel-200 bg-steel-50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-around gap-4 px-4 py-5 sm:px-6 lg:px-8">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <feature.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-steel-900">{feature.title}</h3>
                <p className="text-xs text-steel-500">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories Showcase */}
      {homepage.show_categories && categories.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={t('home.categories.title')} subtitle={t('home.categories.subtitle')} />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {categories.map((category) => {
              const Icon = CATEGORY_ICONS[category.slug] ?? Cpu;
              return (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-steel-200 bg-white p-4 transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-card sm:p-5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-steel-100 text-steel-600 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600 sm:h-14 sm:w-14">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className="text-center text-xs font-semibold leading-tight text-steel-700 transition-colors group-hover:text-brand-600 sm:text-sm">
                    {localized(category, 'name', lang)}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {homepage.show_featured && (
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={t('home.featured.title')} action={<ViewAllLink to="/shop" />} />
          <ProductGrid products={featured.products} loading={featured.loading} error={featured.error} onRetry={load} emptyMessage={t('common.empty')} />
        </section>
      )}

      {/* Best Sellers */}
      {homepage.show_best_sellers && (
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={t('home.bestSellers.title')} action={<ViewAllLink to="/shop" />} />
          <ProductGrid products={bestSellers.products} loading={bestSellers.loading} error={bestSellers.error} onRetry={load} emptyMessage={t('common.empty')} />
        </section>
      )}

      {/* Brands Strip */}
      {brands.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-steel-200 bg-white p-6">
            <h2 className="mb-5 text-center text-sm font-bold uppercase tracking-wide text-steel-500">
              {lang === 'ar' ? 'الماركات المتاحة' : 'Available Brands'}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {brands.filter((b) => b.is_active).map((brand) => (
                <Link
                  key={brand.id}
                  to={`/brand/${brand.slug}`}
                  className="text-lg font-bold text-steel-400 transition-colors hover:text-steel-700 sm:text-xl"
                >
                  {brand.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Products */}
      {homepage.show_latest && (
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={t('home.latest.title')} action={<ViewAllLink to="/shop" />} />
          <ProductGrid products={latest.products} loading={latest.loading} error={latest.error} onRetry={load} emptyMessage={t('common.empty')} />
        </section>
      )}

      {/* CTA Banner */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="metallic-gradient overflow-hidden rounded-2xl p-8 sm:p-12">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-start">
            <div>
              <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                {lang === 'ar' ? 'محتاج قطعة غيار معينة؟' : 'Looking for a specific part?'}
              </h2>
              <p className="mt-2 text-steel-300">
                {lang === 'ar' ? 'تواصل معنا عبر واتساب وسنساعدك في العثور على ما تحتاجه' : 'Contact us on WhatsApp and we will help you find what you need'}
              </p>
            </div>
            <a
              href={`https://wa.me/${general.whatsapp_number.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-brand-700 hover:shadow-glow active:scale-[0.98]"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              {lang === 'ar' ? 'تواصل عبر واتساب' : 'Contact on WhatsApp'}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
