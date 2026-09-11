import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { constructMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = constructMetadata({
  title: 'Privacy Policy | سياسة الخصوصية وحماية البيانات - منصة خدماتك',
  description: 'سياسة الخصوصية وحماية البيانات الشخصية والأمنية لمستخدمي منصة خدماتك في الجزائر.',
  canonicalUrl: '/privacy',
});

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl font-sans">
      <div className="space-y-4 text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
          <Shield className="h-4 w-4" />
          <span>حماية البيانات والسرية التامة • منصة خدماتك</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-headline text-foreground">
          سياسة الخصوصية وحماية البيانات (Privacy Policy)
        </h1>
        <p className="text-sm text-muted-foreground">
          آخر تحديث: 2026 • نلتزم بأعلى معايير التشفير والأمان لحماية بياناتك
        </p>
      </div>

      <div className="bg-card border rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 text-foreground leading-relaxed text-sm sm:text-base">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            1. البيانات التي نجمعها
          </h2>
          <p className="text-muted-foreground">
            نجمع فقط المعلومات الضرورية لتشغيل الخدمات وتوصيل الطلبات بأمان:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground pr-2">
            <li>معلومات الهوية والحساب: الاسم، رقم الهاتف، البريد الإلكتروني.</li>
            <li>بيانات الموقع الجغرافي والعنوان: الولاية، البلدية، والعنوان لتوجيه الحرفيين والشحنات.</li>
            <li>بيانات التحقق والتوثيق لمقدمي الخدمات والتجار وفق المعايير التنظيمية.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <Lock className="h-5 w-5" />
            2. حماية وتشفير البيانات والرموز
          </h2>
          <p className="text-muted-foreground">
            نطبق سياسات أمان صارمة في قاعدة البيانات:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground pr-2">
            <li>يتم تشفير كلمات المرور ورموز التحقق الثنائية (OTP) بواسطة خوارزميات التجزئة الآمنة (SHA-256 / bcrypt) ولا تُحفظ كنصوص صريحة نهائياً.</li>
            <li>يتم تشفير كافة الاتصالات بين متصفحك وخوادمنا بتقنية SSL/TLS الحديثة.</li>
            <li>تُدار المعاملات المالية عبر سجلات محاسبية مشفرة ومحمية من تضارب العمليات.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            3. مشاركة البيانات مع أطراف ثالثة
          </h2>
          <p className="text-muted-foreground">
            لا نقوم ببيع أو تأجير بيانات المستخدمين لأي طرف تجاري خارجي إطلاقاً. تتم مشاركة البيانات التشغيلية فقط بالقدر الأدنى اللازم:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground pr-2">
            <li>مع شركات التوصيل المعتمدة (الاسم، العنوان، ورقم الهاتف لتسليم الطرد).</li>
            <li>مع الحرفي الميداني عند قبول طلب الصيانة لتسهيل الوصول والتواصل.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            4. حقوق المستخدم
          </h2>
          <p className="text-muted-foreground">
            يحق لك في أي وقت تعديل بياناتك الشخصية، إدارة تفضيلات الإشعارات، أو طلب حذف حسابك وبياناتك نهائياً من منصة خدماتك عبر إعدادات الملف الشخصي أو بالتواصل مع الدعم الفني.
          </p>
        </section>

        <div className="pt-6 border-t flex flex-wrap items-center justify-between gap-4">
          <Link href="/terms" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
            <span>الاطلاع على شروط الاستخدام</span>
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
