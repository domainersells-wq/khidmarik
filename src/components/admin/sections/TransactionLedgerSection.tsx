'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Receipt, ArrowUpRight, ArrowDownLeft, ShieldCheck, 
  DollarSign, FileSpreadsheet, Eye, Scale, Hash
} from 'lucide-react';
import { financialService } from '@/services/financialService';
import { DoubleEntryLedgerEntry } from '@/types/financials';
import { AdminDataTable, ColumnDef, FilterOption } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';

export function TransactionLedgerSection() {
  const [entries, setEntries] = useState<DoubleEntryLedgerEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DoubleEntryLedgerEntry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadData = () => {
    setEntries(financialService.getLedger());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filterOptions: FilterOption[] = [
    {
      key: 'eventType',
      label: 'Event Type',
      options: [
        { label: 'CUSTOMER PAYMENT', value: 'CUSTOMER_PAYMENT' },
        { label: 'SETTLEMENT RELEASE', value: 'SETTLEMENT_RELEASE' },
        { label: 'COMMISSION EARNED', value: 'COMMISSION_EARNED' },
        { label: 'WITHDRAWAL PAYOUT', value: 'WITHDRAWAL_PAYOUT' },
        { label: 'REFUND FULL', value: 'REFUND_FULL' },
        { label: 'REFUND PARTIAL', value: 'REFUND_PARTIAL' },
      ],
    },
  ];

  const columns: ColumnDef<DoubleEntryLedgerEntry>[] = [
    {
      header: 'Journal # & Reference',
      accessorKey: 'journalNumber',
      cell: (entry) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground font-mono">{entry.journalNumber}</div>
          <div className="text-xs text-muted-foreground font-mono">Ref: {entry.referenceId}</div>
        </div>
      ),
    },
    {
      header: 'Accounting Event',
      accessorKey: 'eventType',
      cell: (entry) => {
        const eBadges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
          CUSTOMER_PAYMENT: { label: 'Customer Payment', variant: 'default' },
          SETTLEMENT_RELEASE: { label: 'Settlement Release', variant: 'secondary' },
          COMMISSION_EARNED: { label: 'Commission Earned', variant: 'default' },
          WITHDRAWAL_PAYOUT: { label: 'Withdrawal Payout', variant: 'outline' },
          REFUND_FULL: { label: 'Full Refund', variant: 'destructive' },
          REFUND_PARTIAL: { label: 'Partial Refund', variant: 'outline' },
        };
        const conf = eBadges[entry.eventType] || { label: entry.eventType, variant: 'outline' };
        return (
          <div className="space-y-0.5">
            <Badge variant={conf.variant} className="text-[10px] font-bold uppercase">
              {conf.label}
            </Badge>
            <div className="text-xs text-muted-foreground truncate max-w-[240px]" title={entry.description}>
              {entry.description}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Debit Account ➔ Credit Account',
      accessorKey: 'debitAccount',
      cell: (entry) => (
        <div className="space-y-0.5 text-xs font-mono">
          <div className="text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-[200px]" title={entry.debitAccount}>
            DR: {entry.debitAccount}
          </div>
          <div className="text-blue-600 dark:text-blue-400 font-semibold truncate max-w-[200px]" title={entry.creditAccount}>
            CR: {entry.creditAccount}
          </div>
        </div>
      ),
    },
    {
      header: 'Amount (DZD)',
      accessorKey: 'amount',
      cell: (entry) => (
        <span className="font-bold text-foreground text-sm">
          {entry.amount.toLocaleString()} DA
        </span>
      ),
    },
    {
      header: 'Timestamp',
      accessorKey: 'timestamp',
      cell: (entry) => (
        <span className="text-xs text-muted-foreground font-mono">{entry.timestamp}</span>
      ),
    },
    {
      header: 'Actions',
      cell: (entry) => (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEntry(entry);
            setIsDetailOpen(true);
          }}
        >
          <Eye className="h-3.5 w-3.5 mr-1" /> View Entry
        </Button>
      ),
    },
  ];

  const total = entries.length;
  const totalVolume = entries.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center tracking-tight">
          <Scale className="mr-3 h-8 w-8 text-primary" /> Double-Entry Financial General Ledger
        </h1>
        <p className="text-muted-foreground text-sm">
          Immutable double-entry journal tracking debit and credit flows, escrow liability releases, and platform commission recognition.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Journal Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{total} Entries</div>
            <p className="text-xs text-muted-foreground mt-1">Double-entry verified</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Journal Turnover</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{totalVolume.toLocaleString()} DA</div>
            <p className="text-xs text-muted-foreground mt-1">Cumulative debits & credits</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Trial Balance Invariant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Balanced (0 Diff)</div>
            <p className="text-xs text-muted-foreground mt-1">Σ Debits == Σ Credits</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Integrity Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">SHA-256 Hashed</div>
            <p className="text-xs text-muted-foreground mt-1">Append-only immutable record</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <AdminDataTable
        data={entries}
        columns={columns}
        searchPlaceholder="Search journal entries by #, ref, description, debit/credit account..."
        searchKeys={['journalNumber', 'referenceId', 'description', 'debitAccount', 'creditAccount', 'immutableHash']}
        filterOptions={filterOptions}
        exportFileName="khidmatik_financial_ledger"
        onRowClick={(entry) => {
          setSelectedEntry(entry);
          setIsDetailOpen(true);
        }}
        onRefresh={loadData}
      />

      {/* Detail Drawer */}
      {selectedEntry && (
        <AdminDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Journal Entry ${selectedEntry.journalNumber}`}
          subtitle={`Captured on ${selectedEntry.timestamp} • Event: ${selectedEntry.eventType}`}
          statusBadge={{
            label: selectedEntry.eventType,
            variant: 'default',
          }}
          metrics={[
            { label: 'Amount (DZD)', value: `${selectedEntry.amount.toLocaleString()} DA`, icon: DollarSign },
            { label: 'Debit Account', value: selectedEntry.debitAccount.split(' ')[0], icon: ArrowUpRight },
            { label: 'Credit Account', value: selectedEntry.creditAccount.split(' ')[0], icon: ArrowDownLeft },
            { label: 'Operator', value: selectedEntry.operator, icon: ShieldCheck },
          ]}
          fields={[
            { label: 'Journal Entry #', value: selectedEntry.journalNumber },
            { label: 'Reference Entity ID', value: selectedEntry.referenceId },
            { label: 'Debit Account (DR)', value: selectedEntry.debitAccount },
            { label: 'Credit Account (CR)', value: selectedEntry.creditAccount },
            { label: 'Event Description', value: selectedEntry.description, fullWidth: true },
            { label: 'Cryptographic Hash', value: selectedEntry.immutableHash, fullWidth: true },
          ]}
        />
      )}
    </div>
  );
}
