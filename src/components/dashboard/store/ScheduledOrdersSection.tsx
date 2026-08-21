'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  CalendarClock, Search, PlusCircle, Play, Pause, Trash2, 
  RefreshCw, Clock, Sparkles, CheckCircle2, User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScheduledOrder {
  id: string;
  customerName: string;
  frequency: 'Weekly' | 'Monthly' | 'Bi-weekly';
  itemsCount: number;
  totalDA: number;
  nextRunDate: string;
  status: 'active' | 'paused' | 'completed';
  lastRunDate: string;
  productName: string;
}

const mockScheduledOrders: ScheduledOrder[] = [
  { id: 'SCH-809', customerName: 'Nabil Mansouri', frequency: 'Weekly', itemsCount: 2, totalDA: 4500, nextRunDate: '2026-07-12', status: 'active', lastRunDate: '2026-07-05', productName: 'Organic Olive Oil (1L)' },
  { id: 'SCH-412', customerName: 'Soumeya Boumediene', frequency: 'Monthly', itemsCount: 1, totalDA: 12000, nextRunDate: '2026-08-01', status: 'active', lastRunDate: '2026-07-01', productName: 'Handcrafted Ceramic Set' },
  { id: 'SCH-229', customerName: 'Amine Belkaid', frequency: 'Bi-weekly', itemsCount: 3, totalDA: 3200, nextRunDate: '2026-07-19', status: 'paused', lastRunDate: '2026-07-05', productName: 'Traditional Honey Jar' },
  { id: 'SCH-771', customerName: 'Fatiha Touati', frequency: 'Weekly', itemsCount: 5, totalDA: 8900, nextRunDate: '2026-07-14', status: 'active', lastRunDate: '2026-07-07', productName: 'Premium Deglet Nour Dates' },
  { id: 'SCH-902', customerName: 'Riad Zeghdane', frequency: 'Monthly', itemsCount: 1, totalDA: 6500, nextRunDate: '2026-07-28', status: 'completed', lastRunDate: '2026-06-28', productName: 'Wool Berbere Carpet' },
];

export function ScheduledOrdersSection() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<ScheduledOrder[]>(mockScheduledOrders);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleStatus = (id: string) => {
    let nextStatus: 'active' | 'paused' | null = null;

    setOrders(prev => prev.map(order => {
      if (order.id === id) {
        const newStatus = order.status === 'active' ? 'paused' : 'active';
        nextStatus = newStatus;
        return { ...order, status: newStatus };
      }
      return order;
    }));

    if (nextStatus) {
      toast({
        title: nextStatus === 'active' ? 'Subscription Resumed' : 'Subscription Paused',
        description: `Order ${id} status has been updated.`,
      });
    }
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(order => order.id !== id));
    toast({
      title: 'Scheduled Order Cancelled',
      description: `Subscription ${id} was successfully deleted.`,
      variant: 'destructive',
    });
  };

  const filteredOrders = orders.filter(o => 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-2">
            <CalendarClock className="h-8 w-8 text-primary" /> Scheduled Orders (الطلبات المبرمجة)
          </h1>
          <p className="text-muted-foreground">Manage recurring subscriber deliveries, customer subscriptions, and dispatch times.</p>
        </div>
        <Button className="bg-primary text-white flex items-center gap-2">
          <PlusCircle className="h-4 w-4" /> Schedule Custom Order
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Active Subscriptions</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono">
              {orders.filter(o => o.status === 'active').length}
            </div>
            <p className="text-[10px] text-green-600 font-semibold flex items-center gap-1 mt-1">
              <Sparkles className="h-3 w-3" /> Recurring buyers
            </p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Next Run Payout</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-primary">
              {orders.filter(o => o.status === 'active').reduce((acc, curr) => acc + curr.totalDA, 0).toLocaleString()} DA
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Projected revenue</p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Paused Accounts</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-yellow-600">
              {orders.filter(o => o.status === 'paused').length}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Awaiting resumption</p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Deliveries Today</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-green-600">1</div>
            <p className="text-[10px] text-muted-foreground mt-1">1 scheduled for dispatch</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="shadow border">
        <CardHeader className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg">Subscription Registry</CardTitle>
            <CardDescription>View, activate, pause or terminate auto-shipping customer orders.</CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search subscriber, ID or item..." 
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
                <TableHead>Subscription ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product / Package</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead className="text-right">Interval Total</TableHead>
                <TableHead>Last Dispatch</TableHead>
                <TableHead>Next Dispatch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs font-bold text-primary">{order.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center"><User className="h-3 w-3 text-slate-500" /></div>
                      <span className="font-semibold text-xs">{order.customerName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{order.productName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit bg-slate-50 text-[10px]">
                      <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: '6s' }} /> {order.frequency}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold">{order.totalDA.toLocaleString()} DA</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{order.lastRunDate}</TableCell>
                  <TableCell className="text-xs font-semibold">{order.nextRunDate}</TableCell>
                  <TableCell>
                    <Badge className={
                      order.status === 'active' ? 'bg-green-500 text-white' : 
                      order.status === 'paused' ? 'bg-yellow-500 text-white' : 
                      'bg-slate-500 text-white'
                    }>
                      {order.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-slate-600"
                        onClick={() => toggleStatus(order.id)}
                        title={order.status === 'active' ? 'Pause Subscription' : 'Resume Subscription'}
                      >
                        {order.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteOrder(order.id)}
                        title="Cancel Subscription"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No scheduled orders found.
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
