import { useMemo, useState, type FormEvent } from 'react';
import { placeOrder, OrderError, type CheckoutCustomer } from '@/api/orders';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { Link, useRouter } from '@/lib/router';
import { formatMoney, localized } from '@/lib/format';
import { useCartDetails } from '@/lib/useCartDetails';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { EmptyState, ErrorState, LoadingState, Notice } from '@/components/ui/PageState';
import { Field, TextArea, TextInput, SelectInput } from '@/components/ui/FormFields';
import type { TranslationKey } from '@/i18n/translations';

type PaymentMethod = 'cod' | 'whatsapp';
type FieldErrors = Partial<Record<'full_name' | 'phone' | 'city' | 'address', TranslationKey>>;

const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;

function validate(form: CheckoutCustomer): FieldErrors {
  const errors: FieldErrors = {};
  if (form.full_name.trim().length < 2) errors.full_name = 'checkout.shortName';
  if (!PHONE_PATTERN.test(form.phone.trim()) || form.phone.replace(/\D/g, '').length < 7) errors.phone = 'checkout.invalidPhone';
  if (form.city.trim().length < 2) errors.city = 'checkout.shortCity';
  if (form.address.trim().length < 5) errors.address = 'checkout.shortAddress';
  return errors;
}

export function CheckoutPage() {
  const { t, lang } = useLanguage();
  const { general, governorates } = useSettings();
  const { clear } = useCart();
  const { navigate } = useRouter();
  const cart = useCartDetails();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [form, setForm] = useState<CheckoutCustomer>({ full_name: '', phone: '', city: '', address: '', notes: '', governorate_id: '' });
  const [method, setMethod] = useState<PaymentMethod>('cod');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<TranslationKey | null>(null);

  useDocumentMeta({ title: `${t('checkout.title')} | TRONIX`, description: t('checkout.title') });

  const selectedGovernorate = useMemo(
    () => governorates.find((g) => g.id === form.governorate_id) ?? null,
    [governorates, form.governorate_id],
  );

  const deliveryFee = useMemo(() => {
    if (cart.items.length === 0) return 0;
    if (general.free_delivery_threshold > 0 && cart.subtotal >= general.free_delivery_threshold) return 0;
    return selectedGovernorate ? selectedGovernorate.delivery_fee : general.delivery_fee;
  }, [cart.items.length, cart.subtotal, general.free_delivery_threshold, general.delivery_fee, selectedGovernorate]);

  const total = cart.subtotal + deliveryFee;

  if (cart.status === 'loading') return <div className="py-24"><LoadingState /></div>;
  if (cart.status === 'error') return <div className="py-24"><ErrorState onRetry={cart.retry} /></div>;
  if (cart.items.length === 0 && !submitting) {
    return (
      <EmptyState
        message={t('checkout.emptyCart')}
        action={<Link to="/shop" className="btn-primary">{t('cart.continue')}</Link>}
      />
    );
  }

  const money = (value: number) => formatMoney(value, general.currency_code, lang);
  const update = (key: keyof CheckoutCustomer) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const customer: CheckoutCustomer = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
      governorate_id: form.governorate_id || undefined,
    };
    try {
      const placed = await placeOrder(
        customer,
        cart.items.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
        method,
        idempotencyKey,
      );
      clear();
      navigate(`/order-success?number=${encodeURIComponent(placed.order_number)}&method=${method}`);
    } catch (error) {
      const code = error instanceof OrderError ? error.code : 'generic';
      setFormError(`checkout.error.${code}` as TranslationKey);
      if (code === 'stock' || code === 'unavailable') cart.retry();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-steel-900">{t('checkout.title')}</h1>

      <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-5 rounded-2xl border border-steel-200 bg-white p-6 sm:p-8">
            <h2 className="text-lg font-bold text-steel-900">{t('checkout.details')}</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t('checkout.fullName')} required error={errors.full_name && t(errors.full_name)}>
                {(id) => <TextInput id={id} autoComplete="name" value={form.full_name} onChange={(e) => update('full_name')(e.target.value)} invalid={!!errors.full_name} />}
              </Field>
              <Field label={t('checkout.phone')} required error={errors.phone && t(errors.phone)}>
                {(id) => <TextInput id={id} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={form.phone} onChange={(e) => update('phone')(e.target.value)} invalid={!!errors.phone} />}
              </Field>
              {governorates.length > 0 && (
                <Field label={t('checkout.governorate')}>
                  {(id) => (
                    <SelectInput id={id} value={form.governorate_id} onChange={(e) => update('governorate_id')(e.target.value)}>
                      <option value="">{t('checkout.selectGovernorate')}</option>
                      {governorates.map((gov) => (
                        <option key={gov.id} value={gov.id}>{localized(gov, 'name', lang)}</option>
                      ))}
                    </SelectInput>
                  )}
                </Field>
              )}
              <Field label={t('checkout.city')} required error={errors.city && t(errors.city)}>
                {(id) => <TextInput id={id} autoComplete="address-level2" value={form.city} onChange={(e) => update('city')(e.target.value)} invalid={!!errors.city} />}
              </Field>
            </div>
            <Field label={t('checkout.address')} required error={errors.address && t(errors.address)}>
              {(id) => <TextArea id={id} rows={3} autoComplete="street-address" value={form.address} onChange={(e) => update('address')(e.target.value)} invalid={!!errors.address} />}
            </Field>
            <Field label={t('checkout.notes')}>
              {(id) => <TextArea id={id} rows={2} value={form.notes} onChange={(e) => update('notes')(e.target.value)} />}
            </Field>
          </section>

          <section className="flex flex-col gap-4 rounded-2xl border border-steel-200 bg-white p-6 sm:p-8">
            <h2 className="text-lg font-bold text-steel-900">{t('checkout.payment')}</h2>
            <PaymentOption checked={method === 'cod'} onSelect={() => setMethod('cod')} title={t('checkout.cod')} desc={t('checkout.codDesc')} />
            <PaymentOption checked={method === 'whatsapp'} onSelect={() => setMethod('whatsapp')} title={t('checkout.whatsapp')} desc={t('checkout.whatsappDesc')} />
          </section>
        </div>

        <aside className="flex h-fit flex-col gap-5 rounded-2xl border border-steel-200 bg-white p-6 shadow-card lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-steel-900">{t('checkout.summary')}</h2>
          <ul className="flex max-h-72 flex-col gap-3 overflow-y-auto pe-1 text-sm">
            {cart.items.map((item) => (
              <li key={item.product.id} className="flex justify-between gap-3">
                <span className="text-steel-700">{localized(item.product, 'name', lang)} <span className="text-steel-400">x{item.quantity}</span></span>
              </li>
            ))}
          </ul>
          <dl className="flex flex-col gap-2 border-t border-steel-200 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-steel-600">{t('cart.subtotal')}</dt><dd className="font-semibold">{money(cart.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-steel-600">{t('cart.delivery')}</dt><dd className="font-semibold">{deliveryFee === 0 ? t('cart.free') : money(deliveryFee)}</dd></div>
            <div className="flex justify-between border-t border-steel-200 pt-3 text-base"><dt className="font-bold">{t('cart.total')}</dt><dd className="font-bold">{money(total)}</dd></div>
          </dl>
          {formError && <Notice tone="error">{t(formError)}</Notice>}
          <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
            {submitting ? t('checkout.placing') : t('checkout.placeOrder')}
          </button>
          <p className="text-center text-xs text-steel-500">{t('checkout.submitHint')}</p>
        </aside>
      </form>
    </div>
  );
}

function PaymentOption({ checked, onSelect, title, desc }: { checked: boolean; onSelect: () => void; title: string; desc: string }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-colors ${checked ? 'border-brand-600 bg-brand-50/50' : 'border-steel-200 hover:border-steel-300'}`}
    >
      <input type="radio" name="payment" checked={checked} onChange={onSelect} className="mt-1 h-4 w-4 accent-brand-600" />
      <span>
        <span className="block font-semibold text-steel-900">{title}</span>
        <span className="block text-sm text-steel-600">{desc}</span>
      </span>
    </label>
  );
}
