'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Briefcase, PlusCircle, Edit3, Trash2, ImageUp, Video, FileText as FileTextIcon, PackagePlus, CalendarDays, DollarSign, Search, ListFilter, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { storeService } from '@/services/storeService';
import { supabase } from '@/lib/supabase';

// Mock Data (Initial state if local storage is empty)
const mockServices = [
  { id: 'svc1', name: 'Emergency Plumbing Repair', category: 'Manual Labor', price: '10,000 DA (starting)', priceValue: 10000, priceUnit: 'starting', status: 'Active', deliveryTime: '1-3 hours', description: 'Professional emergency plumbing services for leakage repair, pipes installation, and blockage clearing. Available 24/7 in Algiers.' },
  { id: 'svc2', name: 'Custom Logo Design Package', category: 'Digital Service', price: '35,000 DA', priceValue: 35000, priceUnit: '', status: 'Active', deliveryTime: '5 business days', description: 'Get a professional, modern, and customized brand identity and logo package for your business. Includes vector source files and unlimited revisions.' },
  { id: 'svc3', name: 'Business Strategy Consultation', category: 'Consulting', price: '50,000 DA (per session)', priceValue: 50000, priceUnit: 'per session', status: 'Draft', deliveryTime: '2 hours session', description: '1-on-1 intensive business consulting session to identify operational bottlenecks and scale your startup in Algeria.' },
];

const serviceCategories = ['Digital Service', 'Manual Labor', 'Consulting', 'Training', 'Artistic Creation'];

export function ProviderServiceManagementSection() {
  const { toast } = useToast();
  const { translate } = useLanguage();

  const [services, setServices] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Form State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formPriceUnit, setFormPriceUnit] = useState('');
  const [formDeliveryTime, setFormDeliveryTime] = useState('');
  const [formStatus, setFormStatus] = useState('Active');

  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Load from Supabase on mount/auth sync
  const loadServices = async () => {
    setIsLoading(true);
    if (!user || !user.storeId) {
      const saved = localStorage.getItem('khidmatik_services');
      if (saved) {
        try {
          setServices(JSON.parse(saved));
        } catch {
          setServices(mockServices);
        }
      } else {
        setServices(mockServices);
        localStorage.setItem('khidmatik_services', JSON.stringify(mockServices));
      }
      setIsLoading(false);
      return;
    }

    try {
      const data = await storeService.getStoreProducts(user.storeId);
      const mapped = data.map((prod: any) => {
        const val = prod.variants?.[0]?.price || 0;
        return {
          id: prod.id,
          name: prod.name,
          description: prod.description || '',
          category: prod.category || 'Digital Service',
          priceValue: val,
          price: `${val.toLocaleString()} DA`,
          priceUnit: '',
          deliveryTime: 'Flexible',
          status: 'Active',
          mediaCount: 0,
          bundles: 0
        };
      });
      setServices(mapped);
    } catch (e) {
      console.error('Failed loading services from Supabase:', e);
      const saved = localStorage.getItem('khidmatik_services');
      if (saved) {
        try { setServices(JSON.parse(saved)); } catch { setServices(mockServices); }
      } else {
        setServices(mockServices);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadServices();
    }
  }, [user, authLoading]);

  const openForm = (service: any | null = null) => {
    setEditingService(service);
    if (service) {
      setFormName(service.name);
      setFormDescription(service.description || '');
      setFormCategory(service.category);
      setFormPrice(service.priceValue?.toString() || service.price?.match(/\d+/)?.[0] || '');
      setFormPriceUnit(service.priceUnit || '');
      setFormDeliveryTime(service.deliveryTime || '');
      setFormStatus(service.status || 'Active');
    } else {
      setFormName('');
      setFormDescription('');
      setFormCategory(serviceCategories[0]);
      setFormPrice('');
      setFormPriceUnit('');
      setFormDeliveryTime('');
      setFormStatus('Active');
    }
    setIsFormOpen(true);
  };

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formCategory || !formPrice) {
      toast({
        title: translate('validationError', 'Validation Error'),
        description: translate('fillRequiredFields', 'Please fill all required fields.'),
        variant: 'destructive',
      });
      return;
    }

    const numericPrice = parseFloat(formPrice);
    if (isNaN(numericPrice) || numericPrice < 0) {
      toast({
        title: translate('validationError', 'Validation Error'),
        description: translate('invalidPrice', 'Please enter a valid price.'),
        variant: 'destructive',
      });
      return;
    }

    // Local / Demo Mode Fallback
    if (!user || !user.storeId) {
      const newService = {
        id: editingService?.id || 'svc_' + Date.now(),
        name: formName.trim(),
        description: formDescription.trim(),
        category: formCategory,
        priceValue: numericPrice,
        price: `${numericPrice.toLocaleString()} DA`,
        priceUnit: formPriceUnit,
        deliveryTime: formDeliveryTime || 'Flexible',
        status: formStatus,
        mediaCount: 0,
        bundles: 0
      };

      let updatedServices;
      if (editingService) {
        updatedServices = services.map(s => s.id === editingService.id ? newService : s);
      } else {
        updatedServices = [newService, ...services];
      }

      setServices(updatedServices);
      localStorage.setItem('khidmatik_services', JSON.stringify(updatedServices));
      setIsFormOpen(false);
      toast({
        title: editingService ? translate('toastServiceUpdated', 'Service Updated (Local)') : translate('toastServiceCreated', 'Service Created (Local)'),
        description: translate('toastServiceSavedDesc', 'Service details saved successfully.'),
      });
      return;
    }

    // Resolve category ID from the database categories to prevent foreign key violation
    let categoryId = 'cat99'; // Default fallback 'Other'
    try {
      const dbCategories = await storeService.getCategories();
      let found = dbCategories.find(
        (c: any) => c.name.toLowerCase() === formCategory.toLowerCase() || c.id === formCategory
      );
      if (!found) {
        // Try partial match
        found = dbCategories.find((c: any) =>
          c.name.toLowerCase().includes(formCategory.toLowerCase()) ||
          formCategory.toLowerCase().includes(c.name.toLowerCase())
        );
      }
      if (!found && user?.storeId) {
        const storeData = await storeService.getStoreById(user.storeId);
        if (storeData && storeData.category) {
          found = dbCategories.find((c: any) => c.name.toLowerCase() === storeData.category.toLowerCase());
        }
      }
      if (found) {
        categoryId = found.id;
      }
    } catch (err) {
      console.error('Error resolving category ID:', err);
    }

    const productPayload = {
      name: formName.trim(),
      slug: formName.toLowerCase().replace(/\s+/g, '-'),
      description: formDescription.trim(),
      category: categoryId,
      baseImageUrl: 'https://placehold.co/100x100.png?text=Service'
    };

    try {
      let productId = editingService?.id;

      if (editingService) {
        await storeService.updateProduct(editingService.id, productPayload);
        await supabase.from('product_variants').delete().eq('product_id', editingService.id);
      } else {
        const newProd = await storeService.createProduct(user.storeId, productPayload);
        productId = newProd.id;
      }

      if (productId) {
        await storeService.createProductVariant(productId, {
          attributes: [],
          price: numericPrice,
          discountPrice: undefined,
          stock: 9999,
          image: '',
          sku: 'SRV-' + Date.now().toString().slice(-4),
          status: 'available'
        });
      }

      setIsFormOpen(false);
      toast({
        title: editingService ? translate('toastServiceUpdated', 'Service Updated') : translate('toastServiceCreated', 'Service Created'),
        description: translate('toastServiceSavedDesc', 'Service details saved successfully.'),
      });
      await loadServices();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error Saving Service",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!user || !user.storeId) {
      const updated = services.filter(s => s.id !== serviceId);
      setServices(updated);
      localStorage.setItem('khidmatik_services', JSON.stringify(updated));
      toast({
        title: translate('toastServiceDeleted', 'Service Deleted (Local)'),
        description: translate('toastServiceDeletedDesc', 'The service has been removed.'),
      });
      return;
    }

    try {
      await storeService.deleteProduct(serviceId);
      toast({
        title: translate('toastServiceDeleted', 'Service Deleted'),
        description: translate('toastServiceDeletedDesc', 'The service has been removed.'),
      });
      await loadServices();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error Deleting Service",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  // Filter logic
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || service.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <Briefcase className="mr-3 h-8 w-8 text-primary" /> {translate('myServices', 'My Services')}
          </h1>
          <p className="text-muted-foreground">{translate('manageServicesDesc', 'Add, edit, and manage the services you offer to clients.')}</p>
        </div>
        <Button onClick={() => openForm(null)}>
          <PlusCircle className="mr-2 h-4 w-4" /> {translate('addNewServiceBtn', 'Add New Service')}
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{translate('serviceListingsTitle', 'Your Service Listings')}</CardTitle>
          <CardDescription>{translate('serviceListingsDesc', 'Overview of your currently offered services.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={translate('searchServicesPlaceholder', 'Search services...')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-9 h-10"
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[150px] h-10">
                  <SelectValue placeholder={translate('tableCategoryHeader', 'Category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translate('filterAll', 'All')}</SelectItem>
                  {serviceCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[120px] h-10">
                  <SelectValue placeholder={translate('tableStatusHeader', 'Status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translate('filterAll', 'All')}</SelectItem>
                  <SelectItem value="Active">{translate('filterActive', 'Active')}</SelectItem>
                  <SelectItem value="Draft">{translate('filterDraft', 'Draft')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate('tableNameHeader', 'Service Name')}</TableHead>
                  <TableHead>{translate('tableCategoryHeader', 'Category')}</TableHead>
                  <TableHead>{translate('tablePriceHeader', 'Base Price')}</TableHead>
                  <TableHead>{translate('tableStatusHeader', 'Status')}</TableHead>
                  <TableHead className="text-right">{translate('tableActionsHeader', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        <span className="text-muted-foreground font-medium">Loading services...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {filteredServices.map(service => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{service.name}</TableCell>
                        <TableCell>{service.category}</TableCell>
                        <TableCell>{service.price}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={service.status === 'Active' ? 'default' : 'secondary'} 
                            className={service.status === 'Active' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
                          >
                            {service.status === 'Active' ? translate('filterActive', 'Active') : translate('filterDraft', 'Draft')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openForm(service)}>
                            <Edit3 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service.id)} className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredServices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          {translate('noServicesAdded', "You haven't added any services yet.")}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingService ? translate('editServiceTitle', 'Edit Service') : translate('addNewServiceTitle', 'Add New Service')}</DialogTitle>
            <DialogDescription>{translate('serviceDetailsDesc', 'Provide detailed information about the service you offer.')}</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitService} className="space-y-4 overflow-y-auto p-1 flex-grow pr-2">
            <div>
              <Label htmlFor="serviceNameForm">{translate('formServiceNameLabel', 'Service Name / Title *')}</Label>
              <Input 
                id="serviceNameForm" 
                value={formName} 
                onChange={(e) => setFormName(e.target.value)} 
                placeholder="e.g., Advanced Plumbing Solutions, Custom Web Design" 
              />
            </div>
            
            <div>
              <Label htmlFor="serviceDescriptionForm">{translate('formServiceDescriptionLabel', 'Detailed Description *')}</Label>
              <Textarea 
                id="serviceDescriptionForm" 
                value={formDescription} 
                onChange={(e) => setFormDescription(e.target.value)} 
                placeholder="Describe what the service includes, benefits, process, etc." 
                rows={4} 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="serviceCategoryForm">{translate('formServiceCategoryLabel', 'Service Category *')}</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger id="serviceCategoryForm">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="serviceStatusForm">{translate('tableStatusHeader', 'Status')}</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger id="serviceStatusForm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">{translate('filterActive', 'Active')}</SelectItem>
                    <SelectItem value="Draft">{translate('filterDraft', 'Draft')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Card className="p-4 bg-muted/20 border-border">
              <h4 className="font-semibold text-sm mb-3 flex items-center text-primary">
                <DollarSign className="mr-1.5 h-4 w-4" /> {translate('pricingOptionsTitle', 'Pricing Options *')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="basePriceForm">{translate('formBasePriceLabel', 'Base Price (DA)')}</Label>
                  <Input 
                    id="basePriceForm" 
                    type="number" 
                    placeholder="e.g., 10000" 
                    value={formPrice} 
                    onChange={(e) => setFormPrice(e.target.value)} 
                  />
                </div>
                <div>
                  <Label htmlFor="priceUnitForm">{translate('formPriceUnitLabel', 'Price Unit (Optional)')}</Label>
                  <Input 
                    id="priceUnitForm" 
                    placeholder="e.g., per hour, per project, per session" 
                    value={formPriceUnit} 
                    onChange={(e) => setFormPriceUnit(e.target.value)} 
                  />
                </div>
              </div>
              <Button 
                type="button" 
                variant="link" 
                size="sm" 
                className="p-0 h-auto mt-2" 
                onClick={() => toast({title: translate('pricingOptionsTitle', 'Pricing Options') + " (Conceptual)", description: "Advanced options for tiered pricing, add-ons, etc."})} 
              >
                {translate('addCustomPricingBtn', '+ Add Customizable Pricing Options')}
              </Button>
            </Card>

            <Card className="p-4 bg-muted/20 border-border">
              <h4 className="font-semibold text-sm mb-3 flex items-center text-primary">
                <CalendarDays className="mr-1.5 h-4 w-4" /> {translate('deliveryScheduleTitle', 'Delivery & Schedule')}
              </h4>
              <div>
                <Label htmlFor="deliveryTimeForm">{translate('deliveryTimeLabel', 'Estimated Delivery Time / Duration')}</Label>
                <Input 
                  id="deliveryTimeForm" 
                  placeholder="e.g., 3-5 business days, 2 weeks, 1 hour session" 
                  value={formDeliveryTime} 
                  onChange={(e) => setFormDeliveryTime(e.target.value)} 
                />
              </div>
              <Button 
                type="button" 
                variant="link" 
                size="sm" 
                className="p-0 h-auto mt-2" 
                onClick={() => toast({title: translate('deliveryScheduleTitle', 'Delivery Schedule') + " (Conceptual)", description: "Define working hours, buffer times, specific availability."})} 
              >
                {translate('setDeliveryScheduleBtn', '+ Set Delivery Schedule Options')}
              </Button>
            </Card>
            
            <Card className="p-4 bg-muted/20 border-border">
              <h4 className="font-semibold text-sm mb-3 text-primary">{translate('mediaSectionTitle', 'Media (Images, Videos, PDFs)')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button type="button" variant="outline" className="w-full text-xs" onClick={() => toast({title: "Upload Images", description: "Image upload is conceptual."})}><ImageUp className="mr-1.5 h-4 w-4"/> {translate('uploadImagesBtn', 'Upload Images')}</Button>
                <Button type="button" variant="outline" className="w-full text-xs" onClick={() => toast({title: "Add Video", description: "Video link addition is conceptual."})}><Video className="mr-1.5 h-4 w-4"/> {translate('addVideoLinkBtn', 'Add Video Link')}</Button>
                <Button type="button" variant="outline" className="w-full text-xs" onClick={() => toast({title: "Upload PDF", description: "PDF upload is conceptual."})}><FileTextIcon className="mr-1.5 h-4 w-4"/> {translate('uploadPdfBtn', 'Upload PDF')}</Button>
              </div>
            </Card>
            
            <Card className="p-4 bg-muted/20 border-border">
              <h4 className="font-semibold text-sm mb-2 flex items-center text-primary">
                <PackagePlus className="mr-1.5 h-4 w-4" /> {translate('serviceBundlesTitle', 'Service Bundles / Packages')}
              </h4>
              <p className="text-xs text-muted-foreground mb-3">{translate('serviceBundlesDesc', 'Offer combined services at a special price.')}</p>
              <Button type="button" variant="outline" className="w-full text-xs" onClick={() => toast({title: translate('serviceBundlesTitle', 'Service Bundles'), description: "Service bundling is conceptual."})}><PlusCircle className="mr-1.5 h-4 w-4"/> {translate('createBundleBtn', 'Create Service Bundle')}</Button>
            </Card>
          </form>

          <DialogFooter className="pt-4 border-t mt-2 flex flex-row items-center justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">{translate('cancelBtn', 'Cancel')}</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSubmitService}>{translate('saveServiceBtn', 'Save Service')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
