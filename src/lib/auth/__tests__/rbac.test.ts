import { normalizeRole, ROLE_PERMISSIONS_MAP, AppRole, AppPermission } from '../../../types/rbac';
import { hasPermission, hasRole, hasAnyRole, hasAnyPermission, getPermissionsForRoles } from '../rbac';

console.log('=== RUNNING KHIDMATIK RBAC TEST SUITE ===');

// 1. Test Role Normalization
const testRoles = [
  { input: 'super_admin', expected: 'SUPER_ADMIN' },
  { input: 'SUPER_ADMIN', expected: 'SUPER_ADMIN' },
  { input: 'store_owner', expected: 'STORE_OWNER' },
  { input: 'service_provider', expected: 'SERVICE_PROVIDER' },
  { input: 'delivery_rider', expected: 'DELIVERY' },
  { input: 'accountant', expected: 'FINANCE' },
  { input: 'support_agent', expected: 'SUPPORT' },
  { input: 'customer', expected: 'CUSTOMER' },
  { input: 'random_unknown', expected: 'CUSTOMER' }
];

for (const tr of testRoles) {
  const norm = normalizeRole(tr.input);
  if (norm !== tr.expected) {
    throw new Error(`Normalization failed for ${tr.input}: expected ${tr.expected}, got ${norm}`);
  }
}
console.log('✓ Role Normalization Tests Passed (9/9)');

// 2. Test Single Role Permissions
const superAdminSubject = { role: 'SUPER_ADMIN' as AppRole };
if (!hasPermission(superAdminSubject, 'manage_all')) throw new Error('Super Admin missing manage_all');
if (!hasPermission(superAdminSubject, 'manage_users')) throw new Error('Super Admin missing manage_users');
if (!hasPermission(superAdminSubject, 'manage_payments')) throw new Error('Super Admin missing manage_payments');
if (!hasPermission(superAdminSubject, 'manage_products')) throw new Error('Super Admin missing manage_products');
console.log('✓ SUPER_ADMIN Unrestricted Access Tests Passed');

const storeOwnerSubject = { role: 'STORE_OWNER' as AppRole };
if (!hasPermission(storeOwnerSubject, 'view_store_dashboard')) throw new Error('Store Owner missing view_store_dashboard');
if (!hasPermission(storeOwnerSubject, 'manage_products')) throw new Error('Store Owner missing manage_products');
if (hasPermission(storeOwnerSubject, 'manage_users')) throw new Error('Store Owner should NOT have manage_users');
if (hasPermission(storeOwnerSubject, 'manage_withdrawals')) throw new Error('Store Owner should NOT have manage_withdrawals');
console.log('✓ STORE_OWNER Granular Access Tests Passed');

const financeSubject = { role: 'FINANCE' as AppRole };
if (!hasPermission(financeSubject, 'manage_payments')) throw new Error('Finance missing manage_payments');
if (!hasPermission(financeSubject, 'manage_withdrawals')) throw new Error('Finance missing manage_withdrawals');
if (hasPermission(financeSubject, 'manage_products')) throw new Error('Finance should NOT have manage_products');
console.log('✓ FINANCE Access Tests Passed');

const customerSubject = { role: 'CUSTOMER' as AppRole };
if (!hasPermission(customerSubject, 'create_order')) throw new Error('Customer missing create_order');
if (hasPermission(customerSubject, 'view_admin_dashboard')) throw new Error('Customer should NOT have view_admin_dashboard');
if (hasPermission(customerSubject, 'manage_products')) throw new Error('Customer should NOT have manage_products');
console.log('✓ CUSTOMER Limited Access Tests Passed');

// 3. Test Multi-Role User (Store Owner + Service Provider)
const multiRoleSubject = { roles: ['STORE_OWNER', 'SERVICE_PROVIDER'] as AppRole[] };
if (!hasPermission(multiRoleSubject, 'view_store_dashboard')) throw new Error('Multi-role missing view_store_dashboard');
if (!hasPermission(multiRoleSubject, 'view_services_dashboard')) throw new Error('Multi-role missing view_services_dashboard');
if (!hasPermission(multiRoleSubject, 'manage_products')) throw new Error('Multi-role missing manage_products');
if (!hasPermission(multiRoleSubject, 'manage_bookings')) throw new Error('Multi-role missing manage_bookings');
if (hasPermission(multiRoleSubject, 'manage_users')) throw new Error('Multi-role should NOT have manage_users');
console.log('✓ Multi-Role (STORE_OWNER + SERVICE_PROVIDER) Aggregation Tests Passed');

// 4. Test hasAnyRole and hasAnyPermission
if (!hasAnyRole(storeOwnerSubject, ['STORE_OWNER', 'ADMIN'])) throw new Error('hasAnyRole failed');
if (hasAnyRole(customerSubject, ['ADMIN', 'SUPER_ADMIN'])) throw new Error('hasAnyRole false positive');
if (!hasAnyPermission(financeSubject, ['manage_payments', 'manage_users'])) throw new Error('hasAnyPermission failed');

console.log('✓ All 10 RBAC Unit & Integration Test Scenarios Passed Successfully! 🚀');
