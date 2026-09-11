'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Layers, PlusCircle, Edit3, CheckCircle2, Eye, 
  Tag, Sparkles, FolderTree, Power
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminDataService, AdminCategory } from '@/services/adminDataService';
import { AdminDataTable, ColumnDef, FilterOption, BulkAction } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CategoryManagementSection() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New Category Form
  const [newCat, setNewCat] = useState({
    name: '',
    nameAr: '',
    nameFr: '',
    slug: '',
    iconName: 'Layers',
    type: 'store' as AdminCategory['type'],
    displayOrder: 1,
    isActive: true,
    isFeatured: false,
  });

  const loadData = () => {
    setCategories(adminDataService.getCategories());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleActive = (catId: string) => {
    const list = adminDataService.getCategories();
    const target = list.find((c) => c.id === catId);
    if (!target) return;
    target.isActive = !target.isActive;
    adminDataService.saveCategories(list);
    adminDataService.recordAudit('Super Admin', 'UPDATE', 'Category', catId, `Toggled active state to ${target.isActive}`);
    loadData();
    if (selectedCategory && selectedCategory.id === catId) {
      setSelectedCategory({ ...target });
    }
    toast({
      title: 'Category Updated',
      description: `${target.name} is now ${target.isActive ? 'ACTIVE' : 'INACTIVE'}.`,
    });
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name || !newCat.slug) {
      toast({ title: 'Validation Error', description: 'Please provide Category Name and URL Slug.', variant: 'destructive' });
      return;
    }

    const created: AdminCategory = {
      id: `cat_${Date.now()}`,
      name: newCat.name,
      nameAr: newCat.nameAr || newCat.name,
      nameFr: newCat.nameFr || newCat.name,
      slug: newCat.slug.toLowerCase().replace(/\s+/g, '-'),
      iconName: newCat.iconName,
      type: newCat.type,
      itemCount: 0,
      displayOrder: Number(newCat.displayOrder),
      isActive: newCat.isActive,
      isFeatured: newCat.isFeatured,
    };

    const updated = [...categories, created];
    adminDataService.saveCategories(updated);
    adminDataService.recordAudit('Super Admin', 'CREATE', 'Category', created.id, `Created category ${created.name} (${created.type})`);
    setCategories(updated);
    setIsAddOpen(false);
    setNewCat({
      name: '',
      nameAr: '',
      nameFr: '',
      slug: '',
      iconName: 'Layers',
      type: 'store',
      displayOrder: 1,
      isActive: true,
      isFeatured: false,
    });
    toast({
      title: 'Category Created',
      description: `${created.name} added to platform catalog.`,
    });
  };

  const filterOptions: FilterOption[] = [
    {
      key: 'type',
      label: 'Type',
      options: [
        { label: 'Merchant Stores', value: 'store' },
        { label: 'Craftsmen Services', value: 'craftsman' },
        { label: 'Auto Spare Parts', value: 'spare_parts' },
        { label: 'Banquet Halls', value: 'banquet_hall' },
        { label: 'Professional Services', value: 'professional' },
      ],
    },
    {
      key: 'isActive',
      label: 'Status',
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ],
    },
  ];

  const bulkActions: BulkAction<AdminCategory>[] = [
    {
      label: 'Activate Selected',
      icon: CheckCircle2,
      variant: 'default',
      action: (selected) => {
        const list = adminDataService.getCategories();
        const ids = new Set(selected.map((s) => s.id));
        list.forEach((c) => {
          if (ids.has(c.id)) c.isActive = true;
        });
        adminDataService.saveCategories(list);
        loadData();
        toast({ title: 'Batch Activation', description: `${selected.length} categories activated.` });
      },
    },
  ];

  const columns: ColumnDef<AdminCategory>[] = [
    {
      header: 'Category & Trilingual Names',
      accessorKey: 'name',
      cell: (c) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-primary shrink-0" />
            {c.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {c.nameAr} • {c.nameFr}
          </div>
        </div>
      ),
    },
    {
      header: 'Slug & Domain',
      accessorKey: 'slug',
      cell: (c) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-mono text-muted-foreground">/{c.slug}</div>
          <Badge variant="outline" className="text-[10px] uppercase font-semibold">
            {c.type.replace(/_/g, ' ')}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Active Listings',
      accessorKey: 'itemCount',
      cell: (c) => (
        <span className="text-xs font-bold text-foreground">{c.itemCount} items</span>
      ),
    },
    {
      header: 'Display Order',
      accessorKey: 'displayOrder',
      cell: (c) => <span className="text-xs font-mono text-muted-foreground">#{c.displayOrder}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: (c) => (
        <Badge variant={c.isActive ? 'default' : 'outline'} className="text-xs">
          {c.isActive ? 'Active' : 'Hidden'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (c) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => {
              setSelectedCategory(c);
              setIsDetailOpen(true);
            }}
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => handleToggleActive(c.id)}
            title="Toggle Active Status"
          >
            <Power className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const total = categories.length;
  const activeCount = categories.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center tracking-tight">
            <FolderTree className="mr-3 h-8 w-8 text-primary" /> Categories & Taxonomy
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure multi-language category hierarchies for stores, craftsmen services, spare parts, and banquet venues.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="h-10 px-4 rounded-xl font-medium">
          <PlusCircle className="h-4 w-4 mr-2" /> Add New Category
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Platform taxonomy</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Active Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Visible on navigation</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Languages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">EN / AR / FR</div>
            <p className="text-xs text-muted-foreground mt-1">Full trilingual support</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Product & Service Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">1,800+</div>
            <p className="text-xs text-muted-foreground mt-1">Classified items</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <AdminDataTable
        data={categories}
        columns={columns}
        searchPlaceholder="Search categories by name, Arabic, French, slug..."
        searchKeys={['name', 'nameAr', 'nameFr', 'slug', 'type']}
        filterOptions={filterOptions}
        bulkActions={bulkActions}
        exportFileName="khidmatik_categories"
        onRowClick={(c) => {
          setSelectedCategory(c);
          setIsDetailOpen(true);
        }}
        onRefresh={loadData}
      />

      {/* Detail Drawer */}
      {selectedCategory && (
        <AdminDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedCategory.name}
          subtitle={`Slug: /${selectedCategory.slug} • Type: ${selectedCategory.type.toUpperCase()}`}
          statusBadge={{
            label: selectedCategory.isActive ? 'Active' : 'Hidden',
            variant: selectedCategory.isActive ? 'default' : 'outline',
          }}
          metrics={[
            { label: 'Active Items', value: selectedCategory.itemCount, icon: Tag },
            { label: 'Display Order', value: `#${selectedCategory.displayOrder}`, icon: Layers },
            { label: 'Featured', value: selectedCategory.isFeatured ? 'Yes ★' : 'Standard', icon: Sparkles },
            { label: 'Status', value: selectedCategory.isActive ? 'ACTIVE' : 'HIDDEN', icon: CheckCircle2 },
          ]}
          fields={[
            { label: 'English Name', value: selectedCategory.name },
            { label: 'Arabic Name (العربية)', value: selectedCategory.nameAr },
            { label: 'French Name (Français)', value: selectedCategory.nameFr },
            { label: 'URL Slug', value: selectedCategory.slug },
            { label: 'Taxonomy Type', value: selectedCategory.type.replace(/_/g, ' ').toUpperCase() },
            { label: 'Icon Identifier', value: selectedCategory.iconName },
          ]}
          actions={
            <Button
              variant={selectedCategory.isActive ? 'destructive' : 'default'}
              size="sm"
              onClick={() => handleToggleActive(selectedCategory.id)}
            >
              <Power className="h-4 w-4 mr-1.5" />
              {selectedCategory.isActive ? 'Hide Category' : 'Activate Category'}
            </Button>
          }
        />
      )}

      {/* Add Category Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Platform Category</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a new category with trilingual labels and assign it to a marketplace or services branch.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCategory} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">English Name *</Label>
              <Input
                placeholder="e.g. Solar Energy & Inverters"
                value={newCat.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewCat({
                    ...newCat,
                    name: val,
                    slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  });
                }}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Arabic Name (العربية)</Label>
                <Input
                  placeholder="الطاقة الشمسية والمحولات"
                  dir="rtl"
                  value={newCat.nameAr}
                  onChange={(e) => setNewCat({ ...newCat, nameAr: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">French Name (Français)</Label>
                <Input
                  placeholder="Énergie Solaire & Onduleurs"
                  value={newCat.nameFr}
                  onChange={(e) => setNewCat({ ...newCat, nameFr: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">URL Slug *</Label>
                <Input
                  placeholder="solar-energy-inverters"
                  value={newCat.slug}
                  onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Target Domain *</Label>
                <Select
                  value={newCat.type}
                  onValueChange={(val: any) => setNewCat({ ...newCat, type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="store">Merchant Stores</SelectItem>
                    <SelectItem value="craftsman">Craftsmen Services</SelectItem>
                    <SelectItem value="spare_parts">Auto & Spare Parts</SelectItem>
                    <SelectItem value="banquet_hall">Banquet Halls</SelectItem>
                    <SelectItem value="professional">Professional Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Category</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
