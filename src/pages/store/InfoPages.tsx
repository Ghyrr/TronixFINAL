import { useState, type FormEvent } from 'react';
import { Mail, MapPin, MessageCircle, Phone, Clock } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { localized } from '@/lib/format';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { whatsappLink } from '@/lib/whatsapp';
import { Field, TextArea, TextInput } from '@/components/ui/FormFields';

export function AboutPage() {
  const { t } = useLanguage();
  useDocumentMeta({ title: `${t('about.title')} | TRONIX`, description: t('about.body1') });
  const values = [
    { title: t('about.values.quality'), desc: t('about.values.quality.desc') },
    { title: t('about.values.fast'), desc: t('about.values.fast.desc') },
    { title: t('about.values.support'), desc: t('about.values.support.desc') },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold text-steel-900">{t('about.title')}</h1>
      <div className="mt-6 flex flex-col gap-4 text-lg leading-relaxed text-steel-600">
        <p>{t('about.body1')}</p>
        <p>{t('about.body2')}</p>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {values.map((value) => (
          <div key={value.title} className="rounded-2xl border border-steel-200 bg-white p-6">
            <h2 className="font-semibold text-steel-900">{value.title}</h2>
            <p className="mt-2 text-sm text-steel-600">{value.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContactPage() {
  const { t, lang } = useLanguage();
  const { general } = useSettings();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; message?: string }>({});
  const address = localized(general, 'address', lang);
  const whatsappNumber = general.whatsapp_number;

  useDocumentMeta({ title: `${t('contact.title')} | TRONIX`, description: t('contact.subtitle') });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (name.trim().length < 2) nextErrors.name = t('common.requiredField');
    if (message.trim().length < 5) nextErrors.message = t('common.requiredField');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const url = whatsappLink(whatsappNumber, `${name.trim()}: ${message.trim()}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const details = [
    { icon: Phone, label: t('contact.phone'), value: general.phone, dir: 'ltr' },
    { icon: Mail, label: t('contact.email'), value: general.email, dir: 'ltr' },
    { icon: MapPin, label: t('contact.address'), value: address, dir: 'auto' },
    { icon: Clock, label: t('contact.hours'), value: t('contact.hoursValue'), dir: 'auto' },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-steel-900">{t('contact.title')}</h1>
      <p className="mt-3 text-lg text-steel-600">{t('contact.subtitle')}</p>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <ul className="flex flex-col gap-4">
          {details.filter((item) => item.value).map((item) => (
            <li key={item.label} className="flex items-start gap-4 rounded-2xl border border-steel-200 bg-white p-5">
              <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
              <div>
                <p className="text-sm text-steel-500">{item.label}</p>
                <p className="mt-1 font-semibold text-steel-900" dir={item.dir}>{item.value}</p>
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 rounded-2xl border border-steel-200 bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-lg font-bold text-steel-900">{t('contact.form.title')}</h2>
          <Field label={t('contact.form.name')} required error={errors.name}>
            {(id) => <TextInput id={id} value={name} onChange={(e) => setName(e.target.value)} invalid={!!errors.name} />}
          </Field>
          <Field label={t('contact.form.message')} required error={errors.message}>
            {(id) => <TextArea id={id} rows={5} value={message} onChange={(e) => setMessage(e.target.value)} invalid={!!errors.message} />}
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={!whatsappNumber} className="btn-primary flex-1">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {t('contact.form.whatsapp')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
