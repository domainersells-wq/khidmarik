'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { 
  GitCompare, Heart, Trash2, Plus, Star, Check, AlertCircle, ShoppingBag 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProductItem } from '@/types';

export function CompareProductsModal() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [compareList, setCompareList] = useState<ProductItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Load products & wishlist
  useEffect(() => {
    const storedProds = localStorage.getItem('khidmatik_products_catalog');
    if (storedProds) {
      try { setProducts(JSON.parse(storedProds)); } catch (e) {}
    }

    const storedWish = localStorage.getItem('khidmatik_wishlist_items');
    if (storedWish) {
      try { setWishlist(JSON.parse(storedWish)); } catch (e) {}
    }
  }, []);

  const saveWishlist = (updated: string[]) => {
    setWishlist(updated);
    localStorage.setItem('khidmatik_wishlist_items', JSON.stringify(updated));
  };

  const handleToggleWishlist = (prodId: string) => {
    let updated: string[];
    const isAdded = wishlist.includes(prodId);
    if (isAdded) {
      updated = wishlist.filter(id => id !== prodId);
      toast({ title: "Removed from Wishlist", description: "Product has been removed from your saved list." });
    } else {
      updated = [...wishlist, prodId];
      toast({ title: "Saved to Wishlist", description: "Product has been added to your favorites!" });
    }
    saveWishlist(updated);
  };

  const handleAddToCompare = (prod: ProductItem) => {
    if (compareList.find(p => p.id === prod.id)) {
      toast({ title: "Already Added", description: "This product is already in the comparison list.", variant: "destructive" });
      return;
    }
    if (compareList.length >= 4) {
      toast({ title: "Comparison Limit Reached", description: "You can compare up to 4 products at the same time.", variant: "destructive" });
      return;
    }
    setCompareList([...compareList, prod]);
    toast({ title: "Product Added", description: `Added "${prod.name}" to comparison matrix.` });
  };

  const handleRemoveFromCompare = (prodId: string) => {
    setCompareList(compareList.filter(p => p.id !== prodId));
  };

  const getProductStockSum = (prod: ProductItem) => {
    if (!prod.variants) return 0;
    return prod.variants.reduce((acc, v) => acc + v.stock, 0);
  };

  const getProductPriceRange = (prod: ProductItem) => {
    if (!prod.variants || prod.variants.length === 0) return '0 DA';
    const prices = prod.variants.map(v => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `${min.toLocaleString()} DA` : `${min.toLocaleString()} - ${max.toLocaleString()} DA`;
  };

  // Autocomplete products
  const searchedProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
    !compareList.find(cl => cl.id === p.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <GitCompare className="h-8 w-8 text-primary" /> Product Comparison & Wishlist
          </h1>
          <p className="text-muted-foreground text-sm">Compare up to 4 items side-by-side on price, stock status, ratings, and specifications.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wishlist management card */}
        <Card className="shadow border bg-card md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500 fill-red-500 animate-pulse" /> My Wishlist Favorite Items ({wishlist.length})
            </CardTitle>
            <CardDescription>Your saved items list for quick repurchase and checks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto custom-sidebar-scrollbar pr-1">
            {wishlist.map((id) => {
              const prod = products.find(p => p.id === id);
              if (!prod) return null;
              return (
                <div key={prod.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <img src={prod.baseImageUrl || 'https://placehold.co/60x60.png'} className="h-9 w-9 border rounded object-cover" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{prod.name}</p>
                      <p className="text-[10px] text-muted-foreground">{getProductPriceRange(prod)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="outline" className="h-7 w-7 text-primary" onClick={() => handleAddToCompare(prod)} title="Add to compare">
                      <GitCompare className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-7 w-7 text-red-500" onClick={() => handleToggleWishlist(prod.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {wishlist.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-8">Your Wishlist is currently empty.</p>
            )}
          </CardContent>
        </Card>

        {/* Compare layout card */}
        <Card className="shadow border bg-card md:col-span-2">
          <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-base">Product Comparison Matrix</CardTitle>
              <CardDescription>Add products below to construct side-by-side metrics.</CardDescription>
            </div>
            
            {/* Add product to compare trigger */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1 text-xs">
                  <Plus className="h-4 w-4" /> Add Product to Compare
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white border text-slate-800 text-xs">
                <DialogHeader>
                  <DialogTitle>Add Product to Comparison Matrix</DialogTitle>
                  <DialogDescription>Choose a product from your catalog (maximum of 4 total).</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-3">
                  <Input 
                    placeholder="Search catalog product name..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    className="h-9 text-xs"
                  />
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {searchedProducts.map(p => (
                      <div key={p.id} className="flex justify-between items-center p-2 border rounded hover:bg-slate-50 dark:hover:bg-slate-900/30 text-xs">
                        <span>{p.name}</span>
                        <Button size="sm" variant="ghost" onClick={() => { handleAddToCompare(p); setIsOpen(false); }}>
                          Add to Compare
                        </Button>
                      </div>
                    ))}
                    {searchedProducts.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No matching products found.</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {compareList.length > 0 ? (
              <table className="w-full text-xs text-left border-t border-collapse">
                <tbody>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/20">
                    <td className="p-3 border-r font-bold w-[120px] shrink-0 text-slate-500">Preview</td>
                    {compareList.map(prod => (
                      <td key={prod.id} className="p-3 border-r text-center">
                        <div className="relative inline-block">
                          <img src={prod.baseImageUrl || 'https://placehold.co/100x100.png'} className="h-16 w-16 mx-auto object-cover border rounded" />
                          <button 
                            type="button" 
                            onClick={() => handleRemoveFromCompare(prod.id)}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center font-bold text-[9px] hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                        <p className="font-bold mt-1 text-slate-800 dark:text-slate-200">{prod.name}</p>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-r font-bold text-slate-500">Price (DA)</td>
                    {compareList.map(prod => (
                      <td key={prod.id} className="p-3 border-r text-center font-mono font-bold text-primary text-sm">
                        {getProductPriceRange(prod)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-r font-bold text-slate-500">Stock Count</td>
                    {compareList.map(prod => {
                      const totalStock = getProductStockSum(prod);
                      return (
                        <td key={prod.id} className="p-3 border-r text-center">
                          <Badge variant={totalStock === 0 ? "destructive" : "default"} className={totalStock > 0 ? "bg-green-500" : ""}>
                            {totalStock} items
                          </Badge>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 border-r font-bold text-slate-500">Custom Options</td>
                    {compareList.map(prod => {
                      const optNames = prod.variantOptions?.map(o => o.name).join(', ') || 'None';
                      return (
                        <td key={prod.id} className="p-3 border-r text-center text-muted-foreground italic">
                          {optNames}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 border-r font-bold text-slate-500">Requirements</td>
                    {compareList.map(prod => (
                      <td key={prod.id} className="p-3 border-r text-center">
                        {prod.requiresInstallation ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400">Installation Req</Badge>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-r font-bold text-slate-500">Actions</td>
                    {compareList.map(prod => (
                      <td key={prod.id} className="p-3 border-r text-center">
                        <div className="flex flex-col gap-1 max-w-[120px] mx-auto">
                          <Button size="sm" variant="outline" className="h-7 text-[10px] w-full flex items-center gap-1 justify-center" onClick={() => handleToggleWishlist(prod.id)}>
                            <Heart className={`h-3 w-3 ${wishlist.includes(prod.id) ? 'fill-red-500 text-red-500' : ''}`} /> Wishlist
                          </Button>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="text-center py-20 text-muted-foreground flex flex-col justify-center items-center gap-2">
                <AlertCircle className="h-8 w-8 text-primary" />
                <p>No products selected for comparison matrix yet.</p>
                <Button size="sm" variant="outline" className="mt-1" onClick={() => setIsOpen(true)}>Add Products Now</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
