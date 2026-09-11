'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Lock, ArrowRight, Home, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

interface UnauthorizedStateProps {
  type?: 'unauthorized' | 'forbidden';
  titleAr?: string;
  titleEn?: string;
  messageAr?: string;
  messageEn?: string;
  requiredRole?: string;
  requiredPermission?: string;
  showHomeButton?: boolean;
  showLoginButton?: boolean;
}

export function UnauthorizedState({
  type = 'forbidden',
  titleAr,
  titleEn,
  messageAr,
  messageEn,
  requiredRole,
  requiredPermission,
  showHomeButton = true,
  showLoginButton = true
}: UnauthorizedStateProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const is401 = type === 'unauthorized';

  const defaultTitle = is401
    ? (isAr ? 'يجب تسجيل الدخول أولاً' : 'Authentication Required')
    : (isAr ? 'ليس لديك صلاحية للوصول' : 'Access Forbidden');

  const defaultMessage = is401
    ? (isAr ? 'يرجى تسجيل الدخول إلى حسابك للوصول إلى هذه الصفحة أو تنفيذ هذه العملية.' : 'Please log in to your Khidmatik account to access this page or resource.')
    : (isAr ? 'عذراً، لا يمتلك حسابك الحالي الصلاحيات الكافية للوصول إلى هذا القسم أو المورد.' : 'Sorry, your current account does not have sufficient permissions to view this resource.');

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
      <div className="relative mb-6">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${
          is401 
            ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 border border-amber-200 dark:border-amber-800' 
            : 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-800'
        }`}>
          {is401 ? <Lock className="w-10 h-10" /> : <ShieldAlert className="w-10 h-10" />}
        </div>
        <div className={`absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow ${
          is401 ? 'bg-amber-500' : 'bg-rose-500'
        }`}>
          {is401 ? '401' : '403'}
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        {isAr ? (titleAr || defaultTitle) : (titleEn || defaultTitle)}
      </h2>

      <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        {isAr ? (messageAr || defaultMessage) : (messageEn || defaultMessage)}
      </p>

      {(requiredRole || requiredPermission) && (
        <div className="bg-slate-100 dark:bg-slate-800/60 rounded-xl p-3 mb-6 max-w-sm w-full text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          {requiredRole && (
            <div className="flex justify-between items-center py-1">
              <span>{isAr ? 'الدور المطلوب:' : 'Required Role:'}</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white px-2 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">{requiredRole}</span>
            </div>
          )}
          {requiredPermission && (
            <div className="flex justify-between items-center py-1">
              <span>{isAr ? 'الصلاحية المطلوبة:' : 'Required Permission:'}</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white px-2 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">{requiredPermission}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-center items-center">
        {showLoginButton && is401 && (
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white gap-2 shadow">
            <Link href="/login">
              <LogIn className="w-4 h-4" />
              {isAr ? 'تسجيل الدخول' : 'Log In'}
            </Link>
          </Button>
        )}

        {showHomeButton && (
          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              {isAr ? 'العودة للرئيسية' : 'Return Home'}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
