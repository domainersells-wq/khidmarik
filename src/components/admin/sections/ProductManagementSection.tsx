'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, ShoppingCart, Tag, Star, Eye, Archive, CheckCircle, 
  AlertTriangle, Store, Layers, DollarSign, PlusCircle, CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminDataService, AdminProduct } from '@/services/adminDataService';
import { AdminDataTable, ColumnDef, FilterOption, BulkAction } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';
import { AdminConfirmModal } from '@/components/admin/shared/AdminConfirmModal';
import { cn } from '@/lib/utils';

export function ProductManagementSection() {
  const { toast } = useToast();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
    variant: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: () => {},
    variant: 'warning',
  });

  const loadData = async () => {
    setProducts(adminDataService.getProducts());
    try {
      const dbProducts = await adminDataService.fetchProductsFromDb();
      if (dbProducts && dbProducts.length > 0) {
        setProducts(dbProducts);
      }
    } catch (e) {
      console.warn('Error loading products from DB:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = (productId: string, newStatus: AdminProduct['status']) => {
    adminDataService.updateProductStatus(productId, newStatus);
    loadData();
    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct({ ...selectedProduct, status: newStatus });
    }
    toast({
      title: 'Product Status Updated',
      description: `Product status changed to ${newStatus}.`,
    });
  };

  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Draft', value: 'draft' },
        { label: 'Out of Stock', value: 'out_of_stock' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      key: 'category',
      label: 'Category',
      options: [
        { label: 'Electronics & Computers', value: 'Electronics & Computers' },
        { label: 'Auto Spare Parts', value: 'Auto Spare Parts' },
        { label: 'Hardware & Tools', value: 'Hardware & Tools' },
        { label: 'Home & Furniture', value: 'Home & Furniture' },
        { label: 'Beauty & Health', value: 'Beauty & Health' },
      ],
    },
  ];

  const bulkActions: BulkAction<AdminProduct>[] = [
    {
      label: 'Publish Active',
      icon: CheckCircle,
      variant: 'default',
      action: (selected) => {
        selected.forEach((p) => adminDataService.updateProductStatus(p.id, 'active'));
        loadData();
        toast({ title: 'Batch Update', description: `${selected.length} products published active.` });
      },
    },
    {
      label: 'Archive Selected',
      icon: Archive,
      variant: 'destructive',
      action: (selected) => {
        setConfirmState({
          isOpen: true,
          title: `Archive ${selected.length} Products`,
          description: `Are you sure you want to archive ${selected.length} products? They will be hidden from the store.`,
          variant: 'danger',
          action: () => {
            selected.forEach((p) => adminDataService.updateProductStatus(p.id, 'archived'));
            loadData();
            setConfirmState((prev) => ({ ...prev, isOpen: false }));
            toast({ title: 'Batch Archived', description: `${selected.length} products archived.` });
          },
        });
      },
    },
  ];

  const columns: ColumnDef<AdminProduct>[] = [
    {
      header: 'Product Details',
      accessorKey: 'name',
      cell: (p) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            {p.name}
            {p.isMadeInAlgeria && (
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                🇩🇿 Made in DZ
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground font-mono">SKU: {p.sku}</div>
        </div>
      ),
    },
    {
      header: 'Storefront',
      accessorKey: 'storeName',
      cell: (p) => (
        <div className="text-xs font-medium text-foreground flex items-center gap-1">
          <Store className="h-3.5 w-3.5 text-muted-foreground" />
          {p.storeName}
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: (p) => (
        <Badge variant="outline" className="bg-muted/40 text-xs font-normal">
          {p.category}
        </Badge>
      ),
    },
    {
      header: 'Price (DA)',
      accessorKey: 'price',
      cell: (p) => (
        <div className="text-xs">
          <span className="font-bold text-foreground">{p.price.toLocaleString()} DA</span>
          {p.compareAtPrice && (
            <span className="line-through text-muted-foreground ml-1.5">
              {p.compareAtPrice.toLocaleString()} DA
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Stock',
      accessorKey: 'stock',
      cell: (p) => (
        <div className="text-xs">
          <span className={cn("font-bold", p.stock <= 5 ? "text-red-500" : "text-foreground")}>
            {p.stock} units
          </span>
          {p.stock <= 5 && <span className="text-[10px] text-red-500 block">Low stock</span>}
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (p) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          active: 'default',
          draft: 'secondary',
          out_of_stock: 'destructive',
          archived: 'outline',
        };
        return (
          <Badge variant={variants[p.status] || 'outline'} className="capitalize text-xs">
            {p.status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      cell: (p) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => {
              setSelectedProduct(p);
              setIsDetailOpen(true);
            }}
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> View
          </Button>
        </div>
      ),
    },
  ];

  const total = products.length;
  const active = products.filter((p) => p.status === 'active').length;
  const madeInDz = products.filter((p) => p.isMadeInAlgeria).length;
  const outOfStock = products.filter((p) => p.stock === 0 || p.status === 'out_of_stock').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center tracking-tight">
          <Package className="mr-3 h-8 w-8 text-primary" /> Products Management
        </h1>
        <p className="text-muted-foreground text-sm">
          Monitor all merchant catalog items, stock availability, pricing, SKU codes, and marketplace visibility.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total SKUs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all merchant stores</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Active Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{active}</div>
            <p className="text-xs text-muted-foreground mt-1">Available for order</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Made in Algérie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{madeInDz}</div>
            <p className="text-xs text-muted-foreground mt-1">Local production badge</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{outOfStock}</div>
            <p className="text-xs text-muted-foreground mt-1">Inventory depleted</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <AdminDataTable
        data={products}
        columns={columns}
        searchPlaceholder="Search product by name, SKU, store name, category..."
        searchKeys={['name', 'sku', 'storeName', 'category', 'description']}
        filterOptions={filterOptions}
        bulkActions={bulkActions}
        exportFileName="khidmatik_products"
        onRowClick={(p) => {
          setSelectedProduct(p);
          setIsDetailOpen(true);
        }}
        onRefresh={loadData}
      />

      {/* Detail Drawer */}
      {selectedProduct && (
        <AdminDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedProduct.name}
          subtitle={`SKU: ${selectedProduct.sku} • Store: ${selectedProduct.storeName}`}
          statusBadge={{
            label: selectedProduct.status.replace('_', ' '),
            variant: selectedProduct.status === 'active' ? 'default' : 'destructive',
          }}
          metrics={[
            { label: 'Price', value: `${selectedProduct.price.toLocaleString()} DA`, icon: DollarSign },
            { label: 'Stock Level', value: `${selectedProduct.stock} units`, icon: Package },
            { label: 'Total Sold', value: selectedProduct.salesCount, icon: ShoppingCart },
            { label: 'Rating', value: `${selectedProduct.rating.toFixed(1)} ★`, icon: Star },
          ]}
          fields={[
            { label: 'Product Name', value: selectedProduct.name },
            { label: 'SKU Code', value: selectedProduct.sku },
            { label: 'Storefront', value: selectedProduct.storeName, icon: Store },
            { label: 'Category', value: selectedProduct.category },
            { label: 'Origin', value: selectedProduct.isMadeInAlgeria ? 'Made in Algeria 🇩🇿' : 'Imported' },
            { label: 'Added Date', value: selectedProduct.createdDate },
            { label: 'Description', value: selectedProduct.description, fullWidth: true },
          ]}
          activityHistory={[
            {
              timestamp: `${selectedProduct.createdDate} 14:00`,
              actor: selectedProduct.storeName,
              action: 'Product Listing Created',
              details: `Initial stock of ${selectedProduct.stock} added at ${selectedProduct.price} DA.`,
            },
          ]}
          actions={
            <div className="flex items-center gap-2">
              {selectedProduct.status === 'active' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleStatusChange(selectedProduct.id, 'archived')}
                >
                  <Archive className="h-4 w-4 mr-1.5" /> Archive Product
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleStatusChange(selectedProduct.id, 'active')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Publish Active
                </Button>
              )}
            </div>
          }
        />
      )}

      {/* Confirmation Modal */}
      <AdminConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.action}
        title={confirmState.title}
        description={confirmState.description}
        variant={confirmState.variant}
      />
    </div>
  );
}
