import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Upload, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { Link, useRouter } from '@/lib/router';
import {
  fetchAdminProductById,
  fetchAllCategories,
  fetchAllBrands,
  saveProduct,
  type ProductInput,
  type ProductImageInput,
} from '@/api/admin';
import { uploadStoreImage, UploadError } from '@/api/storage';
import { slugify } from '@/lib/format';
import { Field, TextInput, TextArea, SelectInput } from '@/components/ui/FormFields';
import { Badge, ErrorState, LoadingState, Notice } from '@/components/ui/PageState';
import { useToast } from '@/components/ui/Toast';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import type { Category, Brand, SpecEntry, ProductImage } from '@/lib/types';

interface ImageEntry extends ProductImageInput {
  id?: string;
}

export function AdminProductEditPage({ productId }: { productId?: string }) {
  const { t } = useLanguage();
  const { can } = useAuth();
  const { navigate } = useRouter();
  const { notify } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [sku, setSku] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [lowThreshold, setLowThreshold] = useState('5');
  const [isVisible, setIsVisible] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [models, setModels] = useState('');
  const [specs, setSpecs] = useState<SpecEntry[]>([]);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [currentStock, setCurrentStock] = useState(0);

  useDocumentMeta({ title: `${productId ? t('admin.products.edit') : t('admin.products.create')} | TRONIX Admin` });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [cats, brs] = await Promise.all([fetchAllCategories(), fetchAllBrands()]);
        if (cancelled) return;
        setCategories(cats);
        setBrands(brs);

        if (productId) {
          const product = await fetchAdminProductById(productId);
          if (cancelled || !product) return;
          setNameEn(product.name_en);
          setNameAr(product.name_ar);
          setDescEn(product.description_en);
          setDescAr(product.description_ar);
          setSku(product.sku);
          setSlug(product.slug);
          setCategoryId(product.category_id);
          setBrandId(product.brand_id ?? '');
          setPrice(String(product.price));
          setSalePrice(product.sale_price ? String(product.sale_price) : '');
          setLowThreshold(String(product.low_stock_threshold));
          setIsVisible(product.is_visible);
          setIsFeatured(product.is_featured);
          setIsBestSeller(product.is_best_seller);
          setIsAvailable(product.is_available);
          setModels(product.compatible_models.join(', '));
          setSpecs(product.specifications ?? []);
          setImages(product.product_images.map((img: ProductImage) => ({ id: img.id, url: img.url })));
          setCurrentStock(product.stock_quantity);
        }
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [productId]);

  if (!can('products')) {
    return <div className="py-16 text-center text-slate-500">{t('admin.noPermission')}</div>;
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState />;

  if (categories.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Link to="/admin/products" className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('admin.products.back')}
        </Link>
        <Notice tone="error">{t('admin.products.noCategories')}</Notice>
      </div>
    );
  }

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadStoreImage(file, 'products');
        setImages((prev) => [...prev, { url }]);
      }
    } catch (err) {
      if (err instanceof UploadError) {
        notify('error', err.code === 'size' ? t('admin.products.imageTooLarge') : t('admin.products.imageType'));
      } else {
        notify('error', t('common.error'));
      }
    } finally {
      setUploading(false);
    }
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addSpec = () => setSpecs((prev) => [...prev, { label_en: '', label_ar: '', value_en: '', value_ar: '' }]);
  const updateSpec = (index: number, field: keyof SpecEntry, value: string) => {
    setSpecs((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };
  const removeSpec = (index: number) => setSpecs((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!nameEn.trim() || !nameAr.trim()) {
      setFormError(t('common.requiredField'));
      return;
    }
    if (!sku.trim() || !slug.trim()) {
      setFormError(t('common.requiredField'));
      return;
    }
    if (!categoryId) {
      setFormError(t('common.requiredField'));
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError(t('common.invalidNumber'));
      return;
    }
    const saleNum = salePrice ? parseFloat(salePrice) : null;
    if (saleNum !== null && (isNaN(saleNum) || saleNum < 0 || saleNum > priceNum)) {
      setFormError(t('admin.products.salePriceError'));
      return;
    }

    setSaving(true);
    try {
      const input: ProductInput = {
        sku: sku.trim(),
        slug: slug.trim(),
        name_en: nameEn.trim(),
        name_ar: nameAr.trim(),
        description_en: descEn.trim(),
        description_ar: descAr.trim(),
        category_id: categoryId,
        brand_id: brandId || null,
        price: priceNum,
        sale_price: saleNum,
        low_stock_threshold: parseInt(lowThreshold) || 5,
        is_available: isAvailable,
        is_featured: isFeatured,
        is_best_seller: isBestSeller,
        is_visible: isVisible,
        compatible_models: models.split(',').map((m) => m.trim()).filter(Boolean),
        specifications: specs.filter((s) => s.label_en || s.label_ar),
      };
      const id = await saveProduct(input, images, productId);
      notify('success', t('admin.products.saved'));
      navigate('/admin/products');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('sku')) setFormError(t('admin.products.skuTaken'));
      else if (msg.includes('slug')) setFormError(t('admin.products.slugTaken'));
      else setFormError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/admin/products" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t('admin.products.back')}
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-slate-900">
        {productId ? t('admin.products.edit') : t('admin.products.create')}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {formError && <Notice tone="error">{formError}</Notice>}

        {/* Basic info */}
        <Section title={t('admin.products.section.basic')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('admin.products.nameEn')} required>
              {(id) => <TextInput id={id} value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />}
            </Field>
            <Field label={t('admin.products.nameAr')} required>
              {(id) => <TextInput id={id} value={nameAr} onChange={(e) => setNameAr(e.target.value)} required dir="rtl" />}
            </Field>
            <Field label={t('admin.products.sku')} required>
              {(id) => <TextInput id={id} value={sku} onChange={(e) => setSku(e.target.value)} required dir="ltr" />}
            </Field>
            <Field label={t('admin.products.slug')} required hint="/product/...">
              {(id) => (
                <TextInput
                  id={id}
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  required
                  dir="ltr"
                />
              )}
            </Field>
            <Field label={t('product.category')} required>
              {(id) => (
                <SelectInput id={id} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_en} / {c.name_ar}</option>
                  ))}
                </SelectInput>
              )}
            </Field>
            <Field label={t('product.brand')}>
              {(id) => (
                <SelectInput id={id} value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                  <option value="">—</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </SelectInput>
              )}
            </Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={t('admin.products.descEn')}>
              {(id) => <TextArea id={id} rows={4} value={descEn} onChange={(e) => setDescEn(e.target.value)} />}
            </Field>
            <Field label={t('admin.products.descAr')}>
              {(id) => <TextArea id={id} rows={4} value={descAr} onChange={(e) => setDescAr(e.target.value)} dir="rtl" />}
            </Field>
          </div>
        </Section>

        {/* Pricing */}
        <Section title={t('admin.products.section.pricing')}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t('admin.products.regularPrice')} required>
              {(id) => <TextInput id={id} type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required dir="ltr" />}
            </Field>
            <Field label={t('admin.products.salePrice')} hint={t('admin.products.salePriceError')}>
              {(id) => <TextInput id={id} type="number" step="0.01" min="0" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} dir="ltr" />}
            </Field>
            <Field label={t('admin.products.lowThreshold')}>
              {(id) => <TextInput id={id} type="number" min="0" value={lowThreshold} onChange={(e) => setLowThreshold(e.target.value)} dir="ltr" />}
            </Field>
          </div>
          {productId && (
            <div className="mt-4 flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-600">{t('admin.products.stockLocked')}:</span>
              <Badge tone={currentStock <= 0 ? 'red' : currentStock <= (parseInt(lowThreshold) || 5) ? 'amber' : 'green'}>
                {currentStock}
              </Badge>
              <span className="text-xs text-slate-400">{t('admin.products.stockNote')}</span>
            </div>
          )}
        </Section>

        {/* Images */}
        <Section title={t('admin.products.section.media')}>
          <p className="mb-3 text-xs text-slate-500">{t('admin.products.imagesHint')}</p>
          <div className="flex flex-wrap gap-3">
            {images.map((img, index) => (
              <div key={index} className="relative group h-24 w-24 overflow-hidden rounded-lg border border-slate-200">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                {index === 0 && (
                  <span className="absolute start-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">Main</span>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-slate-900/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} className="rounded p-1 text-white disabled:opacity-30">
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} className="rounded p-1 text-white disabled:opacity-30">
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => removeImage(index)} className="rounded p-1 text-white hover:text-brand-300">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 transition-colors hover:border-brand-400 hover:text-brand-600">
              {uploading ? (
                <span className="text-xs">{t('admin.products.uploading')}</span>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span className="text-[10px]">{t('admin.products.uploadImage')}</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
                disabled={uploading}
              />
            </label>
          </div>
        </Section>

        {/* Details */}
        <Section title={t('admin.products.section.details')}>
          <Field label={t('admin.products.models')} hint={t('admin.products.modelsHint')}>
            {(id) => <TextInput id={id} value={models} onChange={(e) => setModels(e.target.value)} dir="ltr" />}
          </Field>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">{t('admin.products.specs')}</span>
              <button type="button" onClick={addSpec} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                <Plus className="h-4 w-4" />
                {t('admin.products.specsAdd')}
              </button>
            </div>
            {specs.map((spec, index) => (
              <div key={index} className="mb-3 grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
                <TextInput placeholder={t('admin.products.specLabelEn')} value={spec.label_en} onChange={(e) => updateSpec(index, 'label_en', e.target.value)} dir="ltr" />
                <TextInput placeholder={t('admin.products.specLabelAr')} value={spec.label_ar} onChange={(e) => updateSpec(index, 'label_ar', e.target.value)} dir="rtl" />
                <TextInput placeholder={t('admin.products.specValueEn')} value={spec.value_en} onChange={(e) => updateSpec(index, 'value_en', e.target.value)} dir="ltr" />
                <div className="flex gap-2">
                  <TextInput placeholder={t('admin.products.specValueAr')} value={spec.value_ar} onChange={(e) => updateSpec(index, 'value_ar', e.target.value)} dir="rtl" />
                  <button type="button" onClick={() => removeSpec(index)} className="shrink-0 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Visibility */}
        <Section title={t('admin.products.section.visibility')}>
          <div className="flex flex-col gap-3">
            <ToggleRow label={t('admin.products.visibility')} checked={isVisible} onChange={setIsVisible} />
            <ToggleRow label={t('admin.products.featured')} checked={isFeatured} onChange={setIsFeatured} />
            <ToggleRow label={t('admin.products.bestSeller')} checked={isBestSeller} onChange={setIsBestSeller} />
            <ToggleRow label={t('admin.products.available')} checked={isAvailable} onChange={setIsAvailable} />
          </div>
        </Section>

        <div className="flex justify-end gap-3">
          <Link to="/admin/products" className="btn-secondary">{t('common.cancel')}</Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="mb-4 text-sm font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-brand-600' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'start-[22px]' : 'start-0.5'}`} />
      </button>
    </label>
  );
}
