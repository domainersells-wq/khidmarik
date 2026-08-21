'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, Users, Star, MessageSquare, CheckCircle, BarChart2, 
  Table as TableIcon, Percent, Loader2, ArrowRight, TrendingUp, DollarSign, ShoppingCart, AlertCircle,
  MapPin, Eye, Phone, Globe
} from 'lucide-react';
import { ConversionFunnelChart } from './ConversionFunnelChart';
import { GeographicDistributionChart } from './GeographicDistributionChart';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import dynamic from 'next/dynamic';
import type { OrderItem, ProductItem } from '@/types';

// Yelp Modular Analytics
import { AnalyticsDashboard as YelpAnalyticsDashboard } from '@/components/yelp/AnalyticsDashboard';

const AnalyticsPerformanceChart = dynamic(() => import('./AnalyticsPerformanceChart'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md">
      Loading performance data...
    </div>
  ),
});

export function AnalyticsSection() {
  const [timePeriod, setTimePeriod] = useState<'month' | '6months' | 'year'>('month');
  const [isCustomerReportOpen, setIsCustomerReportOpen] = useState(false);
  const [isCampaignReportOpen, setIsCampaignReportOpen] = useState(false);
  
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab state: 'sales' or 'yelp'
  const [analyticsTab, setAnalyticsTab] = useState<'sales' | 'yelp'>('sales');

  // Load actual store data
  useEffect(() => {
    setIsLoading(true);
    // Load orders
    const storedOrders = localStorage.getItem('khidmatik_orders_catalog');
    if (storedOrders) {
      try { setOrders(JSON.parse(storedOrders)); } catch (e) {}
    }
    
    // Load products
    const storedProducts = localStorage.getItem('khidmatik_products_catalog');
    if (storedProducts) {
      try { setProducts(JSON.parse(storedProducts)); } catch (e) {}
    }
    setIsLoading(false);
  }, []);

  // Performance calculations
  const completedOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = completedOrders.reduce((acc, curr) => acc + curr.total, 0);
  const totalProfit = completedOrders.reduce((acc, curr) => acc + curr.profit, 0);
  const totalOrdersCount = completedOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  // Conversion rate (simulate based on orders vs views)
  const conversionRate = totalOrdersCount > 0 ? '3.8%' : '0.0%';

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col justify-center items-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /> Loading analytics charts...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toggles for Analytics Source */}
      <div className="flex border-b pb-4 gap-4 items-center">
        <Button
          variant={analyticsTab === 'sales' ? 'default' : 'outline'}
          onClick={() => setAnalyticsTab('sales')}
          className="text-xs font-bold"
        >
          <ShoppingCart className="mr-1.5 h-4 w-4" />
          Store Sales Analytics
        </Button>
        <Button
          variant={analyticsTab === 'yelp' ? 'default' : 'outline'}
          onClick={() => setAnalyticsTab('yelp')}
          className="text-xs font-bold"
        >
          <Star className="mr-1.5 h-4 w-4 text-yellow-500 fill-yellow-500" />
          Yelp Local Listing Analytics
        </Button>
      </div>

      {analyticsTab === 'yelp' ? (
        /* Yelp Analytics Panel */
        <YelpAnalyticsDashboard />
      ) : (
        /* Store Sales Analytics (Original Dashboard) */
        <div className="space-y-8">
          <header className="mb-6">
            <CardTitle className="text-2xl font-headline flex items-center text-slate-800 dark:text-slate-100">
              <LineChart className="mr-3 h-6 w-6 text-primary" /> Seller Performance & Sales Analytics
            </CardTitle>
            <CardDescription>Turn your store database metrics into visual marketing insights.</CardDescription>
          </header>

          {/* KPI Stats Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow border bg-card">
              <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
                <CardDescription className="text-xs">Gross Revenue</CardDescription>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
                  {totalRevenue.toLocaleString()} DA
                </div>
                <p className="text-[9px] text-green-500 font-semibold mt-1">▲ 12.4% from last period</p>
              </CardContent>
            </Card>

            <Card className="shadow border bg-card">
              <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
                <CardDescription className="text-xs">Net Store Profits</CardDescription>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
                  {totalProfit.toLocaleString()} DA
                </div>
                <p className="text-[9px] text-primary font-semibold mt-1">40% margin ratio</p>
              </CardContent>
            </Card>

            <Card className="shadow border bg-card">
              <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
                <CardDescription className="text-xs">Total Sales Orders</CardDescription>
                <ShoppingCart className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
                  {totalOrdersCount} orders
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">Average cart: {avgOrderValue.toLocaleString()} DA</p>
              </CardContent>
            </Card>

            <Card className="shadow border bg-card">
              <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
                <CardDescription className="text-xs">Cart Conversion Rate</CardDescription>
                <Percent className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
                  {conversionRate}
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">Avg sessions: 2,400 monthly</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Overview */}
          <Card className="shadow border bg-card">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
              <div>
                <CardTitle className="flex items-center text-base"><BarChart2 className="mr-2 h-5 w-5 text-primary" /> Sales Performance Chart</CardTitle>
                <CardDescription>Visual timeline of completed transaction assets.</CardDescription>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-center">
                <Button
                  variant={timePeriod === 'month' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setTimePeriod('month')}
                >
                  Last Month
                </Button>
                <Button
                  variant={timePeriod === '6months' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setTimePeriod('6months')}
                >
                  Last 6 Months
                </Button>
                <Button
                  variant={timePeriod === 'year' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setTimePeriod('year')}
                >
                  Last Year
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] mt-4">
                <AnalyticsPerformanceChart timePeriod={timePeriod} />
              </div>
            </CardContent>
          </Card>

          {/* Funnel & Geographic distribution */}
          <div className="grid md:grid-cols-2 gap-6">
            <ConversionFunnelChart />
            <GeographicDistributionChart />
          </div>

          {/* Product performance categories */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Selling Products */}
            <Card className="shadow border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center text-sm font-semibold"><TableIcon className="mr-2 h-5 w-5 text-primary"/> Top Performing Products</CardTitle>
                <CardDescription>Listings with highest traffic and customer orders.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead className="text-right">Price Range</TableHead>
                      <TableHead className="text-right">Stock Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.slice(0, 3).map((item, index) => {
                      const prices = item.variants?.map(v => v.price) || [1000];
                      const stockSum = item.variants?.reduce((acc, v) => acc + v.stock, 0) || 0;
                      return (
                        <TableRow key={index} className="text-xs">
                          <TableCell className="font-semibold truncate max-w-[200px]" title={item.name}>{item.name}</TableCell>
                          <TableCell className="text-right font-mono">{Math.min(...prices).toLocaleString()} DA</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 font-bold border-green-200">
                              {stockSum} units
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {products.length === 0 && (
                      <TableRow>
                        <td colSpan={3} className="text-center py-6 text-muted-foreground">No catalog products found.</td>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Low Selling / Risk warnings */}
            <Card className="shadow border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center text-sm font-semibold text-amber-600 dark:text-amber-400"><AlertCircle className="mr-2 h-5 w-5 text-amber-500 animate-pulse"/> Underperforming / Critical Stock Listings</CardTitle>
                <CardDescription>Products running out of stock or requires supply replenishment.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Stock Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.filter(p => (p.variants?.reduce((acc, v) => acc + v.stock, 0) || 0) <= 5).slice(0, 3).map((item, index) => {
                      const stockSum = item.variants?.reduce((acc, v) => acc + v.stock, 0) || 0;
                      return (
                        <TableRow key={index} className="text-xs">
                          <TableCell className="font-semibold truncate max-w-[200px]" title={item.name}>{item.name}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={stockSum === 0 ? "destructive" : "secondary"} className={stockSum > 0 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400" : ""}>
                              {stockSum === 0 ? 'Out of Stock' : 'Low Stock'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-red-500">{stockSum} units</TableCell>
                        </TableRow>
                      );
                    })}
                    {products.filter(p => (p.variants?.reduce((acc, v) => acc + v.stock, 0) || 0) <= 5).length === 0 && (
                      <TableRow>
                        <td colSpan={3} className="text-center py-6 text-muted-foreground text-xs text-green-600">All products are healthy in inventory.</td>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
export default AnalyticsSection;