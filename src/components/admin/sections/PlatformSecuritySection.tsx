'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ShieldCheck, Fingerprint, Activity, UserX, PowerOff, 
  Database, ServerCrash, Lock, AlertTriangle, MapPin,
  RefreshCw, CheckCircle, Flame, Server, Cpu, RefreshCw as LoopIcon,
  Download, Trash2, CalendarClock, History, Terminal, FileSpreadsheet,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  ip: string;
  location: string;
  oldValue?: string;
  newValue?: string;
}

const mockActivityLog: LogEntry[] = [
  { id: 'log1', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), user: 'admin@khidmatik.dz', action: 'Changed default commission rate', ip: '192.168.1.10', location: 'Algiers, DZ', oldValue: 'commission: 15%', newValue: 'commission: 12%' },
  { id: 'log2', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), user: 'user_suspicious@example.com', action: 'Failed login attempt (x5)', ip: '103.45.67.89', location: 'Unknown' },
  { id: 'log3', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), user: 'store_owner@example.com', action: 'Product "DzTech Electronics" visibility', ip: '41.22.33.44', location: 'Oran, DZ', oldValue: 'status: Private', newValue: 'status: Public' },
];

export function PlatformSecuritySection() {
  const { toast } = useToast();
  
  // Tab controller state
  const [activeTab, setActiveTab] = useState<'controls' | 'system' | 'backups'>('controls');

  // Logs & controls state
  const [searchTerm, setSearchTerm] = useState('');
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [isPaymentsDisabled, setIsPaymentsDisabled] = useState(false);
  const [isNewRegistrationsDisabled, setIsNewRegistrationsDisabled] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(mockActivityLog);

  // Compare dialog state
  const [selectedCompareLog, setSelectedCompareLog] = useState<LogEntry | null>(null);

  // Backups archive state
  const [backupsList, setBackupsList] = useState([
    { name: 'backup_snapshot_prod_2026-07-06.sql', size: '184.2 MB', date: '2026-07-06 02:00 AM', type: 'Automated', status: 'Healthy' },
    { name: 'backup_snapshot_prod_2026-07-05.sql', size: '183.9 MB', date: '2026-07-05 02:00 AM', type: 'Automated', status: 'Healthy' },
    { name: 'manual_pre_migration_backup.sql', size: '181.5 MB', date: '2026-07-02 04:30 PM', type: 'Manual', status: 'Healthy' }
  ]);

  // CPU / RAM simulated values
  const [cpuUsage, setCpuUsage] = useState(14);
  const [ramUsage, setRamUsage] = useState(52);

  useEffect(() => {
    setIsMaintenanceActive(localStorage.getItem('sys_maintenance_mode') === 'true');
    setIsPaymentsDisabled(localStorage.getItem('sys_payments_disabled') === 'true');
    setIsNewRegistrationsDisabled(localStorage.getItem('sys_registrations_disabled') === 'true');
  }, []);

  const addAuditLog = (action: string, oldValue?: string, newValue?: string) => {
    const newLog: LogEntry = {
      id: 'log_' + Math.floor(Math.random() * 90000 + 10000),
      timestamp: new Date().toISOString(),
      user: 'admin@khidmatik.dz',
      action: action,
      ip: '192.168.1.10',
      location: 'Algiers, DZ',
      oldValue,
      newValue
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleToggleMaintenance = () => {
    const nextVal = !isMaintenanceActive;
    setIsMaintenanceActive(nextVal);
    localStorage.setItem('sys_maintenance_mode', String(nextVal));
    addAuditLog(
      nextVal ? 'Activated platform Maintenance Mode globally' : 'Deactivated platform Maintenance Mode',
      `maintenance: ${isMaintenanceActive}`,
      `maintenance: ${nextVal}`
    );
    
    toast({
      title: nextVal ? 'Maintenance Mode Activated' : 'Maintenance Mode Deactivated',
      description: nextVal 
        ? 'The platform will now display a maintenance page to standard users.' 
        : 'The platform is now online and available to everyone.',
      variant: nextVal ? 'destructive' : 'default',
    });
  };

  const handleTogglePayments = () => {
    const nextVal = !isPaymentsDisabled;
    setIsPaymentsDisabled(nextVal);
    localStorage.setItem('sys_payments_disabled', String(nextVal));
    addAuditLog(
      nextVal ? 'Disabled checkout payments globally' : 'Restored global payment gateways',
      `payments_disabled: ${isPaymentsDisabled}`,
      `payments_disabled: ${nextVal}`
    );

    toast({
      title: nextVal ? 'Payments Disabled Globally' : 'Payments Restored Globally',
      description: nextVal 
        ? 'All store checkouts and reservation payment links are suspended.' 
        : 'All transaction flows have been resumed safely.',
      variant: nextVal ? 'destructive' : 'default',
    });
  };

  const handleForceLogoutAll = () => {
    addAuditLog('Executed global force-logout (revoked 142 user sessions)');
    toast({
      title: 'Force Logout Successful',
      description: 'Revoked 142 active login sessions. Users must sign in again.',
      variant: 'default',
    });
  };

  const handleToggleRegistrations = () => {
    const nextVal = !isNewRegistrationsDisabled;
    setIsNewRegistrationsDisabled(nextVal);
    localStorage.setItem('sys_registrations_disabled', String(nextVal));
    addAuditLog(
      nextVal ? 'Suspended new user and vendor registrations' : 'Allowed new registrations',
      `registrations_disabled: ${isNewRegistrationsDisabled}`,
      `registrations_disabled: ${nextVal}`
    );

    toast({
      title: nextVal ? 'Registrations Blocked' : 'Registrations Enabled',
      description: nextVal 
        ? 'New user and vendor sign-ups are temporarily blocked.' 
        : 'Standard account registrations are active.',
      variant: nextVal ? 'destructive' : 'default',
    });
  };

  const handleTriggerBackup = () => {
    const backupName = `manual_pre_migration_backup_${Date.now()}.sql`;
    const newBackup = {
      name: backupName,
      size: '184.5 MB',
      date: new Date().toLocaleString(),
      type: 'Manual',
      status: 'Healthy'
    };
    setBackupsList([newBackup, ...backupsList]);
    addAuditLog(`Triggered manual snapshot database backup: ${backupName}`);
    toast({
      title: "Backup Complete",
      description: `Snapshot "${backupName}" successfully archived to storage.`,
    });
  };

  const handleRestoreBackup = (name: string) => {
    addAuditLog(`Restored database state from backup: ${name}`);
    toast({
      title: "Database Restored",
      description: `Database state returned to snapshot "${name}" successfully.`,
    });
  };

  const handleDeleteBackup = (name: string) => {
    setBackupsList(backupsList.filter(b => b.name !== name));
    addAuditLog(`Permanently deleted backup snapshot: ${name}`);
    toast({
      title: "Backup Deleted",
      description: `Snapshot "${name}" permanently deleted from archive storage.`,
      variant: "destructive"
    });
  };

  const handleExportCSV = () => {
    toast({
      title: "Audit Log Exported",
      description: "Successfully compiled and downloaded audit_logs.csv.",
    });
  };

  const filteredLogs = logs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.ip.includes(searchTerm)
  );

  return (
    <div className="space-y-6 font-sans text-left rtl:text-right">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Fingerprint className="h-6 w-6 text-primary animate-pulse" /> System Security & Audit logs
          </h1>
          <p className="text-xs text-muted-foreground">Monitor platform activity, toggle global lockdowns, supervise hardware allocations, and manage database restore points.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-lg text-xs font-semibold px-3 h-8 ${activeTab === 'controls' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('controls')}
          >
            Emergency Controls
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-lg text-xs font-semibold px-3 h-8 ${activeTab === 'system' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('system')}
          >
            System Resources
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-lg text-xs font-semibold px-3 h-8 ${activeTab === 'backups' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('backups')}
          >
            Backups Center
          </Button>
        </div>
      </header>

      {activeTab === 'controls' && (
        <div className="space-y-6">
          {/* Security Status Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border rounded-2xl shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 p-4">
                <CardTitle className="text-xs font-bold text-muted-foreground">Platform Access</CardTitle>
                <ServerCrash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${isMaintenanceActive ? 'bg-red-500 animate-ping' : 'bg-green-500 animate-pulse'}`} />
                  <span className="text-base font-bold">{isMaintenanceActive ? 'Maintenance Mode' : 'Live & Active'}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border rounded-2xl shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 p-4">
                <CardTitle className="text-xs font-bold text-muted-foreground">Payment Gateways</CardTitle>
                <PowerOff className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${isPaymentsDisabled ? 'bg-red-500 animate-ping' : 'bg-green-500 animate-pulse'}`} />
                  <span className="text-base font-bold">{isPaymentsDisabled ? 'Disabled' : 'Operational'}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border rounded-2xl shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 p-4">
                <CardTitle className="text-xs font-bold text-muted-foreground">Sign-ups Status</CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${isNewRegistrationsDisabled ? 'bg-red-500 animate-ping' : 'bg-green-500 animate-pulse'}`} />
                  <span className="text-base font-bold">{isNewRegistrationsDisabled ? 'Blocked' : 'Allowed'}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border rounded-2xl shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 p-4">
                <CardTitle className="text-xs font-bold text-muted-foreground">Audit Log Entries</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-base font-bold font-mono">{logs.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Emergency Lockdowns */}
          <Card className="border border-red-200 dark:border-red-900 rounded-2xl shadow-sm overflow-hidden bg-card">
            <CardHeader className="bg-red-50/50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900 p-4">
              <CardTitle className="flex items-center gap-2 text-red-950 dark:text-red-300 font-bold text-sm">
                <Lock className="h-4.5 w-4.5 text-red-600 animate-bounce" /> Platform Emergency Lockdown Panel
              </CardTitle>
              <CardDescription className="text-xs text-red-900/80 dark:text-red-400/80">Critical control overrides for immediate platform safety during cyber incidents or database maintenance.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-red-100 dark:border-red-950/40 p-3.5 rounded-xl flex flex-col justify-between space-y-3 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center"><Server className="mr-1.5 h-4 w-4 text-red-600" /> Platform Maintenance Mode</h4>
                  <p className="text-[10px] text-muted-foreground">Divert all standard traffic to a placeholder maintenance template. Admins and managers bypass dynamically.</p>
                </div>
                <Button variant={isMaintenanceActive ? 'destructive' : 'outline'} className="rounded-xl h-10 text-xs">
                  {isMaintenanceActive ? 'Deactivate Maintenance' : 'Activate Maintenance'}
                </Button>
              </div>

              <div className="border border-red-100 dark:border-red-950/40 p-3.5 rounded-xl flex flex-col justify-between space-y-3 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center"><PowerOff className="mr-1.5 h-4 w-4 text-red-600" /> Disable Global Payments</h4>
                  <p className="text-[10px] text-muted-foreground">Freeze checkout carts and billing portals. Yalidine sync operations are unaffected.</p>
                </div>
                <Button variant={isPaymentsDisabled ? 'destructive' : 'outline'} className="rounded-xl h-10 text-xs">
                  {isPaymentsDisabled ? 'Restore Gateways' : 'Freeze Gateways'}
                </Button>
              </div>

              <div className="border border-red-100 dark:border-red-950/40 p-3.5 rounded-xl flex flex-col justify-between space-y-3 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center"><UserX className="mr-1.5 h-4 w-4 text-red-600" /> Suspend Sign-ups</h4>
                  <p className="text-[10px] text-muted-foreground">Deactivates store registration links and customer sign-up forms dynamically.</p>
                </div>
                <Button variant={isNewRegistrationsDisabled ? 'destructive' : 'outline'} className="rounded-xl h-10 text-xs">
                  {isNewRegistrationsDisabled ? 'Unlock Sign-ups' : 'Block Sign-ups'}
                </Button>
              </div>

              <div className="border border-red-100 dark:border-red-950/40 p-3.5 rounded-xl flex flex-col justify-between space-y-3 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center"><Flame className="mr-1.5 h-4 w-4 text-red-600" /> Force Terminate Sessions</h4>
                  <p className="text-[10px] text-muted-foreground">Revokes access tokens and logs out all user accounts across all devices instantly.</p>
                </div>
                <Button variant="destructive" className="rounded-xl h-10 text-xs">
                  Terminate All Sessions
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs List */}
          <Card className="border rounded-2xl shadow-sm bg-card overflow-hidden">
            <CardHeader className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><History className="h-4.5 w-4.5 text-primary" /> Admin Operations Audit Log</CardTitle>
                <CardDescription className="text-xs">Search, filter, or export administrative changes. Compare values before and after adjustments.</CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-48 flex items-center bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-xl px-2.5 py-1">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-1.5" />
                  <Input 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search logs..."
                    className="border-none bg-transparent h-8 p-0 text-xs w-full focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="rounded-xl h-10 text-xs flex items-center gap-1 bg-white dark:bg-slate-900 border-input hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200">
                  <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600" /> Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 dark:bg-slate-900/30">
                    <TableHead className="text-xs font-bold">Time</TableHead>
                    <TableHead className="text-xs font-bold">Administrator</TableHead>
                    <TableHead className="text-xs font-bold">Action Taken</TableHead>
                    <TableHead className="text-xs font-bold">IP Coordinates</TableHead>
                    <TableHead className="text-xs font-bold">Location</TableHead>
                    <TableHead className="text-right text-xs font-bold">Audit Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors">
                      <TableCell className="text-xs font-mono">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</TableCell>
                      <TableCell className="text-xs font-semibold">{log.user}</TableCell>
                      <TableCell className="text-xs">{log.action}</TableCell>
                      <TableCell className="text-xs font-mono">{log.ip}</TableCell>
                      <TableCell className="text-xs">{log.location}</TableCell>
                      <TableCell className="text-right">
                        {(log.oldValue || log.newValue) ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="link" size="sm" className="text-xs font-semibold text-primary">Compare Changes</Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-2xl max-w-sm font-sans text-xs">
                              <DialogHeader>
                                <DialogTitle className="text-base font-bold">Change Comparer: Diff View</DialogTitle>
                                <DialogDescription className="text-xs">Detailed delta review of configurations audit.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-3 my-2 text-left rtl:text-right">
                                <div className="space-y-1">
                                  <span className="font-bold text-red-500 uppercase text-[9px] bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 px-2 py-0.5 rounded-md">Value before (Old)</span>
                                  <pre className="p-3 bg-red-50/50 dark:bg-red-950/10 rounded-xl font-mono text-[10px] text-red-700 dark:text-red-300 whitespace-pre-wrap">{log.oldValue}</pre>
                                </div>
                                <div className="space-y-1">
                                  <span className="font-bold text-green-500 uppercase text-[9px] bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 px-2 py-0.5 rounded-md">Value after (New)</span>
                                  <pre className="p-3 bg-green-50/50 dark:bg-green-950/10 rounded-xl font-mono text-[10px] text-green-700 dark:text-green-300 whitespace-pre-wrap">{log.newValue}</pre>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-[10px] text-muted-foreground px-2">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Server Resources monitor */}
          <Card className="lg:col-span-2 border rounded-2xl shadow-sm bg-card">
            <CardHeader className="border-b p-4">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><Cpu className="h-4.5 w-4.5 text-primary" /> Active Hardware Utilization</CardTitle>
              <CardDescription className="text-xs">Supervise platform web and database instances load allocations.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border dark:border-slate-800 rounded-xl p-4 bg-slate-50/30 dark:bg-slate-900/30 text-center space-y-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">CPU Usage</span>
                  <p className="text-2xl font-bold text-emerald-600">{cpuUsage}%</p>
                  <Button variant="outline" size="sm" onClick={() => setCpuUsage(Math.floor(Math.random() * 25 + 5))} className="rounded-lg h-7 text-[10px] bg-white dark:bg-slate-900 border-input hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200">Test Refresh</Button>
                </div>
                <div className="border dark:border-slate-800 rounded-xl p-4 bg-slate-50/30 dark:bg-slate-900/30 text-center space-y-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">RAM Allocated</span>
                  <p className="text-2xl font-bold text-blue-600">{ramUsage}%</p>
                  <Button variant="outline" size="sm" onClick={() => setRamUsage(Math.floor(Math.random() * 30 + 40))} className="rounded-lg h-7 text-[10px] bg-white dark:bg-slate-900 border-input hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200">Test Refresh</Button>
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

              {/* Database Connections */}
              <div className="space-y-2 text-xs text-left rtl:text-right">
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Database Connection Pools</h4>
                <div className="space-y-2.5 p-3.5 border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl">
                  <div className="flex justify-between"><span>Active clients connection count:</span><strong>34 / 100 max</strong></div>
                  <div className="flex justify-between"><span>Average query execution latency:</span><strong>2.4 ms</strong></div>
                  <div className="flex justify-between"><span>Cache hit ratio:</span><strong>98.2%</strong></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Background queues */}
          <Card className="border rounded-2xl shadow-sm bg-card">
            <CardHeader className="border-b p-4">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><Terminal className="h-4.5 w-4.5 text-primary" /> Background Workers Queue</CardTitle>
              <CardDescription className="text-xs">Monitor asynchronous operations, cron jobs, and queues.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="space-y-3">
                <div className="flex justify-between items-center border dark:border-slate-800 p-2.5 rounded-xl">
                  <div>
                    <span className="font-semibold block text-slate-800 dark:text-slate-200">Email Dispatch Queue</span>
                    <span className="text-[10px] text-muted-foreground">0 delayed • 2 active workers</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900/40">Healthy</Badge>
                </div>
                <div className="flex justify-between items-center border dark:border-slate-800 p-2.5 rounded-xl">
                  <div>
                    <span className="font-semibold block text-slate-800 dark:text-slate-200">Yalidine Delivery Sync</span>
                    <span className="text-[10px] text-muted-foreground">Runs every 15 mins</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900/40">Scheduled</Badge>
                </div>
                <div className="flex justify-between items-center border dark:border-slate-800 p-2.5 rounded-xl">
                  <div>
                    <span className="font-semibold block text-slate-800 dark:text-slate-200">Abandoned Carts Cron</span>
                    <span className="text-[10px] text-muted-foreground">Runs daily at 02:00 AM</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900/40">Scheduled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'backups' && (
        <Card className="border rounded-2xl shadow-sm bg-card overflow-hidden">
          <CardHeader className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><Database className="h-4.5 w-4.5 text-primary" /> Database Recovery & Backups Archive</CardTitle>
              <CardDescription className="text-xs">Schedule database snapshots, download SQL file backups, or roll back states safely.</CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleTriggerBackup} className="rounded-xl h-10 text-xs flex items-center gap-1.5 bg-primary text-primary-foreground">
                <Flame className="h-4 w-4" /> Trigger Snapshot
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-slate-900/30">
                  <TableHead className="text-xs font-bold">Snapshot File Name</TableHead>
                  <TableHead className="text-xs font-bold">File Size</TableHead>
                  <TableHead className="text-xs font-bold">Creation Date</TableHead>
                  <TableHead className="text-xs font-bold">Snapshot Type</TableHead>
                  <TableHead className="text-xs font-bold">Status</TableHead>
                  <TableHead className="text-right text-xs font-bold">Audit Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backupsList.map((item, index) => (
                  <TableRow key={index} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors">
                    <TableCell className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">{item.name}</TableCell>
                    <TableCell className="text-xs font-mono">{item.size}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.date}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900/40 text-[10px]">{item.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1.5">
                      <Button variant="outline" size="sm" onClick={() => handleRestoreBackup(item.name)} className="h-8 text-[11px] rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">Rollback to this</Button>
                      <Button variant="ghost" size="icon" onClick={() => toast({ title: 'Download triggered' })} className="h-8 w-8 text-slate-500 rounded-lg"><Download className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteBackup(item.name)} className="h-8 w-8 text-destructive rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
