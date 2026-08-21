'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, FileText, Download, Landmark, TrendingUp, AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const defaultTransactions = [
  { id: 'txn_001', date: '2024-07-10', description: 'Payment for Project #PROJ002 (Leila A.)', type: 'Service Payment', amount: 15000, status: 'Paid', invoiceId: 'INV001' },
  { id: 'txn_002', date: '2024-07-05', description: 'Platform Commission (Project #PROJ002)', type: 'Commission', amount: -1500, status: 'Deducted', invoiceId: 'INV001' },
  { id: 'txn_003', date: '2024-06-28', description: 'Withdrawal Request', type: 'Payout', amount: -12000, status: 'Pending', invoiceId: 'WD001' },
  { id: 'txn_004', date: '2024-06-15', description: 'Payment for Project #PROJ001 (Omar K.) - Deposit', type: 'Service Payment', amount: 25000, status: 'Paid', invoiceId: 'INV002' },
  { id: 'txn_005', date: '2024-06-10', description: 'Platform Commission (Project #PROJ001)', type: 'Commission', amount: -2500, status: 'Deducted', invoiceId: 'INV002' },
];

const defaultPayoutMethods = [
  { id: 'pm1', type: 'Bank Transfer', details: 'BNA ending in ****1234', isDefault: true },
];

export function ProviderEarningsSection() {
  const { toast } = useToast();
  const { translate } = useLanguage();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<any[]>([]);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isPayoutMethodOpen, setIsPayoutMethodOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedPayoutMethod, setSelectedPayoutMethod] = useState('');

  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [escrowBalance, setEscrowBalance] = useState(0);

  // New payout method form
  const [newMethodType, setNewMethodType] = useState('Bank Transfer');
  const [newMethodDetails, setNewMethodDetails] = useState('');

  const loadEarningsData = async () => {
    setIsLoading(true);
    if (!user) {
      const savedTxn = localStorage.getItem('khidmatik_transactions');
      if (savedTxn) {
        try { setTransactions(JSON.parse(savedTxn)); } catch { setTransactions(defaultTransactions); }
      } else {
        setTransactions(defaultTransactions);
        localStorage.setItem('khidmatik_transactions', JSON.stringify(defaultTransactions));
      }
      setEscrowBalance(35000);
      setIsLoading(false);
      return;
    }

    try {
      const { data: dbTxns, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (txError) throw txError;

      if (dbTxns && dbTxns.length > 0) {
        const mapped = dbTxns.map((t: any) => {
          let uiType = 'Service Payment';
          if (t.type === 'escrow_lock') uiType = 'Escrow Held';
          else if (t.type === 'escrow_release') uiType = 'Escrow Released';
          else if (t.type === 'deposit') uiType = 'Account Deposit';
          else if (t.type === 'payout') uiType = 'Payout';

          return {
            id: t.id,
            date: t.created_at.split('T')[0],
            description: t.transaction_code ? `${uiType} (Code: ${t.transaction_code})` : uiType,
            type: uiType,
            amount: parseFloat(t.amount || 0),
            status: t.status === 'approved' ? 'Paid' : t.status === 'rejected' ? 'Deducted' : 'Pending',
            invoiceId: t.transaction_code || 'INV-' + t.id.slice(-4).toUpperCase(),
          };
        });
        setTransactions(mapped);
      } else {
        const savedTxn = localStorage.getItem('khidmatik_transactions');
        if (savedTxn) {
          try { setTransactions(JSON.parse(savedTxn)); } catch { setTransactions(defaultTransactions); }
        } else {
          setTransactions(defaultTransactions);
        }
      }

      const { data: escrows, error: escError } = await supabase
        .from('ongoing_services_escrow')
        .select('*')
        .eq('status', 'locked');
      
      if (!escError && escrows) {
        const totalEscrow = escrows.reduce((sum: number, item: any) => sum + parseFloat(item.amount_in_escrow || 0), 0);
        setEscrowBalance(totalEscrow);
      } else {
        setEscrowBalance(35000);
      }
    } catch (e) {
      console.error('Failed to load earnings from Supabase:', e);
      const savedTxn = localStorage.getItem('khidmatik_transactions');
      if (savedTxn) {
        try { setTransactions(JSON.parse(savedTxn)); } catch { setTransactions(defaultTransactions); }
      } else {
        setTransactions(defaultTransactions);
      }
      setEscrowBalance(35000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadEarningsData();
    }
  }, [user, authLoading]);

  useEffect(() => {
    const savedPm = localStorage.getItem('khidmatik_payout_methods');
    if (savedPm) {
      try { setPayoutMethods(JSON.parse(savedPm)); } catch { setPayoutMethods(defaultPayoutMethods); }
    } else {
      setPayoutMethods(defaultPayoutMethods);
      localStorage.setItem('khidmatik_payout_methods', JSON.stringify(defaultPayoutMethods));
    }
  }, []);

  const totalEarned = transactions.filter(t => t.type === 'Service Payment').reduce((sum, t) => sum + t.amount, 0);
  const totalFees = Math.abs(transactions.filter(t => t.type === 'Commission').reduce((sum, t) => sum + t.amount, 0));
  const pendingPayout = transactions.filter(t => t.type === 'Payout' && t.status === 'Pending').reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: translate('validationError', 'Error'), description: translate('invalidAmount', 'Please enter a valid amount.'), variant: 'destructive' });
      return;
    }

    if (!user) {
      const newTxn = {
        id: 'txn_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        description: `Withdrawal Request - ${selectedPayoutMethod || 'Default Method'}`,
        type: 'Payout',
        amount: -amount,
        status: 'Pending',
        invoiceId: 'WD' + Date.now(),
      };
      const updated = [newTxn, ...transactions];
      setTransactions(updated);
      localStorage.setItem('khidmatik_transactions', JSON.stringify(updated));
      setIsWithdrawOpen(false);
      setWithdrawAmount('');
      toast({ title: translate('withdrawalRequested', 'Withdrawal Requested'), description: `${amount.toLocaleString()} DA ${translate('willBeProcessed', 'will be processed in 3-5 business days.')}` });
      return;
    }

    try {
      const code = 'WD-' + Date.now().toString().slice(-6);
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: -amount,
          method: selectedPayoutMethod || 'bank',
          status: 'pending',
          transaction_code: code,
          type: 'payout',
        });

      if (error) throw error;

      toast({ title: translate('withdrawalRequested', 'Withdrawal Requested'), description: `${amount.toLocaleString()} DA ${translate('willBeProcessed', 'will be processed in 3-5 business days.')}` });
      setIsWithdrawOpen(false);
      setWithdrawAmount('');
      loadEarningsData();
    } catch (e: any) {
      console.error('Error inserting withdrawal:', e);
      toast({ title: 'Withdrawal Failed', description: e.message, variant: 'destructive' });
    }
  };

  const handleAddPayoutMethod = () => {
    if (!newMethodDetails.trim()) {
      toast({ title: translate('validationError', 'Error'), description: translate('fillRequiredFields', 'Please fill in details.'), variant: 'destructive' });
      return;
    }
    const newMethod = { id: 'pm_' + Date.now(), type: newMethodType, details: newMethodDetails.trim(), isDefault: payoutMethods.length === 0 };
    const updated = [...payoutMethods, newMethod];
    setPayoutMethods(updated);
    localStorage.setItem('khidmatik_payout_methods', JSON.stringify(updated));
    setNewMethodDetails('');
    setIsPayoutMethodOpen(false);
    toast({ title: translate('payoutMethodAdded', 'Payout Method Added') });
  };

  const handleExportCSV = () => {
    const header = 'Date,Description,Type,Amount (DA),Status\n';
    const rows = transactions.map(t => `${t.date},"${t.description}",${t.type},${t.amount},${t.status}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'khidmatik_earnings.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: translate('exportComplete', 'Export Complete'), description: translate('csvDownloaded', 'CSV file has been downloaded.') });
  };

  const handleGenerateInvoice = (invoiceId: string) => {
    const invoiceTxns = transactions.filter(t => t.invoiceId === invoiceId);
    const content = invoiceTxns.map(t => `${t.date} | ${t.description} | ${t.amount.toLocaleString()} DA`).join('\n');
    const blob = new Blob([`Invoice: ${invoiceId}\n${'='.repeat(40)}\n${content}\n${'='.repeat(40)}\nGenerated: ${new Date().toLocaleDateString()}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${invoiceId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: translate('invoiceGenerated', 'Invoice Generated'), description: `${invoiceId} ${translate('downloaded', 'downloaded')}.` });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <DollarSign className="mr-3 h-8 w-8 text-primary" /> {translate('earningsPayouts', 'Earnings & Payouts')}
        </h1>
        <p className="text-muted-foreground">{translate('trackEarnings', 'Track your earnings, manage invoices, and request withdrawals.')}</p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{translate('totalEarned', 'Total Earned')}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalEarned.toLocaleString()} DA</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{translate('escrowHeld', 'Escrow Held')}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-600">{escrowBalance.toLocaleString()} DA</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{translate('pendingPayout', 'Pending Payout')}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{pendingPayout.toLocaleString()} DA</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{translate('platformFees', 'Platform Fees')}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalFees.toLocaleString()} DA</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{translate('netEarnings', 'Net Earnings')}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{(totalEarned - totalFees).toLocaleString()} DA</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" />{translate('transactionHistory', 'Transaction History & Invoices')}</CardTitle>
          <CardDescription>{translate('viewPayments', 'View all payments, commissions, and generate invoices.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate('dateLabel', 'Date')}</TableHead>
                  <TableHead>{translate('description', 'Description')}</TableHead>
                  <TableHead>{translate('type', 'Type')}</TableHead>
                  <TableHead className="text-right">{translate('amount', 'Amount (DA)')}</TableHead>
                  <TableHead>{translate('tableStatusHeader', 'Status')}</TableHead>
                  <TableHead className="text-right">{translate('invoice', 'Invoice')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        <span className="text-muted-foreground font-medium">Loading transactions...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {transactions.map(txn => (
                      <TableRow key={txn.id}>
                        <TableCell>{txn.date}</TableCell>
                        <TableCell className="font-medium max-w-[250px] truncate">{txn.description}</TableCell>
                        <TableCell><Badge variant={txn.type === 'Service Payment' ? 'outline' : txn.type === 'Commission' ? 'secondary' : 'default'} className={txn.type === 'Payout' ? 'bg-blue-500 text-white' : ''}>{txn.type}</Badge></TableCell>
                        <TableCell className={`text-right font-medium ${txn.amount < 0 ? 'text-destructive' : 'text-green-600'}`}>{txn.amount.toLocaleString()}</TableCell>
                        <TableCell><Badge variant={txn.status === 'Paid' || txn.status === 'Deducted' ? 'default' : 'secondary'} className={txn.status === 'Paid' || txn.status === 'Deducted' ? 'bg-green-500 text-white' : ''}>{txn.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          {txn.type === 'Service Payment' && <Button variant="ghost" size="icon" onClick={() => handleGenerateInvoice(txn.invoiceId)}><Download className="h-4 w-4" /></Button>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {transactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleExportCSV}><Download className="mr-2 h-4 w-4" />{translate('exportData', 'Export Earnings Data')}</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Landmark className="mr-2 h-5 w-5 text-primary" />{translate('withdrawalSystem', 'Withdrawal System')}</CardTitle>
          <CardDescription>{translate('requestPayouts', 'Request payouts to your bank account or other supported methods.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {translate('currentMethod', 'Current Payout Method')}: <strong>{payoutMethods.find(pm => pm.isDefault)?.type || 'None'} - {payoutMethods.find(pm => pm.isDefault)?.details || translate('noneSet', 'Not set')}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setIsWithdrawOpen(true)}><DollarSign className="mr-2 h-4 w-4" />{translate('requestWithdrawal', 'Request New Withdrawal')}</Button>
            <Button variant="outline" onClick={() => setIsPayoutMethodOpen(true)}><CreditCard className="mr-2 h-4 w-4" />{translate('managePayoutMethods', 'Manage Payout Methods')}</Button>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-xs flex items-start gap-2 mt-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{translate('commissionNote', 'Platform commissions are automatically calculated and deducted before payouts. Standard payout processing time is 3-5 business days.')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Dialog */}
      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{translate('requestWithdrawal', 'Request Withdrawal')}</DialogTitle>
            <DialogDescription>{translate('enterWithdrawAmount', 'Enter the amount you wish to withdraw.')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{translate('amount', 'Amount (DA)')}</Label>
              <Input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="e.g., 10000" />
            </div>
            <div>
              <Label>{translate('payoutMethod', 'Payout Method')}</Label>
              <Select value={selectedPayoutMethod} onValueChange={setSelectedPayoutMethod}>
                <SelectTrigger><SelectValue placeholder={translate('selectMethod', 'Select method...')} /></SelectTrigger>
                <SelectContent>
                  {payoutMethods.map(pm => <SelectItem key={pm.id} value={pm.details}>{pm.type} - {pm.details}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{translate('cancelBtn', 'Cancel')}</Button></DialogClose>
            <Button onClick={handleWithdraw}>{translate('submitWithdrawal', 'Submit Withdrawal')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payout Methods Dialog */}
      <Dialog open={isPayoutMethodOpen} onOpenChange={setIsPayoutMethodOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{translate('managePayoutMethods', 'Manage Payout Methods')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {payoutMethods.map(pm => (
              <div key={pm.id} className="flex items-center justify-between p-2 border rounded-md">
                <span className="text-sm">{pm.type} - {pm.details} {pm.isDefault && <Badge variant="outline" className="ml-1">Default</Badge>}</span>
              </div>
            ))}
            <div className="border-t pt-3 space-y-2">
              <Label>{translate('addNewMethod', 'Add New Method')}</Label>
              <Select value={newMethodType} onValueChange={setNewMethodType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="CCP">CCP</SelectItem>
                  <SelectItem value="BaridiMob">BaridiMob</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder={translate('accountDetails', 'Account details (e.g., account number)')} value={newMethodDetails} onChange={e => setNewMethodDetails(e.target.value)} />
              <Button size="sm" onClick={handleAddPayoutMethod} className="w-full">{translate('addMethod', 'Add Method')}</Button>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{translate('close', 'Close')}</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
