
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store, Users, CalendarDays, Search, Filter, Settings, Eye, ToggleLeft, ToggleRight, Star, ShieldAlert, MoreVertical, Package, ShieldCheck as VerifiedBadgeIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { PlatformStore, StoreSubscriptionPlan } from '@/types';
import { storeService } from '@/services/storeService';
import { formatDistanceToNow } from 'date-fns';

export function StoreManagementSection() {
  const { toast } = useToast();
  const [stores, setStores] = useState<PlatformStore[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending_payment' | 'expired'>('all');
  const [filterFeatured, setFilterFeatured] = useState<'all' | 'yes' | 'no'>('all');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const data = await storeService.getStores({ type: 'store' });
        const mapped = data.map((s: any) => ({
          id: s.id,
          storeName: s.name,
          ownerName: s.contact?.email ? s.contact.email.split('@')[0] : 'Merchant',
          ownerEmail: s.contact?.email || '',
          ownerId: s.id,
          category: s.category,
          isActive: true,
          isFeatured: s.popularity > 80,
          subscriptionPlan: s.subscriptionPlan || 'basic',
          subscriptionStatus: 'active' as const,
          creationDate: new Date().toISOString(),
          applicationDate: new Date().toISOString(),
          totalSales: 24,
          totalProducts: s.products?.length || 0
        }));
        setStores(mapped);
      } catch (err) {
        console.error('Failed to load stores:', err);
      }
    };
    fetchStores();
  }, []);

  const handleToggleActive = (storeId: string, currentIsActive: boolean) => {
    setStores(prev => prev.map(store => store.id === storeId ? { ...store, isActive: !currentIsActive } : store));
    toast({ title: "Store Status Updated (Conceptual)", description: `Store ID ${storeId} active status toggled. This would update Firestore.` });
  };

  const handleToggleFeatured = (storeId: string, currentIsFeatured: boolean) => {
     setStores(prev => prev.map(store => store.id === storeId ? { ...store, isFeatured: !currentIsFeatured } : store));
    toast({ title: "Store Feature Status Updated (Conceptual)", description: `Store ID ${storeId} featured status toggled. This would update Firestore.` });
  };
  
  const handleAssignBadge = (storeId: string, badgeType: 'Verified' | 'Featured') => {
    if (badgeType === 'Featured') {
        const store = stores.find(s => s.id === storeId);
        if (store) handleToggleFeatured(storeId, store.isFeatured);
    } else {
        toast({ title: `${badgeType} Badge Assigned (Conceptual)`, description: `Store ID ${storeId} assigned ${badgeType} badge. This would update Firestore.`});
    }
  };
  
  const handleViewProducts = (storeId: string, storeName: string) => {
    toast({ title: `View Products for ${storeName} (Conceptual)`, description: `Navigating to product list for store ID ${storeId}.`});
  };


  const filteredStores = stores.filter(store => {
    const matchesSearch = store.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          store.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' && store.isActive) || (filterStatus === 'inactive' && !store.isActive) || store.subscriptionStatus === filterStatus;
    const matchesFeatured = filterFeatured === 'all' || (filterFeatured === 'yes' && store.isFeatured) || (filterFeatured === 'no' && !store.isFeatured);
    return matchesSearch && matchesStatus && matchesFeatured;
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <Store className="mr-3 h-8 w-8 text-primary" /> Store Management
        </h1>
        <p className="text-muted-foreground">Oversee all merchant stores, manage subscriptions, and control store status.</p>
      </header>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stores.length}</div>
            <p className="text-xs text-muted-foreground">+X from last month (conceptual)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stores.filter(s => s.subscriptionStatus === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Pro: Y, Basic: Z (conceptual)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
             <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stores.filter(s => s.subscriptionStatus === 'pending_payment' && !s.isActive).length}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification/payment</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Featured Stores</CardTitle>
             <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stores.filter(s => s.isFeatured).length}</div>
          </CardContent>
        </Card>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>All Platform Stores</CardTitle>
          <CardDescription>View, manage, and moderate all registered stores. Table includes avg rating, activity status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by store or owner name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full"
                />
            </div>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending_payment">Pending Payment</SelectItem>
                    <SelectItem value="expired">Subscription Expired</SelectItem>
                </SelectContent>
            </Select>
            <Select value={filterFeatured} onValueChange={(value) => setFilterFeatured(value as any)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <Star className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filter by Featured" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Featured</SelectItem>
                    <SelectItem value="no">Not Featured</SelectItem>
                </SelectContent>
            </Select>
          </div>

          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Store Name</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Owner</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">City</th>
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Orders</th>
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Rating</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Featured</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filteredStores.map((store) => (
                  <tr key={store.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 font-medium">{store.storeName}</td>
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">{store.ownerName}</td>
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">{store.location?.city || 'N/A'}</td>
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-center">{store.totalSales ? (store.totalSales / (store.averageRating || 5000)).toFixed(0) : 0}</td>
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-center">{store.averageRating ? store.averageRating.toFixed(1) : 'N/A'}</td>
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                      <Badge variant={store.isActive ? 'default' : 'destructive'} className={store.isActive ? 'bg-green-500' : ''}>
                        {store.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {store.subscriptionStatus !== 'active' && (
                        <Badge variant="outline" className="ml-1 text-xs border-yellow-500 text-yellow-600 capitalize">{store.subscriptionStatus.replace('_', ' ')}</Badge>
                      )}
                    </td>
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                      <Badge variant={store.isFeatured ? 'default' : 'outline'} className={store.isFeatured ? 'bg-accent text-accent-foreground' : ''}>
                        {store.isFeatured ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast({title: "View Store Details (Conceptual)"})}> <Eye className="mr-2 h-4 w-4"/>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewProducts(store.id, store.storeName)}> <Package className="mr-2 h-4 w-4"/>View Products</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleActive(store.id, store.isActive)}>
                            {store.isActive ? <ToggleLeft className="mr-2 h-4 w-4"/> : <ToggleRight className="mr-2 h-4 w-4"/>}
                            {store.isActive ? 'Deactivate' : 'Activate'} Store
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAssignBadge(store.id, 'Featured')}>
                            <Star className="mr-2 h-4 w-4"/>
                            {store.isFeatured ? 'Unfeature' : 'Feature'} Store
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAssignBadge(store.id, 'Verified')}>
                             <VerifiedBadgeIcon className="mr-2 h-4 w-4"/> Assign "Verified" Badge
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toast({title: `Manually Approving ${store.storeName} (Conceptual)`})}>Approve Store/Services</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
           {filteredStores.length === 0 && <p className="text-center py-4 text-muted-foreground">No stores match your filters.</p>}
        </CardContent>
         <CardFooter className="pt-4">
            <p className="text-xs text-muted-foreground">
                Store management includes controlling subscription levels, visibility (active/inactive), and promotional featuring.
                These actions would typically update the 'stores' collection in Firestore.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
