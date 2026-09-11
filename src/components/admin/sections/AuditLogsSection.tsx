'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Fingerprint, Shield, Terminal, Clock, Eye, Download, 
  FileText, Activity, Layers, User, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminDataService, AdminAuditLog } from '@/services/adminDataService';
import { AdminDataTable, ColumnDef, FilterOption } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';

export function AuditLogsSection() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadData = () => {
    setLogs(adminDataService.getAuditLogs());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filterOptions: FilterOption[] = [
    {
      key: 'actionType',
      label: 'Action Type',
      options: [
        { label: 'LOGIN / AUTH', value: 'LOGIN' },
        { label: 'UPDATE', value: 'UPDATE' },
        { label: 'CREATE', value: 'CREATE' },
        { label: 'SUSPEND', value: 'SUSPEND' },
        { label: 'APPROVE', value: 'APPROVE' },
        { label: 'REFUND', value: 'REFUND' },
        { label: 'CONFIG_CHANGE', value: 'CONFIG_CHANGE' },
      ],
    },
    {
      key: 'entityType',
      label: 'Entity Type',
      options: [
        { label: 'User', value: 'User' },
        { label: 'Store', value: 'Store' },
        { label: 'Provider', value: 'Provider' },
        { label: 'Withdrawal', value: 'Withdrawal' },
        { label: 'Commission', value: 'Commission' },
        { label: 'AuthSession', value: 'AuthSession' },
      ],
    },
  ];

  const columns: ColumnDef<AdminAuditLog>[] = [
    {
      header: 'Timestamp',
      accessorKey: 'timestamp',
      cell: (l) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-mono font-medium text-foreground">{l.timestamp}</div>
          <div className="text-muted-foreground flex items-center gap-1 font-mono text-[11px]">
            <Terminal className="h-3 w-3" />
            {l.ipAddress}
          </div>
        </div>
      ),
    },
    {
      header: 'Operator (Actor)',
      accessorKey: 'actor',
      cell: (l) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-semibold text-foreground flex items-center gap-1">
            <User className="h-3 w-3 text-muted-foreground" />
            {l.actor}
          </div>
          <Badge variant="outline" className="text-[10px] uppercase font-bold bg-muted/40">
            {l.actorRole}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Action & Entity',
      accessorKey: 'actionType',
      cell: (l) => {
        const aBadges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
          CREATE: { label: 'CREATE', variant: 'default' },
          UPDATE: { label: 'UPDATE', variant: 'secondary' },
          DELETE: { label: 'DELETE', variant: 'destructive' },
          SUSPEND: { label: 'SUSPEND', variant: 'destructive' },
          APPROVE: { label: 'APPROVE', variant: 'default' },
          REFUND: { label: 'REFUND', variant: 'outline' },
          LOGIN: { label: 'LOGIN', variant: 'outline' },
          CONFIG_CHANGE: { label: 'CONFIG CHANGE', variant: 'secondary' },
        };
        const conf = aBadges[l.actionType] || { label: l.actionType, variant: 'outline' };
        return (
          <div className="space-y-1">
            <Badge variant={conf.variant} className="text-[10px] font-mono font-bold">
              {conf.label}
            </Badge>
            <div className="text-xs text-muted-foreground font-mono">{l.entityType}</div>
          </div>
        );
      },
    },
    {
      header: 'Description',
      accessorKey: 'description',
      cell: (l) => (
        <div className="text-xs text-foreground max-w-[340px] truncate" title={l.description}>
          {l.description}
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (l) => (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLog(l);
            setIsDetailOpen(true);
          }}
        >
          <Eye className="h-3.5 w-3.5 mr-1" /> View Diff
        </Button>
      ),
    },
  ];

  const total = logs.length;
  const configChanges = logs.filter((l) => l.actionType === 'CONFIG_CHANGE').length;
  const authLogins = logs.filter((l) => l.actionType === 'LOGIN').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center tracking-tight">
          <Fingerprint className="mr-3 h-8 w-8 text-primary" /> Immutable Audit Logs & Security Trail
        </h1>
        <p className="text-muted-foreground text-sm">
          Trace administrative operations, rate changes, payout approvals, user suspensions, and login telemetry.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Audit Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Logged admin actions</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Config Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{configChanges}</div>
            <p className="text-xs text-muted-foreground mt-1">Platform parameter edits</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Admin Sign-Ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{authLogins}</div>
            <p className="text-xs text-muted-foreground mt-1">2FA authenticated sessions</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Integrity Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Tamper-Proof</div>
            <p className="text-xs text-muted-foreground mt-1">Append-only audit storage</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <AdminDataTable
        data={logs}
        columns={columns}
        searchPlaceholder="Search audit logs by actor, action, description, IP..."
        searchKeys={['actor', 'description', 'actionType', 'entityType', 'ipAddress']}
        filterOptions={filterOptions}
        exportFileName="khidmatik_audit_logs"
        onRowClick={(l) => {
          setSelectedLog(l);
          setIsDetailOpen(true);
        }}
        onRefresh={loadData}
      />

      {/* Detail Drawer with Before/After JSON Diff */}
      {selectedLog && (
        <AdminDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Audit Record #${selectedLog.id}`}
          subtitle={`Captured on ${selectedLog.timestamp} by ${selectedLog.actor}`}
          statusBadge={{
            label: selectedLog.actionType,
            variant: 'default',
          }}
          metrics={[
            { label: 'Action Type', value: selectedLog.actionType, icon: Fingerprint },
            { label: 'Target Entity', value: selectedLog.entityType, icon: Layers },
            { label: 'Actor Role', value: selectedLog.actorRole, icon: Shield },
            { label: 'Source IP', value: selectedLog.ipAddress, icon: Terminal },
          ]}
          fields={[
            { label: 'Operator (Actor)', value: selectedLog.actor },
            { label: 'Entity Identifier', value: selectedLog.entityId || 'N/A' },
            { label: 'Operation Summary', value: selectedLog.description, fullWidth: true },
            { label: 'User Agent / Client', value: selectedLog.userAgent, fullWidth: true },
          ]}
        >
          {/* Before / After JSON Diff Preview */}
          {(selectedLog.oldValue || selectedLog.newValue) && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" /> State Diff (Before ➔ After)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 space-y-1">
                  <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase">
                    Previous State (Old)
                  </span>
                  <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                    {selectedLog.oldValue ? JSON.stringify(selectedLog.oldValue, null, 2) : 'null (None)'}
                  </pre>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    Modified State (New)
                  </span>
                  <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                    {selectedLog.newValue ? JSON.stringify(selectedLog.newValue, null, 2) : 'null (None)'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </AdminDetailDrawer>
      )}
    </div>
  );
}
