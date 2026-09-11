/**
 * Centralized Role-Based Access Control (RBAC) Types & Definitions
 * Khidmatik Super App Engine
 */

export type AppRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MODERATOR'
  | 'SUPPORT'
  | 'FINANCE'
  | 'STORE_OWNER'
  | 'SERVICE_PROVIDER'
  | 'CUSTOMER'
  | 'DELIVERY';

// Legacy lowercase role types mapping for backward compatibility
export type LegacyUserRole =
  | 'super_admin'
  | 'store_owner'
  | 'service_provider'
  | 'seller'
  | 'supplier'
  | 'employee'
  | 'accountant'
  | 'branch_manager'
  | 'support_agent'
  | 'delivery_rider'
  | 'marketing_manager'
  | 'franchisee'
  | 'customer';

export type UserRole = AppRole | LegacyUserRole;

export type AppPermission =
  | 'manage_all'
  | 'manage_users'
  | 'manage_providers'
  | 'manage_stores'
  | 'manage_products'
  | 'manage_orders'
  | 'manage_bookings'
  | 'manage_payments'
  | 'manage_reviews'
  | 'manage_disputes'
  | 'manage_withdrawals'
  | 'manage_settings'
  | 'view_analytics'
  | 'manage_content'
  | 'manage_delivery'
  | 'view_admin_dashboard'
  | 'view_store_dashboard'
  | 'view_services_dashboard'
  | 'create_order'
  | 'create_booking'
  | 'create_review';

export interface UserRoleRecord {
  role: AppRole;
  isPrimary?: boolean;
  assignedAt?: string;
}

/**
 * Standard Role to Permissions Mapping Matrix
 */
export const ROLE_PERMISSIONS_MAP: Record<AppRole, AppPermission[]> = {
  SUPER_ADMIN: [
    'manage_all',
    'manage_users',
    'manage_providers',
    'manage_stores',
    'manage_products',
    'manage_orders',
    'manage_bookings',
    'manage_payments',
    'manage_reviews',
    'manage_disputes',
    'manage_withdrawals',
    'manage_settings',
    'view_analytics',
    'manage_content',
    'manage_delivery',
    'view_admin_dashboard',
    'view_store_dashboard',
    'view_services_dashboard',
    'create_order',
    'create_booking',
    'create_review'
  ],
  ADMIN: [
    'manage_users',
    'manage_providers',
    'manage_stores',
    'manage_products',
    'manage_orders',
    'manage_bookings',
    'manage_payments',
    'manage_reviews',
    'manage_disputes',
    'manage_withdrawals',
    'manage_settings',
    'view_analytics',
    'manage_content',
    'manage_delivery',
    'view_admin_dashboard',
    'view_store_dashboard',
    'view_services_dashboard',
    'create_order',
    'create_booking',
    'create_review'
  ],
  MODERATOR: [
    'manage_reviews',
    'manage_disputes',
    'manage_content',
    'manage_providers',
    'manage_stores',
    'view_admin_dashboard'
  ],
  SUPPORT: [
    'manage_orders',
    'manage_bookings',
    'manage_reviews',
    'manage_disputes',
    'view_admin_dashboard',
    'view_store_dashboard',
    'view_services_dashboard'
  ],
  FINANCE: [
    'manage_payments',
    'manage_withdrawals',
    'manage_disputes',
    'view_analytics',
    'view_admin_dashboard'
  ],
  STORE_OWNER: [
    'view_store_dashboard',
    'manage_products',
    'manage_orders',
    'manage_settings',
    'view_analytics',
    'create_order',
    'create_review'
  ],
  SERVICE_PROVIDER: [
    'view_services_dashboard',
    'manage_bookings',
    'manage_settings',
    'view_analytics',
    'create_order',
    'create_review'
  ],
  DELIVERY: [
    'manage_delivery',
    'view_store_dashboard',
    'manage_orders'
  ],
  CUSTOMER: [
    'create_order',
    'create_booking',
    'create_review'
  ]
};

/**
 * Normalizes any role string to standard uppercase AppRole
 */
export function normalizeRole(role: string | undefined | null): AppRole {
  if (!role) return 'CUSTOMER';
  const upper = role.toUpperCase().trim();
  
  if (upper === 'SUPER_ADMIN') return 'SUPER_ADMIN';
  if (upper === 'ADMIN') return 'ADMIN';
  if (upper === 'MODERATOR') return 'MODERATOR';
  if (upper === 'SUPPORT' || upper === 'SUPPORT_AGENT') return 'SUPPORT';
  if (upper === 'FINANCE' || upper === 'ACCOUNTANT') return 'FINANCE';
  if (upper === 'STORE_OWNER' || upper === 'SELLER' || upper === 'SUPPLIER' || upper === 'BRANCH_MANAGER') return 'STORE_OWNER';
  if (upper === 'SERVICE_PROVIDER' || upper === 'CRAFTSMAN' || upper === 'FREELANCER' || upper === 'PROFESSIONAL') return 'SERVICE_PROVIDER';
  if (upper === 'DELIVERY' || upper === 'DELIVERY_RIDER') return 'DELIVERY';
  return 'CUSTOMER';
}
