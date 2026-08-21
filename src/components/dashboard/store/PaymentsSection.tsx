'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  CreditCard, Search, ArrowDownCircle, ArrowUpCircle, 
  Wallet, DollarSign, RefreshCw, Landmark, Key, ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  date: string;
  type: 'order_payment' | 'withdrawal' | 'refund' | 'chargeback';
  amountDA: number;
  method: 'COD Yalidine' | 'Baridimob' | 'CCP Direct' | 'Wallet';
  status: 'cleared' | 'processing' | 'rejected';
}

const mockTransactions: Transaction[] = [
  { id: 'TXN-9021', date: '2026-07-07 10:20', type: 'order_payment', amountDA: 5500, method: 'COD Yalidine', status: 'cleared' },
  { id: 'TXN-9022', date: '2026-07-06 14:15', type: 'withdrawal', amountDA: -45000, method: 'CCP Direct', status: 'processing' },
  { id: 'TXN-9023', date: '2026-07-05 18:30', type: 'order_payment', amountDA: 950, method: 'Wallet', status: 'cleared' },
  { id: 'TXN-9024', date: '2026-07-04 11:00', type: 'refund', amountDA: -1500, method: 'Baridimob', status: 'cleared' },
  { id: 'TXN-9025', date: '2026-07-03 09:45', type: 'order_payment', amountDA: 12500, method: 'COD Yalidine', status: 'cleared' },
];

export function PaymentsSection() {
  const { toast } = useToast();
  const [txns, setTxns] = useState<Transaction[]>(mockTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRequestingWithdrawal, setIsRequestingWithdrawal] = useState(false);

  const handleWithdrawal = () => {
    setIsRequestingWithdrawal(true);
    setTimeout(() => {
      setIsRequestingWithdrawal(false);
      toast({ title: 'Withdrawal Submitted', description: 'Your CCP withdrawal request of 25,000 DA has been queued for verification.' });
    }, 1200);
  };

  const filteredTxns = txns.filter(t => 
    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-primary" /> Payments & Payouts (المدفوعات)
          </h1>
          <p className="text-muted-foreground">Reconcile Cash-on-Delivery collections, request bank payouts, and sync Baridimob transaction logs.</p>
        </div>
        <Button 
          onClick={handleWithdrawal} 
          disabled={isRequestingWithdrawal}
          className="bg-primary text-white flex items-center gap-2"
        >
          <Landmark className="h-4 w-4" />
          {isRequestingWithdrawal ? 'Processing Request...' : 'Withdraw to CCP / Baridimob'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Cleared Balance</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-green-600">89,200 DA</div>
            <p className="text-[10px] text-muted-foreground mt-1">Available for immediate payout</p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Pending COD (Yalidine)</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-yellow-600">22,500 DA</div>
            <p className="text-[10px] text-muted-foreground mt-1">Held until parcel delivery confirmation</p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>CCP Payouts in Process</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-blue-600">45,000 DA</div>
            <p className="text-[10px] text-muted-foreground mt-1">Transferred, awaiting postal bank clearing</p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Total Earnings (30 Days)</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono">156,700 DA</div>
            <p className="text-[10px] text-green-600 font-semibold mt-1">Gross sales generated</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Gateways Sync */}
      <Card className="shadow border bg-slate-50/50">
        <CardHeader className="p-4 pb-2"><CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4 text-primary" /> Active Payment Integrations</CardTitle></CardHeader>
        <CardContent className="p-4 pt-0 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded border flex justify-between items-center">
            <div>
              <p className="font-bold text-xs">Yalidine COD API</p>
              <p className="text-[10px] text-muted-foreground">Automated payout matching</p>
            </div>
            <Badge className="bg-green-500 text-white text-[9px]">ACTIVE</Badge>
          </div>
          <div className="bg-white p-3 rounded border flex justify-between items-center">
            <div>
              <p className="font-bold text-xs">Baridimob webhook</p>
              <p className="text-[10px] text-muted-foreground">Instant payment notifications</p>
            </div>
            <Badge className="bg-green-500 text-white text-[9px]">ACTIVE</Badge>
          </div>
          <div className="bg-white p-3 rounded border flex justify-between items-center">
            <div>
              <p className="font-bold text-xs">SGB Algerian Bank Gateway</p>
              <p className="text-[10px] text-muted-foreground">CIB / Dahabia online cards</p>
            </div>
            <Badge variant="secondary" className="text-[9px]">SETUP PENDING</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="shadow border">
        <CardHeader className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <CardDescription>Track payments, refunds, and withdrawals.</CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by transaction ID, method..." 
              className="pl-8"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Execution Date</TableHead>
                <TableHead>Transaction Type</TableHead>
                <TableHead>Payment Channel</TableHead>
                <TableHead className="text-right">Amount (DA)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTxns.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs font-bold text-slate-700">{t.id}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {t.amountDA > 0 ? (
                        <span className="flex items-center gap-1 text-green-700"><ArrowDownCircle className="h-4 w-4 text-green-500" /> Payment Received</span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-700"><ArrowUpCircle className="h-4 w-4 text-slate-500" /> {t.type === 'withdrawal' ? 'Withdrawal' : 'Refund Issued'}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{t.method}</TableCell>
                  <TableCell className={`text-right font-mono text-xs font-bold ${t.amountDA > 0 ? 'text-green-600' : 'text-slate-800'}`}>
                    {t.amountDA > 0 ? '+' : ''}{t.amountDA.toLocaleString()} DA
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      t.status === 'cleared' ? 'bg-green-500 text-white' :
                      t.status === 'processing' ? 'bg-yellow-500 text-white animate-pulse' :
                      'bg-red-500 text-white'
                    }>
                      {t.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
