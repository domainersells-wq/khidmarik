'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { 
  RotateCcw, ShieldAlert, Plus, MessageSquare, Check, X, 
  ExternalLink, Eye, ArrowLeftRight, Coins, Package, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { OrderItem, RMARequest, ProductItem, InventoryLog } from '@/types';

const mockRMAs: RMARequest[] = [
  {
    id: 'RMA-9081',
    orderId: 'ORD1002',
    customerName: 'Fatima Zohra',
    type: 'return',
    reason: 'Received wrong design set, ordered handcrafted floral pattern but received geometric model instead.',
    mediaUrls: ['https://placehold.co/100x100.png?text=Proof+Image'],
    status: 'requested',
    history: [{ status: 'requested', date: '2026-07-04 11:20', note: 'Customer opened ticket.' }],
    date: '2026-07-04'
  }
];

export function RMAManagementTab() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [rmas, setRmas] = useState<RMARequest[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  
  // Simulation modal states
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [returnType, setReturnType] = useState<'return' | 'exchange' | 'refund'>('return');
  const [returnReason, setReturnReason] = useState('');
  const [returnProof, setReturnProof] = useState('');

  // Status transitions modal states
  const [selectedRMA, setSelectedRMA] = useState<RMARequest | null>(null);
  const [transitionStatus, setTransitionStatus] = useState<RMARequest['status']>('under_review');
  const [transitionNote, setTransitionNote] = useState('');
  const [restockItem, setRestockItem] = useState(true);
  const [isInspectOpen, setIsInspectOpen] = useState(false);

  // Load RMA catalog & orders
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      
      // Load orders
      const storedOrders = localStorage.getItem('khidmatik_orders_catalog');
      if (storedOrders) {
        try { setOrders(JSON.parse(storedOrders)); } catch (e) {}
      }

      // Load RMAs
      let rmaList: RMARequest[] = [];
      try {
        const res = await fetch('/api/store/rma');
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          rmaList = json.data;
        } else {
          const stored = localStorage.getItem('khidmatik_rma_catalog');
          if (stored) rmaList = JSON.parse(stored);
          else rmaList = mockRMAs;
        }
      } catch (e) {
        const stored = localStorage.getItem('khidmatik_rma_catalog');
        if (stored) rmaList = JSON.parse(stored);
        else rmaList = mockRMAs;
      }
      setRmas(rmaList);
      
      setIsLoading(false);
    }
    loadData();
  }, []);

  const saveRMACatalog = async (updated: RMARequest[]) => {
    setRmas(updated);
    localStorage.setItem('khidmatik_rma_catalog', JSON.stringify(updated));
    try {
      await fetch('/api/store/rma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rmas: updated })
      });
    } catch (e) {}
  };

  const handleSimulateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !returnReason) return;

    const matched = orders.find(o => o.id === selectedOrder);
    if (!matched) return;

    const newRMA: RMARequest = {
      id: `RMA-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: selectedOrder,
      customerName: matched.customerName,
      type: returnType,
      reason: returnReason,
      mediaUrls: returnProof ? [returnProof] : [],
      status: 'requested',
      history: [{ status: 'requested', date: new Date().toISOString().replace('T', ' ').slice(0, 16), note: 'Customer initialized RMA ticket.' }],
      date: new Date().toISOString().split('T')[0]
    };

    const updated = [newRMA, ...rmas];
    saveRMACatalog(updated);

    // Update order status return
    const updatedOrders = orders.map(o => o.id === selectedOrder ? { ...o, returnStatus: 'requested' as const } : o);
    setOrders(updatedOrders);
    localStorage.setItem('khidmatik_orders_catalog', JSON.stringify(updatedOrders));

    setIsSimulateOpen(false);
    setSelectedOrder('');
    setReturnReason('');
    setReturnProof('');

    toast({
      title: "RMA Request Sim Created",
      description: `RMA ticket ${newRMA.id} launched successfully.`
    });
  };

  const handleTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRMA) return;

    // Build timeline entry
    const newHistory = [...selectedRMA.history, {
      status: transitionStatus,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      note: transitionNote || 'Status transitioned.'
    }];

    const updatedRMA: RMARequest = {
      ...selectedRMA,
      status: transitionStatus,
      history: newHistory
    };

    const updatedRMAs = rmas.map(r => r.id === selectedRMA.id ? updatedRMA : r);
    saveRMACatalog(updatedRMAs);

    // Update order return status appropriately
    let finalReturnStatus: OrderItem['returnStatus'] = 'requested';
    if (transitionStatus === 'approved') finalReturnStatus = 'approved';
    if (transitionStatus === 'rejected') finalReturnStatus = 'rejected';
    if (transitionStatus === 'refunded') finalReturnStatus = 'refunded';

    const updatedOrders = orders.map(o => o.id === selectedRMA.orderId ? { ...o, returnStatus: finalReturnStatus } : o);
    setOrders(updatedOrders);
    localStorage.setItem('khidmatik_orders_catalog', JSON.stringify(updatedOrders));

    // Optional: Restock item back to catalog stock count
    if (transitionStatus === 'approved' && restockItem) {
      await triggerRestock(selectedRMA.orderId);
    }

    setIsInspectOpen(false);
    setTransitionNote('');
    setSelectedRMA(null);

    toast({
      title: "RMA Ticket Updated",
      description: `Ticket status successfully set to ${transitionStatus.toUpperCase()}.`
    });
  };

  const triggerRestock = async (orderId: string) => {
    const matchedOrder = orders.find(o => o.id === orderId);
    if (!matchedOrder) return;

    // Load products
    let catalogList: ProductItem[] = [];
    const stored = localStorage.getItem('khidmatik_products_catalog');
    if (stored) {
      try { catalogList = JSON.parse(stored); } catch (e) {}
    }

    // Try finding matching product by name
    const updatedProducts = catalogList.map(p => {
      if (p.name === matchedOrder.productName && p.variants) {
        return {
          ...p,
          variants: p.variants.map((v, i) => {
            if (i === 0) { // Default to restocking first variant
              const changeAmount = matchedOrder.items;
              // Log movement
              const newLog: InventoryLog = {
                id: `log-${Date.now()}`,
                productId: p.id,
                variantId: v.id,
                sku: v.sku || 'N/A',
                changeQty: changeAmount,
                type: 'rma_return',
                reason: `Restocked from returned RMA order ${orderId}`,
                operator: 'Store Manager',
                timestamp: new Date().toISOString()
              };
              // Append to logs
              let currentLogs: InventoryLog[] = [];
              const storedLogs = localStorage.getItem('khidmatik_inventory_logs');
              if (storedLogs) {
                try { currentLogs = JSON.parse(storedLogs); } catch (e) {}
              }
              localStorage.setItem('khidmatik_inventory_logs', JSON.stringify([newLog, ...currentLogs]));

              return { ...v, stock: v.stock + changeAmount };
            }
            return v;
          })
        };
      }
      return p;
    });

    localStorage.setItem('khidmatik_products_catalog', JSON.stringify(updatedProducts));
    
    try {
      await supabase.from('store_settings').upsert({
        key: 'products_catalog',
        value: updatedProducts,
        updated_at: new Date().toISOString()
      });
    } catch (e) {}

    toast({
      title: "Inventory Refilled",
      description: `Restocked ${matchedOrder.items} item units back to inventory.`
    });
  };

  const handleSimulateProofChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const res = await fetch('/api/store/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Data: reader.result as string,
              filename: file.name,
              mimeType: file.type
            })
          });
          const json = await res.json();
          if (json.success) {
            setReturnProof(json.data.publicUrl);
            toast({ title: "Proof Photo Uploaded", description: "Successfully uploaded photo to Storage." });
          } else {
            toast({ title: "Upload Failed", description: json.error, variant: "destructive" });
          }
        } catch (err) {}
      };
      reader.readAsDataURL(file);
    }
  };

  const getRMAStatusBadge = (status: RMARequest['status']) => {
    switch (status) {
      case 'requested': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400 border-blue-300">Requested</Badge>;
      case 'under_review': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400 border-yellow-300">Under Review</Badge>;
      case 'approved': return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400 border-green-300">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'refunded': return <Badge variant="default" className="bg-emerald-500 text-white">Refunded</Badge>;
      case 'replaced': return <Badge variant="default" className="bg-indigo-500 text-white">Replaced</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <RotateCcw className="h-8 w-8 text-primary animate-spin" style={{ animationDuration: '60s' }} /> RMA Returns & Exchanges (إرجاع واستبدال السلع)
          </h1>
          <p className="text-muted-foreground text-sm">Oversee product return claims, inspect buyer photographic evidence, process refunds, and sync stock registries.</p>
        </div>

        <Dialog open={isSimulateOpen} onOpenChange={setIsSimulateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1 text-xs">
              <Plus className="h-4 w-4" /> Simulate Return Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-white border text-slate-800 text-xs">
            <form onSubmit={handleSimulateSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Simulate Return / Exchange Claim</DialogTitle>
                <DialogDescription>Submit return request details matching a registered order.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-1.5">
                <Label htmlFor="order-sel">Select Order ID *</Label>
                <Select value={selectedOrder} onValueChange={setSelectedOrder} required>
                  <SelectTrigger id="order-sel">
                    <SelectValue placeholder="Choose order..." />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {orders.map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.id} - {o.customerName} ({o.total} DA)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="claim-type">Claim Resolution Type</Label>
                <Select value={returnType} onValueChange={val => setReturnType(val as any)}>
                  <SelectTrigger id="claim-type"><SelectValue /></SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="return">Return & Exchange</SelectItem>
                    <SelectItem value="refund">Refund (Cash back)</SelectItem>
                    <SelectItem value="exchange">Exchange (Replacement)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="claim-reason">Detailed Reason *</Label>
                <Textarea id="claim-reason" required value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder="Explain the defect or reason for return..." rows={3} />
              </div>

              <div className="grid gap-1.5 font-sans">
                <Label>Attach Proof Media (Defective item photo)</Label>
                <input type="file" accept="image/*" onChange={handleSimulateProofChange} className="text-xs" />
                {returnProof && (
                  <img src={returnProof} alt="Proof preview" className="h-16 w-16 mt-1 border rounded object-cover" />
                )}
              </div>

              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">Submit Return Ticket</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow border bg-card">
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-base">RMA Ticket Queue</CardTitle>
          <CardDescription>Track claims from pending review to refund settlement.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rmas.map(rma => (
                <TableRow key={rma.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 text-xs">
                  <TableCell className="font-mono font-bold text-slate-700 dark:text-slate-300">{rma.id}</TableCell>
                  <TableCell className="font-mono">{rma.orderId}</TableCell>
                  <TableCell className="font-semibold">{rma.customerName}</TableCell>
                  <TableCell className="capitalize font-medium">{rma.type}</TableCell>
                  <TableCell className="text-muted-foreground">{rma.date}</TableCell>
                  <TableCell>{getRMAStatusBadge(rma.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setSelectedRMA(rma);
                        setTransitionStatus(rma.status);
                        setIsInspectOpen(true);
                      }}
                      className="h-8 text-xs flex items-center gap-1 ml-auto"
                    >
                      <Eye className="h-3.5 w-3.5" /> Inspect Ticket
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rmas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No active RMA requests registered.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Inspect Dialog */}
      <Dialog open={isInspectOpen} onOpenChange={setIsInspectOpen}>
        <DialogContent className="sm:max-w-lg bg-white border text-slate-800 text-xs">
          {selectedRMA && (
            <form onSubmit={handleTransitionSubmit}>
              <DialogHeader>
                <DialogTitle>Inspect RMA Ticket: {selectedRMA.id}</DialogTitle>
                <DialogDescription>Customer: {selectedRMA.customerName} • Order ID: {selectedRMA.orderId}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 text-slate-800 max-h-[60vh] overflow-y-auto pr-1">
                <div className="space-y-1">
                  <span className="font-bold text-muted-foreground text-[10px] uppercase">RMA Resolution Type</span>
                  <p className="capitalize text-slate-800 font-semibold">{selectedRMA.type}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-muted-foreground text-[10px] uppercase">Customer Stated Reason</span>
                  <p className="text-slate-700 italic border p-2 bg-slate-50 rounded">{selectedRMA.reason}</p>
                </div>

                {selectedRMA.mediaUrls && selectedRMA.mediaUrls.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-bold text-muted-foreground text-[10px] uppercase">Attached Media Proof</span>
                    <div className="flex gap-2 mt-1">
                      {selectedRMA.mediaUrls.map((url, i) => (
                        <div key={i} className="relative h-20 w-20 border rounded overflow-hidden">
                          <img src={url} alt="Return proof attachment" className="object-cover h-full w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-3 space-y-2">
                  <span className="font-bold text-muted-foreground text-[10px] uppercase">Action Workflow Panel</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="next-status">Change Claim Status</Label>
                      <Select value={transitionStatus} onValueChange={val => setTransitionStatus(val as any)}>
                        <SelectTrigger id="next-status" className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent className="text-xs">
                          <SelectItem value="requested">Requested</SelectItem>
                          <SelectItem value="under_review">Under Review</SelectItem>
                          <SelectItem value="approved">Approve Claim</SelectItem>
                          <SelectItem value="rejected">Reject Claim</SelectItem>
                          <SelectItem value="refunded">Mark Refund Settled</SelectItem>
                          <SelectItem value="replaced">Mark Exchange Shipped</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {transitionStatus === 'approved' && (
                      <div className="flex items-center justify-between border p-2.5 rounded bg-green-50/50 mt-4">
                        <Label htmlFor="restock-toggle" className="text-[10px] cursor-pointer">Auto Restock Item</Label>
                        <Switch id="restock-toggle" checked={restockItem} onCheckedChange={setRestockItem} />
                      </div>
                    )}
                  </div>

                  <div className="grid gap-1.5 mt-2">
                    <Label htmlFor="operator-comment">Action Remarks / Log Note</Label>
                    <Textarea 
                      id="operator-comment" 
                      placeholder="Write notes representing details of action taken..." 
                      value={transitionNote} 
                      onChange={e => setTransitionNote(e.target.value)} 
                      rows={2} 
                    />
                  </div>
                </div>

                <div className="border-t pt-3 space-y-1.5">
                  <span className="font-bold text-muted-foreground text-[10px] uppercase">Ticket History Trails</span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pl-2 border-l border-primary/30">
                    {selectedRMA.history.map((h, i) => (
                      <div key={i} className="text-[10px] text-muted-foreground">
                        <span className="font-semibold text-slate-800">[{h.date}]</span> - <span className="capitalize font-bold text-primary">{h.status}</span>: {h.note}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">Update Ticket</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
