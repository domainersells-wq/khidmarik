'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { 
  Users, 
  UserCog, 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserX, 
  UserCheck, 
  Edit3, 
  MessageSquare, 
  Activity, 
  Plus, 
  Mail,
  Shield,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Check,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';

interface User {
  id: string;
  userName: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'invited' | 'inactive' | 'suspended' | 'pending_verification';
  registrationDate: string;
  lastLogin: string;
}

interface RolePermission {
  role: string;
  permissions: Record<string, string[]>; // e.g., { 'Users': ['View', 'Create', 'Edit'], ... }
}

const modules = [
  'Users', 'Stores', 'Services', 'Marketplace', 'Reservations', 
  'Payments', 'Reports', 'Settings', 'Plugins', 'Support', 
  'Analytics', 'Logs', 'API'
];

const capabilities = [
  'View', 'Create', 'Edit', 'Delete', 'Approve', 'Export', 'Import', 'Manage'
];

export function UserManagementSection() {
  const { toast } = useToast();
  const { language, translate } = useLanguage();
  
  // Tab control state
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');

  // User list states
  const initialUsers: User[] = [
    { id: 'usr_1', userName: 'Vada Braun', email: 'vada.lesch96@yahoo.com', phone: '+213 555 10 25 54', role: 'superadmin', status: 'active', registrationDate: '2026-04-28', lastLogin: '2026-07-04' },
    { id: 'usr_2', userName: 'Tyra Heidenreich', email: 'tyra.moscicki11@gmail.com', phone: '+213 661 14 75 94', role: 'manager', status: 'invited', registrationDate: '2026-07-02', lastLogin: '2026-07-03' },
    { id: 'usr_3', userName: 'Alvera Conn', email: 'alvera.fisher@hotmail.com', status: 'inactive', phone: '+213 770 02 11 25', role: 'customer', registrationDate: '2026-03-02', lastLogin: '2026-07-02' },
    { id: 'usr_4', userName: 'Jewel Hand', email: 'jewel_lang6@gmail.com', status: 'suspended', phone: '+213 540 22 13 90', role: 'cashier', registrationDate: '2026-07-22', lastLogin: '2026-07-02' },
    { id: 'usr_5', userName: 'Leigh Rodriguez', email: 'leigh_monahan@yahoo.com', status: 'inactive', phone: '+213 699 19 32 60', role: 'vendor', registrationDate: '2026-03-19', lastLogin: '2026-06-26' },
    { id: 'usr_7', userName: 'James Baumbach', email: 'james.huels@gmail.com', status: 'active', phone: '+213 662 27 15 15', role: 'service_provider', registrationDate: '2026-04-27', lastLogin: '2026-06-27' },
  ];

  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Roles permission matrix state
  const [roles, setRoles] = useState<string[]>(['superadmin', 'manager', 'cashier', 'editor', 'vendor', 'service_provider', 'customer']);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([
    {
      role: 'superadmin',
      permissions: modules.reduce((acc, mod) => ({ ...acc, [mod]: capabilities }), {})
    },
    {
      role: 'manager',
      permissions: {
        'Users': ['View', 'Create', 'Edit'],
        'Stores': ['View', 'Create', 'Edit', 'Approve'],
        'Services': ['View', 'Create', 'Edit', 'Approve'],
        'Marketplace': ['View', 'Create'],
        'Reservations': ['View', 'Manage'],
        'Payments': ['View'],
        'Support': ['View', 'Manage']
      }
    },
    {
      role: 'vendor',
      permissions: {
        'Stores': ['View', 'Create', 'Edit'],
        'Marketplace': ['View', 'Create', 'Edit', 'Delete']
      }
    }
  ]);

  const [selectedRole, setSelectedRole] = useState<string>('manager');
  const [newRoleName, setNewRoleName] = useState('');
  const [isNewRoleOpen, setIsNewRoleOpen] = useState(false);

  // Modal control states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Form states
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addRole, setAddRole] = useState<string>('customer');
  const [addStatus, setAddStatus] = useState<'active' | 'invited' | 'inactive' | 'suspended'>('active');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('customer');

  useEffect(() => {
    const saved = localStorage.getItem('khidmatik_admin_users');
    if (saved) {
      try { setUsers(JSON.parse(saved)); } catch (e) {}
    }
    const savedRoles = localStorage.getItem('khidmatik_role_permissions');
    if (savedRoles) {
      try { setRolePermissions(JSON.parse(savedRoles)); } catch (e) {}
    }
  }, []);

  const saveUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem('khidmatik_admin_users', JSON.stringify(newUsers));
  };

  const handleAddUser = () => {
    if (!addName.trim() || !addEmail.trim() || !addPhone.trim()) {
      toast({ title: 'Validation Error', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }
    const newUser: User = {
      id: 'usr_' + Date.now(),
      userName: addName,
      email: addEmail,
      phone: addPhone,
      role: addRole,
      status: addStatus,
      registrationDate: new Date().toISOString().split('T')[0],
      lastLogin: new Date().toISOString().split('T')[0]
    };
    saveUsers([newUser, ...users]);
    setIsAddOpen(false);
    setAddName('');
    setAddEmail('');
    setAddPhone('');
    toast({ title: 'User Account Created', description: `Successfully created ${addName} as a ${addRole}.` });
  };

  const handleInviteUser = () => {
    if (!inviteEmail.trim()) return;
    const newUser: User = {
      id: 'usr_' + Date.now(),
      userName: inviteEmail.split('@')[0],
      email: inviteEmail,
      phone: 'N/A',
      role: inviteRole,
      status: 'invited',
      registrationDate: new Date().toISOString().split('T')[0],
      lastLogin: 'N/A'
    };
    saveUsers([newUser, ...users]);
    setIsInviteOpen(false);
    setInviteEmail('');
    toast({ title: 'Invitation Dispatched', description: `Invitation sent successfully to ${inviteEmail}.` });
  };

  const handleToggleBan = (id: string, currentStatus: User['status']) => {
    const nextStatus: User['status'] = currentStatus === 'suspended' ? 'active' : 'suspended';
    const updated = users.map(u => u.id === id ? { ...u, status: nextStatus } : u);
    saveUsers(updated);
    toast({
      title: nextStatus === 'suspended' ? 'Account Banned' : 'Account Re-activated',
      description: `User account status has been updated.`,
      variant: nextStatus === 'suspended' ? 'destructive' : 'default'
    });
  };

  const handleChangeRole = (id: string, newRole: string) => {
    const updated = users.map(u => u.id === id ? { ...u, role: newRole } : u);
    saveUsers(updated);
    toast({ title: 'Role Updated', description: `User role has been updated to ${newRole}.` });
  };

  // Role permissions modifications helpers
  const handleTogglePermission = (mod: string, cap: string) => {
    const currentPermission = rolePermissions.find(rp => rp.role === selectedRole);
    let updatedPermissions: Record<string, string[]> = {};
    
    if (currentPermission) {
      const moduleCaps = currentPermission.permissions[mod] || [];
      const updatedCaps = moduleCaps.includes(cap) 
        ? moduleCaps.filter(c => c !== cap)
        : [...moduleCaps, cap];
      
      updatedPermissions = {
        ...currentPermission.permissions,
        [mod]: updatedCaps
      };
    } else {
      updatedPermissions = {
        [mod]: [cap]
      };
    }

    const nextPermissions = rolePermissions.some(rp => rp.role === selectedRole)
      ? rolePermissions.map(rp => rp.role === selectedRole ? { ...rp, permissions: updatedPermissions } : rp)
      : [...rolePermissions, { role: selectedRole, permissions: updatedPermissions }];

    setRolePermissions(nextPermissions);
    localStorage.setItem('khidmatik_role_permissions', JSON.stringify(nextPermissions));
    toast({ title: "Permissions Saved", description: `Updated ${selectedRole} permissions for ${mod}.` });
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;
    const nameFormatted = newRoleName.toLowerCase().replace(/\s+/g, '_');
    if (roles.includes(nameFormatted)) {
      toast({ title: "Validation Error", description: "Role already exists.", variant: "destructive" });
      return;
    }
    setRoles([...roles, nameFormatted]);
    setNewRoleName('');
    setIsNewRoleOpen(false);
    toast({ title: "Role Created", description: `New role "${nameFormatted}" added to the directory.` });
  };

  const handleDeleteRole = (roleToDelete: string) => {
    if (roleToDelete === 'superadmin') {
      toast({ title: "Access Denied", description: "The platform root superadmin role cannot be deleted.", variant: "destructive" });
      return;
    }
    setRoles(roles.filter(r => r !== roleToDelete));
    setRolePermissions(rolePermissions.filter(rp => rp.role !== roleToDelete));
    setSelectedRole('manager');
    toast({ title: "Role Deleted", description: `Removed role from directory.` });
  };

  const handleClonePermissions = (fromRole: string) => {
    const sourcePermissions = rolePermissions.find(rp => rp.role === fromRole)?.permissions || {};
    const cloned = JSON.parse(JSON.stringify(sourcePermissions));
    
    const nextPermissions = rolePermissions.some(rp => rp.role === selectedRole)
      ? rolePermissions.map(rp => rp.role === selectedRole ? { ...rp, permissions: cloned } : rp)
      : [...rolePermissions, { role: selectedRole, permissions: cloned }];

    setRolePermissions(nextPermissions);
    localStorage.setItem('khidmatik_role_permissions', JSON.stringify(nextPermissions));
    toast({ title: "Permissions Cloned", description: `Cloned permissions from ${fromRole} into ${selectedRole}.` });
  };

  const hasPermission = (roleName: string, mod: string, cap: string) => {
    const perm = rolePermissions.find(rp => rp.role === roleName);
    if (!perm) return false;
    return perm.permissions[mod]?.includes(cap) || false;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.userName.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case 'invited': return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">Invited</Badge>;
      case 'suspended': return <Badge variant="destructive">Suspended</Badge>;
      default: return <Badge variant="outline">Inactive</Badge>;
    }
  };

  return (
    <div className="space-y-6 font-sans text-left rtl:text-right">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Users & Roles Hub
          </h1>
          <p className="text-xs text-muted-foreground">Manage user directory, role allocations, system permissions matrix, and invitations.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-lg text-xs font-semibold px-3 h-8 ${activeTab === 'users' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('users')}
          >
            Users List
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-lg text-xs font-semibold px-3 h-8 ${activeTab === 'permissions' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('permissions')}
          >
            Permissions Matrix
          </Button>
        </div>
      </header>

      {activeTab === 'users' && (
        <Card className="border rounded-2xl shadow-sm bg-card">
          <CardHeader className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">Members Directory</CardTitle>
              <CardDescription className="text-xs">Filter, update, or restrict user access credentials across the platform.</CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative w-48 sm:w-60 flex items-center bg-slate-50 dark:bg-slate-900 border rounded-xl px-2.5 py-1">
                <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-1.5" />
                <Input 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  placeholder="Search user..." 
                  className="border-none bg-transparent h-8 p-0 text-xs w-full focus-visible:ring-0 focus-visible:ring-offset-0" 
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32 rounded-xl h-10 text-xs bg-slate-50 dark:bg-slate-900 border-input text-slate-800 dark:text-slate-100">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="text-xs bg-card">
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(r => (
                    <SelectItem key={r} value={r}>{r.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 rounded-xl h-10 text-xs bg-slate-50 dark:bg-slate-900 border-input text-slate-800 dark:text-slate-100">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="text-xs bg-card">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>

              <Button size="sm" onClick={() => setIsAddOpen(true)} className="rounded-xl h-10 text-xs flex items-center gap-1.5 bg-primary text-primary-foreground">
                <Plus className="h-4 w-4" /> Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="text-xs font-bold">Username</TableHead>
                  <TableHead className="text-xs font-bold">Email Address</TableHead>
                  <TableHead className="text-xs font-bold">Phone</TableHead>
                  <TableHead className="text-xs font-bold">Registered</TableHead>
                  <TableHead className="text-xs font-bold">Status</TableHead>
                  <TableHead className="text-xs font-bold">Role</TableHead>
                  <TableHead className="text-right text-xs font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/30 transition-colors">
                    <TableCell className="text-xs font-semibold text-slate-800 dark:text-slate-100">{user.userName}</TableCell>
                    <TableCell className="text-xs font-mono">{user.email}</TableCell>
                    <TableCell className="text-xs font-mono">{user.phone}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{user.registrationDate}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={user.role === 'superadmin' ? 'destructive' : 'secondary'} className="capitalize text-[9px] font-bold">
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg"><MoreHorizontal className="h-4.5 w-4.5 text-muted-foreground" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-xs rounded-xl shadow-lg border-border bg-card">
                          <DropdownMenuItem className="hover:bg-slate-50 cursor-pointer" onClick={() => toast({ title: 'Profile details logged' })}><Users className="h-4 w-4 mr-2" /> View Details</DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-slate-50 cursor-pointer" onClick={() => toast({ title: 'Direct Alert sent' })}><Mail className="h-4 w-4 mr-2" /> Notify User</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="hover:bg-slate-50 cursor-pointer text-red-600 font-semibold" onClick={() => handleToggleBan(user.id, user.status)}>
                            <UserX className="h-4 w-4 mr-2" /> 
                            {user.status === 'suspended' ? 'Unban User' : 'Ban User'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-[10px] text-muted-foreground">Modify Role</DropdownMenuLabel>
                          {roles.filter(r => r !== user.role).map(r => (
                            <DropdownMenuItem key={r} className="hover:bg-slate-50 cursor-pointer text-[10px]" onClick={() => handleChangeRole(user.id, r)}>
                              <Edit3 className="h-3 w-3 mr-2 text-primary" /> {r.replace('_', ' ')}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'permissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Roles Selector Sidebar */}
          <Card className="border rounded-2xl shadow-sm bg-card p-4 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Role Profiles</h3>
              <p className="text-[11px] text-muted-foreground">Select a role to inspect and toggle platform access controls.</p>
            </div>
            
            <div className="flex flex-col gap-1.5">
              {roles.map(r => (
                <div key={r} className="flex items-center justify-between group">
                  <button 
                    onClick={() => setSelectedRole(r)}
                    className={`flex-1 text-left px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200 ${
                      selectedRole === r 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {r.replace('_', ' ')}
                  </button>
                  {r !== 'superadmin' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" onClick={() => handleDeleteRole(r)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button onClick={() => setIsNewRoleOpen(true)} className="w-full rounded-xl h-10 text-xs flex items-center justify-center gap-1.5 bg-primary text-primary-foreground">
              <Plus className="h-4 w-4" /> Create Custom Role
            </Button>
          </Card>

          {/* Permissions Matrix */}
          <Card className="lg:col-span-3 border rounded-2xl shadow-sm bg-card overflow-hidden">
            <CardHeader className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">Access Matrix: <span className="capitalize text-primary font-bold">{selectedRole.replace('_', ' ')}</span></CardTitle>
                <CardDescription className="text-xs">Adjust capabilities across platform modules. Changes take effect instantly for active users.</CardDescription>
              </div>

              {/* Clone permissions widget */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Clone From:</span>
                <Select onValueChange={handleClonePermissions}>
                  <SelectTrigger className="w-32 rounded-xl h-9 text-[10px] bg-slate-50 border-input font-bold">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {roles.filter(r => r !== selectedRole).map(r => (
                      <SelectItem key={r} value={r} className="capitalize">{r.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto custom-sidebar-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="text-xs font-bold w-36">Module / Component</TableHead>
                    {capabilities.map(cap => (
                      <TableHead key={cap} className="text-center text-xs font-bold text-slate-800">{cap}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map(mod => (
                    <TableRow key={mod} className="hover:bg-slate-50/30 transition-colors">
                      <TableCell className="text-xs font-semibold text-slate-700">{mod}</TableCell>
                      {capabilities.map(cap => {
                        const checked = hasPermission(selectedRole, mod, cap);
                        const isSuperAdmin = selectedRole === 'superadmin';
                        return (
                          <TableCell key={cap} className="text-center">
                            <button
                              disabled={isSuperAdmin}
                              onClick={() => handleTogglePermission(mod, cap)}
                              className={`h-5 w-5 rounded border focus:outline-none transition-all flex items-center justify-center mx-auto ${
                                checked 
                                  ? 'bg-primary border-primary text-primary-foreground' 
                                  : 'border-input hover:border-slate-400 bg-background'
                              } ${isSuperAdmin && 'opacity-60 cursor-not-allowed bg-slate-100'}`}
                            >
                              {checked && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                            </button>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add User Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="rounded-2xl max-w-sm font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Register New Account</DialogTitle>
            <DialogDescription className="text-xs">Create a profile directly inside the database.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 my-2 text-left rtl:text-right text-xs">
            <div className="space-y-1">
              <Label className="font-bold text-slate-700">Username</Label>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Username" className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="font-bold text-slate-700">Email Address</Label>
              <Input value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="Email" className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="font-bold text-slate-700">Phone Number</Label>
              <Input value={addPhone} onChange={(e) => setAddPhone(e.target.value)} placeholder="Phone" className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="font-bold text-slate-700">Default Role</Label>
              <Select value={addRole} onValueChange={setAddRole}>
                <SelectTrigger className="rounded-xl h-10 border-input">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {roles.map(r => (
                    <SelectItem key={r} value={r}>{r.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl text-xs h-9" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button className="rounded-xl text-xs h-9 bg-primary" onClick={handleAddUser}>Create Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Custom Role Dialog */}
      <Dialog open={isNewRoleOpen} onOpenChange={setIsNewRoleOpen}>
        <DialogContent className="rounded-2xl max-w-sm font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Create Custom Role Profile</DialogTitle>
            <DialogDescription className="text-xs">Generate a new role class. You can customize its permissions inside the matrix immediately after creating.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1 text-left rtl:text-right my-2">
            <Label className="text-[11px] font-bold text-slate-700">Role Identifier Name</Label>
            <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="e.g. Content Editor" className="rounded-xl text-xs h-10" />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl text-xs h-9" onClick={() => setIsNewRoleOpen(false)}>Cancel</Button>
            <Button className="rounded-xl text-xs h-9 bg-primary" onClick={handleCreateRole}>Create Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
