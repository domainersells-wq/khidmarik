'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  DollarSign, ShoppingCart, Users, Package, FileText, ArrowRightLeft,
  Truck, CreditCard, Bell, TrendingUp, TrendingDown, Layers, CalendarDays,
  Percent, ArrowUpRight, Download, Printer, ZoomIn, ZoomOut, CheckCircle, Info, ShieldCheck, Activity
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface KPIData {
  revenues: number;
  profits: number;
  expenses: number;
  orders: number;
  customers: number;
  suppliers: number;
  products: number;
  lowStock: number;
}

export function OverviewSection() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Time Period & Chart Toggles
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'annual'>('monthly');
  const [chartType, setChartType] = useState<'sales-profits' | 'expenses' | 'customers' | 'inventory'>('sales-profits');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>('2026-07-01');
  const [endDate, setEndDate] = useState<string>('2026-07-31');

  // KPI States
  const [kpis, setKpis] = useState<KPIData>({
    revenues: 145000,
    profits: 45000,
    expenses: 15200,
    orders: 124,
    customers: 320,
    suppliers: 8,
    products: 156,
    lowStock: 4
  });

  // Top Selling Products & Lists
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [topEmployees, setTopEmployees] = useState<any[]>([]);
  const [recentOps, setRecentOps] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Load Data
  useEffect(() => {
    async function loadDashboardStats() {
      setIsLoading(true);
      try {
        const storeId = user?.storeId || '00000000-0000-0000-0000-000000000001';

        // 1. Fetch Orders count and total revenues from DB
        const { data: dbOrders } = await supabase
          .from('orders')
          .select('total, profit, status, payment_status, created_at, customer_name, payment_type')
          .eq('store_id', storeId);

        let totalRev = 145000;
        let totalProf = 45000;
        let totalOrdCount = 124;

        if (dbOrders && dbOrders.length > 0) {
          totalRev = dbOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
          totalProf = dbOrders.reduce((sum, o) => sum + Number(o.profit || (o.total * 0.1)), 0);
          totalOrdCount = dbOrders.length;
        }

        // 2. Fetch active products & low stock warning
        const { data: dbProducts } = await supabase
          .from('products')
          .select('id, name, base_image_url');
        
        let productsCount = 156;
        let lowStockCount = 4;

        if (dbProducts && dbProducts.length > 0) {
          productsCount = dbProducts.length;
          // Query variants to check stock levels
          const { data: variants } = await supabase
            .from('product_variants')
            .select('stock')
            .in('product_id', dbProducts.map(p => p.id));
          
          if (variants) {
            lowStockCount = variants.filter(v => v.stock <= 5).length;
          }
        }

        // 3. Fetch active suppliers
        const { data: sups } = await supabase
          .from('suppliers')
          .select('id');
        let suppliersCount = sups?.length || 8;

        // Update KPIs
        setKpis({
          revenues: totalRev,
          profits: totalProf,
          expenses: 15200, // mock expenses
          orders: totalOrdCount,
          customers: 320,
          suppliers: suppliersCount,
          products: productsCount,
          lowStock: lowStockCount
        });

        // Set Top Sellers Mock/DB list
        setTopProducts([
          { id: '1', name: 'Organic Olive Oil (1L)', sales: 45, revenue: 67500, image: 'https://placehold.co/40x40.png?text=Oil' },
          { id: '2', name: 'Handcrafted Ceramic Set', sales: 12, revenue: 144000, image: 'https://placehold.co/40x40.png?text=Ceramic' },
          { id: '3', name: 'Premium Deglet Nour Dates', sales: 38, revenue: 36100, image: 'https://placehold.co/40x40.png?text=Dates' },
          { id: '4', name: 'Traditional Honey Jar', sales: 25, revenue: 45000, image: 'https://placehold.co/40x40.png?text=Honey' }
        ]);

        setTopCustomers([
          { id: '1', name: 'Amine Douba', orders: 12, spent: 38400, email: 'amine.d@example.dz' },
          { id: '2', name: 'Yacine Khelifi', orders: 9, spent: 28000, email: 'yacine.k@example.dz' },
          { id: '3', name: 'Fatima Chergui', orders: 7, spent: 18500, email: 'f.chergui@example.dz' }
        ]);

        setTopEmployees([
          { name: 'Kamel Lahouel', role: 'Cashier / POS', sales: 52, performance: '98%' },
          { name: 'Sofia Benhamadi', role: 'Sales Rep', sales: 41, performance: '95%' },
          { name: 'Mourad Bouzidi', role: 'Delivery Lead', sales: 31, performance: '92%' }
        ]);

        // Recent Operations from DB or Fallback
        if (dbOrders && dbOrders.length > 0) {
          setRecentOps(dbOrders.slice(0, 5).map((o, idx) => ({
            id: `ORD-${idx + 1}`,
            customer: o.customer_name,
            amount: o.total,
            status: o.status,
            date: new Date(o.created_at).toLocaleDateString()
          })));
        } else {
          setRecentOps([
            { id: 'ORD-1002', customer: 'Amine Douba', amount: 12500, status: 'completed', date: '2026-07-12' },
            { id: 'ORD-1003', customer: 'Yacine Khelifi', amount: 8900, status: 'processing', date: '2026-07-12' },
            { id: 'ORD-1004', customer: 'Fatima Chergui', amount: 3200, status: 'completed', date: '2026-07-11' },
            { id: 'ORD-1005', customer: 'Lydia Ait', amount: 15400, status: 'pending', date: '2026-07-10' }
          ]);
        }

        setNotifications([
          { id: '1', title: 'Low Stock Alert', message: 'Smartphone LCD screens are below minimum stock limit.', type: 'warning' },
          { id: '2', title: 'New Customer Registered', message: 'Amine Douba has joined the Loyalty program.', type: 'info' },
          { id: '3', title: 'Payment Confirmed', message: 'Transaction code TXN-384AApproved for order #1002.', type: 'success' }
        ]);

      } catch (err) {
        console.error('Failed fetching overview stats:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardStats();
  }, [user]);

  // Chart Data Generators
  const getChartData = () => {
    if (timePeriod === 'daily') {
      return [
        { name: '08:00', sales: 12000, profit: 4500, expenses: 1200, customers: 12, stock: 120 },
        { name: '10:00', sales: 24000, profit: 8900, expenses: 2400, customers: 24, stock: 110 },
        { name: '12:00', sales: 38000, profit: 12400, expenses: 3100, customers: 38, stock: 95 },
        { name: '14:00', sales: 45000, profit: 15600, expenses: 4000, customers: 41, stock: 80 },
        { name: '16:00', sales: 52000, profit: 19800, expenses: 4500, customers: 56, stock: 75 }
      ];
    }
    if (timePeriod === 'weekly') {
      return [
        { name: 'Mon', sales: 25000, profit: 8500, expenses: 2500, customers: 15, stock: 150 },
        { name: 'Tue', sales: 32000, profit: 11200, expenses: 3100, customers: 21, stock: 142 },
        { name: 'Wed', sales: 29000, profit: 9900, expenses: 2800, customers: 18, stock: 135 },
        { name: 'Thu', sales: 45000, profit: 16000, expenses: 4000, customers: 35, stock: 120 },
        { name: 'Fri', sales: 50000, profit: 18500, expenses: 5000, customers: 42, stock: 115 },
        { name: 'Sat', sales: 65000, profit: 24000, expenses: 6200, customers: 55, stock: 100 },
        { name: 'Sun', sales: 55000, profit: 21000, expenses: 5500, customers: 48, stock: 92 }
      ];
    }
    if (timePeriod === 'annual') {
      return [
        { name: '2022', sales: 850000, profit: 290000, expenses: 95000, customers: 1200, stock: 1200 },
        { name: '2023', sales: 1200000, profit: 410000, expenses: 140000, customers: 1800, stock: 1540 },
        { name: '2024', sales: 1540000, profit: 530000, expenses: 180000, customers: 2400, stock: 1900 },
        { name: '2025', sales: 2100000, profit: 750000, expenses: 220000, customers: 3100, stock: 2400 },
        { name: '2026', sales: 2650000, profit: 980000, expenses: 290000, customers: 4200, stock: 3100 }
      ];
    }
    // Monthly default
    return [
      { name: 'Week 1', sales: 35000, profit: 12000, expenses: 3500, customers: 24, stock: 240 },
      { name: 'Week 2', sales: 42000, profit: 15500, expenses: 4200, customers: 35, stock: 225 },
      { name: 'Week 3', sales: 28000, profit: 9500, expenses: 3100, customers: 21, stock: 210 },
      { name: 'Week 4', sales: 52000, profit: 19200, expenses: 5000, customers: 48, stock: 198 }
    ];
  };

  const handleCardNavigation = (slug: string) => {
    router.push(`/dashboard/store?section=${slug}`);
    toast({
      title: 'Navigating to details',
      description: `Opening the ${slug} management section.`,
    });
  };

  // CSV Export
  const handleExportCSV = () => {
    const data = getChartData();
    let csvContent = 'data:text/csv;charset=utf-8,Name,Sales,Profit,Expenses,Customers,Stock\n';
    data.forEach(row => {
      csvContent += `${row.name},${row.sales},${row.profit},${row.expenses},${row.customers},${row.stock}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dashboard_export_${timePeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast({ title: 'Export Successful', description: 'CSV file downloaded successfully.' });
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Pie colors
  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

  const orderStatusesData = [
    { name: 'Completed', value: 75 },
    { name: 'Processing', value: 30 },
    { name: 'Pending', value: 15 },
    { name: 'Cancelled', value: 4 }
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" /> Store Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">Smart KPIs, real-time indicators, and customizable charts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="mr-2 h-4 w-4" /> CSV</Button>
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
        </div>
      </header>

      {/* Grid of 8 Smart KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {/* KPI 1: Revenues */}
        <Card className="hover:border-primary cursor-pointer transition-all duration-200" onClick={() => handleCardNavigation('financials')}>
          <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Revenues</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-sm font-bold font-mono truncate">{kpis.revenues.toLocaleString()} DA</div>
            <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5 mt-0.5"><TrendingUp className="h-3 w-3 inline" /> +15.2%</p>
          </CardContent>
        </Card>

        {/* KPI 2: Profits */}
        <Card className="hover:border-primary cursor-pointer transition-all duration-200" onClick={() => handleCardNavigation('financials')}>
          <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Net Profit</span>
            <Percent className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-sm font-bold font-mono truncate">{kpis.profits.toLocaleString()} DA</div>
            <p className="text-[10px] text-primary font-semibold flex items-center gap-0.5 mt-0.5"><TrendingUp className="h-3 w-3 inline" /> +12.4%</p>
          </CardContent>
        </Card>

        {/* KPI 3: Expenses */}
        <Card className="hover:border-primary cursor-pointer transition-all duration-200" onClick={() => handleCardNavigation('financials')}>
          <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Expenses</span>
            <ArrowUpRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-sm font-bold font-mono truncate">{kpis.expenses.toLocaleString()} DA</div>
            <p className="text-[10px] text-red-500 font-semibold flex items-center gap-0.5 mt-0.5"><TrendingUp className="h-3 w-3 inline" /> +5.1%</p>
          </CardContent>
        </Card>

        {/* KPI 4: Orders */}
        <Card className="hover:border-primary cursor-pointer transition-all duration-200" onClick={() => handleCardNavigation('orders')}>
          <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Orders</span>
            <ShoppingCart className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-sm font-bold font-mono">{kpis.orders}</div>
            <p className="text-[10px] text-sky-500 font-semibold flex items-center gap-0.5 mt-0.5"><TrendingUp className="h-3 w-3 inline" /> +8.2%</p>
          </CardContent>
        </Card>

        {/* KPI 5: Customers */}
        <Card className="hover:border-primary cursor-pointer transition-all duration-200" onClick={() => handleCardNavigation('customers')}>
          <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Customers</span>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-sm font-bold font-mono">{kpis.customers}</div>
            <p className="text-[10px] text-indigo-500 font-semibold flex items-center gap-0.5 mt-0.5"><TrendingUp className="h-3 w-3 inline" /> +14%</p>
          </CardContent>
        </Card>

        {/* KPI 6: Suppliers */}
        <Card className="hover:border-primary cursor-pointer transition-all duration-200" onClick={() => handleCardNavigation('suppliers')}>
          <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Suppliers</span>
            <Truck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-sm font-bold font-mono">{kpis.suppliers}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Active suppliers</p>
          </CardContent>
        </Card>

        {/* KPI 7: Products */}
        <Card className="hover:border-primary cursor-pointer transition-all duration-200" onClick={() => handleCardNavigation('products')}>
          <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Products</span>
            <Package className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-sm font-bold font-mono">{kpis.products}</div>
            <p className="text-[10px] text-violet-500 font-semibold mt-0.5">Listed items</p>
          </CardContent>
        </Card>

        {/* KPI 8: Low Stock */}
        <Card className="hover:border-primary cursor-pointer transition-all duration-200" onClick={() => handleCardNavigation('stock-inventory')}>
          <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Low Stock</span>
            <Layers className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-sm font-bold font-mono">{kpis.lowStock} items</div>
            <p className="text-[10px] text-red-500 font-semibold flex items-center gap-0.5 mt-0.5"><TrendingDown className="h-3 w-3 inline" /> Warning</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Analytics Block */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Business Performance Charts</CardTitle>
            <CardDescription>Visualize trends, revenue, profit, and inventory movements.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Chart Type Picker */}
            <Select value={chartType} onValueChange={(val: any) => setChartType(val)}>
              <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sales-profits">Sales & Net Profits</SelectItem>
                <SelectItem value="expenses">Expenses Tracker</SelectItem>
                <SelectItem value="customers">New Customer Signups</SelectItem>
                <SelectItem value="inventory">Inventory Levels Flow</SelectItem>
              </SelectContent>
            </Select>

            {/* Time Period Picker */}
            <div className="flex bg-muted rounded-md p-0.5 h-9">
              {(['daily', 'weekly', 'monthly', 'annual'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setTimePeriod(p)}
                  className={`px-3 text-xs font-semibold rounded-md transition-all uppercase ${timePeriod === p ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Zoom controls */}
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.25))}><ZoomOut className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.25))}><ZoomIn className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', width: `${100 / zoomLevel}%` }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'sales-profits' ? (
                <AreaChart data={getChartData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString()} DA`} />
                  <Area type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" name="Sales Revenue" />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" name="Net Profit" />
                </AreaChart>
              ) : chartType === 'expenses' ? (
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString()} DA`} />
                  <Legend />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses Amount" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : chartType === 'customers' ? (
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="customers" fill="#6366f1" name="Signups" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="stock" stroke="#f59e0b" fill="#fef3c7" name="Total In-Stock Items" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Grid of details, top metrics list & trackers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top selling products & Best Customers */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-1.5"><TrendingUp className="h-5 w-5 text-emerald-500" /> Best Selling Products</CardTitle>
            <CardDescription>Most ordered items in the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="relative h-10 w-10 overflow-hidden rounded bg-muted">
                    <img src={p.image} alt={p.name} className="object-cover h-full w-full" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.sales} sales logged</div>
                  </div>
                </div>
                <div className="font-mono font-semibold text-slate-800 dark:text-slate-100">{p.revenue.toLocaleString()} DA</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Operations & Activity Logs */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-1.5"><ArrowRightLeft className="h-5 w-5 text-sky-500" /> Recent Operations</CardTitle>
            <CardDescription>Latest orders and transactions log.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentOps.map(op => (
              <div key={op.id} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                <div>
                  <div className="font-bold text-slate-700 dark:text-slate-300">{op.id} • {op.customer}</div>
                  <div className="text-[10px] text-muted-foreground">{op.date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{op.amount.toLocaleString()} DA</span>
                  <Badge variant={op.status === 'completed' ? 'secondary' : op.status === 'processing' ? 'outline' : 'destructive'} className="text-[9px]">
                    {op.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Live System Alerts & Notifications */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-1.5"><Bell className="h-5 w-5 text-indigo-500" /> Alerts & Notifications</CardTitle>
            <CardDescription>Real-time warnings and security updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map(n => (
              <div key={n.id} className="flex items-start gap-2.5 p-2 rounded-md bg-muted/30 text-xs">
                <Info className={`h-4 w-4 shrink-0 mt-0.5 ${n.type === 'warning' ? 'text-amber-500' : n.type === 'success' ? 'text-emerald-500' : 'text-sky-500'}`} />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{n.title}</div>
                  <div className="text-muted-foreground mt-0.5">{n.message}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Row of widgets: Best Customers & Employee stats & Status indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Best Customers */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5"><Users className="h-5 w-5 text-indigo-500" /> Best Customers</CardTitle>
            <CardDescription>Customers with highest cumulative spent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCustomers.map(c => (
              <div key={c.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</div>
                  <div className="text-muted-foreground">{c.email}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold">{c.spent.toLocaleString()} DA</div>
                  <div className="text-[10px] text-muted-foreground">{c.orders} orders</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Best Employees */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5"><ShieldCheck className="h-5 w-5 text-violet-500" /> Team Performance</CardTitle>
            <CardDescription>Most active cashier/sales agents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topEmployees.map((e, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{e.name}</div>
                  <div className="text-muted-foreground">{e.role}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-violet-500 font-mono">{e.sales} transactions</div>
                  <div className="text-[10px] text-muted-foreground">Rating: {e.performance}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Order Status Breakdown Pie Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5"><ShoppingCart className="h-5 w-5 text-sky-500" /> Order Fulfillment Status</CardTitle>
            <CardDescription>Logistics breakdown statistics.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-0 pb-4">
            <div className="h-[140px] w-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={orderStatusesData} innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                    {orderStatusesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 text-xs ml-4">
              {orderStatusesData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-muted-foreground">{entry.name}:</span>
                  <span className="font-semibold font-mono">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
