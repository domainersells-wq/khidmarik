
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, Users, CalendarDays, Search, Filter, Settings, Eye, ToggleLeft, ToggleRight, ShieldAlert, MoreVertical, ListFilter, ListChecks, ShieldCheck as VerifiedBadgeIcon, Star } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { PlatformServiceProvider } from '@/types';
import { storeService } from '@/services/storeService';
import { categories as allCategories } from '@/data/mock'; 
import { formatDistanceToNow } from 'date-fns';

export function ServiceProviderManagementSection() {
  const { toast } = useToast();
  const [serviceProviders, setServiceProviders] = useState<PlatformServiceProvider[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'pending_review' | 'rejected'>('all');

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const pros = await storeService.getStores({ type: 'professional' });
        const free = await storeService.getStores({ type: 'freelancer' });
        const allProviders = [...pros, ...free];

        const mapped = allProviders.map((s: any) => ({
          id: s.id,
          providerName: s.name,
          ownerName: s.contact?.phone || 'Professional',
          contactEmail: s.contact?.email || 'professional@khidmatik.dz',
          serviceCategory: s.category || 'Manual Labor',
          status: 'active' as const,
          creationDate: new Date().toISOString(),
          applicationDate: new Date().toISOString(),
          totalCompletedJobs: 18,
          averageRating: s.averageRating || 5.0,
          pendingServiceApproval: false
        }));
        setServiceProviders(mapped);
      } catch (err) {
        console.error('Failed to load service providers:', err);
      }
    };
    fetchProviders();
  }, []);

  const handleToggleStatus = (providerId: string, currentStatus: PlatformServiceProvider['status']) => {
    const newStatus: PlatformServiceProvider['status'] = currentStatus === 'active' ? 'suspended' : 'active';
    setServiceProviders(prev => prev.map(provider => provider.id === providerId ? { ...provider, status: newStatus } : provider));
    toast({ title: "Provider Status Updated (Conceptual)", description: `Provider ID ${providerId} status changed to ${newStatus}. This would update Firestore.` });
  };
  
  const handleApproveServices = (providerId: string, providerName: string) => {
    toast({ title: `Approve Services for ${providerName} (Conceptual)`, description: `Marking services of provider ID ${providerId} as approved. This would update relevant service documents in Firestore.` });
  };

  const handleAssignBadge = (providerId: string, badgeType: 'Verified' | 'Featured') => {
    toast({ title: `${badgeType} Badge Assigned (Conceptual)`, description: `Service provider ID ${providerId} assigned ${badgeType} badge. This would update Firestore.`});
  };
  
  const handleViewServices = (providerId: string, providerName: string) => {
    toast({ title: `View Services for ${providerName} (Conceptual)`, description: `Navigating to service list for provider ID ${providerId}.`});
  };

  const filteredProviders = serviceProviders.filter(provider => {
    const matchesSearch = provider.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          provider.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || provider.serviceCategory === filterCategory;
    const matchesStatus = filterStatus === 'all' || provider.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  const professionalCategories = allCategories.filter(c => c.type === 'professional' || c.type === 'all');


  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <Briefcase className="mr-3 h-8 w-8 text-primary" /> Service Provider Management
        </h1>
        <p className="text-muted-foreground">Manage service provider accounts, their status, and service offerings.</p>
      </header>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceProviders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceProviders.filter(p => p.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceProviders.filter(p => p.status === 'pending_review').length}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suspended Accounts</CardTitle>
             <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceProviders.filter(p => p.status === 'suspended').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Service Providers</CardTitle>
          <CardDescription>View, manage status, and access details for all registered service professionals. Table includes avg rating and orders (conceptual).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by provider name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full"
                />
            </div>
             <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <ListFilter className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {professionalCategories.map(cat => <SelectItem key={cat.slug} value={cat.name}>{cat.name}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-center font-bold">Orders {/* Conceptual */}</TableHead>
                <TableHead className="text-center">Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.providerName}</TableCell>
                  <TableCell>{provider.serviceCategory}</TableCell>
                  <TableCell>{provider.location?.city || 'N/A'}</TableCell>
                  <TableCell className="text-center">{provider.totalOrders || 0} {/* Conceptual */}</TableCell>
                  <TableCell className="text-center">{provider.averageRating ? `${provider.averageRating.toFixed(1)}/5` : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={provider.status === 'active' ? 'default' : provider.status === 'suspended' ? 'destructive' : 'secondary'}
                           className={`capitalize ${provider.status === 'active' ? 'bg-green-500 text-white' : provider.status === 'pending_review' ? 'bg-yellow-500 text-white' : ''}`}
                    >
                      {provider.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast({title: "View Provider Details (Conceptual)"})}> <Eye className="mr-2 h-4 w-4"/>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewServices(provider.id, provider.providerName)}> <ListChecks className="mr-2 h-4 w-4"/>View Services</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleStatus(provider.id, provider.status)}>
                           {provider.status === 'active' ? <ToggleLeft className="mr-2 h-4 w-4"/> : <ToggleRight className="mr-2 h-4 w-4"/>}
                           {provider.status === 'active' ? 'Suspend' : 'Activate'} Account
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleApproveServices(provider.id, provider.providerName)}> <VerifiedBadgeIcon className="mr-2 h-4 w-4"/>Manually Approve Services</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAssignBadge(provider.id, 'Verified')}> <VerifiedBadgeIcon className="mr-2 h-4 w-4"/>Assign "Verified" Badge</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAssignBadge(provider.id, 'Featured')}> <Star className="mr-2 h-4 w-4"/>Assign "Featured" Badge</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredProviders.length === 0 && <p className="text-center py-4 text-muted-foreground">No service providers match your filters.</p>}
        </CardContent>
         <CardFooter className="pt-4">
            <p className="text-xs text-muted-foreground">
                Provider management includes activating/suspending accounts based on reviews, compliance, or reports.
                Badges can enhance visibility. These actions would update the 'service_providers' collection in Firestore.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
