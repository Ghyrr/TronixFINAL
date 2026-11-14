import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchActiveBrands, fetchActiveCategories, fetchActiveGovernorates, fetchStoreSettings } from '@/api/catalog';
import { DEFAULT_GENERAL_SETTINGS, DEFAULT_HOMEPAGE_SETTINGS } from '@/lib/settingsDefaults';
import type { Brand, Category, GeneralSettings, Governorate, HomepageSettings } from '@/lib/types';

interface SettingsContextValue {
  general: GeneralSettings;
  homepage: HomepageSettings;
  categories: Category[];
  brands: Brand[];
  governorates: Governorate[];
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [general, setGeneral] = useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS);
  const [homepage, setHomepage] = useState<HomepageSettings>(DEFAULT_HOMEPAGE_SETTINGS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, activeCategories, activeBrands, activeGovernorates] = await Promise.all([
        fetchStoreSettings(),
        fetchActiveCategories(),
        fetchActiveBrands(),
        fetchActiveGovernorates(),
      ]);
      setGeneral(settings.general);
      setHomepage(settings.homepage);
      setCategories(activeCategories);
      setBrands(activeBrands);
      setGovernorates(activeGovernorates);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (general.favicon_url) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = general.favicon_url;
    }
  }, [general.favicon_url]);

  const value = useMemo(
    () => ({ general, homepage, categories, brands, governorates, loading, error, refresh }),
    [general, homepage, categories, brands, governorates, loading, error, refresh],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
