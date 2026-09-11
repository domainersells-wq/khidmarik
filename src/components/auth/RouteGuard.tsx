'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppPermission, AppRole } from '@/types/rbac';
import { hasPermission, hasRole, hasAnyPermission, hasAnyRole } from '@/lib/auth/rbac';
import { UnauthorizedState } from './UnauthorizedState';
import { Loader2 } from 'lucide-react';

export interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermission?: AppPermission;
  requiredPermissions?: AppPermission[];
  requireAllPermissions?: boolean;
  requiredRole?: AppRole | string;
  requiredRoles?: (AppRole | string)[];
  loadingFallback?: React.ReactNode;
  unauthorizedFallback?: React.ReactNode;
}

/**
 * RouteGuard wraps page contents and prevents unauthorized/forbidden access.
 * Displays a clean 401 or 403 state when access is not permitted.
 */
export function RouteGuard({
  children,
  requiredPermission,
  requiredPermissions,
  requireAllPermissions = false,
  requiredRole,
  requiredRoles,
  loadingFallback,
  unauthorizedFallback
}: RouteGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    if (loadingFallback) return <>{loadingFallback}</>;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-sm text-slate-500 font-medium">جاري التحقق من الصلاحيات... / Verifying permissions...</span>
      </div>
    );
  }

  // Not logged in -> 401 Unauthorized
  if (!user) {
    if (unauthorizedFallback) return <>{unauthorizedFallback}</>;
    return (
      <UnauthorizedState
        type="unauthorized"
        requiredRole={requiredRole as string || (requiredRoles ? requiredRoles.join(', ') : undefined)}
        requiredPermission={requiredPermission || (requiredPermissions ? requiredPermissions.join(', ') : undefined)}
      />
    );
  }

  // Permission Checks -> 403 Forbidden
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    if (unauthorizedFallback) return <>{unauthorizedFallback}</>;
    return (
      <UnauthorizedState
        type="forbidden"
        requiredPermission={requiredPermission}
      />
    );
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const passed = requireAllPermissions
      ? requiredPermissions.every(p => hasPermission(user, p))
      : hasAnyPermission(user, requiredPermissions);

    if (!passed) {
      if (unauthorizedFallback) return <>{unauthorizedFallback}</>;
      return (
        <UnauthorizedState
          type="forbidden"
          requiredPermission={requiredPermissions.join(', ')}
        />
      );
    }
  }

  // Role Checks -> 403 Forbidden
  if (requiredRole && !hasRole(user, requiredRole)) {
    if (unauthorizedFallback) return <>{unauthorizedFallback}</>;
    return (
      <UnauthorizedState
        type="forbidden"
        requiredRole={requiredRole as string}
      />
    );
  }

  if (requiredRoles && requiredRoles.length > 0) {
    if (!hasAnyRole(user, requiredRoles)) {
      if (unauthorizedFallback) return <>{unauthorizedFallback}</>;
      return (
        <UnauthorizedState
          type="forbidden"
          requiredRole={requiredRoles.join(' / ')}
        />
      );
    }
  }

  return <>{children}</>;
}
