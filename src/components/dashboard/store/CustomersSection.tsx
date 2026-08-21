'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Users, Search, UserPlus, Eye, Edit, MessageSquare, Star, Gift, CheckCircle, Settings, Loader2, XCircle, EyeOff, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Heart, RotateCcw, FileText, Clock, MoreHorizontal, Mail, PlusCircle, MinusCircle, UserX, UserCheck, Trash2, Download, Send } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  registrationDate: string;
  lastLogin?: string;
  totalOrders: number;
  totalSpent: number;
  group: string;
  loyaltyPoints: number;
  shippingAddress?: string;
  billingAddress?: string;
  city?: string;
  internalNotes?: string;
  blocked?: boolean;
  debt?: number;
}

interface LoyaltySettings {
  enabled: boolean;
  pointsMultiplier: number;
  minPointsToRedeem: number;
  discountPerPoint: number;
}

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'reported' | 'hidden';

interface Review {
  id: string;
  productName: string;
  productImage: string;
  customerName: string;
  customerId: string;
  rating: number;
  text: string;
  images?: string[];
  date: string;
  status: ReviewStatus;
  sellerReply?: string;
}

export function CustomersSection() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings>({
    enabled: true,
    pointsMultiplier: 10,
    minPointsToRedeem: 500,
    discountPerPoint: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [groupFilter, setGroupFilter] = useState('All');

  // Add Customer Form State
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerGroup, setNewCustomerGroup] = useState('Regular');
  const [newCustomerPoints, setNewCustomerPoints] = useState(0);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Customer Details Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [drawerNotes, setDrawerNotes] = useState('');

  // Quick-Actions dialog states
  const [qaCustomer, setQaCustomer] = useState<Customer | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMsgOpen, setIsMsgOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isPointsOpen, setIsPointsOpen] = useState(false);
  const [pointsMode, setPointsMode] = useState<'add' | 'deduct'>('add');
  const [pointsAmount, setPointsAmount] = useState(0);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [newGroupValue, setNewGroupValue] = useState('Regular');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [payDebtAmount, setPayDebtAmount] = useState('');

  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([
    { id: 'rev1', productName: 'Artisan Ceramic Mug', productImage: 'https://placehold.co/60x60.png?text=Mug', customerName: 'Ali Benomar', customerId: 'cust1', rating: 5, text: 'Absolutely love this mug! Great quality and fast delivery. Highly recommended to everyone.', date: '2026-06-28', status: 'pending' },
    { id: 'rev2', productName: 'Couscous Royal Special', productImage: 'https://placehold.co/60x60.png?text=Couscous', customerName: 'Fatima Chergui', customerId: 'cust2', rating: 2, text: 'Package was damaged on arrival. The couscous was okay but presentation was poor.', date: '2026-06-25', status: 'pending' },
    { id: 'rev3', productName: 'Leather Wallet', productImage: 'https://placehold.co/60x60.png?text=Wallet', customerName: 'Yacine Khelifi', customerId: 'cust3', rating: 4, text: 'Good quality wallet. Stitching is solid. Could use a coin pocket though.', date: '2026-06-20', status: 'approved', sellerReply: 'Thank you for your kind feedback! We are working on adding a coin pocket in our next design.' },
    { id: 'rev4', productName: 'Artisan Ceramic Mug', productImage: 'https://placehold.co/60x60.png?text=Mug', customerName: 'Lydia Ait', customerId: 'cust1', rating: 1, text: 'Received broken. Very disappointed. Please improve packaging.', date: '2026-06-18', status: 'reported' },
    { id: 'rev5', productName: 'Organic Olive Oil', productImage: 'https://placehold.co/60x60.png?text=Oil', customerName: 'Amine Douba', customerId: 'cust1', rating: 5, text: 'Pure and authentic! Best olive oil I have tried. Will definitely order again.', date: '2026-06-15', status: 'approved' },
    { id: 'rev6', productName: 'Leather Wallet', productImage: 'https://placehold.co/60x60.png?text=Wallet', customerName: 'Sara Meziane', customerId: 'cust2', rating: 3, text: 'Decent but overpriced for the quality offered.', date: '2026-06-10', status: 'rejected' },
  ]);
  const [reviewTab, setReviewTab] = useState<'all' | ReviewStatus>('pending');
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [pointsMultiplier, setPointsMultiplier] = useState(10);
  const [minPointsToRedeem, setMinPointsToRedeem] = useState(500);
  const [discountPerPoint, setDiscountPerPoint] = useState(1);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

  // Load data from Supabase / localStorage fallback
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      let loadedCustomers: Customer[] = [];
      try {
        const { data, error } = await supabase.from('customers').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          loadedCustomers = data.map(item => ({
            id: item.id,
            name: item.name,
            email: item.email,
            registrationDate: item.registration_date,
            totalOrders: item.total_orders,
            totalSpent: Number(item.total_spent),
            group: item.group_name,
            loyaltyPoints: item.loyalty_points
          }));
        } else {
          throw new Error("No data in table");
        }
      } catch (err) {
        console.warn('Failed to load customers from Supabase, checking localStorage:', err);
        const stored = localStorage.getItem('khidmatikCustomers');
        if (stored) {
          loadedCustomers = JSON.parse(stored);
        } else {
          loadedCustomers = [
            { id: 'cust1', name: 'Amine Douba', email: 'amine.d@example.dz', phone: '0550112233', registrationDate: '2024-01-15', lastLogin: '2026-06-30', totalOrders: 5, totalSpent: 12500, group: 'VIP', loyaltyPoints: 500, shippingAddress: '12 Rue de la Paix, Algiers', billingAddress: '12 Rue de la Paix, Algiers', city: 'Algiers', internalNotes: 'VIP client — priority handling.', debt: 4500 },
            { id: 'cust2', name: 'Fatima Chergui', email: 'f.chergui@example.dz', phone: '0661887654', registrationDate: '2024-03-22', lastLogin: '2026-06-28', totalOrders: 2, totalSpent: 3200, group: 'New', loyaltyPoints: 80, shippingAddress: 'Cite 200 Logements, Oran', billingAddress: 'Cite 200 Logements, Oran', city: 'Oran', debt: 0 },
            { id: 'cust3', name: 'Yacine Khelifi', email: 'yacine.k@example.dz', phone: '0770445566', registrationDate: '2023-11-05', lastLogin: '2026-06-29', totalOrders: 12, totalSpent: 28000, group: 'Regular', loyaltyPoints: 1200, shippingAddress: 'Villa 5, Hydra, Algiers', billingAddress: 'Villa 5, Hydra, Algiers', city: 'Algiers', debt: 12000 },
          ];
          localStorage.setItem('khidmatikCustomers', JSON.stringify(loadedCustomers));
        }
      }
      setCustomers(loadedCustomers);

      // Load settings
      try {
        const { data, error } = await supabase.from('store_settings').select('value').eq('key', 'loyalty_program').single();
        if (error) throw error;
        if (data?.value) {
          const parsed = data.value as LoyaltySettings;
          setLoyaltySettings(parsed);
          setPointsMultiplier(parsed.pointsMultiplier);
          setMinPointsToRedeem(parsed.minPointsToRedeem);
          setDiscountPerPoint(parsed.discountPerPoint);
        }
      } catch (err) {
        console.warn('Failed to load loyalty settings from Supabase, checking localStorage:', err);
        const stored = localStorage.getItem('khidmatikLoyaltySettings');
        if (stored) {
          const parsed = JSON.parse(stored);
          setLoyaltySettings(parsed);
          setPointsMultiplier(parsed.pointsMultiplier);
          setMinPointsToRedeem(parsed.minPointsToRedeem);
          setDiscountPerPoint(parsed.discountPerPoint);
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Sync settings state when dialog opens
  useEffect(() => {
    if (isSettingsDialogOpen) {
      setPointsMultiplier(loyaltySettings.pointsMultiplier);
      setMinPointsToRedeem(loyaltySettings.minPointsToRedeem);
      setDiscountPerPoint(loyaltySettings.discountPerPoint);
    }
  }, [isSettingsDialogOpen, loyaltySettings]);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = groupFilter === 'All' || customer.group === groupFilter;
    return matchesSearch && matchesGroup;
  });

  const openCustomerDrawer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setActiveCustomer(customer);
      setDrawerNotes(customer.internalNotes || '');
      setIsDrawerOpen(true);
    }
  };

  const handleSaveDrawerNotes = () => {
    if (!activeCustomer) return;
    const updated = customers.map(c => c.id === activeCustomer.id ? { ...c, internalNotes: drawerNotes } : c);
    setCustomers(updated);
    localStorage.setItem('khidmatikCustomers', JSON.stringify(updated));
    toast({ title: 'Internal Notes Saved', description: `Notes updated for ${activeCustomer.name}.` });
  };

  const handlePayCustomerDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) return;
    const payVal = parseFloat(payDebtAmount);
    if (isNaN(payVal) || payVal <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a valid amount to pay.', variant: 'destructive' });
      return;
    }
    const currentDebt = activeCustomer.debt || 0;
    if (payVal > currentDebt) {
      toast({ title: 'Limit Exceeded', description: `Payment exceeds current debt of ${currentDebt.toLocaleString()} DA.`, variant: 'destructive' });
      return;
    }
    const newDebt = currentDebt - payVal;
    const updated = customers.map(c => c.id === activeCustomer.id ? { ...c, debt: newDebt } : c);
    setCustomers(updated);
    localStorage.setItem('khidmatikCustomers', JSON.stringify(updated));
    setActiveCustomer({ ...activeCustomer, debt: newDebt });
    setPayDebtAmount('');
    toast({ title: 'Debt Payment Logged', description: `Successfully paid ${payVal.toLocaleString()} DA. Remaining: ${newDebt.toLocaleString()} DA.` });
  };

  const handleEditCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    toast({ title: "Edit Customer (Conceptual)", description: `Editing profile for ${customer?.name}.` });
  };

  // ── Quick-Action helpers ──────────────────────────────────────────────────
  const openQA = (customer: Customer) => setQaCustomer(customer);

  const saveCustomers = (updated: Customer[]) => {
    setCustomers(updated);
    localStorage.setItem('khidmatikCustomers', JSON.stringify(updated));
  };

  const handleOpenEdit = (customer: Customer) => {
    setQaCustomer(customer);
    setEditName(customer.name);
    setEditEmail(customer.email);
    setEditPhone(customer.phone || '');
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaCustomer) return;
    const updated = customers.map(c => c.id === qaCustomer.id ? { ...c, name: editName, email: editEmail, phone: editPhone } : c);
    saveCustomers(updated);
    setIsEditOpen(false);
    toast({ title: 'Customer Updated', description: `${editName}'s profile has been saved.` });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaCustomer) return;
    setIsMsgOpen(false);
    setMsgText('');
    toast({ title: 'Message Sent', description: `Message delivered to ${qaCustomer.name} via platform notification.` });
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaCustomer) return;
    setIsEmailOpen(false);
    setEmailSubject('');
    setEmailBody('');
    toast({ title: 'Email Sent', description: `Email "${emailSubject}" sent to ${qaCustomer.email}.` });
  };

  const handleAdjustPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaCustomer || !pointsAmount) return;
    const updated = customers.map(c => {
      if (c.id !== qaCustomer.id) return c;
      const delta = pointsMode === 'add' ? pointsAmount : -pointsAmount;
      return { ...c, loyaltyPoints: Math.max(0, (c.loyaltyPoints || 0) + delta) };
    });
    saveCustomers(updated);
    setIsPointsOpen(false);
    setPointsAmount(0);
    toast({ title: `Points ${pointsMode === 'add' ? 'Added' : 'Deducted'}`, description: `${pointsAmount} pts ${pointsMode === 'add' ? 'added to' : 'removed from'} ${qaCustomer.name}.` });
  };

  const handleChangeGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaCustomer) return;
    const updated = customers.map(c => c.id === qaCustomer.id ? { ...c, group: newGroupValue } : c);
    saveCustomers(updated);
    setIsGroupOpen(false);
    toast({ title: 'Group Changed', description: `${qaCustomer.name} moved to ${newGroupValue}.` });
  };

  const handleToggleBlock = (customer: Customer) => {
    const updated = customers.map(c => c.id === customer.id ? { ...c, blocked: !c.blocked } : c);
    saveCustomers(updated);
    toast({ title: customer.blocked ? 'Customer Unblocked' : 'Customer Blocked', description: `${customer.name} has been ${customer.blocked ? 'unblocked' : 'blocked'}.`, variant: customer.blocked ? 'default' : 'destructive' });
  };

  const handleDeleteCustomer = () => {
    if (!qaCustomer) return;
    const updated = customers.filter(c => c.id !== qaCustomer.id);
    saveCustomers(updated);
    setIsDeleteOpen(false);
    toast({ title: 'Customer Deleted', description: `${qaCustomer.name} has been permanently removed.`, variant: 'destructive' });
  };

  const handleExportCustomer = (customer: Customer) => {
    const data = JSON.stringify(customer, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer_${customer.id}_${customer.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export Complete', description: `${customer.name}'s data exported as JSON.` });
  };

  const handleApproveReview = (reviewId: string) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: 'approved' } : r));
    toast({ title: 'Review Approved', description: 'Review is now visible on the product page.' });
  };

  const handleRejectReview = (reviewId: string) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: 'rejected' } : r));
    toast({ title: 'Review Rejected', description: 'Review has been rejected and hidden from the storefront.', variant: 'destructive' });
  };

  const handleHideReview = (reviewId: string) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: 'hidden' } : r));
    toast({ title: 'Review Hidden', description: 'Review is no longer visible publicly.' });
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    toast({ title: 'Review Deleted', description: 'Review permanently removed.', variant: 'destructive' });
  };

  const handleOpenReply = (review: Review) => {
    setActiveReview(review);
    setReplyText(review.sellerReply || '');
    setIsReplyOpen(true);
  };

  const handleSaveReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReview) return;
    setReviews(prev => prev.map(r => r.id === activeReview.id ? { ...r, sellerReply: replyText, status: 'approved' } : r));
    setIsReplyOpen(false);
    toast({ title: 'Seller Reply Saved', description: 'Your reply is now shown under the review.' });
  };

  const handleAddCustomer = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerEmail) return;
    setIsAddingCustomer(true);

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustomerName,
      email: newCustomerEmail,
      registrationDate: new Date().toISOString().split('T')[0],
      totalOrders: 0,
      totalSpent: 0,
      group: newCustomerGroup,
      loyaltyPoints: Number(newCustomerPoints) || 0
    };

    let savedToCloud = false;
    try {
      const { error } = await supabase.from('customers').insert({
        name: newCustomerName,
        email: newCustomerEmail,
        group_name: newCustomerGroup,
        loyalty_points: Number(newCustomerPoints) || 0
      });
      if (!error) savedToCloud = true;
    } catch (err) {
      console.warn('Failed to save customer to Supabase, saving locally:', err);
    }

    const updated = [...customers, newCustomer];
    setCustomers(updated);
    localStorage.setItem('khidmatikCustomers', JSON.stringify(updated));

    setIsAddingCustomer(false);
    setIsAddDialogOpen(false);
    setNewCustomerName('');
    setNewCustomerEmail('');
    setNewCustomerGroup('Regular');
    setNewCustomerPoints(0);

    toast({
      title: savedToCloud ? "Customer Added & Saved to Cloud" : "Customer Added & Saved Locally",
      description: `Successfully registered "${newCustomerName}".`
    });
  };

  const handleSaveLoyaltySettings = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);

    const newSettings: LoyaltySettings = {
      enabled: true,
      pointsMultiplier: Number(pointsMultiplier),
      minPointsToRedeem: Number(minPointsToRedeem),
      discountPerPoint: Number(discountPerPoint)
    };

    let savedToCloud = false;
    try {
      const { error } = await supabase.from('store_settings').upsert({
        key: 'loyalty_program',
        value: newSettings,
        updated_at: new Date().toISOString()
      });
      if (!error) savedToCloud = true;
    } catch (err) {
      console.warn('Failed to save loyalty settings to Supabase, saving locally:', err);
    }

    setLoyaltySettings(newSettings);
    localStorage.setItem('khidmatikLoyaltySettings', JSON.stringify(newSettings));

    setIsSavingSettings(false);
    setIsSettingsDialogOpen(false);
    toast({
      title: savedToCloud ? "Loyalty Rules Saved to Cloud" : "Loyalty Rules Saved Locally",
      description: "Earning multipliers and redemption conditions updated successfully."
    });
  };

  return (
    <>
    <Card className="shadow-lg border">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center">
          <Users className="mr-3 h-6 w-6 text-primary" /> Members & Customers Management
        </CardTitle>
        <CardDescription>View store subscribers and customer data, loyalty points, reviews, and product Q&A.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by Name or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:w-full md:w-[300px] lg:w-[400px]"
            />
          </div>
          
          <div className="w-full sm:w-[220px]">
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Groups</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" /> Add Customer Manually
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleAddCustomer}>
                <DialogHeader>
                  <DialogTitle>Add Customer</DialogTitle>
                  <DialogDescription>Enter user credentials to register them as a customer in your store CRM.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cust-name">Full Name</Label>
                    <Input id="cust-name" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} required placeholder="Amine Douba" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cust-email">Email Address</Label>
                    <Input id="cust-email" type="email" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} required placeholder="amine@example.dz" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cust-group">Customer Group</Label>
                    <Select value={newCustomerGroup} onValueChange={setNewCustomerGroup}>
                      <SelectTrigger id="cust-group">
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Regular">Regular</SelectItem>
                        <SelectItem value="VIP">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cust-points">Initial Loyalty Points</Label>
                    <Input id="cust-points" type="number" min="0" value={newCustomerPoints} onChange={(e) => setNewCustomerPoints(Number(e.target.value))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isAddingCustomer}>
                    {isAddingCustomer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Customer
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 flex justify-center items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading customer list...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead className="text-right">Total Spent (DA)</TableHead>
                  <TableHead className="text-center">Loyalty Pts</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {customer.blocked && <Badge variant="destructive" className="text-[9px] px-1 py-0">Blocked</Badge>}
                        {customer.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{customer.email}</TableCell>
                      <TableCell className="text-center">{customer.totalOrders}</TableCell>
                      <TableCell className="text-right font-mono">{(customer.totalSpent ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-center">{customer.loyaltyPoints || 0}</TableCell>
                      <TableCell>
                        <Badge variant={customer.group === 'VIP' ? 'default' : 'secondary'} className={customer.group === 'VIP' ? 'bg-primary text-primary-foreground' : ''}>
                          {customer.group}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border text-slate-800 w-52">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Quick Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openCustomerDrawer(customer.id)}>
                              <Eye className="mr-2 h-4 w-4 text-blue-500" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(customer)}>
                              <Edit className="mr-2 h-4 w-4 text-slate-500" /> Edit Customer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setQaCustomer(customer); setIsMsgOpen(true); }}>
                              <Send className="mr-2 h-4 w-4 text-purple-500" /> Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setQaCustomer(customer); setEmailSubject(''); setEmailBody(''); setIsEmailOpen(true); }}>
                              <Mail className="mr-2 h-4 w-4 text-sky-500" /> Send Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setQaCustomer(customer); setPointsMode('add'); setPointsAmount(0); setIsPointsOpen(true); }}>
                              <PlusCircle className="mr-2 h-4 w-4 text-green-600" /> Add Loyalty Points
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setQaCustomer(customer); setPointsMode('deduct'); setPointsAmount(0); setIsPointsOpen(true); }}>
                              <MinusCircle className="mr-2 h-4 w-4 text-amber-600" /> Deduct Loyalty Points
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setQaCustomer(customer); setNewGroupValue(customer.group); setIsGroupOpen(true); }}>
                              <Users className="mr-2 h-4 w-4 text-indigo-500" /> Change Group
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleBlock(customer)} className={customer.blocked ? 'text-green-700 font-semibold' : 'text-orange-700 font-semibold'}>
                              {customer.blocked ? <><UserCheck className="mr-2 h-4 w-4" /> Unblock Customer</> : <><UserX className="mr-2 h-4 w-4" /> Block Customer</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportCustomer(customer)}>
                              <Download className="mr-2 h-4 w-4 text-teal-600" /> Export Data
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setQaCustomer(customer); setIsDeleteOpen(true); }} className="text-destructive font-bold">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Customer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No customers found matching filters.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
        <Separator />

        {/* ═══════════════ REVIEWS MANAGEMENT SECTION ═══════════════════════ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-headline flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" /> Reviews Management
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">{reviews.filter(r => r.status === 'pending').length} pending</span>
              <span className="bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">{reviews.filter(r => r.status === 'reported').length} reported</span>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'approved', 'rejected', 'reported', 'hidden'] as const).map(tab => {
              const counts: Record<string, number> = {
                all: reviews.length,
                pending: reviews.filter(r => r.status === 'pending').length,
                approved: reviews.filter(r => r.status === 'approved').length,
                rejected: reviews.filter(r => r.status === 'rejected').length,
                reported: reviews.filter(r => r.status === 'reported').length,
                hidden: reviews.filter(r => r.status === 'hidden').length,
              };
              const colors: Record<string, string> = {
                all: 'bg-slate-100 text-slate-700 border-slate-300',
                pending: 'bg-amber-50 text-amber-700 border-amber-300',
                approved: 'bg-green-50 text-green-700 border-green-300',
                rejected: 'bg-red-50 text-red-700 border-red-300',
                reported: 'bg-orange-50 text-orange-700 border-orange-300',
                hidden: 'bg-gray-50 text-gray-500 border-gray-300',
              };
              const activeColors: Record<string, string> = {
                all: 'bg-slate-700 text-white',
                pending: 'bg-amber-500 text-white',
                approved: 'bg-green-600 text-white',
                rejected: 'bg-red-600 text-white',
                reported: 'bg-orange-600 text-white',
                hidden: 'bg-gray-500 text-white',
              };
              return (
                <button
                  key={tab}
                  onClick={() => setReviewTab(tab)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    reviewTab === tab ? activeColors[tab] : colors[tab]
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab]})
                </button>
              );
            })}
          </div>

          {/* Review cards grid */}
          <div className="space-y-3">
            {reviews
              .filter(r => reviewTab === 'all' || r.status === reviewTab)
              .map(review => (
                <div
                  key={review.id}
                  className={`border rounded-xl p-4 bg-card shadow-sm transition-all hover:shadow-md ${
                    review.status === 'reported' ? 'border-orange-400 bg-orange-50/30' :
                    review.status === 'pending' ? 'border-amber-300 bg-amber-50/20' :
                    review.status === 'rejected' ? 'border-red-300 bg-red-50/10 opacity-70' :
                    review.status === 'hidden' ? 'opacity-50 bg-muted/30' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="h-14 w-14 rounded-lg border overflow-hidden bg-muted">
                        <img src={review.productImage} alt={review.productName} className="h-full w-full object-cover" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-semibold text-sm">{review.productName}</p>
                          <p className="text-xs text-muted-foreground">{review.customerName} · {review.date}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Status badge */}
                          {review.status === 'pending' && <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">⏳ Pending</Badge>}
                          {review.status === 'approved' && <Badge className="bg-green-100 text-green-800 border-green-300 text-[10px]">✅ Approved</Badge>}
                          {review.status === 'rejected' && <Badge className="bg-red-100 text-red-800 border-red-300 text-[10px]">❌ Rejected</Badge>}
                          {review.status === 'reported' && <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-[10px]">🚨 Reported</Badge>}
                          {review.status === 'hidden' && <Badge className="bg-gray-100 text-gray-600 border-gray-300 text-[10px]">🙈 Hidden</Badge>}
                        </div>
                      </div>

                      {/* Star rating */}
                      <div className="flex items-center gap-0.5 mt-1.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`h-3.5 w-3.5 ${ s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">{review.rating}/5</span>
                      </div>

                      {/* Review text */}
                      <p className="text-sm text-slate-700 mt-2 leading-relaxed">{review.text}</p>

                      {/* Seller reply */}
                      {review.sellerReply && (
                        <div className="mt-2 pl-3 border-l-2 border-primary/40 bg-primary/5 rounded-r-md py-1.5 pr-2">
                          <p className="text-[11px] font-semibold text-primary">Seller Reply:</p>
                          <p className="text-xs text-slate-600">{review.sellerReply}</p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {review.status !== 'approved' && (
                          <Button size="sm" variant="outline" className="h-7 text-[11px] border-green-400 text-green-700 hover:bg-green-50" onClick={() => handleApproveReview(review.id)}>
                            <CheckCircle className="mr-1 h-3 w-3" /> Approve
                          </Button>
                        )}
                        {review.status !== 'rejected' && (
                          <Button size="sm" variant="outline" className="h-7 text-[11px] border-red-400 text-red-700 hover:bg-red-50" onClick={() => handleRejectReview(review.id)}>
                            <XCircle className="mr-1 h-3 w-3" /> Reject
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-7 text-[11px] border-primary/40 text-primary hover:bg-primary/5" onClick={() => handleOpenReply(review)}>
                          <MessageSquare className="mr-1 h-3 w-3" /> {review.sellerReply ? 'Edit Reply' : 'Reply'}
                        </Button>
                        {review.status !== 'hidden' && (
                          <Button size="sm" variant="outline" className="h-7 text-[11px] text-slate-500 hover:bg-slate-50" onClick={() => handleHideReview(review.id)}>
                            <EyeOff className="mr-1 h-3 w-3" /> Hide
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-7 text-[11px] border-destructive/40 text-destructive hover:bg-red-50" onClick={() => handleDeleteReview(review.id)}>
                          <Trash2 className="mr-1 h-3 w-3" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            {reviews.filter(r => reviewTab === 'all' || r.status === reviewTab).length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm border rounded-xl bg-muted/10">
                <Star className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                No reviews in this category.
              </div>
            )}
          </div>
        </section>

        <div className="grid md:grid-cols-1 gap-6">
          <Card className="bg-muted/30 border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center"><Gift className="mr-2 h-5 w-5 text-primary"/>Loyalty Program</CardTitle>
              <CardDescription>Manage customer loyalty points and rewards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-card border p-3 rounded-md shadow-sm space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Earning Rate:</span><span className="font-semibold">{loyaltySettings.pointsMultiplier} pts / 100 DA</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Min Points to Redeem:</span><span className="font-semibold">{loyaltySettings.minPointsToRedeem} pts</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Redemption Value:</span><span className="font-semibold">1 pt = {loyaltySettings.discountPerPoint} DA discount</span></div>
              </div>

              <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Settings className="mr-2 h-4 w-4" /> Configure Loyalty Program
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <form onSubmit={handleSaveLoyaltySettings}>
                    <DialogHeader>
                      <DialogTitle>Configure Loyalty Rules</DialogTitle>
                      <DialogDescription>Define point multipliers and conversion values for customer checkout rewards.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="pts-mult">Points Earning Rate (Points per 100 DA Spent)</Label>
                        <Input id="pts-mult" type="number" min="1" value={pointsMultiplier} onChange={(e) => setPointsMultiplier(Number(e.target.value))} required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="pts-min">Minimum Points Threshold for Redemption</Label>
                        <Input id="pts-min" type="number" min="0" value={minPointsToRedeem} onChange={(e) => setMinPointsToRedeem(Number(e.target.value))} required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="pts-value">Point Discount Worth (DA discount per 1 loyalty point)</Label>
                        <Input id="pts-value" type="number" step="0.1" min="0.1" value={discountPerPoint} onChange={(e) => setDiscountPerPoint(Number(e.target.value))} required />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSavingSettings}>
                        {isSavingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Loyalty Rules
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>

    {/* === Seller Reply Dialog === */}
    <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
      <DialogContent className="sm:max-w-lg bg-white border text-slate-800">
        <form onSubmit={handleSaveReply}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Seller Reply</DialogTitle>
            <DialogDescription>
              Replying to <strong>{activeReview?.customerName}</strong>'s review on <strong>{activeReview?.productName}</strong>.
            </DialogDescription>
          </DialogHeader>
          {activeReview && (
            <div className="py-3 space-y-3">
              <div className="bg-muted/30 border rounded-md p-3 text-xs">
                <div className="flex items-center gap-1 mb-1">
                  {[1,2,3,4,5].map(s => <Star key={s} className={`h-3 w-3 ${s <= activeReview.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />)}
                </div>
                <p className="text-slate-600 italic">"{activeReview.text}"</p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="seller-reply">Your Reply</Label>
                <Textarea
                  id="seller-reply"
                  rows={4}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Write a professional and helpful reply..."
                  required
                  className="text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setIsReplyOpen(false)}>Cancel</Button>
            <Button type="submit"><CheckCircle className="mr-2 h-4 w-4" /> Publish Reply</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* ═══ Quick-Action Dialogs ══════════════════════════════════════════════ */}

    {/* 1. Edit Customer Dialog */}
    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
      <DialogContent className="sm:max-w-md bg-white border text-slate-800">
        <form onSubmit={handleSaveEdit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit className="h-4 w-4 text-primary" /> Edit Customer</DialogTitle>
            <DialogDescription>Update profile details for {qaCustomer?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input id="edit-name" value={editName} onChange={e => setEditName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input id="edit-email" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input id="edit-phone" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="055 000 0000" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button type="submit"><CheckCircle className="mr-2 h-4 w-4" /> Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* 2. Send Message Dialog */}
    <Dialog open={isMsgOpen} onOpenChange={setIsMsgOpen}>
      <DialogContent className="sm:max-w-md bg-white border text-slate-800">
        <form onSubmit={handleSendMessage}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-4 w-4 text-purple-500" /> Send Message</DialogTitle>
            <DialogDescription>Send an in-platform notification to {qaCustomer?.name}.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea rows={4} placeholder="Type your message..." value={msgText} onChange={e => setMsgText(e.target.value)} required className="text-sm" />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setIsMsgOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white"><Send className="mr-2 h-4 w-4" /> Send</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* 3. Send Email Dialog */}
    <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
      <DialogContent className="sm:max-w-lg bg-white border text-slate-800">
        <form onSubmit={handleSendEmail}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="h-4 w-4 text-sky-500" /> Send Email</DialogTitle>
            <DialogDescription>Compose and send an email to {qaCustomer?.email}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="email-subject">Subject</Label>
              <Input id="email-subject" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="e.g. Your order is ready!" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email-body">Body</Label>
              <Textarea id="email-body" rows={5} value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder="Write your email content here..." required className="text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setIsEmailOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white"><Mail className="mr-2 h-4 w-4" /> Send Email</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* 4. Adjust Loyalty Points Dialog */}
    <Dialog open={isPointsOpen} onOpenChange={setIsPointsOpen}>
      <DialogContent className="sm:max-w-sm bg-white border text-slate-800">
        <form onSubmit={handleAdjustPoints}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pointsMode === 'add' ? <PlusCircle className="h-4 w-4 text-green-600" /> : <MinusCircle className="h-4 w-4 text-amber-600" />}
              {pointsMode === 'add' ? 'Add' : 'Deduct'} Loyalty Points
            </DialogTitle>
            <DialogDescription>
              Current balance: <strong>{qaCustomer?.loyaltyPoints || 0} pts</strong> for {qaCustomer?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="pts-amount">Points to {pointsMode === 'add' ? 'Add' : 'Deduct'}</Label>
            <Input id="pts-amount" type="number" min={1} value={pointsAmount || ''} onChange={e => setPointsAmount(Number(e.target.value))} required className="mt-1.5" placeholder="e.g. 100" />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setIsPointsOpen(false)}>Cancel</Button>
            <Button type="submit" className={pointsMode === 'add' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}>
              {pointsMode === 'add' ? <><PlusCircle className="mr-2 h-4 w-4" /> Add Points</> : <><MinusCircle className="mr-2 h-4 w-4" /> Deduct Points</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* 5. Change Group Dialog */}
    <Dialog open={isGroupOpen} onOpenChange={setIsGroupOpen}>
      <DialogContent className="sm:max-w-sm bg-white border text-slate-800">
        <form onSubmit={handleChangeGroup}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-indigo-500" /> Change Customer Group</DialogTitle>
            <DialogDescription>Currently <strong>{qaCustomer?.group}</strong> — select a new group for {qaCustomer?.name}.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newGroupValue} onValueChange={setNewGroupValue}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="New">🆕 New</SelectItem>
                <SelectItem value="Regular">👤 Regular</SelectItem>
                <SelectItem value="VIP">⭐ VIP</SelectItem>
                <SelectItem value="Wholesale">📦 Wholesale</SelectItem>
                <SelectItem value="Blocked">🚫 Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setIsGroupOpen(false)}>Cancel</Button>
            <Button type="submit"><CheckCircle className="mr-2 h-4 w-4" /> Save Group</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* 6. Delete Confirmation Dialog */}
    <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
      <DialogContent className="sm:max-w-sm bg-white border text-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-4 w-4" /> Delete Customer</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete <strong>{qaCustomer?.name}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDeleteCustomer}><Trash2 className="mr-2 h-4 w-4" /> Yes, Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* === Customer Details Drawer === */}
    <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <SheetContent className="sm:max-w-lg overflow-y-auto bg-white text-slate-800 p-0" side="right">
        {activeCustomer && (
          <div className="flex flex-col h-full">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-primary/90 to-primary p-6 text-primary-foreground">
              <SheetHeader>
                <SheetTitle className="text-white text-xl font-headline">{activeCustomer.name}</SheetTitle>
                <SheetDescription className="text-primary-foreground/80 text-xs">{activeCustomer.email} · {activeCustomer.phone || 'No phone'}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 flex gap-2">
                <Badge className="bg-white/20 text-white border-white/30">{activeCustomer.group}</Badge>
                <Badge className="bg-white/20 text-white border-white/30">⭐ {activeCustomer.loyaltyPoints} pts</Badge>
              </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">

              {/* 1. Personal Info */}
              <section className="space-y-2">
                <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-widest flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Personal Information</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs bg-muted/20 border rounded-md p-3">
                  <span className="text-muted-foreground">Full Name</span>
                  <span className="font-semibold">{activeCustomer.name}</span>
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-semibold truncate">{activeCustomer.email}</span>
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-semibold font-mono">{activeCustomer.phone || '—'}</span>
                  <span className="text-muted-foreground">City</span>
                  <span className="font-semibold">{activeCustomer.city || '—'}</span>
                  <span className="text-muted-foreground">Registered</span>
                  <span className="font-semibold">{activeCustomer.registrationDate}</span>
                  <span className="text-muted-foreground">Last Login</span>
                  <span className="font-semibold">{activeCustomer.lastLogin || '—'}</span>
                </div>
              </section>

              {/* 1.5 Debt Ledger */}
              <section className="space-y-2 border-t pt-3">
                <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-widest flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Customer Debt Ledger (سجل ديون العميل)</h3>
                <div className="bg-red-50/50 border border-red-100 rounded-md p-3 text-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Outstanding Debt / الديون المعلقة:</span>
                    <span className="font-mono font-bold text-sm text-red-600">{(activeCustomer.debt || 0).toLocaleString()} DA</span>
                  </div>
                  {activeCustomer.debt && activeCustomer.debt > 0 ? (
                    <form onSubmit={handlePayCustomerDebt} className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Pay amount (DA)..."
                        value={payDebtAmount}
                        onChange={e => setPayDebtAmount(e.target.value)}
                        className="h-8 text-xs font-mono bg-white"
                      />
                      <Button type="submit" size="sm" className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white">Pay</Button>
                    </form>
                  ) : (
                    <p className="text-[10px] text-green-600 font-semibold">✓ Customer has zero outstanding debt.</p>
                  )}
                </div>
              </section>

              {/* 2. Addresses */}
              <section className="space-y-2">
                <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-widest flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Addresses</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/20 border rounded-md p-3 text-xs">
                    <p className="text-muted-foreground mb-1">Shipping Address</p>
                    <p className="font-semibold leading-relaxed">{activeCustomer.shippingAddress || 'Not provided'}</p>
                  </div>
                  <div className="bg-muted/20 border rounded-md p-3 text-xs">
                    <p className="text-muted-foreground mb-1">Billing Address</p>
                    <p className="font-semibold leading-relaxed">{activeCustomer.billingAddress || 'Not provided'}</p>
                  </div>
                </div>
              </section>

              {/* 3. Order Statistics */}
              <section className="space-y-2">
                <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-widest flex items-center gap-1.5"><ShoppingBag className="h-3.5 w-3.5" /> Order Statistics</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-primary/5 border border-primary/20 rounded-md p-3 text-center">
                    <p className="text-2xl font-extrabold text-primary">{activeCustomer.totalOrders}</p>
                    <p className="text-[10px] text-muted-foreground">Total Orders</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
                    <p className="text-xl font-extrabold text-green-700">{activeCustomer.totalSpent.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Total Spent (DA)</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-center">
                    <p className="text-xl font-extrabold text-amber-700">
                      {activeCustomer.totalOrders > 0 ? Math.round(activeCustomer.totalSpent / activeCustomer.totalOrders).toLocaleString() : '0'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Avg. Order (DA)</p>
                  </div>
                </div>
              </section>

              {/* 4. Most Purchased Products */}
              <section className="space-y-2">
                <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-widest flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> Most Purchased Products</h3>
                <div className="space-y-1.5">
                  {['Artisan Ceramic Mug', 'Couscous Royal Special', 'Organic Olive Oil'].map((product, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-muted/20 border rounded px-3 py-1.5">
                      <span className="font-medium">{product}</span>
                      <Badge variant="outline" className="text-[10px]">{3 - i} orders</Badge>
                    </div>
                  ))}
                </div>
              </section>

              {/* 5. Favourites */}
              <section className="space-y-2">
                <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-widest flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-rose-500" /> Saved Favourites</h3>
                <div className="flex flex-wrap gap-1.5">
                  {['Handmade Pottery', 'Algerian Merguez Pack', 'Argan Oil 100ml'].map((fav, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">{fav}</Badge>
                  ))}
                </div>
              </section>

              {/* 6. Reviews & Questions */}
              <section className="space-y-2">
                <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-widest flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Reviews & Questions</h3>
                <div className="space-y-2">
                  <div className="bg-muted/20 border rounded-md p-3 text-xs">
                    <div className="flex justify-between">
                      <span className="font-semibold">"Excellent quality!"</span>
                      <Badge variant="outline" className="text-[9px]">⭐⭐⭐⭐⭐</Badge>
                    </div>
                    <p className="text-muted-foreground mt-0.5">Artisan Ceramic Mug — June 20, 2026</p>
                  </div>
                  <div className="bg-muted/20 border rounded-md p-3 text-xs">
                    <p className="font-semibold">Q: "Does it come in other colors?"</p>
                    <p className="text-muted-foreground">Ceramic Mug · <span className="text-primary">Awaiting answer</span></p>
                  </div>
                </div>
              </section>

              {/* 7. Return Requests */}
              <section className="space-y-2">
                <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-widest flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" /> Return Requests</h3>
                {activeCustomer.totalOrders > 3 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold">ORD1002 — Couscous Royal Special</span>
                      <Badge variant="outline" className="text-[9px] bg-amber-100 text-amber-800 border-amber-300">REQUESTED</Badge>
                    </div>
                    <p className="text-muted-foreground">Reason: Defective item arrived. Submitted June 27, 2026.</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No return requests on record.</p>
                )}
              </section>

              {/* 8. Activity Log */}
              <section className="space-y-2">
                <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-widest flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Recent Activity Log</h3>
                <div className="relative pl-4 border-l space-y-3">
                  {[
                    { event: 'Placed order ORD1005', date: 'June 29, 2026', color: 'bg-green-500' },
                    { event: 'Redeemed 200 loyalty points', date: 'June 25, 2026', color: 'bg-amber-500' },
                    { event: 'Left a product review', date: 'June 20, 2026', color: 'bg-blue-500' },
                    { event: 'Logged in from Algiers', date: 'June 29, 2026', color: 'bg-slate-400' }
                  ].map((item, i) => (
                    <div key={i} className="relative text-xs">
                      <span className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ${item.color}`} />
                      <p className="font-semibold">{item.event}</p>
                      <p className="text-muted-foreground">{item.date}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 9. Internal Notes */}
              <section className="space-y-2">
                <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-widest flex items-center gap-1.5"><Edit className="h-3.5 w-3.5" /> Internal Notes</h3>
                <Textarea
                  rows={3}
                  placeholder="Add private notes about this customer..."
                  value={drawerNotes}
                  onChange={e => setDrawerNotes(e.target.value)}
                  className="text-xs"
                />
                <Button size="sm" variant="outline" className="w-full" onClick={handleSaveDrawerNotes}>
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-green-600" /> Save Notes
                </Button>
              </section>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  </>
  );
}
