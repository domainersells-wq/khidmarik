'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function DashboardDispatcherPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login?redirect=/dashboard');
      return;
    }

    if (user.role === 'super_admin') {
      router.replace('/admin/dashboard');
    } else if (user.role === 'store_owner') {
      router.replace('/dashboard/store');
    } else if (user.role === 'service_provider') {
      router.replace('/dashboard/professional-services');
    } else {
      router.replace('/profile');
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">جاري توجيهك إلى لوحة التحكم المخصصة...</p>
    </div>
  );
}
