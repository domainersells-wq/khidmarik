'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, Search, PhoneCall, RefreshCcw, Archive, 
  MapPin, User, ChevronRight, XCircle, ArrowUpDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FailedDelivery {
  id: string;
  customerName: string;
  phone: string;
  city: string;
  reason: 'Buyer Unreachable' | 'Refused Package' | 'Wrong Location' | 'Out of Stock';
  failedAttempts: number;
  lastAttemptDate: string;
  amountDA: number;
  courier: string;
  status: 'pending-action' | 'returned-to-stock' | 're-dispatched';
}

const mockFailedDeliveries: FailedDelivery[] = [
  { id: 'ORD-1002', customerName: 'Fouad Khelil', phone: '0662 11 22 33', city: 'Oran', reason: 'Buyer Unreachable', failedAttempts: 3, lastAttemptDate: '2026-07-06', amountDA: 5500, courier: 'Yalidine', status: 'pending-action' },
  { id: 'ORD-1004', customerName: 'Djamel Bensalah', phone: '0770 44 55 66', city: 'Constantine', reason: 'Refused Package', failedAttempts: 1, lastAttemptDate: '2026-07-05', amountDA: 950, courier: 'EMS', status: 'returned-to-stock' },
  { id: 'ORD-1009', customerName: 'Meriem Lahlou', phone: '0555 77 88 99', city: 'Algiers', reason: 'Wrong Location', failedAttempts: 2, lastAttemptDate: '2026-07-07', amountDA: 8000, courier: 'Yalidine', status: 'pending-action' },
  { id: 'ORD-1011', customerName: 'Samir Brahimi', phone: '0656 88 99 00', city: 'Sidi Bel Abbès', reason: 'Out of Stock', failedAttempts: 0, lastAttemptDate: '2026-07-04', amountDA: 12500, courier: 'In-house', status: 're-dispatched' },
];

export function FailureManagementSection() {
  const { toast } = useToast();
  const [failures, setFailures] = useState<FailedDelivery[]>(mockFailedDeliveries);
  const [searchTerm, setSearchTerm] = useState('');

  const handleReDispatch = (id: string) => {
    let triggered = false;
    setFailures(prev => prev.map(f => {
      if (f.id === id) {
        triggered = true;
        return { ...f, status: 're-dispatched', failedAttempts: 0 };
      }
      return f;
    }));

    if (triggered) {
      toast({
        title: 'Order Re-Dispatched',
        description: `Order ${id} has been queued for a new delivery attempt.`,
      });
    }
  };

  const handleReturnToStock = (id: string) => {
    let triggered = false;
    setFailures(prev => prev.map(f => {
      if (f.id === id) {
        triggered = true;
        return { ...f, status: 'returned-to-stock' };
      }
      return f;
    }));

    if (triggered) {
      toast({
        title: 'Returned to Stock',
        description: `Inventory for order ${id} has been restored.`,
      });
    }
  };

  const filteredFailures = failures.filter(f => 
    f.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-destructive animate-pulse" /> Failure Management (إدارة الإخفاقات)
        </h1>
        <p className="text-muted-foreground">Monitor cash-on-delivery failed attempts, unreachable customers, refused packages, and logistics disputes.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow border bg-red-50/20 border-red-100">
          <CardHeader className="p-4 pb-2"><CardDescription>Active Delivery Failures</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-red-600">
              {failures.filter(f => f.status === 'pending-action').length}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Requires seller decision</p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Average COD Return Rate</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono">12.4%</div>
            <p className="text-[10px] text-green-600 font-semibold mt-1">Within standard limits</p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Returned to Inventory</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-slate-700">
              {failures.filter(f => f.status === 'returned-to-stock').length}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Items restocked successfully</p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Recovered Revenue</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-green-600">12,500 DA</div>
            <p className="text-[10px] text-green-600 font-semibold mt-1">Via re-dispatch attempts</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="shadow border">
        <CardHeader className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg">Incident Registry</CardTitle>
            <CardDescription>Resolve failed customer shipping events.</CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by customer, city, ID..." 
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
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Wilaya/City</TableHead>
                <TableHead>Logistics Failure Reason</TableHead>
                <TableHead className="text-center">Attempts</TableHead>
                <TableHead className="text-right">Order Cost</TableHead>
                <TableHead>Last Attempt</TableHead>
                <TableHead>Resolution Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFailures.map(fail => (
                <TableRow key={fail.id} className={fail.status === 'pending-action' ? 'bg-red-50/10' : ''}>
                  <TableCell className="font-mono text-xs font-bold text-slate-700">{fail.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-xs">{fail.customerName}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{fail.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="h-3 w-3 text-muted-foreground" /> {fail.city}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-red-700 font-semibold">
                      <XCircle className="h-4 w-4 text-red-500" />
                      {fail.reason}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">{fail.failedAttempts}</TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold">{fail.amountDA.toLocaleString()} DA</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fail.lastAttemptDate}</TableCell>
                  <TableCell>
                    <Badge className={
                      fail.status === 'pending-action' ? 'bg-red-500 text-white animate-pulse' :
                      fail.status === 'returned-to-stock' ? 'bg-slate-500 text-white' :
                      'bg-green-500 text-white'
                    }>
                      {fail.status === 'pending-action' ? 'PENDING DECISION' : fail.status.toUpperCase().replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {fail.status === 'pending-action' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs flex items-center gap-1 h-8"
                            onClick={() => handleReDispatch(fail.id)}
                          >
                            <RefreshCcw className="h-3.5 w-3.5" /> Re-Dispatch
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs text-red-600 flex items-center gap-1 h-8"
                            onClick={() => handleReturnToStock(fail.id)}
                          >
                            <Archive className="h-3.5 w-3.5" /> Return Stock
                          </Button>
                        </>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500">
                        <PhoneCall className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredFailures.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No failed deliveries logged.
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
