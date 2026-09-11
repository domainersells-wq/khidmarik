'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppPermission, AppRole } from '@/types/rbac';
import { hasPermission, hasRole, hasAnyPermission, hasAnyRole } from '@/lib/auth/rbac';

export interface ProtectedComponentProps {
  children: React.ReactNode;
  requiredPermission?: AppPermission;
  requiredPermissions?: AppPermission[];
  requireAllPermissions?: boolean;
  requiredRole?: AppRole | string;
  requiredRoles?: (AppRole | string)[];
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children if the authenticated user has the required permission(s) or role(s).
 */
export function ProtectedComponent({
  children,
  requiredPermission,
  requiredPermissions,
  requireAllPermissions = false,
  requiredRole,
  requiredRoles,
  fallback = null
}: ProtectedComponentProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <>{fallback}</>;
  }

  // Single permission check
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return <>{fallback}</>;
  }

  // Multiple permissions check
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (requireAllPermissions) {
      const allPassed = requiredPermissions.every(p => hasPermission(user, p));
      if (!allPassed) return <>{fallback}</>;
    } else {
      if (!hasAnyPermission(user, requiredPermissions)) {
        return <>{fallback}</>;
      }
    }
  }

  // Single role check
  if (requiredRole && !hasRole(user, requiredRole)) {
    return <>{fallback}</>;
  }

  // Multiple roles check
  if (requiredRoles && requiredRoles.length > 0) {
    if (!hasAnyRole(user, requiredRoles)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
