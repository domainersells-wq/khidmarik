'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Users, UserPlus, Shield, UserCheck, UserX, Eye, Edit3, Trash2, 
  Mail, Phone, MapPin, CheckCircle, ShieldAlert, KeyRound, Lock, 
  Unlock, Ban, RefreshCw, Smartphone, CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminDataService, AdminUser } from '@/services/adminDataService';
import { AdminDataTable, ColumnDef, FilterOption, BulkAction } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer, DetailField, MetricCard } from '@/components/admin/shared/AdminDetailDrawer';
import { AdminConfirmModal } from '@/components/admin/shared/AdminConfirmModal';
import { cn } from '@/lib/utils';

export function UserManagementSection() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Confirmation state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
    variant: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: () => {},
    variant: 'warning',
  });

  // New user form state
  const [newUser, setNewUser] = useState({
    userName: '',
    email: '',
    phone: '',
    role: 'customer' as AdminUser['role'],
    wilaya: 'Algiers (16)',
    city: 'Alger Centre',
    status: 'active' as AdminUser['status'],
  });

  const loadData = () => {
    setUsers(adminDataService.getUsers());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = (userId: string, newStatus: AdminUser['status']) => {
    adminDataService.updateUserStatus(userId, newStatus);
    loadData();
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser({ ...selectedUser, status: newStatus });
    }
    toast({
      title: 'User Status Updated',
      description: `User status changed to ${newStatus}.`,
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.userName || !newUser.email || !newUser.phone) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    const created: AdminUser = {
      id: `usr_${Date.now()}`,
      userName: newUser.userName,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      status: newUser.status,
      wilaya: newUser.wilaya,
      city: newUser.city,
      registrationDate: new Date().toISOString().slice(0, 10),
      lastLogin: 'Never',
      ordersCount: 0,
      totalSpent: 0,
      verifiedEmail: false,
      verifiedPhone: true,
      twoFactorEnabled: false,
      activityHistory: [
        {
          id: `act_${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          actor: 'Super Admin',
          action: 'Account Created',
          details: `Manual registration by administrator with role: ${newUser.role}`,
        },
      ],
    };

    const updated = [created, ...users];
    adminDataService.saveUsers(updated);
    adminDataService.recordAudit('Super Admin', 'CREATE', 'User', created.id, `Created user ${created.userName} (${created.email})`);
    setUsers(updated);
    setIsAddOpen(false);
    setNewUser({
      userName: '',
      email: '',
      phone: '',
      role: 'customer',
      wilaya: 'Algiers (16)',
      city: 'Alger Centre',
      status: 'active',
    });
    toast({
      title: 'User Created',
      description: `User ${created.userName} was added successfully.`,
    });
  };

  const filterOptions: FilterOption[] = [
    {
      key: 'role',
      label: 'Role',
      options: [
        { label: 'Super Admin', value: 'super_admin' },
        { label: 'Admin', value: 'admin' },
        { label: 'Moderator', value: 'moderator' },
        { label: 'Finance', value: 'finance' },
        { label: 'Store Owner', value: 'store_owner' },
        { label: 'Service Provider', value: 'service_provider' },
        { label: 'Customer', value: 'customer' },
        { label: 'Delivery', value: 'delivery' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Pending Verification', value: 'pending_verification' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Banned', value: 'banned' },
      ],
    },
  ];

  const bulkActions: BulkAction<AdminUser>[] = [
    {
      label: 'Activate Selected',
      icon: CheckCircle,
      variant: 'default',
      action: (selected) => {
        setConfirmState({
          isOpen: true,
          title: `Activate ${selected.length} Users`,
          description: `Are you sure you want to mark ${selected.length} selected users as Active?`,
          variant: 'info',
          action: () => {
            selected.forEach((u) => adminDataService.updateUserStatus(u.id, 'active'));
            loadData();
            setConfirmState((prev) => ({ ...prev, isOpen: false }));
            toast({ title: 'Bulk Update', description: `${selected.length} users marked as active.` });
          },
        });
      },
    },
    {
      label: 'Suspend Selected',
      icon: Ban,
      variant: 'destructive',
      action: (selected) => {
        setConfirmState({
          isOpen: true,
          title: `Suspend ${selected.length} Users`,
          description: `Are you sure you want to suspend access for ${selected.length} selected accounts?`,
          variant: 'danger',
          action: () => {
            selected.forEach((u) => adminDataService.updateUserStatus(u.id, 'suspended'));
            loadData();
            setConfirmState((prev) => ({ ...prev, isOpen: false }));
            toast({ title: 'Bulk Suspend', description: `${selected.length} users suspended.` });
          },
        });
      },
    },
  ];

  const columns: ColumnDef<AdminUser>[] = [
    {
      header: 'User Info',
      accessorKey: 'userName',
      cell: (user) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 uppercase">
            {user.userName.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              {user.userName}
              {user.twoFactorEnabled && (
                <span title="2FA Active"><Shield className="h-3.5 w-3.5 text-blue-500" /></span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Phone / Wilaya',
      accessorKey: 'phone',
      cell: (user) => (
        <div className="space-y-0.5">
          <div className="text-xs font-mono font-medium text-foreground">{user.phone}</div>
          <div className="text-xs text-muted-foreground">{user.wilaya}</div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: (user) => {
        const roleLabels: Record<string, string> = {
          super_admin: 'Super Admin',
          admin: 'Admin',
          moderator: 'Moderator',
          finance: 'Finance',
          store_owner: 'Store Owner',
          service_provider: 'Provider',
          customer: 'Customer',
          delivery: 'Delivery Rider',
        };
        return (
          <Badge variant="outline" className="font-medium text-xs capitalize bg-muted/30">
            {roleLabels[user.role] || user.role}
          </Badge>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (user) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          active: 'default',
          pending_verification: 'secondary',
          inactive: 'outline',
          suspended: 'destructive',
          banned: 'destructive',
        };
        return (
          <Badge variant={variants[user.status] || 'outline'} className="capitalize text-xs">
            {user.status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      header: 'Registered',
      accessorKey: 'registrationDate',
      cell: (user) => <span className="text-xs text-muted-foreground">{user.registrationDate}</span>,
    },
    {
      header: 'Orders / Spent',
      accessorKey: 'totalSpent',
      cell: (user) => (
        <div className="text-xs">
          <span className="font-bold text-foreground">{user.totalSpent.toLocaleString()} DA</span>
          <span className="text-muted-foreground block">({user.ordersCount} orders)</span>
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (user) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => {
              setSelectedUser(user);
              setIsDetailOpen(true);
            }}
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> View
          </Button>
          {user.status === 'active' ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => {
                setConfirmState({
                  isOpen: true,
                  title: `Suspend ${user.userName}`,
                  description: 'Are you sure you want to suspend this user? They will not be able to log in.',
                  variant: 'danger',
                  action: () => {
                    handleStatusChange(user.id, 'suspended');
                    setConfirmState((prev) => ({ ...prev, isOpen: false }));
                  },
                });
              }}
            >
              <Ban className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={() => handleStatusChange(user.id, 'active')}
            >
              <UserCheck className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const storeOwners = users.filter((u) => u.role === 'store_owner').length;
  const providers = users.filter((u) => u.role === 'service_provider').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center tracking-tight">
            <Users className="mr-3 h-8 w-8 text-primary" /> User Directory
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage all platform users, staff roles, permissions, verification states, and activity logs.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="h-10 px-4 rounded-xl font-medium">
          <UserPlus className="h-4 w-4 mr-2" /> Add New User
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all 58 Wilayas</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Active Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Verified & Active</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Store Owners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{storeOwners}</div>
            <p className="text-xs text-muted-foreground mt-1">Marketplace Merchants</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Craftsmen & Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{providers}</div>
            <p className="text-xs text-muted-foreground mt-1">Verified Professionals</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <AdminDataTable
        data={users}
        columns={columns}
        searchPlaceholder="Search users by name, email, phone, wilaya..."
        searchKeys={['userName', 'email', 'phone', 'wilaya', 'city', 'role']}
        filterOptions={filterOptions}
        bulkActions={bulkActions}
        exportFileName="khidmatik_users"
        onRowClick={(user) => {
          setSelectedUser(user);
          setIsDetailOpen(true);
        }}
        onRefresh={loadData}
      />

      {/* Detail Drawer */}
      {selectedUser && (
        <AdminDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedUser.userName}
          subtitle={`User ID: ${selectedUser.id} • Registered: ${selectedUser.registrationDate}`}
          statusBadge={{
            label: selectedUser.status.replace('_', ' '),
            variant: selectedUser.status === 'active' ? 'default' : 'destructive',
          }}
          metrics={[
            { label: 'Total Spent', value: `${selectedUser.totalSpent.toLocaleString()} DA`, icon: CreditCard },
            { label: 'Orders Made', value: selectedUser.ordersCount, icon: Users },
            { label: 'Role', value: selectedUser.role.toUpperCase(), icon: Shield },
            { label: '2FA Auth', value: selectedUser.twoFactorEnabled ? 'Enabled' : 'Disabled', icon: Lock },
          ]}
          fields={[
            { label: 'Full Name', value: selectedUser.userName, icon: Users },
            { label: 'Email Address', value: selectedUser.email, icon: Mail },
            { label: 'Phone Number', value: selectedUser.phone, icon: Phone },
            { label: 'Wilaya / Location', value: `${selectedUser.city}, ${selectedUser.wilaya}`, icon: MapPin },
            { label: 'Last Login', value: selectedUser.lastLogin, icon: KeyRound },
            { label: 'Email Verification', value: selectedUser.verifiedEmail ? 'Verified' : 'Unverified' },
            { label: 'Phone Verification', value: selectedUser.verifiedPhone ? 'Verified (SMS OTP)' : 'Unverified' },
          ]}
          activityHistory={selectedUser.activityHistory || [
            {
              timestamp: `${selectedUser.registrationDate} 10:00`,
              actor: 'System',
              action: 'Account Registration',
              details: 'Signed up via Khidmatik Web Application',
            },
          ]}
          actions={
            <div className="flex items-center gap-2">
              {selectedUser.status === 'active' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    handleStatusChange(selectedUser.id, 'suspended');
                  }}
                >
                  <Ban className="h-4 w-4 mr-1.5" /> Suspend Account
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    handleStatusChange(selectedUser.id, 'active');
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" /> Activate Account
                </Button>
              )}
            </div>
          }
        />
      )}

      {/* Add User Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Platform User</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Create a new user account and assign administrative or operational roles.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Full Name *</Label>
              <Input
                placeholder="e.g. Youcef Belaili"
                value={newUser.userName}
                onChange={(e) => setNewUser({ ...newUser, userName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Email Address *</Label>
                <Input
                  type="email"
                  placeholder="youcef@example.dz"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Phone Number *</Label>
                <Input
                  placeholder="+213 550 12 34 56"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Role *</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(val: any) => setNewUser({ ...newUser, role: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="store_owner">Store Owner</SelectItem>
                    <SelectItem value="service_provider">Service Provider</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="finance">Finance Officer</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Wilaya *</Label>
                <Input
                  placeholder="Algiers (16)"
                  value={newUser.wilaya}
                  onChange={(e) => setNewUser({ ...newUser, wilaya: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <AdminConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.action}
        title={confirmState.title}
        description={confirmState.description}
        variant={confirmState.variant}
      />
    </div>
  );
}
