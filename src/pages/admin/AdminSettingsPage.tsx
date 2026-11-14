import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Upload, X, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import {
  fetchSettingsRow,
  saveSettings,
  fetchAllBanners,
  fetchAllCategories,
  fetchAllBrands,
  fetchAllGovernorates,
  saveBanner,
  deleteBanner,
  saveCategory,
  deleteCategory,
  saveBrand,
  deleteBrand,
  saveGovernorate,
  deleteGovernorate,
  type BannerInput,
  type TaxonomyInput,
  type GovernorateInput,
} from '@/api/admin';
import { uploadStoreImage, UploadError } from '@/api/storage';
import { slugify } from '@/lib/format';
import { Field, TextInput, TextArea, SelectInput } from '@/components/ui/FormFields';
import { Badge, LoadingState, Notice } from '@/components/ui/PageState';
import { useToast } from '@/components/ui/Toast';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import type { Banner, Category, Brand, Governorate, GeneralSettings, HomepageSettings } from '@/lib/types';

type Tab = 'general' | 'homepage' | 'banners' | 'categories' | 'brands' | 'shipping';

export function AdminSettingsPage() {
  const { t } = useLanguage();
  const { can } = useAuth();
  const { refresh } = useSettings();
  const { notify } = useToast();
  const [tab, setTab] = useState<Tab>('general');

  useDocumentMeta({ title: `${t('admin.settings.title')} | TRONIX Admin` });

  if (!can('settings')) {
    return <div className="py-16 text-center text-slate-500">{t('admin.noPermission')}</div>;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: t('admin.settings.tab.general') },
    { id: 'homepage', label: t('admin.settings.tab.homepage') },
    { id: 'banners', label: t('admin.settings.tab.banners') },
    { id: 'categories', label: t('admin.settings.tab.categories') },
    { id: 'brands', label: t('admin.settings.tab.brands') },
    { id: 'shipping', label: t('admin.settings.tab.shipping') },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('admin.settings.title')}</h1>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === item.id ? 'bg-brand-600 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'general' && <GeneralTab onSaved={refresh} notify={notify} />}
      {tab === 'homepage' && <HomepageTab onSaved={refresh} notify={notify} />}
      {tab === 'banners' && <BannersTab notify={notify} />}
      {tab === 'categories' && <CategoriesTab notify={notify} />}
      {tab === 'brands' && <BrandsTab notify={notify} />}
      {tab === 'shipping' && <ShippingTab onSaved={refresh} notify={notify} />}
    </div>
  );
}

type NotifyFn = (tone: 'success' | 'error', message: string) => void;

/* ---------- General tab ---------- */
function GeneralTab({ onSaved, notify }: { onSaved: () => Promise<void>; notify: NotifyFn }) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettingsRow('general')
      .then((data) => {
        if (data) setSettings(data as unknown as GeneralSettings);
        else setSettings({ store_name: '', logo_url: '', favicon_url: '', phone: '', whatsapp_number: '', email: '', address_en: '', address_ar: '', social: { facebook: '', instagram: '', tiktok: '', x: '' }, currency_code: 'EGP', delivery_fee: 0, free_delivery_threshold: 0, announcement_enabled: false, announcement_en: '', announcement_ar: '', announcement_speed: 'normal' });
      })
      .catch(() => notify('error', t('common.error')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (!settings) return <Notice tone="error">{t('common.error')}</Notice>;

  const update = <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) =>
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));

  const updateSocial = (key: keyof GeneralSettings['social'], value: string) =>
    setSettings((prev) => (prev ? { ...prev, social: { ...prev.social, [key]: value } } : prev));

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveSettings('general', settings);
      await onSaved();
      notify('success', t('admin.settings.saved'));
    } catch {
      notify('error', t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File, field: 'logo_url' | 'favicon_url') => {
    try {
      const url = await uploadStoreImage(file, 'settings');
      update(field, url);
      notify('success', t('common.saved'));
    } catch (err) {
      if (err instanceof UploadError) {
        notify('error', err.code === 'size' ? t('admin.products.imageTooLarge') : t('admin.products.imageType'));
      } else {
        notify('error', t('common.error'));
      }
    }
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('admin.settings.storeName')}>
          {(id) => <TextInput id={id} value={settings.store_name} onChange={(e) => update('store_name', e.target.value)} />}
        </Field>
        <Field label={t('admin.settings.currency')}>
          {(id) => <TextInput id={id} value={settings.currency_code} onChange={(e) => update('currency_code', e.target.value)} dir="ltr" placeholder="EGP" />}
        </Field>
        <Field label={t('admin.settings.phone')}>
          {(id) => <TextInput id={id} value={settings.phone} onChange={(e) => update('phone', e.target.value)} dir="ltr" />}
        </Field>
        <Field label={t('admin.settings.whatsapp')}>
          {(id) => <TextInput id={id} value={settings.whatsapp_number} onChange={(e) => update('whatsapp_number', e.target.value)} dir="ltr" placeholder="201234567890" />}
        </Field>
        <Field label={t('admin.settings.email')}>
          {(id) => <TextInput id={id} type="email" value={settings.email} onChange={(e) => update('email', e.target.value)} dir="ltr" />}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('admin.settings.logo')}>
            {(id) => (
              <div className="flex items-center gap-3">
                {settings.logo_url && <img src={settings.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                <label className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  <Upload className="me-1 inline h-3.5 w-3.5" />
                  {t('common.upload')}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0], 'logo_url')} />
                </label>
                {settings.logo_url && (
                  <button type="button" onClick={() => update('logo_url', '')} className="text-slate-400 hover:text-brand-700"><X className="h-4 w-4" /></button>
                )}
              </div>
            )}
          </Field>
          <Field label={t('admin.settings.favicon')}>
            {(id) => (
              <div className="flex items-center gap-3">
                {settings.favicon_url && <img src={settings.favicon_url} alt="" className="h-8 w-8 rounded object-cover" />}
                <label className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  <Upload className="me-1 inline h-3.5 w-3.5" />
                  {t('common.upload')}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0], 'favicon_url')} />
                </label>
                {settings.favicon_url && (
                  <button type="button" onClick={() => update('favicon_url', '')} className="text-slate-400 hover:text-brand-700"><X className="h-4 w-4" /></button>
                )}
              </div>
            )}
          </Field>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('admin.settings.addressEn')}>
          {(id) => <TextArea id={id} rows={2} value={settings.address_en} onChange={(e) => update('address_en', e.target.value)} />}
        </Field>
        <Field label={t('admin.settings.addressAr')}>
          {(id) => <TextArea id={id} rows={2} value={settings.address_ar} onChange={(e) => update('address_ar', e.target.value)} dir="rtl" />}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Facebook">
          {(id) => <TextInput id={id} value={settings.social.facebook} onChange={(e) => updateSocial('facebook', e.target.value)} dir="ltr" />}
        </Field>
        <Field label="Instagram">
          {(id) => <TextInput id={id} value={settings.social.instagram} onChange={(e) => updateSocial('instagram', e.target.value)} dir="ltr" />}
        </Field>
        <Field label="TikTok">
          {(id) => <TextInput id={id} value={settings.social.tiktok} onChange={(e) => updateSocial('tiktok', e.target.value)} dir="ltr" />}
        </Field>
        <Field label="X">
          {(id) => <TextInput id={id} value={settings.social.x} onChange={(e) => updateSocial('x', e.target.value)} dir="ltr" />}
        </Field>
      </div>

      {/* Announcement bar section */}
      <div className="rounded-lg border border-slate-200 p-4">
        <h3 className="mb-4 text-sm font-bold text-slate-900">{t('admin.settings.announcement')}</h3>
        <div className="flex flex-col gap-4">
          <ToggleRow label={t('admin.settings.announcementOn')} checked={settings.announcement_enabled} onChange={(v) => update('announcement_enabled', v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('admin.settings.announcementEn')}>
              {(id) => <TextInput id={id} value={settings.announcement_en} onChange={(e) => update('announcement_en', e.target.value)} dir="ltr" />}
            </Field>
            <Field label={t('admin.settings.announcementAr')}>
              {(id) => <TextInput id={id} value={settings.announcement_ar} onChange={(e) => update('announcement_ar', e.target.value)} dir="rtl" />}
            </Field>
          </div>
          <Field label={t('admin.settings.announcementSpeed')}>
            {(id) => (
              <SelectInput id={id} value={settings.announcement_speed} onChange={(e) => update('announcement_speed', e.target.value as GeneralSettings['announcement_speed'])}>
                <option value="slow">{t('admin.settings.announcementSpeed.slow')}</option>
                <option value="normal">{t('admin.settings.announcementSpeed.normal')}</option>
                <option value="fast">{t('admin.settings.announcementSpeed.fast')}</option>
              </SelectInput>
            )}
          </Field>
        </div>
      </div>

      {/* Shipping defaults */}
      <div className="rounded-lg border border-slate-200 p-4">
        <h3 className="mb-4 text-sm font-bold text-slate-900">{t('admin.settings.tab.shipping')}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('admin.settings.deliveryFee')} hint={t('admin.settings.defaultDeliveryHelp')}>
            {(id) => <TextInput id={id} type="number" step="0.01" min="0" value={String(settings.delivery_fee)} onChange={(e) => update('delivery_fee', parseFloat(e.target.value) || 0)} dir="ltr" />}
          </Field>
          <Field label={t('admin.settings.freeThreshold')}>
            {(id) => <TextInput id={id} type="number" step="0.01" min="0" value={String(settings.free_delivery_threshold)} onChange={(e) => update('free_delivery_threshold', parseFloat(e.target.value) || 0)} dir="ltr" />}
          </Field>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary">
          <Save className="h-4 w-4" />
          {saving ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </form>
  );
}

/* ---------- Homepage tab ---------- */
function HomepageTab({ onSaved, notify }: { onSaved: () => Promise<void>; notify: NotifyFn }) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettingsRow('homepage')
      .then((data) => setSettings((data as unknown as HomepageSettings) ?? { show_hero: true, show_categories: true, show_featured: true, show_best_sellers: true, show_latest: true }))
      .catch(() => notify('error', t('common.error')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (!settings) return <Notice tone="error">{t('common.error')}</Notice>;

  const update = <K extends keyof HomepageSettings>(key: K, value: HomepageSettings[K]) =>
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveSettings('homepage', settings);
      await onSaved();
      notify('success', t('admin.settings.saved'));
    } catch {
      notify('error', t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const sections: { key: keyof HomepageSettings; label: string }[] = [
    { key: 'show_hero', label: t('admin.settings.showHero') },
    { key: 'show_categories', label: t('admin.settings.showCategories') },
    { key: 'show_featured', label: t('admin.settings.showFeatured') },
    { key: 'show_best_sellers', label: t('admin.settings.showBest') },
    { key: 'show_latest', label: t('admin.settings.showLatest') },
  ];

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-sm font-bold text-slate-900">{t('admin.settings.homeSections')}</h2>
      {sections.map((section) => (
        <ToggleRow key={section.key} label={section.label} checked={settings[section.key]} onChange={(v) => update(section.key, v)} />
      ))}
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary">
          <Save className="h-4 w-4" />
          {saving ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </form>
  );
}

/* ---------- Banners tab ---------- */
function BannersTab({ notify }: { notify: NotifyFn }) {
  const { t } = useLanguage();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setBanners(await fetchAllBanners()); } catch { notify('error', t('common.error')); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const handleSave = async (input: BannerInput, id?: string) => {
    try {
      await saveBanner(input, id);
      await load();
      notify('success', t('admin.banners.saved'));
      setShowForm(false);
      setEditing(null);
    } catch { notify('error', t('common.error')); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;
    try { await deleteBanner(id); await load(); notify('success', t('admin.banners.deleted')); }
    catch { notify('error', t('common.error')); }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary self-start">
        <Plus className="h-4 w-4" />
        {t('admin.banners.new')}
      </button>

      {showForm && <BannerForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />}

      {banners.length === 0 && !showForm ? (
        <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-500">{t('admin.banners.empty')}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => (
            <div key={banner.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {banner.image_url && <img src={banner.image_url} alt="" className="h-32 w-full object-cover" />}
              <div className="p-4">
                <p className="font-semibold text-slate-900">{banner.title_en || banner.title_ar}</p>
                <p className="text-xs text-slate-500">{banner.subtitle_en || banner.subtitle_ar}</p>
                <div className="mt-2 flex items-center justify-between">
                  <Badge tone={banner.is_active ? 'green' : 'slate'}>{banner.is_active ? t('common.active') : t('common.inactive')}</Badge>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => { setEditing(banner); setShowForm(true); }} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100">✏</button>
                    <button type="button" onClick={() => handleDelete(banner.id)} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-brand-700"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BannerForm({ initial, onSave, onCancel }: { initial: Banner | null; onSave: (input: BannerInput, id?: string) => void; onCancel: () => void }) {
  const { t } = useLanguage();
  const { notify } = useToast();
  const [titleEn, setTitleEn] = useState(initial?.title_en ?? '');
  const [titleAr, setTitleAr] = useState(initial?.title_ar ?? '');
  const [subEn, setSubEn] = useState(initial?.subtitle_en ?? '');
  const [subAr, setSubAr] = useState(initial?.subtitle_ar ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '');
  const [linkUrl, setLinkUrl] = useState(initial?.link_url ?? '');
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadStoreImage(file, 'banners');
      setImageUrl(url);
    } catch (err) {
      if (err instanceof UploadError) notify('error', err.code === 'size' ? t('admin.products.imageTooLarge') : t('admin.products.imageType'));
      else notify('error', t('common.error'));
    } finally { setUploading(false); }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({ title_en: titleEn, title_ar: titleAr, subtitle_en: subEn, subtitle_ar: subAr, image_url: imageUrl, link_url: linkUrl, sort_order: initial?.sort_order ?? 0, is_active: isActive }, initial?.id);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('admin.banners.titleEn')}>
          {(id) => <TextInput id={id} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} dir="ltr" />}
        </Field>
        <Field label={t('admin.banners.titleAr')}>
          {(id) => <TextInput id={id} value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl" />}
        </Field>
        <Field label={t('admin.banners.subEn')}>
          {(id) => <TextInput id={id} value={subEn} onChange={(e) => setSubEn(e.target.value)} dir="ltr" />}
        </Field>
        <Field label={t('admin.banners.subAr')}>
          {(id) => <TextInput id={id} value={subAr} onChange={(e) => setSubAr(e.target.value)} dir="rtl" />}
        </Field>
        <Field label={t('admin.banners.link')}>
          {(id) => <TextInput id={id} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} dir="ltr" placeholder="/shop" />}
        </Field>
        <ToggleRow label={t('common.active')} checked={isActive} onChange={setIsActive} />
      </div>
      <Field label={t('admin.banners.image')}>
        {(id) => (
          <div id={id} className="flex items-center gap-3">
            {imageUrl && <img src={imageUrl} alt="" className="h-16 w-24 rounded-lg object-cover" />}
            <label className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
              {uploading ? t('admin.products.uploading') : t('common.upload')}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            </label>
            {imageUrl && <button type="button" onClick={() => setImageUrl('')} className="text-slate-400 hover:text-brand-700"><X className="h-4 w-4" /></button>}
          </div>
        )}
      </Field>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary">{t('common.cancel')}</button>
        <button type="submit" className="btn-primary">{t('common.save')}</button>
      </div>
    </form>
  );
}

/* ---------- Categories tab ---------- */
function CategoriesTab({ notify }: { notify: NotifyFn }) {
  const { t } = useLanguage();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [slug, setSlug] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try { setItems(await fetchAllCategories()); } catch { notify('error', t('common.error')); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameAr.trim()) return;
    try {
      await saveCategory({ slug: slug || slugify(nameEn), name_en: nameEn, name_ar: nameAr, sort_order: 0, is_active: true }, editingId ?? undefined);
      notify('success', t('admin.categories.saved'));
      setNameEn(''); setNameAr(''); setSlug(''); setEditingId(null);
      await load();
    } catch { notify('error', t('common.error')); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;
    try { await deleteCategory(id); await load(); notify('success', t('admin.categories.deleted')); }
    catch (err) {
      const msg = err instanceof Error ? err.message : '';
      notify('error', msg.includes('foreign') ? t('admin.categories.inUse') : t('common.error'));
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setNameEn(cat.name_en); setNameAr(cat.name_ar); setSlug(cat.slug);
  };

  if (loading) return <LoadingState />;

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <TextInput value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder={t('common.english')} dir="ltr" className="flex-1 min-w-[120px]" />
        <TextInput value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder={t('common.arabic')} dir="rtl" className="flex-1 min-w-[120px]" />
        <TextInput value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={t('admin.categories.slug')} dir="ltr" className="w-32" />
        <button type="submit" className="btn-primary">{editingId ? t('common.save') : t('admin.categories.new')}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setNameEn(''); setNameAr(''); setSlug(''); }} className="btn-secondary">{t('common.cancel')}</button>}
      </form>

      <p className="text-xs text-slate-500">{t('admin.categories.hidden')}</p>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
            <tr><th className="px-4 py-3 text-start">EN</th><th className="px-4 py-3 text-start">AR</th><th className="px-4 py-3 text-start">Slug</th><th className="px-4 py-3 text-center">{t('common.status')}</th><th className="px-4 py-3 text-end">{t('common.actions')}</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{cat.name_en}</td>
                <td className="px-4 py-3 text-slate-700" dir="rtl">{cat.name_ar}</td>
                <td className="px-4 py-3 text-xs text-slate-500" dir="ltr">{cat.slug}</td>
                <td className="px-4 py-3 text-center"><Badge tone={cat.is_active ? 'green' : 'slate'}>{cat.is_active ? t('common.active') : t('common.inactive')}</Badge></td>
                <td className="px-4 py-3 text-end">
                  <button type="button" onClick={() => startEdit(cat)} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100">✏</button>
                  <button type="button" onClick={() => handleDelete(cat.id)} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-brand-700"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Brands tab ---------- */
function BrandsTab({ notify }: { notify: NotifyFn }) {
  const { t } = useLanguage();
  const [items, setItems] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try { setItems(await fetchAllBrands()); } catch { notify('error', t('common.error')); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await saveBrand({ slug: slug || slugify(name), name, sort_order: 0, is_active: true }, editingId ?? undefined);
      notify('success', t('admin.brands.saved'));
      setName(''); setSlug(''); setEditingId(null);
      await load();
    } catch { notify('error', t('common.error')); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;
    try { await deleteBrand(id); await load(); notify('success', t('admin.brands.deleted')); }
    catch (err) {
      const msg = err instanceof Error ? err.message : '';
      notify('error', msg.includes('foreign') ? t('admin.brands.inUse') : t('common.error'));
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder={t('common.name')} className="flex-1 min-w-[120px]" />
        <TextInput value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={t('admin.categories.slug')} dir="ltr" className="w-32" />
        <button type="submit" className="btn-primary">{editingId ? t('common.save') : t('admin.brands.new')}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setName(''); setSlug(''); }} className="btn-secondary">{t('common.cancel')}</button>}
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
            <tr><th className="px-4 py-3 text-start">{t('common.name')}</th><th className="px-4 py-3 text-start">Slug</th><th className="px-4 py-3 text-center">{t('common.status')}</th><th className="px-4 py-3 text-end">{t('common.actions')}</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((brand) => (
              <tr key={brand.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{brand.name}</td>
                <td className="px-4 py-3 text-xs text-slate-500" dir="ltr">{brand.slug}</td>
                <td className="px-4 py-3 text-center"><Badge tone={brand.is_active ? 'green' : 'slate'}>{brand.is_active ? t('common.active') : t('common.inactive')}</Badge></td>
                <td className="px-4 py-3 text-end">
                  <button type="button" onClick={() => { setEditingId(brand.id); setName(brand.name); setSlug(brand.slug); }} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100">✏</button>
                  <button type="button" onClick={() => handleDelete(brand.id)} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-brand-700"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Shipping / Governorates tab ---------- */
function ShippingTab({ onSaved, notify }: { onSaved: () => Promise<void>; notify: NotifyFn }) {
  const { t } = useLanguage();
  const { general } = useSettings();
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGov, setEditingGov] = useState<Governorate | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setGovernorates(await fetchAllGovernorates()); } catch { notify('error', t('common.error')); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;
    try { await deleteGovernorate(id); await load(); notify('success', t('admin.governorates.deleted')); }
    catch { notify('error', t('common.error')); }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="flex flex-col gap-5">
      {/* Default shipping settings info */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-bold text-slate-900">{t('admin.settings.tab.shipping')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">{t('admin.settings.deliveryFee')}</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{general.delivery_fee} {general.currency_code}</p>
            <p className="mt-1 text-xs text-slate-400">{t('admin.settings.defaultDeliveryHelp')}</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">{t('admin.settings.freeThreshold')}</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{general.free_delivery_threshold} {general.currency_code}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">Change these values in the General tab.</p>
      </div>

      {/* Governorates */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">{t('admin.settings.shippingGovernorates')}</h2>
          <button type="button" onClick={() => { setEditingGov(null); setShowForm(true); }} className="btn-primary">
            <Plus className="h-4 w-4" />
            {t('common.add')}
          </button>
        </div>

        {showForm && (
          <GovernorateForm
            initial={editingGov}
            currency={general.currency_code}
            onSave={async (input, id) => {
              try { await saveGovernorate(input, id); await load(); notify('success', t('admin.governorates.saved')); setShowForm(false); setEditingGov(null); }
              catch { notify('error', t('common.error')); }
            }}
            onCancel={() => { setShowForm(false); setEditingGov(null); }}
          />
        )}

        {governorates.length === 0 && !showForm ? (
          <p className="py-8 text-center text-sm text-slate-400">{t('admin.governorates.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-600">
                <tr><th className="px-3 py-2 text-start">EN</th><th className="px-3 py-2 text-start">AR</th><th className="px-3 py-2 text-end">{t('admin.governorates.fee')}</th><th className="px-3 py-2 text-center">{t('common.status')}</th><th className="px-3 py-2 text-end">{t('common.actions')}</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {governorates.map((gov) => (
                  <tr key={gov.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-900">{gov.name_en}</td>
                    <td className="px-3 py-2 text-slate-700" dir="rtl">{gov.name_ar}</td>
                    <td className="px-3 py-2 text-end font-semibold">{gov.delivery_fee} {general.currency_code}</td>
                    <td className="px-3 py-2 text-center"><Badge tone={gov.is_active ? 'green' : 'slate'}>{gov.is_active ? t('common.active') : t('common.inactive')}</Badge></td>
                    <td className="px-3 py-2 text-end">
                      <button type="button" onClick={() => { setEditingGov(gov); setShowForm(true); }} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100">✏</button>
                      <button type="button" onClick={() => handleDelete(gov.id)} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-brand-700"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function GovernorateForm({ initial, currency, onSave, onCancel }: { initial: Governorate | null; currency: string; onSave: (input: GovernorateInput, id?: string) => void; onCancel: () => void }) {
  const { t } = useLanguage();
  const [nameEn, setNameEn] = useState(initial?.name_en ?? '');
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? '');
  const [fee, setFee] = useState(String(initial?.delivery_fee ?? 0));
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({ name_en: nameEn, name_ar: nameAr, delivery_fee: parseFloat(fee) || 0, is_active: isActive, sort_order: initial?.sort_order ?? 0 }, initial?.id);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 p-4">
      <Field label={t('admin.governorates.nameEn')}>
        {(id) => <TextInput id={id} value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" required />}
      </Field>
      <Field label={t('admin.governorates.nameAr')}>
        {(id) => <TextInput id={id} value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" required />}
      </Field>
      <Field label={`${t('admin.governorates.fee')} (${currency})`}>
        {(id) => <TextInput id={id} type="number" step="0.01" min="0" value={fee} onChange={(e) => setFee(e.target.value)} dir="ltr" />}
      </Field>
      <ToggleRow label={t('common.active')} checked={isActive} onChange={setIsActive} />
      <div className="flex gap-2">
        <button type="submit" className="btn-primary">{t('common.save')}</button>
        <button type="button" onClick={onCancel} className="btn-secondary">{t('common.cancel')}</button>
      </div>
    </form>
  );
}

/* ---------- Shared toggle ---------- */
function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-brand-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'start-[22px]' : 'start-0.5'}`} />
      </button>
    </label>
  );
}
