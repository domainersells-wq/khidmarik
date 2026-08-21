'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, UserPlus, Search, ShieldCheck, Mail, 
  Trash2, UserCheck, Lock, ShieldAlert, AlertCircle, History, Clock, Loader2
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'Manager' | 'Cashier' | 'Employee';
  status: 'active' | 'pending';
  lastActive: string;
}

interface AuditLog {
  id: string;
  user_name: string;
  action_type: string;
  entity_type: string;
  description: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

export function TeamSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('roster');
  
  // States
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Invite form state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'Super Admin' | 'Admin' | 'Manager' | 'Cashier' | 'Employee'>('Employee');

  // Permissions config matrix
  const [permissions, setPermissions] = useState<Record<string, string[]>>({
    'Super Admin': ['all'],
    'Admin': ['view_store_dashboard', 'manage_products', 'manage_inventory', 'view_store_reports', 'create_order'],
    'Manager': ['view_store_dashboard', 'manage_products', 'manage_inventory', 'create_order'],
    'Cashier': ['view_store_dashboard', 'create_order'],
    'Employee': ['view_store_dashboard']
  });

  useEffect(() => {
    async function loadTeamData() {
      setIsLoading(true);
      const storeId = user?.storeId || '00000000-0000-0000-0000-000000000001';
      try {
        // Fetch profiles matching this store or standard list
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('role', 'customer');
        
        if (profiles && profiles.length > 0) {
          setTeam(profiles.map(p => ({
            id: p.id,
            name: p.name,
            email: p.email,
            role: p.role === 'super_admin' ? 'Super Admin' : p.role === 'store_owner' ? 'Admin' : 'Employee',
            status: p.is_verified ? 'active' as const : 'pending' as const,
            lastActive: p.member_since ? new Date(p.member_since).toLocaleDateString() : 'N/A'
          })));
        } else {
          throw new Error("No profiles loaded");
        }

        // Fetch audit logs
        const { data: logs } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (logs) {
          setAuditLogs(logs.map(l => ({
            id: l.id,
            user_name: profiles?.find(p => p.id === l.user_id)?.name || 'System Operator',
            action_type: l.action_type,
            entity_type: l.entity_type,
            description: l.description,
            created_at: l.created_at,
            ip_address: l.ip_address,
            user_agent: l.user_agent
          })));
        }

      } catch (err) {
        console.warn('Failed querying team/audit from Supabase. Loading fallbacks:', err);
        setTeam([
          { id: 'usr1', name: 'Nabil Mansouri', email: 'domainersells@gmail.com', role: 'Super Admin', status: 'active', lastActive: 'Online now' },
          { id: 'usr2', name: 'Karim Boumediene', email: 'karim.packer@khidmatik.dz', role: 'Manager', status: 'active', lastActive: '10 mins ago' },
          { id: 'usr3', name: 'Selma Belkaid', email: 'selma.support@khidmatik.dz', role: 'Cashier', status: 'active', lastActive: '1 hour ago' },
          { id: 'usr4', name: 'Fouad Madani', email: 'fouad.manager@khidmatik.dz', role: 'Employee', status: 'pending', lastActive: 'Invited 2 days ago' }
        ]);
        setAuditLogs([
          { id: '1', user_name: 'Nabil Mansouri', action_type: 'LOGIN', entity_type: 'profiles', description: 'User login from Algiers Centre IP 197.200.41.9', created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), ip_address: '197.200.41.9', user_agent: 'Chrome/Windows' },
          { id: '2', user_name: 'Karim Boumediene', action_type: 'UPDATE', entity_type: 'products', description: 'Updated stock level of Ceramic Mug (SKU OL-1L)', created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), ip_address: '105.101.48.12', user_agent: 'Firefox/Linux' },
          { id: '3', user_name: 'Selma Belkaid', action_type: 'CREATE', entity_type: 'orders', description: 'POS Sale checkout of 12,500 DA completed', created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), ip_address: '197.202.99.11', user_agent: 'Safari/iOS' }
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    loadTeamData();
  }, [user]);

  const saveTeamState = (newTeam: TeamMember[], newLogs: AuditLog[]) => {
    setTeam(newTeam);
    setAuditLogs(newLogs);
    localStorage.setItem('khidmatik_team', JSON.stringify(newTeam));
    localStorage.setItem('khidmatik_audit_logs', JSON.stringify(newLogs));
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) {
      toast({ title: 'Fields Missing', description: 'Please enter name and email to send team invitation.', variant: 'destructive' });
      return;
    }

    const newMember: TeamMember = {
      id: Math.random().toString(36).substring(7),
      name: newName,
      email: newEmail,
      role: newRole,
      status: 'pending',
      lastActive: 'Just invited'
    };

    // Save invitation to audit logs
    const newLog: AuditLog = {
      id: Math.random().toString(36).substring(7),
      user_name: user?.name || 'Administrator',
      action_type: 'CREATE',
      entity_type: 'profiles',
      description: `Invited new team member: ${newName} (${newEmail}) as role: ${newRole}`,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('profiles').insert({
        id: user ? undefined : newMember.id, // simulate or insert if mock
        name: newName,
        email: newEmail,
        role: newRole.toLowerCase().replace(' ', '_'),
        is_verified: false
      });
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action_type: 'CREATE',
        entity_type: 'profiles',
        description: newLog.description
      });
    } catch (err) {
      console.warn('Failed database invite write, logging locally', err);
    }

    const updatedTeam = [...team, newMember];
    const updatedLogs = [newLog, ...auditLogs];
    saveTeamState(updatedTeam, updatedLogs);

    toast({ title: 'Invitation Sent', description: `Verification link sent to ${newEmail} as ${newRole}.` });
    setNewName('');
    setNewEmail('');
  };

  const deleteMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke dashboard access for ${name}?`)) return;

    const newLog: AuditLog = {
      id: Math.random().toString(36).substring(7),
      user_name: user?.name || 'Administrator',
      action_type: 'DELETE',
      entity_type: 'profiles',
      description: `Revoked dashboard access for team member: ${name}`,
      created_at: new Date().toISOString()
    };

    const updatedTeam = team.filter(m => m.id !== id);
    const updatedLogs = [newLog, ...auditLogs];
    saveTeamState(updatedTeam, updatedLogs);

    try {
      await supabase.from('profiles').delete().eq('id', id);
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action_type: 'DELETE',
        entity_type: 'profiles',
        description: newLog.description
      });
    } catch (err) {
      console.warn('Failed database deletion check, logging locally', err);
    }

    toast({ title: 'Access Revoked', description: `Removed ${name} from your store team.`, variant: 'destructive' });
  };

  const togglePermission = (role: string, perm: string) => {
    const list = permissions[role] || [];
    const updatedList = list.includes(perm) ? list.filter(p => p !== perm) : [...list, perm];
    setPermissions({
      ...permissions,
      [role]: updatedList
    });
    toast({ title: 'Permissions Adjusted', description: `Updated permission config for role: ${role}.` });
  };

  const filteredTeam = team.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col justify-center items-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /> Loading staff privileges and audit logs...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" /> Staff Privileges & Security Auditing (إدارة الفريق)
          </h1>
          <p className="text-muted-foreground">Manage store accounts, customize RBAC navigation permissions, and read system audit logs.</p>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 max-w-md bg-muted">
          <TabsTrigger value="roster" className="text-xs">Team Roster</TabsTrigger>
          <TabsTrigger value="permissions" className="text-xs">Role Permissions</TabsTrigger>
          <TabsTrigger value="audit" className="text-xs">Audit Logs</TabsTrigger>
        </TabsList>

        {/* Tab 1: Team Roster */}
        <TabsContent value="roster" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Team Roster list */}
          <Card className="shadow border lg:col-span-2">
            <CardHeader className="p-4 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-base">Store Staff List</CardTitle>
                <CardDescription>Accounts authorized to access store sections.</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, email..." 
                  className="pl-8 text-xs h-9"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Profile</TableHead>
                    <TableHead>System Role</TableHead>
                    <TableHead>Registration/Last Active</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeam.map(member => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">{member.name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{member.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {member.role === 'Super Admin' && <ShieldAlert className="h-3 w-3 mr-1 text-red-500 inline" />}
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[10px] font-mono text-muted-foreground">{member.lastActive}</TableCell>
                      <TableCell>
                        <Badge className={member.status === 'active' ? 'bg-green-500 text-white text-[9px]' : 'bg-amber-500 text-white text-[9px]'}>
                          {member.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {member.role !== 'Super Admin' ? (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => deleteMember(member.id, member.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Lock className="h-4 w-4 text-slate-300 mx-auto" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Right: Invite Form */}
          <Card className="shadow border h-fit">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-base flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" /> Invite Team Member</CardTitle>
              <CardDescription>Grant dashboard access to staff.</CardDescription>
            </CardHeader>
            <form onSubmit={handleInvite}>
              <CardContent className="p-4 pt-0 space-y-4 text-xs">
                <div className="space-y-1">
                  <Label>Staff Name *</Label>
                  <Input placeholder="e.g. Yasser" value={newName} onChange={e => setNewName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>Staff Email *</Label>
                  <Input type="email" placeholder="yasser@khidmatik.dz" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>Access Role *</Label>
                  <Select value={newRole} onValueChange={(val: any) => setNewRole(val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border text-xs">
                      <SelectItem value="Admin">Admin (Full administrative credentials)</SelectItem>
                      <SelectItem value="Manager">Manager (Catalog and stock control)</SelectItem>
                      <SelectItem value="Cashier">Cashier (POS checkout only)</SelectItem>
                      <SelectItem value="Employee">Employee (Basic view rights)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center gap-1.5 h-9 text-xs">
                  <UserCheck className="h-4 w-4" /> Send Verification Link
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Tab 2: Custom Role Permissions Setup */}
        <TabsContent value="permissions">
          <Card className="shadow border">
            <CardHeader>
              <CardTitle className="text-base">RBAC Authorization Matrix</CardTitle>
              <CardDescription>Assign specific module privileges to system roles. Cashiers are restricted to checkout by default.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>System Role</TableHead>
                    <TableHead className="text-center text-xs">Dashboard stats</TableHead>
                    <TableHead className="text-center text-xs">Catalog Edit</TableHead>
                    <TableHead className="text-center text-xs">Inventory Audit</TableHead>
                    <TableHead className="text-center text-xs">POS Checkout</TableHead>
                    <TableHead className="text-center text-xs font-bold text-red-500">Settings Config</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {(['Admin', 'Manager', 'Cashier', 'Employee'] as const).map(role => (
                    <TableRow key={role}>
                      <TableCell className="font-bold text-slate-800 dark:text-slate-200">{role}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={permissions[role]?.includes('view_store_dashboard')} 
                          onCheckedChange={() => togglePermission(role, 'view_store_dashboard')}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={permissions[role]?.includes('manage_products')} 
                          onCheckedChange={() => togglePermission(role, 'manage_products')}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={permissions[role]?.includes('manage_inventory')} 
                          onCheckedChange={() => togglePermission(role, 'manage_inventory')}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={permissions[role]?.includes('create_order')} 
                          onCheckedChange={() => togglePermission(role, 'create_order')}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={permissions[role]?.includes('manage_settings')} 
                          onCheckedChange={() => togglePermission(role, 'manage_settings')}
                          className="border-red-400"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: System Audit Logs */}
        <TabsContent value="audit">
          <Card className="shadow border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><History className="h-5 w-5 text-muted-foreground" /> Security Operations Ledger</CardTitle>
              <CardDescription>Cryptographic logs of all store actions (IP addresses, Browser agents, changes).</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Logs Details</TableHead>
                    <TableHead>IP Address / Agent</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {auditLogs.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-semibold">{l.user_name}</TableCell>
                      <TableCell>
                        <Badge variant={l.action_type === 'CREATE' ? 'secondary' : l.action_type === 'DELETE' ? 'destructive' : 'outline'} className="text-[10px] uppercase font-mono">
                          {l.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans">{l.description}</TableCell>
                      <TableCell>
                        <div className="font-mono text-[10px] text-slate-700 dark:text-slate-300">{l.ip_address || '—'}</div>
                        <div className="text-[9px] text-muted-foreground truncate max-w-[120px]">{l.user_agent || '—'}</div>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground shrink-0">{new Date(l.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
