import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { constructMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = constructMetadata({
  title: 'Terms of Service | شروط الاستخدام - منصة خدماتك الجزائر',
  description: 'الشروط والأحكام والقواعد المنظمة لاستخدام منصة خدماتك الشاملة في الجزائر للمعاملات والخدمات والوساطة المالية.',
  canonicalUrl: '/terms',
});

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl font-sans">
      <div className="space-y-4 text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
          <ShieldCheck className="h-4 w-4" />
          <span>الميثاق القانوني والتنظيمي • منصة خدماتك</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-headline text-foreground">
          شروط وأحكام الاستخدام (Terms of Service)
        </h1>
        <p className="text-sm text-muted-foreground">
          آخر تحديث: 2026 • متوافقة مع القوانين والتشريعات المنظمة للتجارة والخدمات الإلكترونية في الجزائر
        </p>
      </div>

      <div className="bg-card border rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 text-foreground leading-relaxed text-sm sm:text-base">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            1. مقدمة وتعريف بالمنصة
          </h2>
          <p className="text-muted-foreground">
            تعتبر منصة "خدماتك" (Khidmatik) منصة وسيطة متعددة القطاعات تقدم خدمات الربط التقني واللوجستي والتجاري بين مقدمي الخدمات (الحرفيين، المتاجر، المستقلين، أصحاب القاعات) والعملاء المستفيدين عبر كامل التراب الوطني الجزائري (58 ولاية).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            2. حسابات المستخدمين والتسجيل
          </h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground pr-2">
            <li>يتعهد المستخدم بتقديم معلومات دقيقة وصحيحة عند فتح الحساب (الاسم، رقم الهاتف، الولاية والبلدية).</li>
            <li>يتحمل المستخدم المسؤولية الكاملة عن سرية بيانات الدخول وكلمة المرور الخاصة بحسابه.</li>
            <li>يخضع الحرفيون والتجار ومقدمو الخدمات للتحقق الميداني والوثائقي (السجل التجاري أو بطاقة الحرفي وبطاقة التعريف الوطنية).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            3. الوساطة المالية ونظام الضمان (Escrow Engine)
          </h2>
          <p className="text-muted-foreground">
            تعتمد المنصة نظام الضمان المالي لحماية حقوق جميع الأطراف:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground pr-2">
            <li>يتم حجز المقابل المالي للخدمة أو الطلب مؤقتاً في حساب الوساطة ولا يتم الإفراج عنه إلا بعد تأكيد استلام الخدمة برمز التحقق OTP أو إتمام الفحص.</li>
            <li>في الخدمات الميدانية والحرفية، لا تبدأ الخدمة إلا بإدخال رمز التحقق الأولي (START OTP)، ولا تكتمل التسوية المالية إلا بإدخال رمز الإتمام (COMPLETION OTP).</li>
            <li>تكلفة قطع الغيار تُحوّل بالكامل بنسبة 100% للمزود، وتُطبق عمولة المنصة فقط على أجور العمل والخدمات.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            4. الشحن والتوصيل والفحص
          </h2>
          <p className="text-muted-foreground">
            تتعاون المنصة مع كبرى الشركات اللوجستية المعتمدة في الجزائر (Yalidine, ZR Express, Maystro Express). يحق للعميل فحص الطرد وفقاً لبروتوكول الفحص المعتمد قبل استلام الشحنة لضمان مطابقتها للمواصفات.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            5. التقييمات والنزاعات
          </h2>
          <p className="text-muted-foreground">
            تعتمد المنصة نظام التقييم الثنائي المحجوب (Double-Blind Review) حيث لا يظهر تقييم أي طرف حتى يقوم الطرفان بتقديم تقييماتهما أو انقضاء 48 ساعة، لضمان النزاهة والموضوعية. في حال حدوث نزاع، يتدخل فريق الدعم المركزي للتحكيم بناءً على الأدلة وسجلات النظام.
          </p>
        </section>

        <div className="pt-6 border-t flex flex-wrap items-center justify-between gap-4">
          <Link href="/privacy" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
            <span>الاطلاع على سياسة الخصوصية</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
