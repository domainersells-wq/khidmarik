'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldAlert, LogOut, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermission: string;
}

export function RouteGuard({ children, requiredPermission }: RouteGuardProps) {
  const { user, isLoading, hasPermission, logout } = useAuth();
  const { translate } = useLanguage();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      setIsRedirecting(true);
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // 1. Loading State - Render a beautiful skeleton layout
  if (isLoading || isRedirecting) {
    return (
      <div className="flex h-screen w-full bg-slate-50 animate-pulse p-4 gap-4">
        {/* Sidebar Skeleton */}
        <div className="hidden md:flex flex-col w-64 bg-white border rounded-xl p-4 gap-4 h-full">
          <div className="h-8 w-32 bg-slate-200 rounded-md" />
          <div className="h-px bg-slate-100 w-full" />
          <div className="space-y-3 flex-1">
            <div className="h-7 bg-slate-100 rounded-md w-full" />
            <div className="h-7 bg-slate-100 rounded-md w-4/5" />
            <div className="h-7 bg-slate-100 rounded-md w-11/12" />
            <div className="h-7 bg-slate-100 rounded-md w-5/6" />
            <div className="h-7 bg-slate-100 rounded-md w-3/4" />
          </div>
          <div className="h-8 bg-slate-200 rounded-md w-full" />
        </div>
        
        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col gap-4 h-full">
          {/* Header Bar Skeleton */}
          <div className="h-14 bg-white border rounded-xl w-full flex items-center justify-between px-4">
            <div className="h-6 w-40 bg-slate-200 rounded-md" />
            <div className="h-8 w-8 bg-slate-200 rounded-full" />
          </div>
          {/* Dashboard Blocks Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-28 bg-white border rounded-xl" />
            <div className="h-28 bg-white border rounded-xl" />
            <div className="h-28 bg-white border rounded-xl" />
          </div>
          <div className="flex-1 bg-white border rounded-xl p-4 space-y-4">
            <div className="h-6 w-1/4 bg-slate-200 rounded-md" />
            <div className="h-32 bg-slate-100 rounded-md w-full animate-pulse" />
            <div className="h-32 bg-slate-100 rounded-md w-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated - Guard triggers push to login, render brief loader
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Securing session...</p>
        </div>
      </div>
    );
  }

  // 3. Unauthorized - Show premium 403 Forbidden Access Page
  if (!hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="w-full max-w-lg bg-white border border-red-100 rounded-2xl shadow-xl overflow-hidden">
          {/* Decorative Red Alert Banner */}
          <div className="bg-red-50 p-6 border-b border-red-100 flex flex-col items-center justify-center">
            <div className="bg-red-100 p-3 rounded-full text-red-600 mb-2 animate-bounce">
              <ShieldAlert className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold text-red-950 uppercase tracking-wide">403 - Forbidden</h2>
          </div>

          <div className="p-6 text-center space-y-4">
            {/* Arabic Localization */}
            <div className="space-y-1 py-1 border-b border-slate-50">
              <p className="text-base font-bold text-slate-800">عذراً، ليس لديك صلاحية الوصول!</p>
              <p className="text-xs text-muted-foreground">هذا القسم مخصص للمستخدمين المصرح لهم فقط. يرجى تسجيل الدخول بحساب ملائم.</p>
            </div>

            {/* English Localization */}
            <div className="space-y-1 py-1 border-b border-slate-50">
              <p className="text-sm font-bold text-slate-800">Access Denied</p>
              <p className="text-xs text-muted-foreground">You do not possess the required permissions to view this dashboard area.</p>
            </div>

            {/* French Localization */}
            <div className="space-y-1 py-1">
              <p className="text-sm font-bold text-slate-800">Accès Refusé</p>
              <p className="text-xs text-muted-foreground">Vous n'avez pas l'autorisation nécessaire pour accéder à ce panneau de contrôle.</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-6 bg-slate-50/50 border-t flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full sm:w-auto flex items-center gap-1.5"
            >
              <Home className="h-4 w-4" /> Return Home
            </Button>
            <Button 
              variant="destructive" 
              onClick={logout}
              className="w-full sm:w-auto flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4" /> Log Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized - Render children
  return <>{children}</>;
}
