import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Menu, Phone, Search, ShoppingBag, X } from 'lucide-react';
import { Link, useRouter } from '@/lib/router';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { useCart } from '@/context/CartContext';
import { localized } from '@/lib/format';
import { AnnouncementBar } from '@/components/store/AnnouncementBar';
import { Footer } from '@/components/store/Footer';
import { Logo } from '@/components/store/Logo';

function SearchForm({ onSubmitDone, autoFocus }: { onSubmitDone?: () => void; autoFocus?: boolean }) {
  const { t, lang } = useLanguage();
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : '/shop');
    onSubmitDone?.();
  };

  return (
    <form onSubmit={handleSubmit} role="search" className="relative w-full group">
      <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-steel-400 group-focus-within:text-brand-500" aria-hidden="true" />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={lang === 'ar' ? 'ابحث عن قطع غيار...' : 'Search for spare parts...'}
        aria-label={t('search.button')}
        autoFocus={autoFocus}
        maxLength={80}
        className="w-full rounded-full border-2 border-steel-200 bg-steel-50 py-3 ps-12 pe-28 text-sm font-medium text-steel-900 placeholder:text-steel-400 transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
      />
      <button type="submit" className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded-full bg-steel-900 px-6 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-600">
        {t('search.button')}
      </button>
    </form>
  );
}

function NavLinks({ onNavigate, className = '' }: { onNavigate?: () => void; className?: string }) {
  const { t } = useLanguage();
  const { location } = useRouter();
  const items = [
    { to: '/', label: t('nav.home') },
    { to: '/shop', label: t('nav.shop') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];
  return (
    <nav className={className} aria-label="Main">
      {items.map((item) => {
        const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
              active ? 'text-brand-600' : 'text-steel-700 hover:text-brand-600'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function CategoryStrip() {
  const { lang } = useLanguage();
  const { categories } = useSettings();
  const { location } = useRouter();
  if (categories.length === 0) return null;
  return (
    <div className="border-t border-steel-100 bg-white">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 scrollbar-none sm:px-6 lg:px-8">
        {categories.map((category) => {
          const active = location.pathname === `/category/${category.slug}`;
          return (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              aria-current={active ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                active ? 'border-brand-600 text-brand-600' : 'border-transparent text-steel-600 hover:text-steel-900'
              }`}
            >
              {localized(category, 'name', lang)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function TopBar() {
  const { lang } = useLanguage();
  const { general } = useSettings();
  if (!general.phone && !general.email) return null;
  return (
    <div className="hidden bg-steel-950 py-1.5 text-xs text-steel-300 sm:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {general.phone && (
            <a href={`tel:${general.phone}`} className="flex items-center gap-1.5 transition-colors hover:text-white" dir="ltr">
              <Phone className="h-3 w-3" aria-hidden="true" />
              {general.phone}
            </a>
          )}
        </div>
        <p className="text-steel-400">
          {lang === 'ar' ? 'قطع غيار لابتوب أصلية مع ضمان وتوصيل لكل المحافظات' : 'Genuine laptop spare parts with warranty and nationwide delivery'}
        </p>
      </div>
    </div>
  );
}

function CenterLogo() {
  const { general } = useSettings();
  return (
    <div className="flex shrink-0 flex-col items-center">
      <Link to="/" className="flex items-center" aria-label={general.store_name}>
        {general.logo_url ? (
          <img src={general.logo_url} alt={general.store_name} className="h-9 w-auto" />
        ) : (
          <Logo />
        )}
      </Link>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-steel-400 sm:text-[11px]">
        Powering Your Technology
      </p>
    </div>
  );
}

function Header() {
  const { t, toggleLang } = useLanguage();
  const { count } = useCart();
  const { location } = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  return (
    <header className={`sticky top-0 z-40 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-card' : 'border-b border-steel-200'}`}>
      {/* Main header row: left actions | centered logo | right actions */}
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
        {/* Left side: menu (mobile) + nav (desktop) */}
        <div className="flex flex-1 items-center gap-1">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? t('nav.close') : t('nav.menu')}
            aria-expanded={menuOpen}
            className="rounded-md p-2 text-steel-700 hover:bg-steel-100 lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
          <NavLinks className="hidden items-center gap-1 lg:flex" />
        </div>

        {/* Center: logo + slogan */}
        <CenterLogo />

        {/* Right side: search toggle, lang switch, cart */}
        <div className="flex flex-1 items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            aria-label={t('search.button')}
            className="rounded-md p-2 text-steel-700 hover:bg-steel-100 lg:hidden"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={toggleLang}
            aria-label={t('lang.switch')}
            className="rounded-full border border-steel-300 px-3 py-1.5 text-xs font-bold text-steel-700 transition-colors hover:border-brand-500 hover:text-brand-600"
          >
            {t('lang.switch')}
          </button>
          <Link
            to="/cart"
            aria-label={`${t('nav.cart')} (${count})`}
            className="relative rounded-md p-2 text-steel-700 transition-colors hover:bg-steel-100 hover:text-brand-600"
          >
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            {count > 0 && (
              <span className="absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Desktop search bar - Much larger and prominent */}
      <div className="hidden border-t border-steel-100 px-4 py-3 lg:block bg-white">
        <div className="mx-auto max-w-3xl">
          <SearchForm />
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-steel-100 px-4 py-3 lg:hidden">
          <SearchForm autoFocus onSubmitDone={() => setSearchOpen(false)} />
        </div>
      )}

      {menuOpen && (
        <div className="border-t border-steel-100 bg-white px-4 py-3 lg:hidden">
          <NavLinks className="flex flex-col gap-1" onNavigate={() => setMenuOpen(false)} />
          <Link to="/cart" onClick={() => setMenuOpen(false)} className="mt-1 block rounded-md px-3 py-2 text-sm font-semibold text-steel-700">
            {t('nav.cart')}
          </Link>
        </div>
      )}

      <CategoryStrip />
    </header>
  );
}

export function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopBar />
      <AnnouncementBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}