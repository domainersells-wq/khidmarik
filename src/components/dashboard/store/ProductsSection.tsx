'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Search, Filter, Package, AlertTriangle, Settings2, Tag, ImagePlus, Layers, Download, Upload, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { storeService } from '@/services/storeService';
import type { ProductItem, ProductVariant, ProductVariantOption } from '@/types';

export function ProductsSection() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedProductIds.length === sortedProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(sortedProducts.map(p => p.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete the ${selectedProductIds.length} selected products?`)) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProductIds);

      if (error) throw error;

      toast({
        title: "Bulk Delete Successful",
        description: `Successfully deleted ${selectedProductIds.length} products.`
      });
      setSelectedProductIds([]);
      await loadProducts();
    } catch (err: any) {
      toast({
        title: "Error in Bulk Delete",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkExport = () => {
    if (selectedProductIds.length === 0) return;
    const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedProducts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `khidmatik_products_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast({
      title: "Export Completed",
      description: `Successfully downloaded configuration for ${selectedProductIds.length} products.`
    });
  };
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form Fields State
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productCategory, setProductCategory] = useState('cat11');
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [productExpiry, setProductExpiry] = useState('');
  const [productSku, setProductSku] = useState('');
  const [productImage, setProductImage] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [maxStock, setMaxStock] = useState('100');
  const [trackStock, setTrackStock] = useState(true);
  const [trackSerialNumber, setTrackSerialNumber] = useState(false);
  const [productType, setProductType] = useState<'standard' | 'composite' | 'digital' | 'service'>('standard');
  const [digitalUrl, setDigitalUrl] = useState('');
  const [serviceDuration, setServiceDuration] = useState('30 min');
  const [galleryImages, setGalleryImages] = useState('');
  const [relatedProducts, setRelatedProducts] = useState('');
  const [substituteProducts, setSubstituteProducts] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Variants States
  const [variantOptions, setVariantOptions] = useState<ProductVariantOption[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [tempOptionName, setTempOptionName] = useState('');
  const [tempOptionValues, setTempOptionValues] = useState('');

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('none');

  // Dialog Controls
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkImportJson, setBulkImportJson] = useState('');
  const [isStockAlertOpen, setIsStockAlertOpen] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [enableLowStockNotify, setEnableLowStockNotify] = useState(true);
  
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [bulkDiscountEnabled, setBulkDiscountEnabled] = useState(false);
  const [bulkDiscountQty, setBulkDiscountQty] = useState('3');
  const [bulkDiscountPct, setBulkDiscountPct] = useState('10');

  // Delete Confirm Dialog state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { user } = useAuth();

  const loadProducts = async () => {
    if (!user || !user.storeId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await storeService.getStoreProducts(user.storeId);
      setProducts(data);
      setSelectedProductIds([]);
    } catch (e) {
      console.error('Failed loading products from Supabase:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingProgress(0);
      interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          const increment = prev < 40 ? 15 : prev < 70 ? 8 : prev < 85 ? 4 : 1;
          return prev + increment;
        });
      }, 250);
    } else {
      setLoadingProgress(100);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (user) {
      if (user.storeId) {
        loadProducts();
      } else {
        setIsLoading(false);
      }
    }

    const fetchCategories = async () => {
      try {
        const { data } = await supabase
          .from('categories')
          .select('id, name')
          .or('type.eq.store,type.eq.all');
        if (data) {
          setCategoriesList(data);
          setProductCategory(prev => (prev === 'Crafts' || prev === 'Food') && data.length > 0 ? data[0].id : prev);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    fetchCategories();

    // Load sub-dialog configurations
    const storedAlert = localStorage.getItem('khidmatik_products_stock_alert');
    if (storedAlert) {
      try {
        const parsed = JSON.parse(storedAlert);
        setLowStockThreshold(parsed.threshold || '5');
        setEnableLowStockNotify(parsed.enabled ?? true);
      } catch (e) {}
    }

    const storedPricing = localStorage.getItem('khidmatik_products_pricing_rules');
    if (storedPricing) {
      try {
        const parsed = JSON.parse(storedPricing);
        setBulkDiscountEnabled(parsed.enabled ?? false);
        setBulkDiscountQty(parsed.qty || '3');
        setBulkDiscountPct(parsed.pct || '10');
      } catch (e) {}
    }
  }, [user]);

  // Stub saveCatalog to maintain layout compat
  const saveCatalog = async (updatedList: ProductItem[]) => {
    return true;
  };

  const openFormForNew = () => {
    setEditingProduct(null);
    setProductName('');
    setProductDesc('');
    setProductPrice('');
    setProductStock('');
    setProductCategory(categoriesList.length > 0 ? categoriesList[0].id : 'cat11');
    setProductExpiry('');
    setProductSku('');
    setProductImage('');
    setPurchaseCost('');
    setMinStock('5');
    setMaxStock('100');
    setTrackStock(true);
    setTrackSerialNumber(false);
    setProductType('standard');
    setDigitalUrl('');
    setServiceDuration('30 min');
    setGalleryImages('');
    setRelatedProducts('');
    setSubstituteProducts('');
    setVariantOptions([]);
    setVariants([]);
    setTempOptionName('');
    setTempOptionValues('');
    setIsFormOpen(true);
  };

  const openFormForEdit = (product: ProductItem & any) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductDesc(product.description || '');
    setProductPrice(product.variants?.[0]?.price.toString() || '');
    setProductStock(product.variants?.[0]?.stock.toString() || '');
    setProductCategory(product.category || (categoriesList.length > 0 ? categoriesList[0].id : 'cat11'));
    setProductExpiry(product.expiryDate || '');
    setProductSku(product.variants?.[0]?.sku || '');
    setProductImage(product.baseImageUrl || '');
    setPurchaseCost(product.purchaseCost?.toString() || '');
    setMinStock(product.minStock?.toString() || '5');
    setMaxStock(product.maxStock?.toString() || '100');
    setTrackStock(product.trackStock !== false);
    setTrackSerialNumber(!!product.trackSerialNumber);
    setProductType(product.productType || 'standard');
    setDigitalUrl(product.digitalUrl || '');
    setServiceDuration(product.serviceDuration || '30 min');
    setGalleryImages(product.galleryImages || '');
    setRelatedProducts(product.relatedProducts || '');
    setSubstituteProducts(product.substituteProducts || '');
    setVariantOptions(product.variantOptions || []);
    setVariants(product.variants || []);
    setTempOptionName('');
    setTempOptionValues('');
    setIsFormOpen(true);
  };

  // Image Upload handler
  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Cartesian combination generator
  const generateCartesian = (options: ProductVariantOption[]) => {
    if (options.length === 0) return [];
    let results: Array<Array<{ name: string; value: string }>> = [[]];
    for (const opt of options) {
      const temp: Array<Array<{ name: string; value: string }>> = [];
      for (const res of results) {
        for (const val of opt.values) {
          temp.push([...res, { name: opt.name, value: val }]);
        }
      }
      results = temp;
    }
    return results.map((comb, index) => ({
      id: `v-${Date.now()}-${index}`,
      attributes: comb,
      price: Number(productPrice) || 0,
      stock: Number(productStock) || 0,
      sku: `${productSku || 'SKU'}-${comb.map(c => c.value.substring(0, 3).toUpperCase()).join('-')}-${index}`,
      barcode: '',
      discountPrice: undefined,
      status: 'available' as const
    }));
  };

  const handleAddOptionType = () => {
    if (!tempOptionName || !tempOptionValues) return;
    const values = tempOptionValues.split(',').map(v => v.trim()).filter(v => v.length > 0);
    if (values.length === 0) return;
    const newOption: ProductVariantOption = {
      name: tempOptionName,
      values
    };
    setVariantOptions([...variantOptions, newOption]);
    setTempOptionName('');
    setTempOptionValues('');
  };

  const handleRemoveOptionType = (index: number) => {
    setVariantOptions(variantOptions.filter((_, i) => i !== index));
  };

  const handleGenerateCombinations = () => {
    const generated = generateCartesian(variantOptions);
    setVariants(generated);
  };

  const handleRemoveVariant = (vId: string) => {
    setVariants(variants.filter(v => v.id !== vId));
  };

  const handleUpdateVariantField = (vId: string, field: keyof ProductVariant, val: any) => {
    setVariants(variants.map(v => v.id === vId ? { ...v, [field]: val } : v));
  };

  // Submit Add/Edit form
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("handleFormSubmit triggered:", { productName, storeId: user?.storeId, productCategory });
    
    try {
      if (!productName || !user || !user.storeId) {
        toast({
          title: "Missing Required Fields / حقول مطلوبة ناقصة",
          description: `Please fill out all required fields. Name: ${productName ? "OK" : "Missing"}, Store ID: ${user?.storeId || "Missing"}`,
          variant: "destructive"
        });
        return;
      }

      // Check if productCategory is a valid UUID, otherwise map it from categoriesList names
      let finalCategoryId = productCategory;
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productCategory)) {
        const found = categoriesList.find(c => c.name.toLowerCase() === productCategory.toLowerCase() || c.id === productCategory);
        if (found) {
          finalCategoryId = found.id;
        } else if (categoriesList.length > 0) {
          finalCategoryId = categoriesList[0].id;
        }
      }

      // Build final variants list
      const finalVariants = (variants && variants.length > 0)
        ? variants
        : [{
            id: editingProduct?.variants?.[0]?.id || `v-${Date.now()}`,
            attributes: [],
            price: Number(productPrice) || 0,
            stock: Number(productStock) || 0,
            sku: productSku || editingProduct?.variants?.[0]?.sku || `SKU-${Date.now().toString().slice(-4)}`,
            status: 'available' as const
          }];

      const productPayload = {
        name: productName,
        slug: productName.toLowerCase().replace(/\s+/g, '-'),
        description: productDesc,
        category: finalCategoryId,
        baseImageUrl: productImage || 'https://placehold.co/100x100.png?text=Product',
        expiryDate: productExpiry || null,
        purchaseCost: Number(purchaseCost) || 0,
        minStock: Number(minStock) || 5,
        maxStock: Number(maxStock) || 100,
        trackStock: trackStock !== false,
        trackSerialNumber: trackSerialNumber || false,
        productType: productType || 'standard',
        digitalUrl: digitalUrl || null,
        serviceDuration: serviceDuration || null,
        galleryImages: galleryImages || null,
        relatedProducts: relatedProducts || null,
        substituteProducts: substituteProducts || null,
      };

      let productId = editingProduct?.id;

      if (editingProduct) {
        await storeService.updateProduct(editingProduct.id, productPayload);
        await supabase.from('product_variants').delete().eq('product_id', editingProduct.id);
      } else {
        const newProd = await storeService.createProduct(user.storeId, productPayload);
        productId = newProd.id;
      }

      if (productId) {
        const variantsPayload = finalVariants.map(variant => ({
          attributes: variant.attributes || [],
          price: variant.price,
          discountPrice: variant.discountPrice,
          stock: variant.stock,
          image: variant.image || '',
          sku: variant.sku || '',
          status: variant.status || 'available',
          barcode: (variant as any).barcode || ''
        }));
        await storeService.createProductVariants(productId, variantsPayload);
      }

      setIsFormOpen(false);
      toast({
        title: "Product Catalog Synchronized",
        description: `Product ${productName} saved successfully.`
      });
      await loadProducts();
    } catch (err: any) {
      console.error("Error submitting product:", err);
      toast({
        title: "Error Saving Product / خطأ في حفظ المنتج",
        description: err.message || "An unexpected error occurred while saving.",
        variant: "destructive"
      });
    }
  };

  // Delete action
  const handleDeleteProduct = async (productId: string) => {
    try {
      await storeService.deleteProduct(productId);
      setDeletingId(null);
      toast({
        title: "Product Deleted",
        description: "Listing deleted successfully."
      });
      await loadProducts();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error Deleting Product",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  // Export Catalog
  const handleExportProducts = () => {
    let csvContent = "ID,Name,Category,SKU,Price,Stock,ExpiryDate\n";
    products.forEach(p => {
      p.variants?.forEach(v => {
        const row = [
          p.id,
          `"${p.name.replace(/"/g, '""')}"`,
          p.category || 'Crafts',
          v.sku || '',
          v.price,
          v.stock,
          p.expiryDate || ''
        ].join(',');
        csvContent += row + "\n";
      });
    });

    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `khidmatik_products_catalog_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast({
      title: "Catalog Exported",
      description: `Downloaded product catalog as Excel-compatible CSV.`
    });
  };

  // CSV template downloader
  const handleDownloadTemplate = () => {
    const template = "ID,Name,Category,SKU,Price,Stock,ExpiryDate\nprod-example,\"Premium Deglet Nour Dates\",Food,DGT-NR-01,1200,80,2026-12-31\n";
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(template);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "khidmatik_products_template.csv");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast({ title: "Template Downloaded", description: "Use this template CSV to import products in bulk." });
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) return [];
    
    return lines.slice(1).map(line => {
      // Regex split to handle quotes
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const clean = matches.map(val => val.replace(/^"|"$/g, '').trim());
      
      return {
        id: clean[0] || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: clean[1] || 'Imported Product',
        category: clean[2] || 'Crafts',
        sku: clean[3] || '',
        price: Number(clean[4]) || 1000,
        stock: Number(clean[5]) || 10,
        expiryDate: clean[6] || ''
      };
    });
  };

  // Bulk Import Submit
  const handleBulkImportSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!bulkImportJson) return;
    try {
      let validated: ProductItem[] = [];
      if (bulkImportJson.trim().startsWith('[')) {
        const parsed = JSON.parse(bulkImportJson);
        const toImport = Array.isArray(parsed) ? parsed : [parsed];
        validated = toImport.map((item: any) => ({
          id: item.id || `prod-${Math.random().toString(36).substr(2, 9)}`,
          slug: item.slug || item.name.toLowerCase().replace(/\s+/g, '-'),
          name: item.name || 'Imported product',
          category: item.category || 'Crafts',
          baseImageUrl: item.baseImageUrl || 'https://placehold.co/100x100.png?text=Imported',
          expiryDate: item.expiryDate || '',
          variants: item.variants || [{ id: `v-${Date.now()}`, attributes: [], price: item.price || 1000, stock: item.stock || 10, sku: item.sku || `SKU-${Date.now().toString().slice(-4)}` }]
        }));
      } else {
        const parsedRows = parseCSV(bulkImportJson);
        validated = parsedRows.map(row => ({
          id: row.id,
          slug: row.name.toLowerCase().replace(/\s+/g, '-'),
          name: row.name,
          category: row.category,
          baseImageUrl: 'https://placehold.co/100x100.png?text=CSV+Import',
          expiryDate: row.expiryDate,
          variants: [{
            id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            attributes: [],
            price: row.price,
            stock: row.stock,
            sku: row.sku || `SKU-${Date.now().toString().slice(-4)}`
          }]
        }));
      }

      const updatedList = [...validated, ...products];
      const saved = await saveCatalog(updatedList);
      setProducts(updatedList);
      setIsBulkImportOpen(false);
      setBulkImportJson('');

      toast({
        title: saved ? "Bulk Import Completed" : "Bulk Import Saved Locally",
        description: `Successfully loaded and appended ${validated.length} products.`
      });
    } catch (e) {
      toast({
        title: "Import Error",
        description: "Failed to parse data. Please check formatting rules.",
        variant: "destructive"
      });
    }
  };

  // Save Stock Alert details
  const handleSaveStockAlertConfig = () => {
    localStorage.setItem('khidmatik_products_stock_alert', JSON.stringify({ enabled: enableLowStockNotify, threshold: Number(lowStockThreshold) }));
    setIsStockAlertOpen(false);
    toast({ title: "Stock Alerts Configured", description: `Notifications will trigger for inventory items below ${lowStockThreshold} units.` });
  };

  // Save Pricing rules
  const handleSavePricingConfig = () => {
    localStorage.setItem('khidmatik_products_pricing_rules', JSON.stringify({ enabled: bulkDiscountEnabled, qty: Number(bulkDiscountQty), pct: Number(bulkDiscountPct) }));
    setIsPricingOpen(false);
    toast({ title: "Pricing Rules Configured", description: bulkDiscountEnabled ? `Bulk discounts set: Buy ${bulkDiscountQty}+ get ${bulkDiscountPct}% discount.` : "Bulk discounts disabled." });
  };

  // Filter & Search & Sort logic
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || (product.variants?.[0]?.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Mock category tags mapping for filters
    const productCat = product.slug === 'artisan-mug' ? 'crafts' : 'food';
    const matchesCategory = selectedCategory === 'all' || productCat === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') {
      return (a.variants?.[0]?.price || 0) - (b.variants?.[0]?.price || 0);
    }
    if (sortBy === 'price-desc') {
      return (b.variants?.[0]?.price || 0) - (a.variants?.[0]?.price || 0);
    }
    if (sortBy === 'stock') {
      return (a.variants?.[0]?.stock || 0) - (b.variants?.[0]?.stock || 0);
    }
    return 0; // none
  });

  if (!user?.storeId) {
    return (
      <Card className="shadow-lg border">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-2xl font-headline flex items-center">
            <Package className="mr-3 h-6 w-6 text-primary" /> Products & Inventory
          </CardTitle>
          <CardDescription>Manage your product catalog, stock levels, pricing, and variants.</CardDescription>
        </CardHeader>
        <CardContent className="py-16 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold">No Store Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            You need to create a store and save your store identity in settings before you can manage products.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col justify-center items-center gap-4 text-muted-foreground w-full max-w-md mx-auto px-4">
        <div className="relative h-12 w-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary absolute" />
          <span className="text-[10px] font-bold text-primary font-mono">{loadingProgress}%</span>
        </div>
        <div className="w-full space-y-2 text-center">
          <p className="text-sm font-semibold animate-pulse">Loading products & inventory data...</p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground/80 text-center">
            Fetching records from Supabase cloud database. Please wait...
          </p>
        </div>
      </div>
    );
  }

  const calculatedMargin = (Number(productPrice) || 0) - (Number(purchaseCost) || 0);
  const calculatedMarginPct = (Number(productPrice) || 0) > 0 ? ((calculatedMargin / Number(productPrice)) * 100).toFixed(1) : '0';

  return (
    <Card className="shadow-lg border">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b">
        <div>
          <CardTitle className="text-2xl font-headline flex items-center">
            <Package className="mr-3 h-6 w-6 text-primary" /> Products & Inventory
          </CardTitle>
          <CardDescription>Manage your product catalog, stock levels, pricing, and variants.</CardDescription>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          {/* Bulk Import */}
          <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4"/> Bulk Import
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white border text-slate-800">
              <form onSubmit={handleBulkImportSubmit}>
                <DialogHeader>
                  <DialogTitle>Bulk Import Products</DialogTitle>
                  <DialogDescription>Paste a JSON array or CSV text rows of product objects to import listings in batch.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-slate-800">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded border dark:border-slate-800 text-xs">
                    <span>Need a copy of the CSV format template?</span>
                    <Button type="button" size="sm" variant="link" onClick={handleDownloadTemplate} className="p-0 h-auto font-bold text-primary">Download Template</Button>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="bulk-json">Products Copy-Paste Input (JSON or CSV)</Label>
                    <Textarea
                      id="bulk-json"
                      required
                      placeholder='Copy-paste JSON array or CSV rows...'
                      rows={5}
                      value={bulkImportJson}
                      onChange={e => setBulkImportJson(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Import Listings</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleExportProducts}><Download className="mr-2 h-4 w-4"/>Export Products</Button>
          <Button onClick={openFormForNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {/* Search, Filter, Sort */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name or SKU..."
              className="pl-8"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground"/>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="food">Food & Delicacies</SelectItem>
              <SelectItem value="crafts">Crafts & Arts</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Default Sort</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="stock">Stock Level</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions Panel */}
        {selectedProductIds.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-primary/20 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-mono">
                {selectedProductIds.length}
              </span>
              <span>Selected Products / المنتجات المحددة</span>
            </div>
            <div className="flex gap-2">
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                onClick={handleBulkExport} 
                className="h-8 text-xs flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Selected / تحميل المنتجات المحددة</span>
              </Button>
              <Button 
                type="button"
                variant="destructive" 
                size="sm" 
                onClick={handleBulkDelete} 
                className="h-8 text-xs flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Selected / حذف جماعي</span>
              </Button>
            </div>
          </div>
        )}

        {/* Product Table */}
        <div className="overflow-x-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">
                  <Checkbox 
                    checked={selectedProductIds.length === sortedProducts.length && sortedProducts.length > 0} 
                    onCheckedChange={handleToggleSelectAll} 
                  />
                </TableHead>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Price (DA)</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.map((product) => {
                const stockVal = product.variants?.[0]?.stock ?? 0;
                const isExpired = product.expiryDate && new Date(product.expiryDate) < new Date();
                const productCat = product.slug === 'artisan-mug' ? 'Crafts & Arts' : 'Food & Delicacies';

                return (
                  <TableRow key={product.id}>
                    <TableCell className="text-center">
                      <Checkbox 
                        checked={selectedProductIds.includes(product.id)} 
                        onCheckedChange={() => handleToggleSelectProduct(product.id)} 
                      />
                    </TableCell>
                    <TableCell>
                      <div className="relative h-10 w-10 border rounded overflow-hidden bg-muted/20">
                        <Image src={product.baseImageUrl || 'https://placehold.co/100x100.png'} alt={product.name} fill className="object-cover" />
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-sm">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{productCat}</TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">{product.variants?.[0]?.sku || 'N/A'}</TableCell>
                    <TableCell className="text-right text-sm font-mono font-semibold">{product.variants?.[0]?.price.toLocaleString()}</TableCell>
                    <TableCell className="text-center text-xs">
                      {stockVal}
                      {stockVal > 0 && stockVal < Number(lowStockThreshold) && (
                        <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">Low</Badge>
                      )}
                      {stockVal === 0 && <Badge variant="destructive" className="ml-2">Out</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={stockVal === 0 ? "secondary" : "default"} className={stockVal !== 0 ? "bg-green-500 text-white" : ""}>
                        {stockVal === 0 ? 'Inactive' : 'Active'}
                      </Badge>
                      {isExpired && (
                        <Badge variant="destructive" className="ml-1"><AlertTriangle className="h-3 w-3 mr-1"/>Expired</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openFormForEdit(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border text-slate-800">
                          <DialogHeader>
                            <DialogTitle>Confirm Delete Listing</DialogTitle>
                            <DialogDescription>Are you sure you want to permanently delete "{product.name}"? This action cannot be undone.</DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button variant="destructive" onClick={() => handleDeleteProduct(product.id)}>Delete</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sortedProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                    No products matching filter criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Configuration Boxes */}
        <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <Card className="p-4 bg-muted/20 border">
            <h4 className="font-semibold text-foreground flex items-center mb-1"><Package className="h-4 w-4 mr-2 text-primary"/>Inventory Management</h4>
            <p className="text-xs">Configure alerts for low-running stocks, automatic email notifications and watch thresholds.</p>
            
            <Dialog open={isStockAlertOpen} onOpenChange={setIsStockAlertOpen}>
              <DialogTrigger asChild>
                <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-primary">Configure Stock Alerts</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white border text-slate-800">
                <DialogHeader>
                  <DialogTitle>Stock Alert Rules</DialogTitle>
                  <DialogDescription>Define system notifications parameters for out-of-stock items.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-slate-800">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stock-alert-enable">Enable Low Stock Badges</Label>
                    <Switch id="stock-alert-enable" checked={enableLowStockNotify} onCheckedChange={setEnableLowStockNotify} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="stock-alert-val">Low Stock Threshold (Units)</Label>
                    <Input
                      id="stock-alert-val"
                      type="number"
                      value={lowStockThreshold}
                      onChange={e => setLowStockThreshold(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveStockAlertConfig}>Save Config</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>

          <Card className="p-4 bg-muted/20 border">
            <h4 className="font-semibold text-foreground flex items-center mb-1"><Tag className="h-4 w-4 mr-2 text-primary"/>Flexible Pricing</h4>
            <p className="text-xs">Establish volume pricing structures and bulk quantity discounts automatically on checkout.</p>
            
            <Dialog open={isPricingOpen} onOpenChange={setIsPricingOpen}>
              <DialogTrigger asChild>
                <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-primary">Manage Pricing Rules</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white border text-slate-800">
                <DialogHeader>
                  <DialogTitle>Platform Pricing Rules</DialogTitle>
                  <DialogDescription>Apply discount rules dynamically based on customer shopping cart.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-slate-800">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bulk-discount-enable">Enable Quantity Discounts</Label>
                    <Switch id="bulk-discount-enable" checked={bulkDiscountEnabled} onCheckedChange={setBulkDiscountEnabled} />
                  </div>
                  {bulkDiscountEnabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1.5">
                        <Label htmlFor="bulk-qty">Min Quantity</Label>
                        <Input id="bulk-qty" type="number" value={bulkDiscountQty} onChange={e => setBulkDiscountQty(e.target.value)} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="bulk-pct">Discount (%)</Label>
                        <Input id="bulk-pct" type="number" value={bulkDiscountPct} onChange={e => setBulkDiscountPct(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={handleSavePricingConfig}>Save Config</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>
        </div>

        {/* Add/Edit Product Modal Form */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] flex flex-col bg-white border text-slate-800">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? `Modify details for ${editingProduct.name}.` : 'Fill in details to register listing.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4 overflow-y-auto p-1 flex-grow">
              <div className="grid gap-1.5">
                <Label htmlFor="productName">Product Name *</Label>
                <Input id="productName" value={productName} onChange={(e) => setProductName(e.target.value)} required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="productDesc">Description</Label>
                <Textarea id="productDesc" value={productDesc} onChange={(e) => setProductDesc(e.target.value)} rows={3}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="productPrice">Base Price (DA) *</Label>
                  <Input id="productPrice" type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} required />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="productStock">Base Stock Quantity *</Label>
                  <Input id="productStock" type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="productCategory">Category (Main)</Label>
                  <Select value={productCategory} onValueChange={setProductCategory}>
                    <SelectTrigger id="productCategory">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesList.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                      {categoriesList.length === 0 && (
                        <>
                          <SelectItem value="cat1">Restaurants</SelectItem>
                          <SelectItem value="cat11">Home Goods</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="productSku">SKU Code (Optional)</Label>
                  <Input id="productSku" value={productSku} onChange={(e) => setProductSku(e.target.value)} placeholder="e.g. CER-MUG-12" />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="productExpiry">Expiry Date (Optional)</Label>
                <Input id="productExpiry" type="date" value={productExpiry} onChange={(e) => setProductExpiry(e.target.value)} />
              </div>

              {/* 1. Purchase Cost & margins */}
              <div className="grid grid-cols-3 gap-4 border p-3 rounded-lg bg-slate-50/50">
                <div className="grid gap-1.5">
                  <Label htmlFor="purchaseCost">Purchase Cost (DA)</Label>
                  <Input id="purchaseCost" type="number" value={purchaseCost} onChange={e => setPurchaseCost(e.target.value)} placeholder="0.00" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Profit Margin (DA)</Label>
                  <div className="h-10 flex items-center px-3 border rounded bg-slate-100 dark:bg-slate-800 font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {calculatedMargin.toLocaleString()} DA
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label>Margin Percentage</Label>
                  <div className="h-10 flex items-center px-3 border rounded bg-slate-100 dark:bg-slate-800 font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {calculatedMarginPct}%
                  </div>
                </div>
              </div>

              {/* 2. Product Type selector & conditional options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="productType">Product Type</Label>
                  <Select value={productType} onValueChange={(val: any) => setProductType(val)}>
                    <SelectTrigger id="productType"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Product (منتج عادي)</SelectItem>
                      <SelectItem value="composite">Composite / Assembly (منتج مركب)</SelectItem>
                      <SelectItem value="digital">Digital Product (منتج رقمي)</SelectItem>
                      <SelectItem value="service">Service Product (خدمة)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {productType === 'digital' && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="digitalUrl">Download URL / File Link</Label>
                    <Input id="digitalUrl" value={digitalUrl} onChange={e => setDigitalUrl(e.target.value)} placeholder="https://..." />
                  </div>
                )}
                {productType === 'service' && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="serviceDuration">Service Duration</Label>
                    <Input id="serviceDuration" value={serviceDuration} onChange={e => setServiceDuration(e.target.value)} placeholder="e.g. 30 min, 1 hour" />
                  </div>
                )}
              </div>

              {/* 3. Stock warning parameters */}
              <div className="border p-3 rounded-lg bg-slate-50/50 space-y-3">
                <h5 className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">Inventory Tracking & Alert Rules</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox id="trackStock" checked={trackStock} onCheckedChange={(val: boolean) => setTrackStock(val)} />
                    <Label htmlFor="trackStock" className="cursor-pointer">Track Inventory</Label>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox id="trackSerialNumber" checked={trackSerialNumber} onCheckedChange={(val: boolean) => setTrackSerialNumber(val)} />
                    <Label htmlFor="trackSerialNumber" className="cursor-pointer">Serial Number</Label>
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="minStock" className="text-[10px]">Min Stock Warning</Label>
                    <Input id="minStock" type="number" value={minStock} onChange={e => setMinStock(e.target.value)} className="h-8" disabled={!trackStock} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="maxStock" className="text-[10px]">Max Stock Limit</Label>
                    <Input id="maxStock" type="number" value={maxStock} onChange={e => setMaxStock(e.target.value)} className="h-8" disabled={!trackStock} />
                  </div>
                </div>
              </div>

              {/* 4. Gallery Images & Related Products */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="galleryImages">Gallery Images (Comma-separated URLs)</Label>
                  <Input id="galleryImages" value={galleryImages} onChange={e => setGalleryImages(e.target.value)} placeholder="url1, url2, url3..." />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="relatedProducts">Related Products (Comma-separated IDs)</Label>
                  <Input id="relatedProducts" value={relatedProducts} onChange={e => setRelatedProducts(e.target.value)} placeholder="prod_id1, prod_id2..." />
                </div>
              </div>
              
              {/* Image Upload Input */}
              <div className="grid gap-1.5">
                <Label>Product Image</Label>
                <div className="flex items-center gap-3">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProductImageChange} />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Choose Image File
                  </Button>
                  {productImage && (
                    <div className="relative h-12 w-12 border rounded overflow-hidden bg-slate-100">
                      <Image src={productImage} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Variants Customizer */}
              <div className="space-y-4 border dark:border-slate-800 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30">
                <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
                  <h4 className="font-bold text-sm flex items-center gap-1.5"><Layers className="h-4 w-4 text-primary" /> Product Options (e.g. Size, Color)</h4>
                  <Badge variant="outline">Advanced Variants</Badge>
                </div>
                
                {/* Add option inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Option Name</Label>
                    <Input placeholder="e.g. Color" value={tempOptionName} onChange={e => setTempOptionName(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Values (comma separated)</Label>
                    <Input placeholder="e.g. Red, Blue, Green" value={tempOptionValues} onChange={e => setTempOptionValues(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <Button type="button" size="sm" onClick={handleAddOptionType} className="h-8 text-xs bg-primary text-primary-foreground">Add Option</Button>
                </div>
                
                {/* Option types list */}
                {variantOptions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {variantOptions.map((opt, i) => (
                      <Badge key={i} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                        <span>{opt.name}: {opt.values.join(', ')}</span>
                        <button type="button" onClick={() => handleRemoveOptionType(i)} className="text-red-500 hover:text-red-700 font-bold ml-1">×</button>
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Generate combinations trigger */}
                {variantOptions.length > 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={handleGenerateCombinations} className="w-full h-8 text-xs">
                    Generate Combinations
                  </Button>
                )}
                
                {/* Variant combinations edit list */}
                {variants.length > 0 && (
                  <div className="space-y-2.5 mt-3 max-h-[220px] overflow-y-auto custom-sidebar-scrollbar pr-1">
                    <Label className="font-bold text-xs">Edit Variant Details</Label>
                    {variants.map((v, i) => {
                      const attrLabel = v.attributes.map((a: any) => `${a.name}: ${a.value}`).join(' / ');
                      return (
                        <div key={v.id || i} className="p-3 border dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 space-y-2 text-xs">
                          <div className="flex justify-between items-center font-semibold text-primary">
                            <span>Variant #{i+1}: {attrLabel || 'Base Product'}</span>
                            <button type="button" onClick={() => handleRemoveVariant(v.id)} className="text-red-500 hover:text-red-700">Delete</button>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>
                              <Label className="text-[9px]">SKU *</Label>
                              <Input value={v.sku || ''} onChange={e => handleUpdateVariantField(v.id, 'sku', e.target.value)} className="h-7 text-xs" />
                            </div>
                            <div>
                              <Label className="text-[9px]">Barcode</Label>
                              <Input value={v.barcode || ''} onChange={e => handleUpdateVariantField(v.id, 'barcode', e.target.value)} className="h-7 text-xs" />
                            </div>
                            <div>
                              <Label className="text-[9px]">Price (DA) *</Label>
                              <Input type="number" value={v.price} onChange={e => handleUpdateVariantField(v.id, 'price', Number(e.target.value))} className="h-7 text-xs" />
                            </div>
                            <div>
                              <Label className="text-[9px]">Stock *</Label>
                              <Input type="number" value={v.stock} onChange={e => handleUpdateVariantField(v.id, 'stock', Number(e.target.value))} className="h-7 text-xs" />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <Label className="text-[9px]">Discount Price (DA)</Label>
                              <Input type="number" value={v.discountPrice || ''} onChange={e => handleUpdateVariantField(v.id, 'discountPrice', e.target.value ? Number(e.target.value) : undefined)} className="h-7 text-xs" />
                            </div>
                            <div>
                              <Label className="text-[9px]">Image URL</Label>
                              <Input value={v.image || ''} onChange={e => handleUpdateVariantField(v.id, 'image', e.target.value)} className="h-7 text-xs" placeholder="Image URL / Data URI" />
                            </div>
                            <div>
                              <Label className="text-[9px]">Status</Label>
                              <Select value={v.status || 'available'} onValueChange={val => handleUpdateVariantField(v.id, 'status', val)}>
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="text-xs">
                                  <SelectItem value="available">Available</SelectItem>
                                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4 border-t mt-4">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">Save Product</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
