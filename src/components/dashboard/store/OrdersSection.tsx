'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, Filter, Search, Truck, MoreHorizontal, Printer, CheckCircle, XCircle, 
  Hourglass, RotateCcw, Loader2, Copy, QrCode, Download, PlusCircle, FileSpreadsheet, Eye, 
  Activity, Settings, MessageSquare, EyeOff, Check, Image as ImageIcon
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/services/orderService';
import dynamic from 'next/dynamic';

const OrdersAnalyticsCharts = dynamic(() => import('./OrdersAnalyticsCharts').then(mod => mod.OrdersAnalyticsCharts), {
  ssr: false,
  loading: () => <div className="h-[200px] w-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md">Loading charts...</div>
});

interface OrderItem {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  billingAddress: string;
  paymentType: string;
  paymentStatus: 'paid' | 'pending' | 'refunded';
  date: string;
  total: number;
  profit: number;
  status: 'pending' | 'processing' | 'packed' | 'ready_to_ship' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded';
  items: number;
  productName: string;
  productImageUrl: string;
  returnStatus: 'none' | 'requested' | 'approved' | 'rejected' | 'refunded';
  marketplace: string;
  city: string;
  courier: string;
  trackingNumber: string;
  lastUpdate: string;
  internalNotes?: string;
  customerNotes?: string;
  timelineHistory?: Array<{ status: string; date: string; operator: string }>;
}

export function OrdersSection() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Advanced Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [payStatusFilter, setPayStatusFilter] = useState<string>('all');
  const [shipStatusFilter, setShipStatusFilter] = useState<string>('all');
  const [returnStatusFilter, setReturnStatusFilter] = useState<string>('all');
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [courierFilter, setCourierFilter] = useState<string>('all');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    id: true, date: true, customer: true, city: true, products: true, total: true, 
    profit: true, payStatus: true, shippingStatus: true, courier: true, actions: true
  });

  // Dialog & Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderItem | null>(null);
  const [drawerTab, setDrawerTab] = useState<'details' | 'chat'>('details');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [chatAttachment, setChatAttachment] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');

  // Invoice / Label printer states
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [activeOrderForInvoice, setActiveOrderForInvoice] = useState<OrderItem | null>(null);
  const [isLabelOpen, setIsLabelOpen] = useState(false);
  const [activeOrderForLabel, setActiveOrderForLabel] = useState<OrderItem | null>(null);
  const [isBulkInvoiceOpen, setIsBulkInvoiceOpen] = useState(false);

  // Store name for invoice header
  const [storeName, setStoreName] = useState('My Khidmatik Store');

  // Add Order Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCity, setNewCity] = useState('Algiers');
  const [newAddress, setNewAddress] = useState('');
  const [newProduct, setNewProduct] = useState('Artisan Ceramic Mug');
  const [newTotal, setNewTotal] = useState('');
  const [newPayment, setNewPayment] = useState('Cash on Delivery');

  const { user } = useAuth();

  // Load orders data from Supabase
  const loadOrders = async () => {
    if (!user || !user.storeId) return;
    setIsLoading(true);
    try {
      const data = await orderService.getStoreOrders(user.storeId);
      const mappedOrders = data.map((o: any) => ({
        id: o.id,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        customerPhone: o.customer_phone,
        shippingAddress: o.shipping_address,
        billingAddress: o.billing_address,
        paymentType: o.payment_type,
        paymentStatus: o.payment_status,
        date: o.created_at.split('T')[0],
        total: parseFloat(o.total),
        profit: parseFloat(o.profit),
        status: o.status as OrderItem['status'],
        items: o.order_items ? o.order_items.reduce((acc: number, item: any) => acc + item.quantity, 0) : 0,
        productName: o.order_items && o.order_items.length > 0 ? o.order_items[0].product_name : 'N/A',
        productImageUrl: o.order_items && o.order_items.length > 0 ? o.order_items[0].product_image_url : '',
        returnStatus: 'none' as const,
        marketplace: 'Khidmatik Store',
        city: o.city || 'Algiers',
        courier: o.courier || 'Yalidine',
        trackingNumber: o.tracking_number || '',
        lastUpdate: o.created_at,
        customerNotes: o.customer_notes,
        internalNotes: o.internal_notes,
        timelineHistory: o.timeline_history
      }));
      setOrders(mappedOrders);
    } catch (e) {
      console.error('Failed to load orders from Supabase:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.storeId) {
      loadOrders();
    }
  }, [user]);

  const saveCatalog = async (updatedList: OrderItem[]) => {
    // Stubbed since we now use direct database updates
    return true;
  };

  // Top Stats calculations
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const processingOrders = orders.filter(o => o.status === 'processing').length;
  const readyToShip = orders.filter(o => o.status === 'ready_to_ship').length;
  const shippedOrders = orders.filter(o => o.status === 'shipped').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const returnedOrders = orders.filter(o => o.returnStatus === 'approved' || o.returnStatus === 'refunded').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + o.total, 0);
  const netProfit = orders.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + o.profit, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Search & Filter execution
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm) ||
      order.productName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = 
      (!dateStart || order.date >= dateStart) &&
      (!dateEnd || order.date <= dateEnd);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayStatus = payStatusFilter === 'all' || order.paymentStatus === payStatusFilter;
    const matchesShipStatus = shipStatusFilter === 'all' || order.status === shipStatusFilter;
    const matchesReturn = returnStatusFilter === 'all' || order.returnStatus === returnStatusFilter;
    const matchesMarket = marketplaceFilter === 'all' || order.marketplace === marketplaceFilter;
    const matchesCity = cityFilter === 'all' || order.city === cityFilter;
    const matchesCourier = courierFilter === 'all' || order.courier === courierFilter;

    return matchesSearch && matchesDate && matchesStatus && matchesPayStatus && matchesShipStatus && matchesReturn && matchesMarket && matchesCity && matchesCourier;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setDateStart('');
    setDateEnd('');
    setStatusFilter('all');
    setPayStatusFilter('all');
    setShipStatusFilter('all');
    setReturnStatusFilter('all');
    setMarketplaceFilter('all');
    setCityFilter('all');
    setCourierFilter('all');
  };

  // Bulk Actions
  const handleBulkStatusChange = async (newStatus: OrderItem['status']) => {
    try {
      for (const id of selectedIds) {
        await orderService.updateOrderStatus(id, newStatus);
      }
      setSelectedIds([]);
      toast({ title: "Bulk Status Updated", description: `Updated status for ${selectedIds.length} orders to ${newStatus.toUpperCase()}.` });
      await loadOrders();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedIds) {
        await supabase.from('orders').delete().eq('id', id);
      }
      setSelectedIds([]);
      toast({ title: "Orders Deleted", description: `Successfully removed ${selectedIds.length} selected orders.` });
      await loadOrders();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleBulkExport = () => {
    const selectedOrders = orders.filter(o => selectedIds.includes(o.id));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedOrders, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `khidmatik_bulk_orders_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast({ title: "Bulk Export Complete", description: `Exported ${selectedIds.length} order records.` });
  };

  // Load chat messages when activeOrder changes
  useEffect(() => {
    if (activeOrder) {
      const storedChat = localStorage.getItem(`order_chat_${activeOrder.id}`);
      if (storedChat) {
        try { setChatMessages(JSON.parse(storedChat)); } catch (e) {}
      } else {
        const defaultChat = [
          { id: '1', sender: 'buyer', text: `Hello, is my package shipped yet?`, timestamp: new Date(Date.now() - 3600000).toISOString(), isRead: true },
          { id: '2', sender: 'seller', text: `Hello! We are currently processing your package. It will be dispatched soon.`, timestamp: new Date(Date.now() - 1800000).toISOString(), isRead: true }
        ];
        setChatMessages(defaultChat);
        localStorage.setItem(`order_chat_${activeOrder.id}`, JSON.stringify(defaultChat));
      }
    }
  }, [activeOrder]);

  const handleSendMessage = () => {
    if (!activeOrder || (!chatInput && !chatAttachment)) return;
    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: 'seller',
      text: chatInput,
      attachment: chatAttachment || undefined,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    const updated = [...chatMessages, newMessage];
    setChatMessages(updated);
    localStorage.setItem(`order_chat_${activeOrder.id}`, JSON.stringify(updated));
    setChatInput('');
    setChatAttachment('');
  };

  // Quick Action triggers
  const handleOpenDrawer = (order: OrderItem) => {
    setActiveOrder(order);
    setDrawerTab('details');
    setIsDrawerOpen(true);
  };

  const handleCopyOrder = (order: OrderItem) => {
    navigator.clipboard.writeText(`Order ${order.id}: Name: ${order.customerName}, Phone: ${order.customerPhone}, Total: ${order.total} DA`);
    toast({ title: "Copied to Clipboard", description: "Order details copied successfully." });
  };

  const handleGenerateQr = (orderId: string) => {
    setQrCodeData(`https://khidmatik.dz/tracking/${orderId}`);
    setIsQrOpen(true);
  };

  // Timeline checkmark helper
  const isTimelineStepChecked = (status: OrderItem['status'], step: string) => {
    const statusPriority: Record<string, number> = {
      pending: 1,
      processing: 2,
      packed: 3,
      ready_to_ship: 4,
      shipped: 5,
      delivered: 6,
      completed: 7
    };
    const currentPriority = statusPriority[status] || 1;
    
    switch (step) {
      case 'created': return true;
      case 'paid': return status !== 'cancelled';
      case 'processing': return currentPriority >= 2;
      case 'packed': return currentPriority >= 3;
      case 'ready_to_ship': return currentPriority >= 4;
      case 'picked_up': return currentPriority >= 5;
      case 'in_transit': return currentPriority >= 5;
      case 'out_for_delivery': return currentPriority >= 5;
      case 'delivered': return currentPriority >= 6;
      default: return false;
    }
  };

  // Add order submit
  const handleCreateOrderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone || !newTotal) return;

    const newOrder: OrderItem = {
      id: `ORD${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: newCustName,
      customerEmail: `${newCustName.toLowerCase().replace(/\s+/g, '')}@example.dz`,
      customerPhone: newCustPhone,
      shippingAddress: newAddress || 'Main street, Algiers',
      billingAddress: newAddress || 'Main street, Algiers',
      paymentType: newPayment,
      paymentStatus: newPayment === 'Cash on Delivery' ? 'pending' : 'paid',
      date: new Date().toISOString().split('T')[0],
      total: Number(newTotal),
      profit: Math.round(Number(newTotal) * 0.4),
      status: 'pending',
      items: 1,
      productName: newProduct,
      productImageUrl: 'https://placehold.co/100x100.png?text=Product',
      returnStatus: 'none',
      marketplace: 'Khidmatik Store',
      city: newCity,
      courier: 'Yalidine',
      trackingNumber: `YL${Math.floor(100000 + Math.random() * 900000)}DZ`,
      lastUpdate: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    const updated = [newOrder, ...orders];
    setOrders(updated);
    await saveCatalog(updated);

    setIsCreateOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewTotal('');
    setNewAddress('');
    toast({ title: "Order Created", description: `Order ${newOrder.id} registered successfully.` });
  };

  // Status change helper
  const handleStatusChange = async (orderId: string, newStatus: OrderItem['status']) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      toast({ title: 'Order Status Updated', description: `Order ${orderId} set to ${newStatus.toUpperCase()}.` });
      await loadOrders();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  // Print trigger
  const handlePrintCommand = () => window.print();

  // Save drawer internal notes
  const handleSaveInternalNotes = async (orderId: string, notes: string) => {
    try {
      await orderService.updateOrderStatus(orderId, activeOrder?.status || 'pending', notes);
      toast({ title: "Notes Updated", description: "Internal order notes saved successfully." });
      await loadOrders();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'processing': return 'secondary';
      case 'shipped': case 'ready_to_ship': return 'default'; 
      case 'delivered': case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Hourglass className="h-3 w-3" />;
      case 'shipped': case 'ready_to_ship': return <Truck className="h-3 w-3" />;
      case 'delivered': case 'completed': return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'cancelled': return <XCircle className="h-3 w-3 text-red-600" />;
      default: return <Hourglass className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <Truck className="mr-3 h-8 w-8 text-primary animate-pulse" /> Orders & Shipping Portal
          </h1>
          <p className="text-muted-foreground">Manage your domestic e-commerce shipments, COD accounts, and packing documents.</p>
        </div>
        
        {/* Global Toolbar actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Order
            </Button>
            <DialogContent className="sm:max-w-md bg-white border text-slate-800">
              <form onSubmit={handleCreateOrderSubmit}>
                <DialogHeader>
                  <DialogTitle>Create Manual Order</DialogTitle>
                  <DialogDescription>Manually register a telephone order or custom platform client order.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4 text-slate-800">
                  <div className="grid gap-1">
                    <Label htmlFor="cust-name">Customer Full Name *</Label>
                    <Input id="cust-name" value={newCustName} onChange={e => setNewCustName(e.target.value)} required />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="cust-phone">Phone Number *</Label>
                    <Input id="cust-phone" value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} required placeholder="e.g. 0550123456" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1">
                      <Label htmlFor="cust-city">City *</Label>
                      <Input id="cust-city" value={newCity} onChange={e => setNewCity(e.target.value)} required />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="cust-total">Grand Total (DA) *</Label>
                      <Input id="cust-total" type="number" value={newTotal} onChange={e => setNewTotal(e.target.value)} required />
                    </div>
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="cust-address">Shipping Address details</Label>
                    <Input id="cust-address" value={newAddress} onChange={e => setNewAddress(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="cust-product">Product ordered</Label>
                    <Select value={newProduct} onValueChange={setNewProduct}>
                      <SelectTrigger id="cust-product">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Artisan Ceramic Mug">Artisan Ceramic Mug</SelectItem>
                        <SelectItem value="Couscous Royal Special">Couscous Royal Special</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Register Order</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={handleBulkExport}>
            <FileSpreadsheet className="mr-1.5 h-4 w-4 text-green-600" /> Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast({title: "Downloading PDF report...", description: "All pages downloaded."})}>
            <Download className="mr-1.5 h-4 w-4" /> Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Print Orders
          </Button>
        </div>
      </header>

      {/* 1. Statistics Cards Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-3 pb-1"><CardDescription className="text-xs">Total Orders</CardDescription></CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold font-mono">{totalOrders}</div>
            <span className="text-[10px] text-green-500 font-semibold">+8% vs last month</span>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-3 pb-1"><CardDescription className="text-xs">Pending Orders</CardDescription></CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold font-mono text-yellow-600">{pendingOrders}</div>
            <span className="text-[10px] text-muted-foreground font-semibold">Needs confirmation</span>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-3 pb-1"><CardDescription className="text-xs">Processing</CardDescription></CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold font-mono text-blue-600">{processingOrders}</div>
            <span className="text-[10px] text-muted-foreground font-semibold">Being packed</span>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-3 pb-1"><CardDescription className="text-xs">Ready to Ship</CardDescription></CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold font-mono text-indigo-600">{readyToShip}</div>
            <span className="text-[10px] text-muted-foreground font-semibold">Packed for pickup</span>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-3 pb-1"><CardDescription className="text-xs">Shipped</CardDescription></CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold font-mono text-purple-600">{shippedOrders}</div>
            <span className="text-[10px] text-muted-foreground font-semibold">In transit</span>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-3 pb-1"><CardDescription className="text-xs">Delivered</CardDescription></CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold font-mono text-green-600">{deliveredOrders}</div>
            <span className="text-[10px] text-green-500 font-semibold">+12% delivery success</span>
          </CardContent>
        </Card>
        
        {/* Money stats */}
        <Card className="hover:shadow-md transition-shadow md:col-span-2">
          <CardHeader className="p-3 pb-1"><CardDescription className="text-xs">Total Revenue</CardDescription></CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold font-mono">{totalRevenue.toLocaleString()} DA</div>
            <span className="text-[10px] text-green-500 font-semibold">Growth target reached</span>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow md:col-span-2">
          <CardHeader className="p-3 pb-1"><CardDescription className="text-xs">Net Profit</CardDescription></CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold font-mono text-green-600">{netProfit.toLocaleString()} DA</div>
            <span className="text-[10px] text-green-500 font-semibold">40% profit margin</span>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow md:col-span-2">
          <CardHeader className="p-3 pb-1"><CardDescription className="text-xs">Avg. Order Value (AOV)</CardDescription></CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold font-mono">{Math.round(averageOrderValue).toLocaleString()} DA</div>
            <span className="text-[10px] text-muted-foreground font-semibold">Per invoice average</span>
          </CardContent>
        </Card>
      </section>

      {/* 2. Advanced Collapsible Filters */}
      <Card className="shadow border">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center"><Filter className="h-4 w-4 mr-2 text-primary" /> Filtering & Search Controls</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsFilterExpanded(!isFilterExpanded)} className="text-xs">
            {isFilterExpanded ? "Collapse Filters" : "Expand Filters"}
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ID, customer, phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2 items-center">
              <Input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="text-xs" />
              <span className="text-muted-foreground text-xs">to</span>
              <Input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="text-xs" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Order Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button variant="outline" className="flex-1" onClick={handleResetFilters}>Reset</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border text-slate-800">
                  <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.keys(visibleColumns).map((col) => (
                    <DropdownMenuItem
                      key={col}
                      onClick={() => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))}
                      className="flex items-center justify-between"
                    >
                      <span className="capitalize">{col}</span>
                      {visibleColumns[col] ? <CheckCircle className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {isFilterExpanded && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t">
              <Select value={payStatusFilter} onValueChange={setPayStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Payment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={returnStatusFilter} onValueChange={setReturnStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Returns" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Returns</SelectItem>
                  <SelectItem value="none">No Return</SelectItem>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={marketplaceFilter} onValueChange={setMarketplaceFilter}>
                <SelectTrigger><SelectValue placeholder="Marketplace" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="Khidmatik Store">Khidmatik Store</SelectItem>
                  <SelectItem value="Secondary Store">Secondary Store</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger><SelectValue placeholder="City" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="Algiers">Algiers</SelectItem>
                  <SelectItem value="Oran">Oran</SelectItem>
                  <SelectItem value="Constantine">Constantine</SelectItem>
                  <SelectItem value="Sidi Bel Abbès">Sidi Bel Abbès</SelectItem>
                </SelectContent>
              </Select>
              <Select value={courierFilter} onValueChange={setCourierFilter}>
                <SelectTrigger><SelectValue placeholder="Courier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Couriers</SelectItem>
                  <SelectItem value="Yalidine">Yalidine</SelectItem>
                  <SelectItem value="EMS">EMS</SelectItem>
                  <SelectItem value="In-house">In-house</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Orders Table redone */}
      <Card className="shadow border">
        <div className="overflow-x-auto max-h-[500px]">
          <Table className="relative">
            <TableHeader className="sticky top-0 bg-card z-10 border-b">
              <TableRow>
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredOrders.map(o => o.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </TableHead>
                {visibleColumns.id && <TableHead>Order ID</TableHead>}
                {visibleColumns.date && <TableHead>Date</TableHead>}
                {visibleColumns.customer && <TableHead>Customer</TableHead>}
                {visibleColumns.city && <TableHead>City</TableHead>}
                {visibleColumns.products && <TableHead>Products</TableHead>}
                {visibleColumns.total && <TableHead className="text-right">Total (DA)</TableHead>}
                {visibleColumns.profit && <TableHead className="text-right">Profit</TableHead>}
                {visibleColumns.payStatus && <TableHead>Payment Status</TableHead>}
                {visibleColumns.shippingStatus && <TableHead>Shipping Status</TableHead>}
                {visibleColumns.courier && <TableHead>Courier</TableHead>}
                {visibleColumns.actions && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const isSelected = selectedIds.includes(order.id);
                return (
                  <TableRow key={order.id} className={isSelected ? 'bg-muted/30' : ''}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, order.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== order.id));
                          }
                        }}
                      />
                    </TableCell>
                    {visibleColumns.id && (
                      <TableCell className="font-mono text-xs font-bold text-primary cursor-pointer hover:underline" onClick={() => handleOpenDrawer(order)}>
                        {order.id}
                      </TableCell>
                    )}
                    {visibleColumns.date && <TableCell className="text-xs">{order.date}</TableCell>}
                    {visibleColumns.customer && (
                      <TableCell>
                        <p className="font-semibold text-xs">{order.customerName}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{order.customerPhone}</p>
                      </TableCell>
                    )}
                    {visibleColumns.city && <TableCell className="text-xs">{order.city}</TableCell>}
                    {visibleColumns.products && <TableCell className="text-xs max-w-[120px] truncate">{order.productName}</TableCell>}
                    {visibleColumns.total && <TableCell className="text-right font-mono text-xs font-bold">{(order.total ?? 0).toLocaleString()}</TableCell>}
                    {visibleColumns.profit && <TableCell className="text-right font-mono text-xs text-green-600 font-semibold">{(order.profit ?? 0).toLocaleString()}</TableCell>}
                    {visibleColumns.payStatus && (
                      <TableCell>
                        <Badge variant={(order.paymentStatus ?? 'pending') === 'paid' ? 'default' : 'secondary'} className={(order.paymentStatus ?? '') === 'paid' ? 'bg-green-500 text-white' : ''}>
                          {(order.paymentStatus ?? 'pending').toUpperCase()}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.shippingStatus && (
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)} className="gap-1 px-1.5 text-[10px]">
                          {getStatusIcon(order.status)}
                          {order.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.courier && <TableCell className="text-xs">{order.courier}</TableCell>}
                    {visibleColumns.actions && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border text-slate-800">
                            <DropdownMenuLabel>Order Menu</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenDrawer(order)}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyOrder(order)}><Copy className="mr-2 h-4 w-4" /> Copy Order Info</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGenerateQr(order.id)}><QrCode className="mr-2 h-4 w-4" /> Generate QR Code</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setIsInvoiceOpen(true); setActiveOrderForInvoice(order); }}><FileText className="mr-2 h-4 w-4" /> Print Invoice</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setIsLabelOpen(true); setActiveOrderForLabel(order); }}><Truck className="mr-2 h-4 w-4" /> Print Label</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'cancelled')} className="text-destructive font-bold">Cancel Order</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                    No orders match filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* 4. Floating bulk actions toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white border shadow-xl rounded-lg p-3 z-50 flex items-center gap-3 animate-bounce">
          <span className="text-xs font-semibold text-muted-foreground">{selectedIds.length} orders selected</span>
          <Separator orientation="vertical" className="h-5" />
          <Button size="sm" variant="outline" onClick={() => setIsBulkInvoiceOpen(true)} className="flex items-center"><Printer className="h-4 w-4 mr-1.5" /> Print Invoices</Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('processing')}>Mark Processing</Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('shipped')}>Mark Shipped</Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('delivered')}>Mark Delivered</Button>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}>Delete</Button>
        </div>
      )}

      {/* 5. Detailed Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto bg-white text-slate-800 p-6 flex flex-col h-full">
          {activeOrder && (
            <div className="space-y-5 text-slate-800 flex flex-col h-full">
              <SheetHeader>
                <SheetTitle className="font-headline text-lg">Order: {activeOrder.id}</SheetTitle>
                <SheetDescription>Date: {activeOrder.date} • Portal: {activeOrder.marketplace}</SheetDescription>
              </SheetHeader>

              {/* Tabs selector */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
                <button 
                  type="button" 
                  onClick={() => setDrawerTab('details')}
                  className={`py-1.5 rounded-md text-center transition-all ${drawerTab === 'details' ? 'bg-white text-primary shadow' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Details (التفاصيل)
                </button>
                <button 
                  type="button" 
                  onClick={() => setDrawerTab('chat')}
                  className={`py-1.5 rounded-md text-center transition-all ${drawerTab === 'chat' ? 'bg-white text-primary shadow' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Customer Chat (محادثة البائع)
                </button>
              </div>

              {drawerTab === 'details' ? (
                <div className="space-y-4 flex-grow overflow-y-auto pr-1">
                  {/* Status update dropdown */}
                  <div className="p-3 border dark:border-slate-800 rounded-lg bg-slate-50 space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Update Order Status</Label>
                    <Select value={activeOrder.status} onValueChange={(val) => handleStatusChange(activeOrder.id, val as any)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="pending">Pending (قيد الانتظار)</SelectItem>
                        <SelectItem value="processing">Processing (قيد التحضير)</SelectItem>
                        <SelectItem value="packed">Packed (تم التعبئة)</SelectItem>
                        <SelectItem value="ready_to_ship">Ready to Ship (جاهز للشحن)</SelectItem>
                        <SelectItem value="shipped">Shipped (تم الشحن)</SelectItem>
                        <SelectItem value="delivered">Delivered (تم التوصيل)</SelectItem>
                        <SelectItem value="completed">Completed (مكتمل)</SelectItem>
                        <SelectItem value="cancelled">Cancelled (ملغي)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Customer details */}
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-muted-foreground uppercase text-[10px]">Customer Details</h4>
                    <p className="font-semibold text-sm">{activeOrder.customerName}</p>
                    <p className="text-muted-foreground">{activeOrder.customerEmail}</p>
                    <p className="font-mono text-primary font-semibold">{activeOrder.customerPhone}</p>
                    <p className="text-muted-foreground mt-1"><strong>Shipping:</strong> {activeOrder.shippingAddress}</p>
                    <p className="text-muted-foreground"><strong>Billing:</strong> {activeOrder.billingAddress}</p>
                  </div>

                  {/* Yalidine Logistics */}
                  <div className="space-y-1 text-xs bg-slate-50 p-2.5 rounded border">
                    <h4 className="font-bold text-muted-foreground uppercase text-[9px]">Logistics Yalidine Courier</h4>
                    <p>Courier: <strong>{activeOrder.courier}</strong></p>
                    <p>Tracking Code: <strong className="font-mono text-primary">{activeOrder.trackingNumber || 'Awaiting Shipment'}</strong></p>
                  </div>

                  {/* Interactive Timeline */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-muted-foreground uppercase text-[10px]">Shipping Timeline Tracking</h4>
                    <div className="relative pl-6 space-y-4 border-l text-xs">
                      {['pending', 'processing', 'packed', 'ready_to_ship', 'shipped', 'delivered', 'completed'].map((st) => {
                        const log = activeOrder.timelineHistory?.find(h => h.status === st);
                        const isDone = !!log || isTimelineStepChecked(activeOrder.status, st);
                        const logDate = log ? log.date : activeOrder.date + ' 10:00';
                        const logOperator = log ? log.operator : 'System Auto';
                        
                        return (
                          <div key={st} className="relative">
                            <span className={`absolute -left-[30px] top-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${isDone ? 'bg-green-500' : 'bg-slate-300'}`}>✓</span>
                            <p className="font-semibold capitalize text-xs">{st.replace(/_/g, ' ')}</p>
                            {isDone && (
                              <p className="text-[9px] text-muted-foreground">Updated: {logDate} • Operator: {logOperator}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5 pt-2">
                    <Label htmlFor="notes" className="text-[10px] font-bold text-muted-foreground uppercase">Internal Store Notes</Label>
                    <Textarea
                      id="notes"
                      defaultValue={activeOrder.internalNotes || ''}
                      placeholder="e.g. VIP client, check dimensions."
                      rows={2}
                      onBlur={(e) => handleSaveInternalNotes(activeOrder.id, e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col flex-grow overflow-hidden">
                  {/* Chat Search */}
                  <div className="relative mb-2 shrink-0">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Search chat log messages..." 
                      value={chatSearch} 
                      onChange={e => setChatSearch(e.target.value)} 
                      className="pl-7 h-8 text-xs" 
                    />
                  </div>

                  {/* Chat messages box */}
                  <div className="space-y-3 flex-grow overflow-y-auto border p-3 rounded bg-slate-50 dark:bg-slate-900/50 max-h-[300px]">
                    {chatMessages
                      .filter(m => m.text.toLowerCase().includes(chatSearch.toLowerCase()))
                      .map((msg) => {
                        const isMe = msg.sender === 'seller';
                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`p-2.5 rounded-lg max-w-[80%] text-xs ${isMe ? 'bg-primary text-primary-foreground' : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}>
                              <p>{msg.text}</p>
                              {msg.attachment && (
                                <div className="mt-1 flex items-center gap-1 text-[10px] underline">
                                  <ImageIcon className="h-3 w-3" /> {msg.attachment}
                                </div>
                              )}
                            </div>
                            <span className="text-[8px] text-muted-foreground mt-0.5 font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {isMe && <span className="ml-1 text-green-500 font-bold">✓✓</span>}
                            </span>
                          </div>
                        );
                      })}
                    {chatMessages.length === 0 && (
                      <p className="text-center text-muted-foreground py-10">No chats exchanged yet.</p>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="flex gap-1.5 mt-2 shrink-0">
                    <Input 
                      placeholder="Type a message reply..." 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)} 
                      onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }} 
                      className="text-xs h-9" 
                    />
                    <Button size="icon" onClick={handleSendMessage} className="h-9 w-9 bg-primary text-primary-foreground">
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[9px] text-muted-foreground border-t pt-1.5 shrink-0">
                    <span>Last active: 5 mins ago</span>
                    <span>Status: Connected</span>
                  </div>
                </div>
              )}

              <DialogFooter className="pt-2 border-t mt-auto shrink-0">
                <Button variant="outline" className="w-full h-9" onClick={() => setIsDrawerOpen(false)}>Close Panel</Button>
              </DialogFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 6. Invoice / Shipping labels printing triggers */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="sm:max-w-xl bg-white border text-slate-800 p-6 max-h-[90vh] overflow-y-auto">
          {activeOrderForInvoice && (
            <div className="space-y-6 text-slate-800">
              <DialogHeader className="sr-only">
                <DialogTitle>Print Invoice</DialogTitle>
                <DialogDescription>Invoice printout for order {activeOrderForInvoice.id}</DialogDescription>
              </DialogHeader>
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-lg font-bold text-primary">{storeName}</h3>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-mono">Invoice #: INV-{activeOrderForInvoice.id}</p>
                  <p className="text-[10px] text-muted-foreground">Date: {activeOrderForInvoice.date}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <h4 className="font-semibold text-muted-foreground uppercase text-[10px]">Seller</h4>
                  <p className="font-bold">{storeName}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-muted-foreground uppercase text-[10px]">Buyer</h4>
                  <p className="font-bold">{activeOrderForInvoice.customerName}</p>
                  <p className="text-[10px] text-muted-foreground">{activeOrderForInvoice.shippingAddress}</p>
                </div>
              </div>
              <Table className="border-t border-b">
                <TableHeader>
                  <TableRow className="text-[10px]">
                    <TableHead>Details</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Total (DA)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  <TableRow>
                    <TableCell>{activeOrderForInvoice.productName}</TableCell>
                    <TableCell className="text-center">{activeOrderForInvoice.items}</TableCell>
                    <TableCell className="text-right">{activeOrderForInvoice.total.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="text-right text-xs max-w-[200px] ml-auto space-y-1">
                <div className="flex justify-between"><span>Subtotal:</span><span>{activeOrderForInvoice.total.toLocaleString()} DA</span></div>
                <div className="flex justify-between font-bold text-sm"><span>Grand Total:</span><span>{activeOrderForInvoice.total.toLocaleString()} DA</span></div>
              </div>
              <DialogFooter className="pt-2 border-t gap-2 print:hidden">
                <Button variant="outline" onClick={() => setIsInvoiceOpen(false)}>Close</Button>
                <Button onClick={handlePrintCommand} className="bg-primary text-white"><Printer className="h-4 w-4 mr-2" /> Print Invoice</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Invoice printing dialog */}
      <Dialog open={isBulkInvoiceOpen} onOpenChange={setIsBulkInvoiceOpen}>
        <DialogContent className="sm:max-w-3xl bg-white border text-slate-800 p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Print Selected Invoices</DialogTitle>
            <DialogDescription>Print layout for {selectedIds.length} selected invoices</DialogDescription>
          </DialogHeader>
          <div className="space-y-8 text-slate-800 print:space-y-8">
            {orders.filter(o => selectedIds.includes(o.id)).map((order, index, array) => (
              <div key={order.id} className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <h3 className="text-lg font-bold text-primary">{storeName}</h3>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground font-mono">Invoice #: INV-{order.id}</p>
                    <p className="text-[10px] text-muted-foreground">Date: {order.date}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <h4 className="font-semibold text-muted-foreground uppercase text-[10px]">Seller</h4>
                    <p className="font-bold">{storeName}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-muted-foreground uppercase text-[10px]">Buyer</h4>
                    <p className="font-bold">{order.customerName}</p>
                    <p className="text-[10px] text-muted-foreground">{order.shippingAddress}</p>
                  </div>
                </div>
                <Table className="border-t border-b">
                  <TableHeader>
                    <TableRow className="text-[10px]">
                      <TableHead>Details</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Total (DA)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    <TableRow>
                      <TableCell>{order.productName}</TableCell>
                      <TableCell className="text-center">{order.items}</TableCell>
                      <TableCell className="text-right">{order.total.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div className="text-right text-xs max-w-[200px] ml-auto space-y-1">
                  <div className="flex justify-between"><span>Subtotal:</span><span>{order.total.toLocaleString()} DA</span></div>
                  <div className="flex justify-between font-bold text-sm"><span>Grand Total:</span><span>{order.total.toLocaleString()} DA</span></div>
                </div>
                {index < array.length - 1 && (
                  <div className="border-t-2 border-dashed border-muted-foreground/30 my-8 pt-4 print:my-4 print:border-slate-400" />
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="pt-2 border-t gap-2 print:hidden">
            <Button variant="outline" onClick={() => setIsBulkInvoiceOpen(false)}>Close</Button>
            <Button onClick={handlePrintCommand} className="bg-primary text-white"><Printer className="h-4 w-4 mr-2" /> Print Invoices</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLabelOpen} onOpenChange={setIsLabelOpen}>
        <DialogContent className="sm:max-w-md bg-white border text-slate-800 p-6">
          {activeOrderForLabel && (
            <div className="space-y-4 text-slate-800">
              <DialogHeader className="sr-only">
                <DialogTitle>Print Shipping Label</DialogTitle>
                <DialogDescription>Shipping label for order {activeOrderForLabel.id}</DialogDescription>
              </DialogHeader>
              <div className="p-3 border-2 border-dashed border-slate-300 rounded-md text-xs space-y-3 bg-slate-50">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-extrabold text-base tracking-widest text-primary flex items-center gap-1"><Truck className="h-5 w-5" /> YALIDINE</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b pb-2 text-[10px]">
                  <div>
                    <h5 className="font-bold text-muted-foreground uppercase text-[8px]">From</h5>
                    <p className="font-bold">{storeName}</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-muted-foreground uppercase text-[8px]">To</h5>
                    <p className="font-bold">{activeOrderForLabel.customerName}</p>
                    <p className="text-muted-foreground">{activeOrderForLabel.shippingAddress}</p>
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <span className="font-mono text-xl block tracking-widest font-extrabold text-slate-600">||| | ||||| ||| ||| ||</span>
                  <span className="font-mono text-[10px] text-slate-500 uppercase font-semibold">Tracking: {activeOrderForLabel.trackingNumber}</span>
                </div>
              </div>
              <DialogFooter className="pt-2 border-t gap-2 print:hidden">
                <Button variant="outline" onClick={() => setIsLabelOpen(false)}>Close</Button>
                <Button onClick={handlePrintCommand} className="bg-primary text-white"><Printer className="h-4 w-4 mr-2" /> Print Label</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
        <DialogContent className="sm:max-w-xs bg-white border text-slate-800 p-6 text-center">
          <DialogHeader>
            <DialogTitle>Order QR Code</DialogTitle>
            <DialogDescription>Scan to track delivery routing status.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="h-32 w-32 border bg-muted/20 flex items-center justify-center rounded">
              <QrCode className="h-24 w-24 text-primary animate-pulse" />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground truncate max-w-full">{qrCodeData}</span>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsQrOpen(false)} className="w-full">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. Analytics Section */}
      <section className="space-y-4 pt-6 border-t">
        <h2 className="text-xl font-bold font-headline flex items-center"><Activity className="mr-2 h-5 w-5 text-primary" /> Logistics & Shipping Performance Analytics</h2>
        <OrdersAnalyticsCharts />
      </section>

      {/* 8. Recent Activity Panel & Notifications */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-semibold flex items-center"><Activity className="mr-2 h-4 w-4 text-primary" /> Recent Shipping Events Feed</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 text-xs space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <div><p className="font-semibold">New Order ORD1005 Registered</p><p className="text-[10px] text-muted-foreground">Constantine, Yalidine Carrier</p></div>
              <span className="font-mono text-[9px] text-muted-foreground">Today 09:30</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <div><p className="font-semibold">Refund Issued for ORD1004</p><p className="text-[10px] text-muted-foreground">Refunded amount 950 DA to buyer wallet</p></div>
              <span className="font-mono text-[9px] text-muted-foreground">Yesterday 11:00</span>
            </div>
            <div className="flex justify-between items-center">
              <div><p className="font-semibold">Return Requested for ORD1002</p><p className="text-[10px] text-muted-foreground">Fatima Chergui requested package return</p></div>
              <span className="font-mono text-[9px] text-muted-foreground">2 days ago</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-semibold flex items-center"><MessageSquare className="mr-2 h-4 w-4 text-primary" /> Integrated Notifications Toggles</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div><p className="font-semibold">WhatsApp Order Notifications</p><p className="text-[10px] text-muted-foreground">Send tracking URL instantly to customer WhatsApp.</p></div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div><p className="font-semibold">SMS Shipping status updates</p><p className="text-[10px] text-muted-foreground">Notify user when status changes to Shipped/Delivered.</p></div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div><p className="font-semibold">Email PDF invoices sitemap</p><p className="text-[10px] text-muted-foreground">Auto-generate and email billing invoices.</p></div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
