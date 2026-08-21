'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
  Layers, Search, AlertCircle, Plus, Minus, CheckCircle2, History, 
  AlertTriangle, RefreshCw, Loader2, ArrowRightLeft, Landmark, FileText, Settings2
} from 'lucide-react';

interface Warehouse {
  id: string;
  name: string;
  location: string;
}

interface StockMovement {
  id: string;
  product_name: string;
  sku: string;
  type: string; // 'in' | 'out' | 'transfer' | 'adjustment' | 'return'
  quantity: number;
  description: string;
  created_at: string;
}

export function StockInventorySection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');

  // Core Data States
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Physical Count (Reconciliation) Form fields
  const [reconcileVarId, setReconcileVarId] = useState('');
  const [countedQty, setCountedQty] = useState('');
  const [reconcileReason, setReconcileReason] = useState('Damage Adjustment');

  // Warehouse Transfer Form fields
  const [transferVarId, setTransferVarId] = useState('');
  const [fromWhId, setFromWhId] = useState('');
  const [toWhId, setToWhId] = useState('');
  const [transferQty, setTransferQty] = useState('');

  // Goods Receiving Form fields
  const [receiveVarId, setReceiveVarId] = useState('');
  const [receiveQty, setReceiveQty] = useState('');
  const [receiveSupplier, setReceiveSupplier] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');

  // Load Data
  useEffect(() => {
    async function loadStockData() {
      setIsLoading(true);
      const storeId = user?.storeId || '00000000-0000-0000-0000-000000000001';
      try {
        // 1. Fetch products & variants
        const { data: prods } = await supabase
          .from('products')
          .select(`*, product_variants(*)`)
          .eq('store_id', storeId);
        
        if (prods) setProducts(prods);

        // 2. Fetch warehouses
        const { data: whs } = await supabase
          .from('warehouses')
          .select('*')
          .eq('store_id', storeId);
        
        if (whs && whs.length > 0) {
          setWarehouses(whs);
        } else {
          setWarehouses([
            { id: 'wh1', name: 'Main Depot (Oued Smar)', location: 'Algiers' },
            { id: 'wh2', name: 'Oran Showroom Branch', location: 'Oran' }
          ]);
        }

        // 3. Fetch movements
        const { data: mvts } = await supabase
          .from('stock_movements')
          .select('*')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false });

        if (mvts && mvts.length > 0) {
          setMovements(mvts.map(m => {
            const variantObj = prods?.flatMap(p => p.product_variants || []).find(v => v.id === m.variant_id);
            const prodObj = prods?.find(p => p.id === m.product_id);
            return {
              id: m.id,
              product_name: prodObj?.name || 'Unknown Item',
              sku: variantObj?.sku || 'N/A',
              type: m.type,
              quantity: m.quantity,
              description: m.description,
              created_at: m.created_at
            };
          }));
        } else {
          // Fallback movements seed
          setMovements([
            { id: 'm1', product_name: 'Organic Olive Oil (1L)', sku: 'OL-1L', type: 'in', quantity: 50, description: 'Initial stock load', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'm2', product_name: 'Handcrafted Ceramic Set', sku: 'CR-SET', type: 'transfer', quantity: 5, description: 'Transfer to Oran showroom', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'm3', product_name: 'Traditional Honey Jar', sku: 'HN-JAR', type: 'adjustment', quantity: -2, description: 'Damaged item reconciliation', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
          ]);
        }

      } catch (err) {
        console.warn('Failed querying stock info from Supabase, running locally', err);
        // Set mock data
        setProducts([
          { id: 'p1', name: 'Organic Olive Oil (1L)', product_variants: [{ id: 'var1', price: 1500, stock: 45, sku: 'OL-1L' }] },
          { id: 'p2', name: 'Handcrafted Ceramic Set', product_variants: [{ id: 'var2', price: 12000, stock: 12, sku: 'CR-SET' }] }
        ]);
        setWarehouses([
          { id: 'wh1', name: 'Main Depot (Oued Smar)', location: 'Algiers' },
          { id: 'wh2', name: 'Oran Showroom Branch', location: 'Oran' }
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    loadStockData();
  }, [user]);

  // Save changes wrapper
  const saveLocalMovements = (updatedMvts: StockMovement[]) => {
    setMovements(updatedMvts);
    localStorage.setItem('khidmatik_stock_movements', JSON.stringify(updatedMvts));
  };

  // 1. Physical Count Reconciliation
  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    const countNum = parseInt(countedQty);
    if (!reconcileVarId || isNaN(countNum) || countNum < 0) {
      toast({ title: 'Validation Error', description: 'Please select a variant and input a valid counted stock level.', variant: 'destructive' });
      return;
    }

    // Find product and variant
    let targetProd: any = null;
    let targetVar: any = null;
    for (const p of products) {
      const v = p.product_variants?.find((v: any) => v.id === reconcileVarId);
      if (v) {
        targetProd = p;
        targetVar = v;
        break;
      }
    }

    if (!targetProd || !targetVar) return;

    const stockDiff = countNum - targetVar.stock;
    if (stockDiff === 0) {
      toast({ title: 'No Adjustment Needed', description: 'The counted level matches the system record.' });
      return;
    }

    // Update state product stock
    const updatedProducts = products.map(p => {
      if (p.id === targetProd.id) {
        return {
          ...p,
          product_variants: p.product_variants.map((v: any) => v.id === reconcileVarId ? { ...v, stock: countNum } : v)
        };
      }
      return p;
    });

    const newMvt: StockMovement = {
      id: Math.random().toString(36).substring(7),
      product_name: targetProd.name,
      sku: targetVar.sku || 'N/A',
      type: 'adjustment',
      quantity: stockDiff,
      description: `${reconcileReason} (Diff: ${stockDiff > 0 ? '+' : ''}${stockDiff})`,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('product_variants').update({ stock: countNum }).eq('id', reconcileVarId);
      await supabase.from('stock_movements').insert({
        store_id: user?.storeId || '00000000-0000-0000-0000-000000000001',
        product_id: targetProd.id,
        variant_id: reconcileVarId,
        type: 'adjustment',
        quantity: stockDiff,
        description: newMvt.description
      });
      // Audit log
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action_type: 'UPDATE',
        entity_type: 'products',
        description: `Physical count reconciliation for SKU ${targetVar.sku}: adjusted stock from ${targetVar.stock} to ${countNum}`
      });
    } catch (e) {
      console.warn('Failed database reconciliation sync, running locally', e);
    }

    setProducts(updatedProducts);
    saveLocalMovements([newMvt, ...movements]);
    setCountedQty('');
    setReconcileVarId('');

    toast({ title: 'Stock Reconciled', description: `Successfully adjusted stock levels for ${targetProd.name}.` });
  };

  // 2. Warehouse Stock Transfer
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseInt(transferQty);
    if (!transferVarId || !fromWhId || !toWhId || isNaN(qtyNum) || qtyNum <= 0) {
      toast({ title: 'Validation Error', description: 'Please fill out all fields with valid transfer values.', variant: 'destructive' });
      return;
    }
    if (fromWhId === toWhId) {
      toast({ title: 'Validation Error', description: 'Source and target warehouses cannot be identical.', variant: 'destructive' });
      return;
    }

    let targetProd: any = null;
    let targetVar: any = null;
    for (const p of products) {
      const v = p.product_variants?.find((v: any) => v.id === transferVarId);
      if (v) {
        targetProd = p;
        targetVar = v;
        break;
      }
    }

    if (!targetVar) return;
    if (qtyNum > targetVar.stock) {
      toast({ title: 'Limit Exceeded', description: `Transfer quantity exceeds current warehouse stock (${targetVar.stock}).`, variant: 'destructive' });
      return;
    }

    const sourceWh = warehouses.find(w => w.id === fromWhId)?.name || 'Source';
    const destWh = warehouses.find(w => w.id === toWhId)?.name || 'Destination';

    const newMvt: StockMovement = {
      id: Math.random().toString(36).substring(7),
      product_name: targetProd.name,
      sku: targetVar.sku || 'N/A',
      type: 'transfer',
      quantity: -qtyNum,
      description: `Transfer of ${qtyNum} items from "${sourceWh}" to "${destWh}"`,
      created_at: new Date().toISOString()
    };

    // Deduct stock from main depot
    const updatedProducts = products.map(p => {
      if (p.id === targetProd.id) {
        return {
          ...p,
          product_variants: p.product_variants.map((v: any) => v.id === transferVarId ? { ...v, stock: v.stock - qtyNum } : v)
        };
      }
      return p;
    });

    try {
      await supabase.from('product_variants').update({ stock: targetVar.stock - qtyNum }).eq('id', transferVarId);
      await supabase.from('stock_movements').insert({
        store_id: user?.storeId || '00000000-0000-0000-0000-000000000001',
        product_id: targetProd.id,
        variant_id: transferVarId,
        type: 'transfer',
        quantity: -qtyNum,
        description: newMvt.description
      });
    } catch (e) {
      console.warn('Failed DB transfer logging, running locally', e);
    }

    setProducts(updatedProducts);
    saveLocalMovements([newMvt, ...movements]);
    setTransferQty('');
    setTransferVarId('');

    toast({ title: 'Stock Transferred', description: `Successfully dispatched ${qtyNum} items to ${destWh}.` });
  };

  // 3. Goods Receiving (Supplier Shipments)
  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseInt(receiveQty);
    if (!receiveVarId || isNaN(qtyNum) || qtyNum <= 0) {
      toast({ title: 'Validation Error', description: 'Please select an item and enter a valid quantity received.', variant: 'destructive' });
      return;
    }

    let targetProd: any = null;
    let targetVar: any = null;
    for (const p of products) {
      const v = p.product_variants?.find((v: any) => v.id === receiveVarId);
      if (v) {
        targetProd = p;
        targetVar = v;
        break;
      }
    }

    if (!targetVar) return;

    const newMvt: StockMovement = {
      id: Math.random().toString(36).substring(7),
      product_name: targetProd.name,
      sku: targetVar.sku || 'N/A',
      type: 'in',
      quantity: qtyNum,
      description: `Replenishment shipment received from "${receiveSupplier || 'Wholesale Supplier'}". Notes: ${receiveNotes || 'None'}`,
      created_at: new Date().toISOString()
    };

    const updatedProducts = products.map(p => {
      if (p.id === targetProd.id) {
        return {
          ...p,
          product_variants: p.product_variants.map((v: any) => v.id === receiveVarId ? { ...v, stock: v.stock + qtyNum } : v)
        };
      }
      return p;
    });

    try {
      await supabase.from('product_variants').update({ stock: targetVar.stock + qtyNum }).eq('id', receiveVarId);
      await supabase.from('stock_movements').insert({
        store_id: user?.storeId || '00000000-0000-0000-0000-000000000001',
        product_id: targetProd.id,
        variant_id: receiveVarId,
        type: 'in',
        quantity: qtyNum,
        description: newMvt.description
      });
    } catch (e) {
      console.warn('Failed database goods receipt sync, running locally', e);
    }

    setProducts(updatedProducts);
    saveLocalMovements([newMvt, ...movements]);
    setReceiveQty('');
    setReceiveSupplier('');
    setReceiveNotes('');
    setReceiveVarId('');

    toast({ title: 'Goods Received', description: `Added ${qtyNum} units to the inventory of ${targetProd.name}.` });
  };

  const getInventoryRows = () => {
    const rows: any[] = [];
    products.forEach(p => {
      p.product_variants?.forEach((v: any) => {
        const attrLabel = v.attributes?.map((a: any) => `${a.name}: ${a.value}`).join(' / ');
        rows.push({
          id: v.id,
          name: attrLabel ? `${p.name} (${attrLabel})` : p.name,
          sku: v.sku || 'N/A',
          stock: v.stock || 0,
          price: v.price,
          status: v.stock === 0 ? 'out_of_stock' : v.stock <= 5 ? 'low_stock' : 'available'
        });
      });
    });
    return rows.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.sku.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const activeRows = getInventoryRows();
  const lowStockRows = activeRows.filter(r => r.stock <= 5);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col justify-center items-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /> Loading warehouses and inventory ledgers...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center text-slate-800 dark:text-slate-100">
            <Layers className="mr-3 h-8 w-8 text-primary" /> Stock & Warehouse Inventory (الجرد والمخازن)
          </h1>
          <p className="text-muted-foreground">Track stock flows, execute physical count audits, and dispatch stock transfers between warehouses.</p>
        </div>
      </header>

      {/* Warning Alert Banner */}
      {lowStockRows.length > 0 && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/40 shadow-sm">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-amber-800 text-sm">Low Stock Items Detected / تنبيه نقص المخزون</h5>
              <p className="text-xs text-amber-700 mt-0.5">There are {lowStockRows.length} items that have fallen below the threshold limit. Please record a goods receipt from suppliers.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full bg-muted">
          <TabsTrigger value="list" className="text-xs">Inventory List</TabsTrigger>
          <TabsTrigger value="reconcile" className="text-xs">Physical Reconciliation</TabsTrigger>
          <TabsTrigger value="transfer" className="text-xs">Warehouse Transfer</TabsTrigger>
          <TabsTrigger value="receive" className="text-xs">Receive Goods</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">Movements Log</TabsTrigger>
        </TabsList>

        {/* Tab 1: Inventory List */}
        <TabsContent value="list" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Warehouse Levels List</CardTitle>
                <CardDescription>Consolidated stock ledger overview across all store branches.</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by SKU or name..."
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
                      <TableHead>Product Variant</TableHead>
                      <TableHead>SKU Reference</TableHead>
                      <TableHead className="text-right">Unit Value</TableHead>
                      <TableHead className="text-center">Stock Level</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-xs">No items in the warehouse catalog.</TableCell>
                      </TableRow>
                    ) : (
                      activeRows.map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="font-semibold text-slate-800 dark:text-slate-200">{r.name}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">{r.sku}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{r.price.toLocaleString()} DA</TableCell>
                          <TableCell className="text-center font-mono font-bold text-slate-800 dark:text-slate-100">{r.stock}</TableCell>
                          <TableCell>
                            {r.stock === 0 ? (
                              <Badge variant="destructive">Out of Stock</Badge>
                            ) : r.stock <= 5 ? (
                              <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">Low Stock</Badge>
                            ) : (
                              <Badge variant="secondary">In Stock</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Physical Count Reconciliation */}
        <TabsContent value="reconcile">
          <Card className="shadow-sm max-w-xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Physical Stock Count (عملية الجرد)</CardTitle>
              <CardDescription>Adjust current stock levels based on manual inventory counts. Diff is automatically audited.</CardDescription>
            </CardHeader>
            <form onSubmit={handleReconcile}>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1">
                  <Label>Select Product Variant</Label>
                  <Select value={reconcileVarId} onValueChange={setReconcileVarId}>
                    <SelectTrigger><SelectValue placeholder="Choose item to adjust" /></SelectTrigger>
                    <SelectContent className="bg-white border text-xs">
                      {activeRows.map(r => <SelectItem key={r.id} value={r.id}>{r.name} (SKU: {r.sku} • Current: {r.stock})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Actual Counted Stock</Label>
                    <Input type="number" value={countedQty} onChange={e => setCountedQty(e.target.value)} placeholder="e.g. 40" required />
                  </div>
                  <div className="space-y-1">
                    <Label>Adjustment Reason</Label>
                    <Select value={reconcileReason} onValueChange={setReconcileReason}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white border text-xs">
                        <SelectItem value="Damage Adjustment">Item Damaged / Scrapped</SelectItem>
                        <SelectItem value="Lost Item Reconciliation">Lost or Misplaced Item</SelectItem>
                        <SelectItem value="Input Error Correction">Previous Logging Error</SelectItem>
                        <SelectItem value="Stock Audit Update">Annual Stocktaking Audit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button type="submit" className="w-full">Log Reconciliation Count</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Tab 3: Warehouse Transfer */}
        <TabsContent value="transfer">
          <Card className="shadow-sm max-w-xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><ArrowRightLeft className="h-5 w-5 text-primary" /> Warehouse Stock Transfer</CardTitle>
              <CardDescription>Move stock volumes between your main depot and regional branches/showrooms.</CardDescription>
            </CardHeader>
            <form onSubmit={handleTransfer}>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1">
                  <Label>Product to Shift</Label>
                  <Select value={transferVarId} onValueChange={setTransferVarId}>
                    <SelectTrigger><SelectValue placeholder="Choose item to transfer" /></SelectTrigger>
                    <SelectContent className="bg-white border text-xs">
                      {activeRows.map(r => <SelectItem key={r.id} value={r.id}>{r.name} (Available: {r.stock})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Source Warehouse</Label>
                    <Select value={fromWhId} onValueChange={setFromWhId}>
                      <SelectTrigger><SelectValue placeholder="Select Source" /></SelectTrigger>
                      <SelectContent className="bg-white border text-xs">
                        {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Target Warehouse / Branch</Label>
                    <Select value={toWhId} onValueChange={setToWhId}>
                      <SelectTrigger><SelectValue placeholder="Select Target" /></SelectTrigger>
                      <SelectContent className="bg-white border text-xs">
                        {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Transfer Quantity</Label>
                  <Input type="number" value={transferQty} onChange={e => setTransferQty(e.target.value)} placeholder="e.g. 5" required />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button type="submit" className="w-full">Dispatch Stock Transfer</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Tab 4: Goods Receiving */}
        <TabsContent value="receive">
          <Card className="shadow-sm max-w-xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Goods Receiving (استلام البضائع)</CardTitle>
              <CardDescription>Log new merchandise or supplies shipments received from raw materials vendors.</CardDescription>
            </CardHeader>
            <form onSubmit={handleReceiveGoods}>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Item Received</Label>
                    <Select value={receiveVarId} onValueChange={setReceiveVarId}>
                      <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                      <SelectContent className="bg-white border text-xs">
                        {activeRows.map(r => <SelectItem key={r.id} value={r.id}>{r.name} (SKU: {r.sku})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Supplier</Label>
                    <Input value={receiveSupplier} onChange={e => setReceiveSupplier(e.target.value)} placeholder="e.g. Blida Materials" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Quantity Received</Label>
                    <Input type="number" value={receiveQty} onChange={e => setReceiveQty(e.target.value)} placeholder="e.g. 100" required />
                  </div>
                  <div className="space-y-1">
                    <Label>Shipment/Lot Notes</Label>
                    <Input value={receiveNotes} onChange={e => setReceiveNotes(e.target.value)} placeholder="e.g. Batch #492 - safe arrival" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button type="submit" className="w-full">Log Goods Receipt</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Tab 5: Movements Log */}
        <TabsContent value="history">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><History className="h-5 w-5 text-muted-foreground" /> Full Stock Movements Log</CardTitle>
              <CardDescription>Complete audit trail of all warehouse items operations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto max-h-[350px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variant Item</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Flow Type</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead>Operation Details</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-semibold text-xs">{m.product_name}</TableCell>
                        <TableCell className="font-mono text-xs">{m.sku}</TableCell>
                        <TableCell>
                          <Badge variant={m.type === 'in' ? 'secondary' : m.type === 'transfer' ? 'outline' : 'destructive'} className="text-[10px] uppercase">
                            {m.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono font-semibold text-xs">
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground leading-relaxed">{m.description}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground font-mono">{new Date(m.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
