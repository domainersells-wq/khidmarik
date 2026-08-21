'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, FileText, Download, Landmark, CreditCard, AlertCircle, Filter, Loader2, Printer, PlusCircle, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import dynamic from 'next/dynamic';

const FinancialsRevenueChart = dynamic(() => import('./FinancialsRevenueChart').then(mod => mod.FinancialsRevenueChart), {
  ssr: false,
  loading: () => <div className="h-[250px] w-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md">Loading revenue charts...</div>
});

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: string; // 'Sale' | 'Commission' | 'Payout'
  amount: number;
  status: string; // 'Paid' | 'Deducted' | 'Pending (COD)' | 'Processing'
  invoiceId: string;
}

export function FinancialsSection() {
  const toastHook = useToast();
  const { toast } = toastHook;

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 'stxn_001', date: '2024-07-15', description: 'Sale of "Artisan Ceramic Mug" (Order #ORD1001)', type: 'Sale', amount: 2500, status: 'Paid', invoiceId: 'INV_S_001' },
    { id: 'stxn_002', date: '2024-07-14', description: 'Platform Commission (Order #ORD1001)', type: 'Commission', amount: -250, status: 'Deducted', invoiceId: 'INV_S_001' },
    { id: 'stxn_003', date: '2024-07-10', description: 'Sale of "Handmade Leather Wallet" (Order #ORD1002)', type: 'Sale', amount: 1800, status: 'Pending (COD)', invoiceId: 'INV_S_002' },
    { id: 'stxn_004', date: '2024-07-05', description: 'Withdrawal Request', type: 'Payout', amount: -5000, status: 'Processing', invoiceId: 'WDR_001' },
  ]);

  const [totalRevenue, setTotalRevenue] = useState(120500.75);
  const [pendingPayouts, setPendingPayouts] = useState(15200.00);
  const [platformCommissions, setPlatformCommissions] = useState(12050.08);
  const [lastPayoutDate, setLastPayoutDate] = useState('2024-07-01');

  // Available balance
  const availableBalance = totalRevenue - platformCommissions - pendingPayouts;

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Payout Dialogs states
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('bank');
  const [withdrawalDetails, setWithdrawalDetails] = useState('');
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);

  // Manage Payout Methods states
  const [isMethodsOpen, setIsMethodsOpen] = useState(false);
  const [activeBankDetails, setActiveBankDetails] = useState('BNA ending in ****5678');
  const [activeBaridimobRip, setActiveBaridimobRip] = useState('00799999000002134567');
  const [activeSofypayEmail, setActiveSofypayEmail] = useState('seller@payment.dz');
  const [isSavingMethods, setIsSavingMethods] = useState(false);

  useEffect(() => {
    // Load local storage financials configuration if edited
    const storedPayment = localStorage.getItem('khidmatik_settings_payment');
    if (storedPayment) {
      try {
        const parsed = JSON.parse(storedPayment);
        if (parsed.bankDetails) setActiveBankDetails(parsed.bankDetails);
        if (parsed.baridimobRip) setActiveBaridimobRip(parsed.baridimobRip);
      } catch (e) {
        console.warn('Failed loading stored payout details:', e);
      }
    }
  }, []);

  const handleGenerateInvoice = (invoiceId: string) => {
    toastHook.toast({
      title: "Invoice Generated",
      description: `PDF Invoice for ${invoiceId} has been successfully downloaded.`
    });
  };

  const handleWithdrawalRequestSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const amountNum = Number(withdrawalAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toastHook.toast({ title: "Invalid Amount", description: "Please enter a valid positive withdrawal amount.", variant: "destructive" });
      return;
    }
    if (amountNum > availableBalance) {
      toastHook.toast({ title: "Insufficient Balance", description: `You cannot withdraw more than your available balance (${availableBalance.toLocaleString()} DA).`, variant: "destructive" });
      return;
    }

    setIsSubmittingWithdrawal(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newTxn: Transaction = {
      id: `stxn_${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      description: `Withdrawal Request to ${withdrawalMethod === 'bank' ? 'Bank Account' : withdrawalMethod === 'baridimob' ? 'BaridiMob' : 'SofyPay account'}`,
      type: 'Payout',
      amount: -amountNum,
      status: 'Processing',
      invoiceId: `WDR_${Date.now().toString().slice(-3)}`
    };

    setTransactions(prev => [newTxn, ...prev]);
    setPendingPayouts(prev => prev + amountNum);
    setIsSubmittingWithdrawal(false);
    setIsWithdrawalOpen(false);
    setWithdrawalAmount('');
    setWithdrawalDetails('');

    toastHook.toast({
      title: "Withdrawal Requested Successfully!",
      description: `Withdrawal of ${amountNum.toLocaleString()} DA is being processed. Expected clearance: 3-5 business days.`
    });
  };

  const handleSavePayoutMethods = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingMethods(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSavingMethods(false);
    setIsMethodsOpen(false);

    toastHook.toast({
      title: "Payout Methods Updated",
      description: "Your default payment accounts were successfully updated."
    });
  };

  const handleExportTransactions = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `khidmatik_revenue_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toastHook.toast({
      title: "Revenue Report Exported",
      description: `Downloaded ${transactions.length} transactions as JSON.`
    });
  };

  // Filter transactions based on Search Term and Type
  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.description.toLowerCase().includes(searchTerm.toLowerCase()) || txn.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || txn.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <DollarSign className="mr-3 h-8 w-8 text-primary" /> Store Financials & Payouts
        </h1>
        <p className="text-muted-foreground">Track your store's earnings, manage invoices, and request withdrawals.</p>
      </header>

      {/* Overview stats cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Revenue (Month)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} DA</div>
            <p className="text-xs text-green-500">+5.2% vs last month</p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pending Payouts</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayouts.toLocaleString()} DA</div>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Platform Commissions (Month)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformCommissions.toLocaleString()} DA</div>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Last Payout Date</CardTitle></CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{lastPayoutDate}</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Reports Composed Charts */}
      <Card className="shadow border">
        <CardHeader>
          <CardTitle className="flex items-center"><Landmark className="mr-2 h-5 w-5 text-primary"/>Revenue Reports</CardTitle>
          <CardDescription>Track daily cash-flow values and monthly aggregated store sales.</CardDescription>
        </CardHeader>
        <CardContent>
          <FinancialsRevenueChart />
        </CardContent>
        <CardFooter className="pt-4 flex justify-between items-center border-t">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toastHook.toast({title: "Date filter default: Current Month"})}>
              <CalendarDays className="mr-2 h-4 w-4"/> Current Month Only
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportTransactions}>
            <Download className="mr-2 h-4 w-4"/>Export Revenue Data
          </Button>
        </CardFooter>
      </Card>

      {/* Payout/Withdrawal request System */}
      <Card className="shadow border">
        <CardHeader>
          <CardTitle className="flex items-center"><Landmark className="mr-2 h-5 w-5 text-primary"/>Withdrawal System</CardTitle>
          <CardDescription>Request payouts to your bank account or local digital wallet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-3 bg-muted/40 border rounded-md">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Available for Payout</span>
              <p className="text-2xl font-extrabold text-primary mt-1">{availableBalance.toLocaleString()} DA</p>
            </div>
            <div className="p-3 bg-muted/40 border rounded-md">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Active Withdrawal Methods</span>
              <p className="text-xs text-muted-foreground mt-1 truncate">Bank: <strong>{activeBankDetails.slice(0, 30)}...</strong></p>
              <p className="text-xs text-muted-foreground">BaridiMob RIP: <strong>{activeBaridimobRip}</strong></p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Request Withdrawal Dialog */}
            <Dialog open={isWithdrawalOpen} onOpenChange={setIsWithdrawalOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90 text-primary-foreground">
                  <DollarSign className="mr-2 h-4 w-4"/> Request New Withdrawal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white border text-slate-800">
                <form onSubmit={handleWithdrawalRequestSubmit}>
                  <DialogHeader>
                    <DialogTitle>Withdrawal Request</DialogTitle>
                    <DialogDescription>Submit request to withdraw money from store balance. Available: {availableBalance.toLocaleString()} DA</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4 text-slate-800">
                    <div className="grid gap-1.5">
                      <Label htmlFor="withdrawal-amount">Amount (DA) *</Label>
                      <Input
                        id="withdrawal-amount"
                        type="number"
                        min="1"
                        max={availableBalance}
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        required
                        placeholder="e.g. 5000"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="withdrawal-method">Withdrawal Payout Destination</Label>
                      <Select value={withdrawalMethod} onValueChange={setWithdrawalMethod}>
                        <SelectTrigger id="withdrawal-method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank">Bank Account Transfer</SelectItem>
                          <SelectItem value="baridimob">BaridiMob (Algeria Post RIP)</SelectItem>
                          <SelectItem value="sofypay">SofyPay / Chargily account</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="withdrawal-notes">Verification / Account Details *</Label>
                      <Textarea
                        id="withdrawal-notes"
                        value={withdrawalDetails}
                        onChange={(e) => setWithdrawalDetails(e.target.value)}
                        required
                        placeholder={
                          withdrawalMethod === 'bank'
                            ? `Enter BNA/CCP details. Default: ${activeBankDetails}`
                            : withdrawalMethod === 'baridimob'
                            ? `Enter BaridiMob RIP. Default: ${activeBaridimobRip}`
                            : `Enter SofyPay registered Email. Default: ${activeSofypayEmail}`
                        }
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmittingWithdrawal}>
                      {isSubmittingWithdrawal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Request Withdrawal
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Manage payout methods Dialog */}
            <Dialog open={isMethodsOpen} onOpenChange={setIsMethodsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-initial">
                  <CreditCard className="mr-2 h-4 w-4"/> Manage Payout Methods
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white border text-slate-800">
                <form onSubmit={handleSavePayoutMethods}>
                  <DialogHeader>
                    <DialogTitle>Configure Payout Destination accounts</DialogTitle>
                    <DialogDescription>Add/modify accounts used by the platform to clear withdrawals.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4 text-slate-800">
                    <div className="grid gap-1.5">
                      <Label htmlFor="method-bank">Standard Bank Account (RIB / CCP)</Label>
                      <Input
                        id="method-bank"
                        value={activeBankDetails}
                        onChange={(e) => setActiveBankDetails(e.target.value)}
                        placeholder="BNA Code 007..."
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="method-baridi">BaridiMob RIP Number</Label>
                      <Input
                        id="method-baridi"
                        value={activeBaridimobRip}
                        onChange={(e) => setActiveBaridimobRip(e.target.value)}
                        placeholder="007999990000..."
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="method-sofy">SofyPay / Chargily Account Email</Label>
                      <Input
                        id="method-sofy"
                        value={activeSofypayEmail}
                        onChange={(e) => setActiveSofypayEmail(e.target.value)}
                        placeholder="merchant@sofypay.dz"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSavingMethods}>
                      {isSavingMethods && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save payout options
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-xs flex items-start gap-2 mt-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Platform commissions are automatically calculated and deducted before payouts are processed. Standard payout processing time is 3-5 business days after request.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History & Invoices */}
      <Card className="shadow border">
        <CardHeader>
          <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/>Transaction History & Invoices</CardTitle>
          <CardDescription>View all sales, commissions, and generate invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <Input
              placeholder="Search by Order ID or Description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="commission">Commission</SelectItem>
                <SelectItem value="payout">Payout</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount (DA)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map(txn => (
                <TableRow key={txn.id}>
                  <TableCell className="text-xs">{txn.date}</TableCell>
                  <TableCell className="font-medium text-xs sm:text-sm">{txn.description}</TableCell>
                  <TableCell>
                    <Badge variant={txn.type === 'Sale' ? 'outline' : txn.type === 'Commission' ? 'secondary' : 'default'} className={txn.type === 'Payout' ? 'bg-blue-500 text-white' : ''}>
                      {txn.type}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right text-xs sm:text-sm font-mono ${txn.amount < 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {txn.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={txn.status === 'Paid' || txn.status === 'Deducted' ? 'default' : 'secondary'}
                      className={
                        txn.status === 'Paid' || txn.status === 'Deducted'
                          ? 'bg-green-500 text-white'
                          : txn.status === 'Pending (COD)'
                          ? 'bg-yellow-400 text-yellow-900'
                          : txn.status === 'Processing'
                          ? 'bg-blue-500 text-white'
                          : ''
                      }
                    >
                      {txn.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {txn.type === 'Sale' && (
                      <Button variant="ghost" size="icon" onClick={() => handleGenerateInvoice(txn.invoiceId)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No transactions match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
