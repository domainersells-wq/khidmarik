import { AppRole, AppPermission, ROLE_PERMISSIONS_MAP, normalizeRole } from '@/types/rbac';

export interface RBACSubject {
  roles?: (AppRole | string)[];
  role?: AppRole | string;
  permissions?: AppPermission[];
}

/**
 * Computes the complete list of unique permissions for a set of roles
 */
export function getPermissionsForRoles(roles: (AppRole | string)[]): AppPermission[] {
  const permSet = new Set<AppPermission>();
  
  for (const rawRole of roles) {
    const role = normalizeRole(rawRole);
    const rolePerms = ROLE_PERMISSIONS_MAP[role] || [];
    for (const p of rolePerms) {
      permSet.add(p);
    }
  }

  return Array.from(permSet);
}

/**
 * Checks if a user has a specific permission
 */
export function hasPermission(
  subject: RBACSubject | null | undefined,
  requiredPermission: AppPermission
): boolean {
  if (!subject) return false;

  const roles = subject.roles && subject.roles.length > 0
    ? subject.roles
    : (subject.role ? [subject.role] : []);

  // SUPER_ADMIN has unconditional full access
  const isSuperAdmin = roles.some(r => normalizeRole(r) === 'SUPER_ADMIN');
  if (isSuperAdmin) return true;

  // Check explicit permissions attached to user
  if (subject.permissions && (subject.permissions.includes(requiredPermission) || subject.permissions.includes('manage_all'))) {
    return true;
  }

  // Calculate permissions from user roles
  const effectivePerms = getPermissionsForRoles(roles);
  return effectivePerms.includes(requiredPermission) || effectivePerms.includes('manage_all');
}

/**
 * Checks if a user has ANY of the specified permissions
 */
export function hasAnyPermission(
  subject: RBACSubject | null | undefined,
  permissions: AppPermission[]
): boolean {
  if (!subject || permissions.length === 0) return false;
  return permissions.some(p => hasPermission(subject, p));
}

/**
 * Checks if a user has ALL of the specified permissions
 */
export function hasAllPermissions(
  subject: RBACSubject | null | undefined,
  permissions: AppPermission[]
): boolean {
  if (!subject || permissions.length === 0) return false;
  return permissions.every(p => hasPermission(subject, p));
}

/**
 * Checks if a user has a specific role
 */
export function hasRole(
  subject: RBACSubject | null | undefined,
  role: AppRole | string
): boolean {
  if (!subject) return false;
  const targetRole = normalizeRole(role);

  const roles = subject.roles && subject.roles.length > 0
    ? subject.roles
    : (subject.role ? [subject.role] : []);

  return roles.some(r => normalizeRole(r) === targetRole || normalizeRole(r) === 'SUPER_ADMIN');
}

/**
 * Checks if a user has ANY of the specified roles
 */
export function hasAnyRole(
  subject: RBACSubject | null | undefined,
  roles: (AppRole | string)[]
): boolean {
  if (!subject || roles.length === 0) return false;
  return roles.some(r => hasRole(subject, r));
}
