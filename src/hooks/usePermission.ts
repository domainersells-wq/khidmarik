'use client';

import { useAuth } from '@/context/AuthContext';
import { AppPermission, AppRole } from '@/types/rbac';
import { hasPermission, hasRole, hasAnyPermission, hasAnyRole, hasAllPermissions } from '@/lib/auth/rbac';

export function usePermission(permission: AppPermission): boolean {
  const { user } = useAuth();
  return hasPermission(user, permission);
}

export function useAnyPermission(permissions: AppPermission[]): boolean {
  const { user } = useAuth();
  return hasAnyPermission(user, permissions);
}

export function useAllPermissions(permissions: AppPermission[]): boolean {
  const { user } = useAuth();
  return hasAllPermissions(user, permissions);
}

export function useRole(role: AppRole | string): boolean {
  const { user } = useAuth();
  return hasRole(user, role);
}

export function useAnyRole(roles: (AppRole | string)[]): boolean {
  const { user } = useAuth();
  return hasAnyRole(user, roles);
}

export function useIsSuperAdmin(): boolean {
  const { user } = useAuth();
  return hasRole(user, 'SUPER_ADMIN');
}
