
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, Users, CreditCard, BarChartBig, LineChart, ListFilter, CalendarDays, Download, UserPlus, FileText, Settings, Percent, Receipt, Landmark, AlertCircle } from 'lucide-react';
import type { PlatformFinancialKPI, StoreSubscriptionPlan } from '@/types';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'; 
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';


const subscriptionPlans: {id: StoreSubscriptionPlan, name: string}[] = [
    { id: 'basic', name: 'Basic Plan' },
    { id: 'pro', name: 'Pro Plan' },
    { id: 'premium_annual', name: 'Premium (Annual)' },
];

export function FinancialOverviewSection() {
  const { toast } = useToast();
  const [stores, setStores] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch stores
        const { data: dbStores, error: storesError } = await supabase
          .from('stores')
          .select('*');

        if (storesError) throw storesError;

        // Fetch transactions
        const { data: dbTx, error: txError } = await supabase
          .from('transactions')
          .select('*');

        if (txError) throw txError;

        setStores(dbStores || []);

        const totalVol = dbTx?.reduce((acc, t) => acc + parseFloat(t.amount || 0), 0) || 0;
        const totalComm = totalVol * 0.10; // 10% platform commission model

        setKpis([
          {
            title: "Total Volume",
            value: `${totalVol.toLocaleString()} DA`,
            icon: DollarSign,
            trend: { percentage: 12.5, direction: 'up' as const }
          },
          {
            title: "Platform Commission",
            value: `${totalComm.toLocaleString()} DA`,
            icon: Percent,
            trend: { percentage: 8.2, direction: 'up' as const }
          },
          {
            title: "Active Storefronts",
            value: (dbStores?.length || 0).toString(),
            icon: Users,
            trend: { percentage: 4.1, direction: 'up' as const }
          },
          {
            title: "Total Transactions",
            value: (dbTx?.length || 0).toString(),
            icon: Receipt,
            trend: { percentage: 18.3, direction: 'up' as const }
          }
        ]);
      } catch (e) {
        console.error('Error fetching financial overview:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleViewReport = (reportName: string) => {
     toast({ title: `View ${reportName} Report (Conceptual)`, description: `Navigating to detailed ${reportName.toLowerCase()} reports.` });
  };

  const handleManagePlan = (providerId: string, providerName: string, newPlan: StoreSubscriptionPlan) => {
    toast({ title: `Manage Plan for ${providerName} (Conceptual)`, description: `Changing subscription for ${providerId} to ${newPlan}. This would update Firestore and potentially trigger billing.` });
  };
  
  const handleVendorPayout = (vendorId: string, amount: number) => {
      toast({ title: `Process Payout for ${vendorId} (Conceptual)`, description: `Processing payout of ${amount} DA. This would integrate with a payment system.` });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <DollarSign className="mr-3 h-8 w-8 text-primary" /> Financial Management
        </h1>
        <p className="text-muted-foreground">Monitor subscriptions, commissions, manage payouts, and view financial transactions.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map(kpi => {
            const TrendIcon = kpi.trend?.direction === 'up' ? TrendingUp : TrendingUp; 
            const KpiIcon = kpi.icon; 
            return (
            <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                    <KpiIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                    {kpi.trend && (
                        <p className={`text-xs ${kpi.trend.direction === 'up' ? 'text-green-600' : 'text-destructive'}`}>
                           <TrendIcon className="inline h-3 w-3 mr-1"/> {kpi.trend.percentage > 0 ? `+${kpi.trend.percentage}` : kpi.trend.percentage}% from last period
                        </p>
                    )}
                </CardContent>
            </Card>
            );
        })}
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><Settings className="mr-2 h-5 w-5"/>Subscription & Commission System</CardTitle>
            <CardDescription>Manage subscription plans and platform commission rates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <h4 className="font-semibold mb-2">Subscription Plans Management (Conceptual)</h4>
                <p className="text-sm text-muted-foreground">Table of subscription plans (Basic, Pro, Premium) with features, pricing. Ability to create/edit plans.</p>
                <Button variant="outline" size="sm" className="mt-2" disabled>Manage Subscription Plans</Button>
            </div>
            <Separator/>
            <div>
                <h4 className="font-semibold mb-2">Commission Rates (Conceptual)</h4>
                <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Default Rate %" className="w-32" disabled/>
                    <Button variant="outline" size="sm" disabled>Set Default Rate</Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Assign individual commission rates per vendor or plan. Auto-calculation and deduction.</p>
                 <Button variant="outline" size="sm" className="mt-2" disabled>Manage Commission Rules</Button>
            </div>
            <Separator/>
             <div>
                <h4 className="font-semibold mb-2">Monitor Subscriptions (Example Data - Stores)</h4>
                <Table>
                    <TableHeader><TableRow><TableHead>Store Name</TableHead><TableHead>Current Plan</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {(stores.length > 0 ? stores.slice(0,3) : [
                            { id: 's1', name: 'DzTech Electronics', subscription_plan: 'pro' },
                            { id: 's2', name: 'Yalidine Delivery Shop', subscription_plan: 'basic' }
                        ]).map(store => (
                            <TableRow key={store.id}>
                                <TableCell>{store.name}</TableCell>
                                <TableCell className="capitalize">{store.subscription_plan || 'basic'}</TableCell>
                                <TableCell className="capitalize">Active</TableCell>
                                <TableCell>
                                    <Select onValueChange={(newPlan) => handleManagePlan(store.id, store.name, newPlan as StoreSubscriptionPlan)}>
                                        <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Change Plan..."/></SelectTrigger>
                                        <SelectContent>
                                            {subscriptionPlans.map(plan => <SelectItem key={plan.id} value={plan.id} className="text-xs">{plan.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-1">Auto-update accounts on expiration (conceptual).</p>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><Receipt className="mr-2 h-5 w-5"/>Invoicing & Payments Management</CardTitle>
            <CardDescription>View financial transactions, manage invoices, and process payouts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="flex gap-2 mb-4 items-center">
                <Input placeholder="Search Transaction ID, User, Invoice..." className="max-w-sm"/>
                 <Select>
                    <SelectTrigger className="w-[180px]"><ListFilter className="mr-2 h-4 w-4"/><SelectValue placeholder="Filter by Type"/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Transactions</SelectItem>
                        <SelectItem value="subscription_fee">Subscription Fee</SelectItem>
                        <SelectItem value="platform_commission">Platform Commission</SelectItem>
                        <SelectItem value="vendor_payout">Vendor Payout</SelectItem>
                        <SelectItem value="customer_payment">Customer Payment</SelectItem>
                    </SelectContent>
                </Select>
                 <Button variant="outline" disabled><CalendarDays className="mr-2 h-4 w-4"/>Date Range</Button>
                 <Button variant="outline" disabled><Download className="mr-2 h-4 w-4"/>Export Data</Button>
            </div>
            <p className="text-sm text-muted-foreground">Conceptual: Detailed table of all platform financial transactions (subscriptions, commissions, customer payments through platform, payouts).</p>
            <Button variant="outline" size="sm" className="mt-2" disabled>Create Manual Invoice</Button>
            <Separator className="my-4"/>
            <h4 className="font-semibold mb-2">Vendor Payout & Withdrawal Requests (Conceptual)</h4>
            <Table>
                 <TableHeader><TableRow><TableHead>Vendor Name</TableHead><TableHead>Requested Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                 <TableBody>
                     <TableRow>
                         <TableCell>Store ABC</TableCell>
                         <TableCell>15,000 DA</TableCell>
                         <TableCell><Badge variant="secondary">Pending</Badge></TableCell>
                         <TableCell><Button size="sm" onClick={() => handleVendorPayout('Store ABC', 15000)}>Process Payout</Button></TableCell>
                     </TableRow>
                     <TableRow>
                         <TableCell>Service Pro XYZ</TableCell>
                         <TableCell>8,000 DA</TableCell>
                         <TableCell><Badge>Approved</Badge></TableCell>
                         <TableCell><Button size="sm" variant="outline" disabled>View Details</Button></TableCell>
                     </TableRow>
                 </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-1">Integration with banking systems for actual fund transfers needed.</p>
             <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-xs flex items-start gap-2 mt-3">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                    Financial management requires robust security, logging, and integration with actual payment gateways and banking APIs. 
                    All transactions should be logged for auditing. Commission calculations need to be precise.
                </span>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
