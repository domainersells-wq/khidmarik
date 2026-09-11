'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AppPermission, AppRole } from '@/types/rbac';
import { hasPermission as rbacHasPermission, hasRole as rbacHasRole, hasAnyPermission, hasAnyRole } from '@/lib/auth/rbac';
import { UnauthorizedState } from '@/components/auth/UnauthorizedState';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermission?: AppPermission | string;
  requiredPermissions?: (AppPermission | string)[];
  requiredRole?: AppRole | string;
  requiredRoles?: (AppRole | string)[];
  loadingFallback?: React.ReactNode;
  unauthorizedFallback?: React.ReactNode;
}

export function RouteGuard({
  children,
  requiredPermission,
  requiredPermissions,
  requiredRole,
  requiredRoles,
  loadingFallback,
  unauthorizedFallback
}: RouteGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      setIsRedirecting(true);
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // 1. Loading Skeleton State
  if (isLoading || isRedirecting) {
    if (loadingFallback) return <>{loadingFallback}</>;
    return (
      <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 animate-pulse p-4 gap-4">
        <div className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 gap-4 h-full">
          <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />
          <div className="space-y-3 flex-1">
            <div className="h-7 bg-slate-100 dark:bg-slate-800/60 rounded-md w-full" />
            <div className="h-7 bg-slate-100 dark:bg-slate-800/60 rounded-md w-4/5" />
            <div className="h-7 bg-slate-100 dark:bg-slate-800/60 rounded-md w-11/12" />
            <div className="h-7 bg-slate-100 dark:bg-slate-800/60 rounded-md w-5/6" />
          </div>
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
        </div>
        
        <div className="flex-1 flex flex-col gap-4 h-full">
          <div className="h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full flex items-center justify-between px-4">
            <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
            <div className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
            <div className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
          </div>
          <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
            <div className="h-6 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
            <div className="h-64 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated -> 401 Unauthorized
  if (!user) {
    if (unauthorizedFallback) return <>{unauthorizedFallback}</>;
    return <UnauthorizedState type="unauthorized" />;
  }

  // 3. Check Single Required Permission
  if (requiredPermission && !rbacHasPermission(user, requiredPermission as AppPermission)) {
    if (unauthorizedFallback) return <>{unauthorizedFallback}</>;
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <UnauthorizedState
          type="forbidden"
          requiredPermission={requiredPermission}
        />
      </div>
    );
  }

  // 4. Check Multiple Permissions (Any)
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (!hasAnyPermission(user, requiredPermissions as AppPermission[])) {
      if (unauthorizedFallback) return <>{unauthorizedFallback}</>;
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
          <UnauthorizedState
            type="forbidden"
            requiredPermission={requiredPermissions.join(', ')}
          />
        </div>
      );
    }
  }

  // 5. Check Single Required Role
  if (requiredRole && !rbacHasRole(user, requiredRole)) {
    if (unauthorizedFallback) return <>{unauthorizedFallback}</>;
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <UnauthorizedState
          type="forbidden"
          requiredRole={requiredRole}
        />
      </div>
    );
  }

  // 6. Check Multiple Required Roles
  if (requiredRoles && requiredRoles.length > 0) {
    if (!hasAnyRole(user, requiredRoles)) {
      if (unauthorizedFallback) return <>{unauthorizedFallback}</>;
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
          <UnauthorizedState
            type="forbidden"
            requiredRole={requiredRoles.join(' / ')}
          />
        </div>
      );
    }
  }

  return <>{children}</>;
}
