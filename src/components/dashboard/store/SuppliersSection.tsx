'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { PlusCircle, Search, Trash2, Edit, FileText, Phone, Mail, MapPin, DollarSign, ArrowRightLeft, ShieldAlert, Loader2, Users } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  balance: number;
  notes: string;
  created_at?: string;
}

interface Purchase {
  id: string;
  supplier_id: string;
  supplier_name: string;
  total_amount: number;
  payment_status: 'paid' | 'pending' | 'partial';
  notes: string;
  created_at: string;
}

interface Payment {
  id: string;
  supplier_id: string;
  supplier_name: string;
  amount: number;
  payment_method: 'cash' | 'cib' | 'ccp';
  notes: string;
  created_at: string;
}

export function SuppliersSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal / Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isContractsOpen, setIsContractsOpen] = useState(false);

  // New Supplier Form Fields
  const [supName, setSupName] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supNotes, setSupNotes] = useState('');

  // New Purchase Form Fields
  const [selectedSupId, setSelectedSupId] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseStatus, setPurchaseStatus] = useState<'paid' | 'pending' | 'partial'>('pending');
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // New Payment Form Fields
  const [paymentSupId, setPaymentSupId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cib' | 'ccp'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Local Storage and Supabase Sync
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      let loadedSuppliers: Supplier[] = [];
      let loadedPurchases: Purchase[] = [];
      let loadedPayments: Payment[] = [];

      try {
        // Load suppliers from DB
        const { data: sups, error: supErr } = await supabase.from('suppliers').select('*');
        if (supErr) throw supErr;
        
        if (sups && sups.length > 0) {
          loadedSuppliers = sups.map(s => ({
            id: s.id,
            name: s.name,
            email: s.email || '',
            phone: s.phone || '',
            address: s.address || '',
            balance: Number(s.balance || 0),
            notes: s.notes || ''
          }));
        } else {
          throw new Error("No suppliers returned");
        }

        // Load purchases
        const { data: purchs } = await supabase.from('supplier_purchases').select('*');
        if (purchs) {
          loadedPurchases = purchs.map(p => ({
            id: p.id,
            supplier_id: p.supplier_id,
            supplier_name: sups.find(s => s.id === p.supplier_id)?.name || 'Unknown Supplier',
            total_amount: Number(p.total_amount),
            payment_status: p.payment_status,
            notes: p.notes || '',
            created_at: p.created_at
          }));
        }

        // Load payments
        const { data: pays } = await supabase.from('supplier_payments').select('*');
        if (pays) {
          loadedPayments = pays.map(p => ({
            id: p.id,
            supplier_id: p.supplier_id,
            supplier_name: sups.find(s => s.id === p.supplier_id)?.name || 'Unknown Supplier',
            amount: Number(p.amount),
            payment_method: p.payment_method,
            notes: p.notes || '',
            created_at: p.created_at
          }));
        }

      } catch (err) {
        console.warn('Failed fetching suppliers from database. Falling back to local storage:', err);
        const storedSups = localStorage.getItem('khidmatik_suppliers');
        const storedPurchs = localStorage.getItem('khidmatik_supplier_purchases');
        const storedPays = localStorage.getItem('khidmatik_supplier_payments');

        if (storedSups) {
          loadedSuppliers = JSON.parse(storedSups);
        } else {
          loadedSuppliers = [
            { id: 'sup1', name: 'Algiers Wholesale Electronics', email: 'sales@algiers-wholesale.dz', phone: '021-45-78-99', address: 'Zone Industrielle, Oued Smar, Alger', balance: 45000, notes: 'Primary supplier for smartphone screens and accessories.' },
            { id: 'sup2', name: 'Eco-Packaging Algeria', email: 'info@ecopack.dz', phone: '031-88-22-11', address: 'Zone d\'Activite, Sidi Maarouf, Oran', balance: 0, notes: 'Supplier of organic paper bags and cardboard shipping boxes.' },
            { id: 'sup3', name: 'Blida Artisan Materials', email: 'contact@blida-artisan.dz', phone: '025-30-14-15', address: 'Route de Chrea, Blida', balance: 12500, notes: 'Provides local leather fabrics and clay for ceramic creations.' }
          ];
          localStorage.setItem('khidmatik_suppliers', JSON.stringify(loadedSuppliers));
        }

        if (storedPurchs) {
          loadedPurchases = JSON.parse(storedPurchs);
        } else {
          loadedPurchases = [
            { id: 'p1', supplier_id: 'sup1', supplier_name: 'Algiers Wholesale Electronics', total_amount: 60000, payment_status: 'partial', notes: 'Initial batch of LCD screens', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'p2', supplier_id: 'sup3', supplier_name: 'Blida Artisan Materials', total_amount: 12500, payment_status: 'pending', notes: 'Premium leather rolls', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
          ];
          localStorage.setItem('khidmatik_supplier_purchases', JSON.stringify(loadedPurchases));
        }

        if (storedPays) {
          loadedPayments = JSON.parse(storedPays);
        } else {
          loadedPayments = [
            { id: 'pay1', supplier_id: 'sup1', supplier_name: 'Algiers Wholesale Electronics', amount: 15000, payment_method: 'ccp', notes: 'First down payment on invoice', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
          ];
          localStorage.setItem('khidmatik_supplier_payments', JSON.stringify(loadedPayments));
        }
      }

      setSuppliers(loadedSuppliers);
      setPurchases(loadedPurchases);
      setPayments(loadedPayments);
      setIsLoading(false);
    }

    loadData();
  }, []);

  const saveToStorage = (sups: Supplier[], purchs: Purchase[], pays: Payment[]) => {
    localStorage.setItem('khidmatik_suppliers', JSON.stringify(sups));
    localStorage.setItem('khidmatik_supplier_purchases', JSON.stringify(purchs));
    localStorage.setItem('khidmatik_supplier_payments', JSON.stringify(pays));
  };

  // Add Supplier Handler
  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) {
      toast({ title: 'Validation Error', description: 'Supplier name is required.', variant: 'destructive' });
      return;
    }

    const newSup: Supplier = {
      id: Math.random().toString(36).substring(7),
      name: supName,
      email: supEmail,
      phone: supPhone,
      address: supAddress,
      balance: 0,
      notes: supNotes
    };

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          store_id: user?.storeId || '00000000-0000-0000-0000-000000000001',
          name: supName,
          email: supEmail,
          phone: supPhone,
          address: supAddress,
          balance: 0,
          notes: supNotes
        })
        .select()
        .single();
      
      if (error) throw error;
      if (data) {
        newSup.id = data.id;
      }
    } catch (err) {
      console.warn('Failed inserting supplier into DB, running locally', err);
    }

    const updated = [...suppliers, newSup];
    setSuppliers(updated);
    saveToStorage(updated, purchases, payments);
    setIsAddOpen(false);

    // Reset fields
    setSupName('');
    setSupEmail('');
    setSupPhone('');
    setSupAddress('');
    setSupNotes('');

    toast({ title: 'Supplier Added', description: `Successfully added ${newSup.name}.` });
  };

  // Record Purchase Handler
  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(purchaseAmount);
    if (!selectedSupId || isNaN(amountNum) || amountNum <= 0) {
      toast({ title: 'Validation Error', description: 'Please select a supplier and enter a valid positive purchase amount.', variant: 'destructive' });
      return;
    }

    const targetSup = suppliers.find(s => s.id === selectedSupId);
    if (!targetSup) return;

    const newPurch: Purchase = {
      id: Math.random().toString(36).substring(7),
      supplier_id: selectedSupId,
      supplier_name: targetSup.name,
      total_amount: amountNum,
      payment_status: purchaseStatus,
      notes: purchaseNotes,
      created_at: new Date().toISOString()
    };

    // Calculate new balance
    let balanceIncrease = amountNum;
    if (purchaseStatus === 'paid') balanceIncrease = 0;
    else if (purchaseStatus === 'partial') balanceIncrease = amountNum / 2; // Assume half paid

    const updatedSups = suppliers.map(s => {
      if (s.id === selectedSupId) {
        return { ...s, balance: s.balance + balanceIncrease };
      }
      return s;
    });

    try {
      await supabase.from('supplier_purchases').insert({
        store_id: user?.storeId || '00000000-0000-0000-0000-000000000001',
        supplier_id: selectedSupId,
        total_amount: amountNum,
        payment_status: purchaseStatus,
        notes: purchaseNotes
      });
      // Update DB balance
      const newBal = updatedSups.find(s => s.id === selectedSupId)?.balance || 0;
      await supabase.from('suppliers').update({ balance: newBal }).eq('id', selectedSupId);
    } catch (err) {
      console.warn('Failed recording purchase to DB, running locally', err);
    }

    const updatedPurchases = [newPurch, ...purchases];
    setPurchases(updatedPurchases);
    setSuppliers(updatedSups);
    saveToStorage(updatedSups, updatedPurchases, payments);
    setIsPurchaseOpen(false);

    // Reset fields
    setSelectedSupId('');
    setPurchaseAmount('');
    setPurchaseNotes('');

    toast({ title: 'Purchase Recorded', description: `Added invoice of ${amountNum.toLocaleString()} DA to ${targetSup.name}.` });
  };

  // Record Payment Handler
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    if (!paymentSupId || isNaN(amountNum) || amountNum <= 0) {
      toast({ title: 'Validation Error', description: 'Please select a supplier and enter a valid positive payment amount.', variant: 'destructive' });
      return;
    }

    const targetSup = suppliers.find(s => s.id === paymentSupId);
    if (!targetSup) return;

    if (amountNum > targetSup.balance) {
      toast({ title: 'Limit Exceeded', description: `Payment amount exceeds current balance of ${targetSup.balance.toLocaleString()} DA.`, variant: 'destructive' });
      return;
    }

    const newPay: Payment = {
      id: Math.random().toString(36).substring(7),
      supplier_id: paymentSupId,
      supplier_name: targetSup.name,
      amount: amountNum,
      payment_method: paymentMethod,
      notes: paymentNotes,
      created_at: new Date().toISOString()
    };

    const updatedSups = suppliers.map(s => {
      if (s.id === paymentSupId) {
        return { ...s, balance: Math.max(0, s.balance - amountNum) };
      }
      return s;
    });

    try {
      await supabase.from('supplier_payments').insert({
        store_id: user?.storeId || '00000000-0000-0000-0000-000000000001',
        supplier_id: paymentSupId,
        amount: amountNum,
        payment_method: paymentMethod,
        notes: paymentNotes
      });
      // Update DB balance
      const newBal = updatedSups.find(s => s.id === paymentSupId)?.balance || 0;
      await supabase.from('suppliers').update({ balance: newBal }).eq('id', paymentSupId);
    } catch (err) {
      console.warn('Failed recording payment to DB, running locally', err);
    }

    const updatedPayments = [newPay, ...payments];
    setPayments(updatedPayments);
    setSuppliers(updatedSups);
    saveToStorage(updatedSups, purchases, updatedPayments);
    setIsPaymentOpen(false);

    // Reset fields
    setPaymentSupId('');
    setPaymentAmount('');
    setPaymentNotes('');

    toast({ title: 'Payment Logged', description: `Logged payment of ${amountNum.toLocaleString()} DA to ${targetSup.name}.` });
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    const updated = suppliers.filter(s => s.id !== id);
    setSuppliers(updated);
    saveToStorage(updated, purchases, payments);

    try {
      await supabase.from('suppliers').delete().eq('id', id);
    } catch (err) {
      console.warn('Failed deleting supplier from DB', err);
    }

    toast({ title: 'Supplier Deleted', description: 'Supplier removed successfully.' });
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOutstandingBalance = suppliers.reduce((sum, curr) => sum + curr.balance, 0);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col justify-center items-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /> Loading supplier directory...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center text-slate-800 dark:text-slate-100">
            <Users className="mr-3 h-8 w-8 text-primary" /> Suppliers Directory & Ledger (إدارة الموردين)
          </h1>
          <p className="text-muted-foreground">Monitor purchases, invoices, payments, and outstanding credits with raw materials suppliers.</p>
        </div>
        <div className="flex gap-2">
          {/* Add Supplier Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Supplier</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Supplier</DialogTitle>
                <DialogDescription>Create a supplier profile for raw materials or merchandise procurement.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSupplier} className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label htmlFor="name">Supplier Name / Company *</Label>
                  <Input id="name" value={supName} onChange={e => setSupName(e.target.value)} placeholder="e.g. Algiers Wholesale Electronics" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={supEmail} onChange={e => setSupEmail(e.target.value)} placeholder="sales@company.dz" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" value={supPhone} onChange={e => setSupPhone(e.target.value)} placeholder="e.g. 021-44-55-66" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="address">Physical Address</Label>
                  <Input id="address" value={supAddress} onChange={e => setSupAddress(e.target.value)} placeholder="Oued Smar, Algiers" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="notes">Notes / Scope of Supply</Label>
                  <Textarea id="notes" value={supNotes} onChange={e => setSupNotes(e.target.value)} placeholder="e.g. Supplies components for mobile phones." />
                </div>
                <DialogFooter className="pt-2">
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit">Create Supplier</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Record Purchase Invoice */}
          <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><FileText className="mr-2 h-4 w-4" /> Record Purchase</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Purchase Invoice</DialogTitle>
                <DialogDescription>Enter goods/stock shipments received from suppliers to update ledger balance.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRecordPurchase} className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label>Supplier</Label>
                  <Select value={selectedSupId} onValueChange={setSelectedSupId}>
                    <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name} (Debt: {s.balance.toLocaleString()} DA)</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Total Bill (DA)</Label>
                    <Input type="number" value={purchaseAmount} onChange={e => setPurchaseAmount(e.target.value)} placeholder="e.g. 15000" required />
                  </div>
                  <div className="space-y-1">
                    <Label>Initial Status</Label>
                    <Select value={purchaseStatus} onValueChange={(val: any) => setPurchaseStatus(val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending Payment (Debt)</SelectItem>
                        <SelectItem value="paid">Fully Paid (Cash)</SelectItem>
                        <SelectItem value="partial">Partially Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Purchase Notes</Label>
                  <Textarea value={purchaseNotes} onChange={e => setPurchaseNotes(e.target.value)} placeholder="List items bought or reference invoice number..." />
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit">Record Invoice</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Record Payment */}
          <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary"><DollarSign className="mr-2 h-4 w-4" /> Record Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Supplier Payment</DialogTitle>
                <DialogDescription>Log a payment made to a supplier to reduce outstanding balance dues.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRecordPayment} className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label>Supplier</Label>
                  <Select value={paymentSupId} onValueChange={setPaymentSupId}>
                    <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name} (Owed: {s.balance.toLocaleString()} DA)</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Payment Amount (DA)</Label>
                    <Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="e.g. 5000" required />
                  </div>
                  <div className="space-y-1">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash (نقدي)</SelectItem>
                        <SelectItem value="cib">CIB Card</SelectItem>
                        <SelectItem value="ccp">BaridiMob / CCP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Transaction Notes</Label>
                  <Textarea value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} placeholder="Receipt number or transfer reference code..." />
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit">Record Payment</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Summary KPI Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
              Total Outstanding Balance <ShieldAlert className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{totalOutstandingBalance.toLocaleString()} DA</div>
            <p className="text-xs text-muted-foreground mt-1">Net amount currently owed to active suppliers.</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
              Purchases Logged <FileText className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              {purchases.reduce((acc, curr) => acc + curr.total_amount, 0).toLocaleString()} DA
            </div>
            <p className="text-xs text-muted-foreground mt-1">Aggregated cost of supplies from {purchases.length} invoices.</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
              Total Payments Made <DollarSign className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              {payments.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} DA
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total payout transactions logged to date.</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Directory Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Suppliers Ledger List</CardTitle>
            <CardDescription>Directory of trusted suppliers with current balance states.</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier Company</TableHead>
                  <TableHead>Phone / Contact</TableHead>
                  <TableHead>Physical Address</TableHead>
                  <TableHead>Balance Owed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No suppliers found.</TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{s.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3 inline" /> {s.email || 'N/A'}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
                          <Phone className="h-3 w-3 text-muted-foreground" /> {s.phone || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground inline shrink-0" /> {s.address || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold font-mono text-slate-800 dark:text-slate-100">
                        {s.balance.toLocaleString()} DA
                      </TableCell>
                      <TableCell>
                        {s.balance > 0 ? (
                          <Badge variant="destructive">Pending Debt</Badge>
                        ) : (
                          <Badge variant="secondary">Cleared</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSupplier(s.id)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Purchases & Payments Ledgers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Purchases */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" /> Recent Supply Purchases (فواتير المشتريات)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto max-h-[250px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No purchases logged.</TableCell>
                    </TableRow>
                  ) : (
                    purchases.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-xs truncate max-w-[150px]">{p.supplier_name}</TableCell>
                        <TableCell className="font-mono text-xs">{p.total_amount.toLocaleString()} DA</TableCell>
                        <TableCell>
                          <Badge variant={p.payment_status === 'paid' ? 'secondary' : p.payment_status === 'partial' ? 'outline' : 'destructive'} className="text-[10px]">
                            {p.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Payments History */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-muted-foreground" /> Payments Log (وصولات الدفع)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto max-h-[250px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No payments logged.</TableCell>
                    </TableRow>
                  ) : (
                    payments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-xs truncate max-w-[150px]">{p.supplier_name}</TableCell>
                        <TableCell className="font-mono text-xs">{p.amount.toLocaleString()} DA</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase">{p.payment_method}</Badge>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
