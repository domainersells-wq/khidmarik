import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AppPermission, AppRole, normalizeRole } from '@/types/rbac';
import { hasPermission, hasRole } from './rbac';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: AppRole;
  roles: AppRole[];
  permissions: AppPermission[];
}

export interface AuthValidationResult {
  authorized: boolean;
  user?: AuthenticatedUser;
  response?: NextResponse;
}

/**
 * Validates request Bearer token or Supabase session on server side,
 * enforcing required permissions or roles.
 */
export async function validateApiAuth(
  req: NextRequest,
  options?: {
    requiredPermissions?: AppPermission[];
    requiredRoles?: (AppRole | string)[];
    allowSelfOrAdminId?: string; // Optional user ID check
  }
): Promise<AuthValidationResult> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  if (!token) {
    // Check if development fallback header or query parameter is supplied
    const devUserId = req.headers.get('x-user-id');
    const devUserRole = req.headers.get('x-user-role');

    if (devUserId && devUserRole) {
      const normRole = normalizeRole(devUserRole);
      const devUser: AuthenticatedUser = {
        id: devUserId,
        email: 'dev@khidmatik.dz',
        role: normRole,
        roles: [normRole],
        permissions: []
      };

      if (options?.requiredPermissions?.length) {
        const canAccess = options.requiredPermissions.some(p => hasPermission(devUser, p));
        if (!canAccess) {
          return {
            authorized: false,
            response: NextResponse.json(
              { error: 'Forbidden: Insufficient permissions', code: 'FORBIDDEN', requiredPermissions: options.requiredPermissions },
              { status: 403 }
            )
          };
        }
      }

      if (options?.requiredRoles?.length) {
        const hasRequiredRole = options.requiredRoles.some(r => hasRole(devUser, r));
        if (!hasRequiredRole) {
          return {
            authorized: false,
            response: NextResponse.json(
              { error: 'Forbidden: Role not authorized', code: 'FORBIDDEN', requiredRoles: options.requiredRoles },
              { status: 403 }
            )
          };
        }
      }

      return { authorized: true, user: devUser };
    }

    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized: Missing authentication token', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    };
  }

  // Verify JWT token with Supabase Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized: Invalid or expired token', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    };
  }

  // Fetch user roles and profile
  let primaryRole: AppRole = 'CUSTOMER';
  const rolesList: AppRole[] = [];

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role) {
    primaryRole = normalizeRole(profile.role);
    rolesList.push(primaryRole);
  }

  // Check multi-roles table if exists
  const { data: userRolesData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  if (userRolesData && Array.isArray(userRolesData)) {
    for (const r of userRolesData) {
      const normalized = normalizeRole(r.role);
      if (!rolesList.includes(normalized)) {
        rolesList.push(normalized);
      }
    }
  }

  if (rolesList.length === 0) {
    rolesList.push('CUSTOMER');
  }

  const authenticatedUser: AuthenticatedUser = {
    id: user.id,
    email: user.email || '',
    role: primaryRole,
    roles: rolesList,
    permissions: []
  };

  // Self or Admin bypass check
  if (options?.allowSelfOrAdminId) {
    const isSelf = authenticatedUser.id === options.allowSelfOrAdminId;
    const isSuperAdmin = authenticatedUser.roles.includes('SUPER_ADMIN');
    if (isSelf || isSuperAdmin) {
      return { authorized: true, user: authenticatedUser };
    }
  }

  // Check Permissions
  if (options?.requiredPermissions && options.requiredPermissions.length > 0) {
    const hasPerm = options.requiredPermissions.some(p => hasPermission(authenticatedUser, p));
    if (!hasPerm) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Forbidden: Insufficient permissions for this action', code: 'FORBIDDEN', requiredPermissions: options.requiredPermissions },
          { status: 403 }
        )
      };
    }
  }

  // Check Roles
  if (options?.requiredRoles && options.requiredRoles.length > 0) {
    const isAllowedRole = options.requiredRoles.some(r => hasRole(authenticatedUser, r));
    if (!isAllowedRole) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Forbidden: Role not authorized for this action', code: 'FORBIDDEN', requiredRoles: options.requiredRoles },
          { status: 403 }
        )
      };
    }
  }

  return { authorized: true, user: authenticatedUser };
}
