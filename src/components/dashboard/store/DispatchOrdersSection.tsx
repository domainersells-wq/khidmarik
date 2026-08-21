'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Compass, Search, Truck, Printer, CheckSquare, 
  MapPin, User, ChevronRight, Play, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DispatchItem {
  id: string;
  customerName: string;
  city: string;
  totalDA: number;
  assignedCourier: 'Pending' | 'Yalidine' | 'EMS' | 'In-house';
  status: 'awaiting_assignment' | 'assigned' | 'collected';
}

const initialDispatchList: DispatchItem[] = [
  { id: 'ORD-1012', customerName: 'Rachid Belkaïd', city: 'Algiers', totalDA: 4500, assignedCourier: 'Pending', status: 'awaiting_assignment' },
  { id: 'ORD-1013', customerName: 'Yasmine Oukil', city: 'Oran', totalDA: 12000, assignedCourier: 'Yalidine', status: 'assigned' },
  { id: 'ORD-1014', customerName: 'Kamel Madani', city: 'Setif', totalDA: 3200, assignedCourier: 'Pending', status: 'awaiting_assignment' },
  { id: 'ORD-1015', customerName: 'Zohra Haddad', city: 'Constantine', totalDA: 8900, assignedCourier: 'EMS', status: 'assigned' },
  { id: 'ORD-1016', customerName: 'Sofiane Taleb', city: 'Blida', totalDA: 6500, assignedCourier: 'In-house', status: 'collected' },
];

export function DispatchOrdersSection() {
  const { toast } = useToast();
  const [items, setItems] = useState<DispatchItem[]>(initialDispatchList);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const assignCourier = (id: string, courier: 'Yalidine' | 'EMS' | 'In-house') => {
    setAssigningId(id);
    setTimeout(() => {
      let triggered = false;
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          triggered = true;
          return { ...item, assignedCourier: courier, status: 'assigned' };
        }
        return item;
      }));
      setAssigningId(null);

      if (triggered) {
        toast({ title: 'Courier Assigned', description: `Order ${id} assigned to ${courier}. Waybill generated.` });
      }
    }, 800);
  };

  const handleBulkAssign = (courier: 'Yalidine' | 'EMS' | 'In-house') => {
    if (selectedIds.length === 0) {
      toast({ title: 'No Orders Selected', description: 'Select one or more orders to assign bulk courier.', variant: 'destructive' });
      return;
    }
    setItems(prev => prev.map(item => {
      if (selectedIds.includes(item.id)) {
        return { ...item, assignedCourier: courier, status: 'assigned' };
      }
      return item;
    }));
    toast({ title: 'Bulk Assign Complete', description: `Assigned ${selectedIds.length} orders to ${courier}.` });
    setSelectedIds([]);
  };

  const handlePrintSlips = () => {
    if (selectedIds.length === 0) {
      toast({ title: 'No Orders Selected', description: 'Select orders to print layout slips.', variant: 'destructive' });
      return;
    }

    const selectedOrders = items.filter(item => selectedIds.includes(item.id));
    
    // Open a new browser window/tab for printing packing slips
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Packing Slips - Khidmatik Logistics</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 25px; background: #fff; color: #1e293b; }
              .slip-container { max-width: 650px; margin: 0 auto; }
              .slip { 
                border: 2px dashed #94a3b8; 
                border-radius: 12px; 
                padding: 24px; 
                margin-bottom: 30px; 
                page-break-after: always; 
                background: #f8fafc;
              }
              .header { 
                display: flex; 
                justify-content: space-between; 
                border-bottom: 2px solid #e2e8f0; 
                padding-bottom: 12px; 
                margin-bottom: 16px; 
              }
              .logo { font-weight: 800; font-size: 18px; color: #0f172a; }
              .barcode { 
                font-family: monospace; 
                font-size: 28px; 
                background: #e2e8f0; 
                padding: 6px 12px; 
                border-radius: 6px; 
                display: inline-block; 
                letter-spacing: 2px;
                font-weight: bold;
              }
              .details { margin-bottom: 16px; font-size: 14px; line-height: 1.6; }
              .details p { margin: 6px 0; }
              .price { font-size: 22px; font-weight: 800; color: #0f172a; }
              @media print {
                .no-print { display: none; }
                body { padding: 0; }
                .slip { border: 2px dashed #000; background: #fff; margin-bottom: 0; }
              }
            </style>
          </head>
          <body>
            <div class="slip-container">
              <div class="no-print" style="margin-bottom: 25px; display: flex; gap: 10px; background: #f1f5f9; padding: 12px; border-radius: 8px; justify-content: space-between; align-items: center;">
                <span style="font-size: 13px; font-weight: 600; color: #475569;">Ready to print ${selectedOrders.length} packing slips</span>
                <div style="display: flex; gap: 8px;">
                  <button onclick="window.print()" style="padding: 8px 16px; font-size: 13px; font-weight: 700; cursor: pointer; background: #2563eb; color: #fff; border: none; border-radius: 6px;">Print</button>
                  <button onclick="window.close()" style="padding: 8px 16px; font-size: 13px; font-weight: 700; cursor: pointer; background: #e2e8f0; color: #334155; border: none; border-radius: 6px;">Close</button>
                </div>
              </div>
              ${selectedOrders.map(order => `
                <div class="slip">
                  <div class="header">
                    <div>
                      <div class="logo">KHIDMATIK LOGISTICS</div>
                      <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Courier Assigned: <strong>${order.assignedCourier === 'Pending' ? 'In-house Carrier' : order.assignedCourier}</strong></p>
                    </div>
                    <div style="text-align: right;">
                      <span style="font-size: 14px; font-weight: 800; background: #cbd5e1; padding: 4px 8px; border-radius: 4px;">${order.id}</span>
                      <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">Awaiting Shipment Collection</p>
                    </div>
                  </div>
                  <div class="details">
                    <p><strong>Customer Name:</strong> ${order.customerName}</p>
                    <p><strong>Shipping City:</strong> ${order.city}, Algeria</p>
                    <p><strong>Delivery Method:</strong> Yalidine COD / EMS Priority Postal</p>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                      <div class="barcode">||| ${order.id} |||</div>
                      <p style="font-size: 10px; color: #64748b; margin: 4px 0 0 0;">Scan waybill barcode to release shipment</p>
                    </div>
                    <div class="price">
                      ${order.totalDA.toLocaleString()} DZD
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() { window.print(); }, 500);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }

    toast({ title: 'Packing Slips Generated', description: `Opened print dialog for ${selectedIds.length} layout sheets.` });
  };

  const filteredItems = items.filter(item => 
    item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-2">
            <Compass className="h-8 w-8 text-primary animate-spin" style={{ animationDuration: '20s' }} /> Order Dispatch (توزيع الطلبات)
          </h1>
          <p className="text-muted-foreground">Assign couriers, print Yalidine barcodes, compile bulk shipments, and release packages to couriers.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Awaiting Assignment</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-yellow-600">
              {items.filter(i => i.status === 'awaiting_assignment').length}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Requires courier selection</p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Assigned / Processing</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-blue-600">
              {items.filter(i => i.status === 'assigned').length}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Waybills & labels printed</p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Collected by Couriers</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-green-600">
              {items.filter(i => i.status === 'collected').length}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">In transit with Yalidine/EMS</p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Ready for Pickup</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono">3</div>
            <p className="text-[10px] text-green-600 font-semibold mt-1">Pending carrier collection</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <Card className="shadow border">
        <CardHeader className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg">Logistics Dispatch Center</CardTitle>
            <CardDescription>Select pending packaging orders to generate domestic waybills.</CardDescription>
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
                <TableHead className="w-[40px]">
                  <input 
                    type="checkbox"
                    checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedIds(filteredItems.map(i => i.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Destination City</TableHead>
                <TableHead className="text-right">Order Cost</TableHead>
                <TableHead>Assigned Courier</TableHead>
                <TableHead>Logistics Status</TableHead>
                <TableHead className="text-right">Carrier Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map(item => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <TableRow key={item.id} className={isSelected ? 'bg-muted/30' : ''}>
                    <TableCell>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, item.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== item.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-slate-700">{item.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center"><User className="h-3 w-3 text-slate-500" /></div>
                        <span className="font-semibold text-xs">{item.customerName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3 text-muted-foreground" /> {item.city}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">{item.totalDA.toLocaleString()} DA</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {item.assignedCourier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        item.status === 'awaiting_assignment' ? 'bg-yellow-500 text-white' :
                        item.status === 'assigned' ? 'bg-blue-500 text-white' :
                        'bg-green-500 text-white'
                      }>
                        {item.status.toUpperCase().replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.status === 'awaiting_assignment' ? (
                        <div className="flex justify-end gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-[11px] h-7 px-2 border-primary text-primary hover:bg-primary/5"
                            onClick={() => assignCourier(item.id, 'Yalidine')}
                            disabled={assigningId === item.id}
                          >
                            {assigningId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yalidine'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-[11px] h-7 px-2"
                            onClick={() => assignCourier(item.id, 'EMS')}
                            disabled={assigningId === item.id}
                          >
                            EMS
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1 text-xs text-green-600 font-semibold items-center">
                          Ready <Printer className="h-3.5 w-3.5 ml-1 text-slate-400" />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
        {selectedIds.length > 0 && (
          <CardFooter className="p-3 bg-slate-50 border-t flex gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-auto self-center">{selectedIds.length} orders selected</span>
            <Button size="sm" variant="outline" onClick={handlePrintSlips} className="flex items-center"><Printer className="h-3.5 w-3.5 mr-1" /> Print Slips</Button>
            <Button size="sm" onClick={() => handleBulkAssign('Yalidine')}>Assign Yalidine</Button>
            <Button size="sm" onClick={() => handleBulkAssign('EMS')}>Assign EMS</Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
