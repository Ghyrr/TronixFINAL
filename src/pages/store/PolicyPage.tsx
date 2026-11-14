import { useLanguage } from '@/i18n/LanguageContext';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import type { Lang } from '@/lib/types';

export type PolicyKind = 'privacy' | 'terms' | 'returns';

interface PolicySection {
  heading: string;
  body: string;
}

const POLICIES: Record<PolicyKind, Record<Lang, { title: string; sections: PolicySection[] }>> = {
  privacy: {
    en: {
      title: 'Privacy Policy',
      sections: [
        { heading: 'Information we collect', body: 'When you place an order we collect your name, phone number, city and delivery address, and any notes you add. We do not collect payment card details.' },
        { heading: 'How we use it', body: 'We use your information only to confirm, prepare and deliver your order and to contact you about it. We do not sell your personal data.' },
        { heading: 'Retention', body: 'Order records are kept for accounting and warranty purposes. You can ask us to review or delete your details by contacting our support team.' },
      ],
    },
    ar: {
      title: 'سياسة الخصوصية',
      sections: [
        { heading: 'المعلومات التي نجمعها', body: 'عند تقديم طلب نجمع اسمك ورقم هاتفك ومدينتك وعنوان التوصيل وأي ملاحظات تضيفها. لا نجمع بيانات بطاقات الدفع.' },
        { heading: 'كيف نستخدمها', body: 'نستخدم معلوماتك فقط لتأكيد طلبك وتجهيزه وتوصيله والتواصل معك بشأنه. لا نبيع بياناتك الشخصية.' },
        { heading: 'مدة الاحتفاظ', body: 'نحتفظ بسجلات الطلبات لأغراض المحاسبة والضمان. يمكنك طلب مراجعة بياناتك أو حذفها بالتواصل مع فريق الدعم.' },
      ],
    },
  },
  terms: {
    en: {
      title: 'Terms & Conditions',
      sections: [
        { heading: 'Orders and prices', body: 'Prices are shown in the store currency and may change without notice. An order is confirmed once our team has reviewed it and contacted you.' },
        { heading: 'Stock', body: 'Product availability is updated in real time. If an item sells out before your order is confirmed, we will inform you and adjust your order.' },
        { heading: 'Delivery and payment', body: 'Cash on delivery is paid to the courier on arrival. Delivery fees are shown at checkout and free delivery applies above the published threshold.' },
      ],
    },
    ar: {
      title: 'الشروط والأحكام',
      sections: [
        { heading: 'الطلبات والأسعار', body: 'تُعرض الأسعار بعملة المتجر وقد تتغير دون إشعار. يُعتمد الطلب بعد مراجعته من فريقنا والتواصل معك.' },
        { heading: 'المخزون', body: 'يتم تحديث توفر المنتجات لحظياً. إذا نفد منتج قبل تأكيد طلبك سنبلغك ونعدّل الطلب.' },
        { heading: 'التوصيل والدفع', body: 'الدفع عند الاستلام يتم للمندوب عند الوصول. تظهر رسوم التوصيل عند الدفع، ويكون التوصيل مجانياً فوق الحد المعلن.' },
      ],
    },
  },
  returns: {
    en: {
      title: 'Return Policy',
      sections: [
        { heading: 'Eligibility', body: 'Parts can be returned within 7 days of delivery if they are unused, in their original packaging and not damaged by installation.' },
        { heading: 'Defective items', body: 'If a part is defective on arrival, contact us with your order number and a photo. We will replace it or refund the price after inspection.' },
        { heading: 'Non-returnable items', body: 'Opened batteries, software-locked items and special-order products cannot be returned unless they are defective.' },
      ],
    },
    ar: {
      title: 'سياسة الاسترجاع',
      sections: [
        { heading: 'الشروط', body: 'يمكن إرجاع القطع خلال 7 أيام من الاستلام إذا كانت غير مستخدمة وبعبوتها الأصلية وغير متضررة بسبب التركيب.' },
        { heading: 'القطع المعيبة', body: 'إذا وصلت القطعة معيبة فتواصل معنا برقم الطلب وصورة. سنستبدلها أو نرد قيمتها بعد الفحص.' },
        { heading: 'المنتجات غير القابلة للإرجاع', body: 'البطاريات المفتوحة والأجهزة المقفلة برمجياً والمنتجات المطلوبة خصيصاً لا تُرجع إلا إذا كانت معيبة.' },
      ],
    },
  },
};

export function PolicyPage({ kind }: { kind: PolicyKind }) {
  const { lang, t } = useLanguage();
  const policy = POLICIES[kind][lang];
  useDocumentMeta({ title: `${policy.title} | TRONIX`, description: policy.sections[0].body });

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold text-steel-900">{policy.title}</h1>
      <p className="mt-2 text-sm text-steel-500">{t('policy.lastUpdated')}: 2026-11-04</p>
      <div className="mt-10 flex flex-col gap-8">
        {policy.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-semibold text-steel-900">{section.heading}</h2>
            <p className="mt-2 leading-relaxed text-steel-600">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
