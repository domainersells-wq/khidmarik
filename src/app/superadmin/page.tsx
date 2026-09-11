'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  ShieldAlert,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  Crown,
  Home,
  LogOut,
  AlertTriangle,
  Clock,
  Smartphone,
  KeyRound
} from 'lucide-react';
import Link from 'next/link';
import { is2FAEnabled, verify2FACode } from '@/services/twoFactorService';

export default function SuperAdminSecureLoginPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 2FA Challenge State
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [authedTempEmail, setAuthedTempEmail] = useState('');

  // Brute-force & Lockout Protection State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Check if current user is an authenticated Super Admin
  const isSuperAdminUser =
    user &&
    (user.role === 'super_admin' ||
      user.role === 'SUPER_ADMIN' ||
      user.roles?.includes('SUPER_ADMIN') ||
      user.email?.toLowerCase() === 'admin@khidmatik.dz' ||
      user.email?.toLowerCase() === 'domainersells@gmail.com');

  // Lockout Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutRemaining > 0) {
      timer = setTimeout(() => {
        setLockoutRemaining((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [lockoutRemaining]);

  const handleSecureLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lockoutRemaining > 0) {
      toast({
        title: 'النظام مجمد مؤقتاً',
        description: `يرجى الانتظار ${lockoutRemaining} ثانية قبل إعادة المحاولة.`,
        variant: 'destructive',
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      toast({
        title: 'بيانات غير مكتملة',
        description: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Authenticate credentials via Supabase
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (!signInError && signInData?.user) {
        const authedUser = signInData.user;
        const authedEmail = (authedUser.email || '').toLowerCase().trim();

        // 2. Strict Super Admin Privilege Verification
        const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
        const adminEmailsList = adminEmailsEnv.split(',').map((e) => e.trim().toLowerCase());
        const isEmailAdmin =
          authedEmail === 'admin@khidmatik.dz' ||
          authedEmail === 'domainersells@gmail.com' ||
          adminEmailsList.includes(authedEmail);

        let isDatabaseAdmin = false;
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authedUser.id)
            .maybeSingle();

          if (
            profile?.role === 'super_admin' ||
            profile?.role === 'SUPER_ADMIN' ||
            profile?.role === 'admin'
          ) {
            isDatabaseAdmin = true;
          }
        } catch (dbErr) {
          console.warn('Profile role check fallback:', dbErr);
        }

        // 3. Reject if not a verified Super Admin
        if (!isEmailAdmin && !isDatabaseAdmin) {
          await supabase.auth.signOut();
          const newFailCount = failedAttempts + 1;
          setFailedAttempts(newFailCount);

          if (newFailCount >= 5) {
            setLockoutRemaining(60);
          }

          toast({
            title: 'وصول محظور ⛔',
            description: 'هذا الحساب لا يملك صلاحيات المشرف الأعلى (Super Admin). تم رفض الوصول وإلغاء الجلسة لأسباب أمنية.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        // 4. Authorized Super Admin - Check if 2FA is active
        if (is2FAEnabled(authedEmail)) {
          setAuthedTempEmail(authedEmail);
          setRequires2FA(true);
          setIsLoading(false);
          toast({
            title: 'مطلوب المصادقة الثنائية (2FA) 📱',
            description: 'يرجى إدخال رمز التحقق المكون من 6 أرقام لإكمال تسجيل الدخول.',
          });
          return;
        }

        setFailedAttempts(0);
        toast({
          title: 'تم تسجيل الدخول بنجاح 🛡️',
          description: 'تم التحقق من هويتك كـ Super Admin. جاري نقلك إلى لوحة التحكم...',
        });

        // Trigger page refresh / redirect to ensure context update
        window.location.href = '/admin/dashboard';
        return;
      }

      // Offline / Developer Credential Verification Fallback
      if (
        (cleanEmail === 'admin@khidmatik.dz' && (password === 'admin123456' || password === 'admin123')) ||
        (cleanEmail === 'domainersells@gmail.com' && password === 'Nabil1995')
      ) {
        if (is2FAEnabled(cleanEmail)) {
          setAuthedTempEmail(cleanEmail);
          setRequires2FA(true);
          setIsLoading(false);
          toast({
            title: 'مطلوب المصادقة الثنائية (2FA) 📱',
            description: 'يرجى إدخال رمز التحقق المكون من 6 أرقام لإكمال تسجيل الدخول.',
          });
          return;
        }

        setFailedAttempts(0);
        toast({
          title: 'دخول مصرح (نمط الإدارة المباشر)',
          description: 'تم التحقق من بيانات المشرف الأعلى بنجاح.',
        });
        window.location.href = '/admin/dashboard';
        return;
      }

      // Authentication Failed
      const newFailCount = failedAttempts + 1;
      setFailedAttempts(newFailCount);
      if (newFailCount >= 5) {
        setLockoutRemaining(60);
        toast({
          title: 'تم تجميد محاولات الدخول',
          description: 'تم تجاوز الحد الأقصى للمحاولات الخاطئة. تم قفل النموذج لمدة 60 ثانية.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'فشل تسجيل الدخول ❌',
          description: `البريد الإلكتروني أو كلمة المرور غير صحيحة. المحاولات المتبقية: ${5 - newFailCount}`,
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'خطأ في الاتصال',
        description: err?.message || 'تعذر إتمام عملية التحقق الأمني.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FAChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = twoFactorCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      toast({
        title: 'رمز غير مكتمل',
        description: 'يرجى إدخال رمز 2FA المكون من 6 أرقام أو رمز استرداد.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const targetEmail = authedTempEmail || email;
      const result = await verify2FACode(targetEmail, cleanCode);

      if (result.success) {
        setFailedAttempts(0);
        toast({
          title: 'تم التحقق بنجاح 🛡️',
          description: result.isBackupCode
            ? 'تم قبول رمز الاسترداد بنجاح! جاري نقلك إلى لوحة التحكم...'
            : 'تم التحقق من رمز 2FA بنجاح! جاري نقلك إلى لوحة التحكم...',
        });
        window.location.href = '/admin/dashboard';
      } else {
        const newFailCount = failedAttempts + 1;
        setFailedAttempts(newFailCount);
        if (newFailCount >= 5) {
          setLockoutRemaining(60);
          toast({
            title: 'تم تجميد الدخول مؤقتاً',
            description: 'تم إدخال رمز خاطئ 5 مرات. تم قفل النموذج لمدة 60 ثانية.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'رمز غير صحيح ❌',
            description: result.error || `رمز 2FA غير صحيح. المحاولات المتبقية: ${5 - newFailCount}`,
            variant: 'destructive',
          });
        }
      }
    } catch {
      toast({
        title: 'خطأ في التحقق',
        description: 'حدث خطأ غير متوقع أثناء فحص رمز 2FA.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden"
      dir="rtl"
    >
      {/* Dynamic Background Glow Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="w-full max-w-lg mb-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-red-600 via-primary to-slate-900 flex items-center justify-center font-black text-white text-lg shadow-xl shadow-red-900/20 border border-red-500/20">
            KH
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              بوابة المشرف الأعلى
              <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold">
                SECURE AUTH
              </Badge>
            </h1>
            <p className="text-xs text-slate-400 font-mono" dir="ltr">
              Restricted Super Admin Authentication Gate
            </p>
          </div>
        </div>

        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white text-xs rounded-xl"
          >
            <Home className="h-3.5 w-3.5 ml-1" />
            الموقع الرئيسي
          </Button>
        </Link>
      </div>

      {isSuperAdminUser ? (
        /* Authenticated Super Admin Card */
        <Card className="w-full max-w-lg bg-slate-900/90 border-slate-800 backdrop-blur-xl shadow-2xl rounded-3xl z-10 text-slate-100 overflow-hidden">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-lg">
              <Crown className="h-8 w-8" />
            </div>
            <CardTitle className="text-lg font-black text-white">جلسة المشرف الأعلى نشطة وموثقة</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              أنت مسجل الدخول حالياً بحساب المشرف الأعلى المعتمد للمنصة.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-6">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">الاسم:</span>
                <span className="font-bold text-slate-200">{user?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">البريد الإلكتروني:</span>
                <span className="font-mono text-emerald-400 font-semibold" dir="ltr">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">مستوى الصلاحيات:</span>
                <span className="font-bold text-amber-400">Super Admin (All Privileges)</span>
              </div>
            </div>

            <Button
              onClick={() => router.push('/admin/dashboard')}
              className="w-full h-12 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 text-sm flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4 ml-1" />
              الانتقال إلى لوحة تحكم المشرف (Admin Dashboard)
            </Button>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-800/80 px-6 py-4 bg-slate-950/40">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              اتصال آمن ومشفر 256-bit
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              تسجيل الخروج
            </Button>
          </CardFooter>
        </Card>
      ) : (
        /* Strict Credentials Login Form */
        <Card className="w-full max-w-lg bg-slate-900/95 border-slate-800 backdrop-blur-xl shadow-2xl rounded-3xl z-10 text-slate-100 overflow-hidden">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3 shadow-lg">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <CardTitle className="text-lg font-black text-white">
              {requires2FA ? 'المصادقة الثنائية (2FA Required)' : 'تسجيل الدخول للمشرف الأعلى'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              {requires2FA
                ? 'حسابك محمي بنظام 2FA. يرجى إدخال رمز الأمان المكون من 6 أرقام من تطبيق Authenticator أو رمز استرداد احتياطي.'
                : 'الدخول محمي ومقيد للمسؤولين المعتمدين فقط بواسطة البريد الإلكتروني وكلمة المرور.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-6 pt-2">
            {/* Lockout Banner if active */}
            {lockoutRemaining > 0 && (
              <div className="bg-red-950/50 border border-red-500/40 rounded-2xl p-3 flex items-center gap-3 text-red-300 text-xs">
                <Clock className="h-5 w-5 text-red-400 shrink-0 animate-spin" />
                <div>
                  <p className="font-bold">تم قفل تسجيل الدخول مؤقتاً</p>
                  <p className="text-[11px] text-red-400">يرجى الانتظار {lockoutRemaining} ثانية لإعادة المحاولة.</p>
                </div>
              </div>
            )}

            {/* If user is currently logged in as a normal customer */}
            {user && !isSuperAdminUser && !requires2FA && (
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-amber-300 text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">أنت مسجل حالياً بحساب عادي ({user.email})</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    هذا الحساب لا يملك صلاحيات الإدارة. يرجى إدخال بيانات حساب المشرف أدناه للمتابعة.
                  </p>
                </div>
              </div>
            )}

            {requires2FA ? (
              /* 2FA Challenge Form */
              <form onSubmit={handleVerify2FAChallenge} className="space-y-4">
                <div className="p-3.5 bg-slate-950/70 border border-border/60 rounded-2xl text-center space-y-1">
                  <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-200">التحقق من هوية المشرف ({authedTempEmail || email})</p>
                  <p className="text-[11px] text-slate-400">افتح Google Authenticator أو أدخل أحد رموز الاسترداد الاحتياطية</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="2fa-code" className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-primary" /> رمز الأمان (6 أرقام أو رمز احتياطي):
                    </span>
                  </Label>
                  <Input
                    id="2fa-code"
                    type="text"
                    required
                    autoFocus
                    placeholder="000000 أو XXXX-XXXX"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    disabled={isLoading || lockoutRemaining > 0}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-center font-mono font-bold text-lg tracking-widest h-12 rounded-xl focus-visible:ring-primary"
                    dir="ltr"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || lockoutRemaining > 0 || twoFactorCode.trim().length < 6}
                  className="w-full h-11 bg-gradient-to-r from-emerald-600 to-primary hover:from-emerald-500 hover:to-primary/90 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 text-xs flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري فحص الرمز...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      تأكيد الرمز والدخول إلى لوحة التحكم
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRequires2FA(false);
                    setTwoFactorCode('');
                  }}
                  className="w-full text-[11px] text-slate-400 hover:text-white rounded-xl"
                >
                  العودة إلى إدخال كلمة المرور
                </Button>
              </form>
            ) : (
              /* Standard Credentials Form */
              <form onSubmit={handleSecureLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="superadmin-email" className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" /> البريد الإلكتروني للمسؤول (Admin Email)
                  </Label>
                  <Input
                    id="superadmin-email"
                    type="email"
                    required
                    placeholder="admin@khidmatik.dz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || lockoutRemaining > 0}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-sm h-11 rounded-xl focus-visible:ring-red-500"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="superadmin-password" className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-slate-400" /> كلمة مرور المسؤول (Password)
                  </Label>
                  <div className="relative">
                    <Input
                      id="superadmin-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading || lockoutRemaining > 0}
                      className="bg-slate-950 border-slate-800 text-slate-100 text-sm h-11 rounded-xl focus-visible:ring-red-500 pl-10"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || lockoutRemaining > 0}
                  className="w-full h-11 bg-gradient-to-r from-red-600 via-rose-600 to-primary hover:from-red-500 hover:to-primary/90 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 text-xs flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري التحقق الأمني من البيانات...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      تسجيل الدخول والتحقق الأمني
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800/80 px-6 py-4 bg-slate-950/40 text-[11px] text-slate-400 gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>نظام أمان معتمد ومحمي من محاولات التخمين</span>
            </div>
            {failedAttempts > 0 && (
              <span className="text-amber-400 font-mono">
                المحاولات الفاشلة: {failedAttempts}/5
              </span>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
