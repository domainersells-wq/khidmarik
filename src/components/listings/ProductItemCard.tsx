
'use client';

import Image from 'next/image';
import type { ProductItem, ProductVariant, CartItem, ProductVariantAttribute } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings2, ShoppingCart, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { QuickOrderDialog } from '@/components/features/QuickOrderDialog';

interface ProductItemCardProps {
  product: ProductItem;
  onAddWithInstallation: (product: ProductItem, selectedVariant?: ProductVariant) => void;
}

const CART_STORAGE_KEY = 'khidmatikCart';

export function ProductItemCard({ product, onAddWithInstallation }: ProductItemCardProps) {
  const { toast } = useToast();
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string | undefined>>({});
  const [currentFullVariant, setCurrentFullVariant] = useState<ProductVariant | null>(null);
  const [isQuickOrderDialogOpen, setIsQuickOrderDialogOpen] = useState(false);

  useEffect(() => {
    // Initialize selectedAttributes with the first value of each option if available
    const initialAttributes: Record<string, string | undefined> = {};
    if (product.variantOptions && product.variantOptions.length > 0) {
      product.variantOptions.forEach(option => {
        if (option.values.length > 0) {
          initialAttributes[option.name] = option.values[0];
        }
      });
    }
    setSelectedAttributes(initialAttributes);
  }, [product.variantOptions]);

  useEffect(() => {
    if (!product.variants || product.variants.length === 0) {
      // If no variants, but product.variants might be an array with a single default variant
      setCurrentFullVariant(product.variants?.[0] || null);
      return;
    }

    if (product.variantOptions && product.variantOptions.some(opt => !selectedAttributes[opt.name])) {
      // Not all options selected yet
      setCurrentFullVariant(null);
      return;
    }
    
    const findVariant = () => {
      if (!product.variants) return null;
      return product.variants.find(variant => {
        return Object.entries(selectedAttributes).every(([key, value]) => {
          return variant.attributes.some(attr => attr.name === key && attr.value === value);
        });
      }) || null;
    };

    setCurrentFullVariant(findVariant());

  }, [selectedAttributes, product.variants, product.variantOptions]);


  const displayPrice = currentFullVariant?.price ?? (product.variants?.[0]?.price ?? 0);
  const displayImage = currentFullVariant?.image || product.baseImageUrl;
  const currentStock = currentFullVariant?.stock ?? (product.variants?.[0]?.stock); // Can be 0 or undefined

  const allOptionsSelected = product.variantOptions ? product.variantOptions.every(opt => !!selectedAttributes[opt.name]) : true;
  const isSelectionInvalidOrOutOfStock = !currentFullVariant || currentFullVariant.stock === 0;
  const disableActions = !allOptionsSelected || isSelectionInvalidOrOutOfStock;


  const handleAttributeChange = (optionName: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [optionName]: value,
    }));
  };

  const handleAddToCart = () => {
    if (!currentFullVariant) {
      toast({ title: "Select Options", description: "Please select all product options.", variant: "default" });
      return;
    }
     if (currentFullVariant.stock === 0) {
      toast({ title: "Out of Stock", description: "This variant is currently out of stock.", variant: "destructive" });
      return;
    }


    const cartItem: CartItem = {
      id: `${product.id}-${currentFullVariant.id}`,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantId: currentFullVariant.id,
      variantDescription: currentFullVariant.attributes.map(a => `${a.name}: ${a.value}`).join(', '),
      quantity: 1, // Default quantity to 1 for now
      unitPrice: displayPrice,
      lineItemImage: displayImage || product.baseImageUrl,
      storeId: (product as any).storeId || (product as any).store_id,
    };

    try {
      const existingCartJson = localStorage.getItem(CART_STORAGE_KEY);
      let cart: CartItem[] = existingCartJson ? JSON.parse(existingCartJson) : [];
      
      const existingItemIndex = cart.findIndex(item => item.id === cartItem.id);
      if (existingItemIndex > -1) {
        toast({
          title: "Item in Cart",
          description: `${cartItem.productName}${cartItem.variantDescription ? ` (${cartItem.variantDescription})` : ''} is already in your cart. You can adjust quantity there.`,
        });
      } else {
        cart.push(cartItem);
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        toast({
          title: "Product Added to Cart!",
          description: `${cartItem.productName}${cartItem.variantDescription ? ` (${cartItem.variantDescription})` : ''} has been added.`,
        });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({ title: "Error", description: "Could not add item to cart.", variant: "destructive" });
    }
  };
  
  const handleAddWithInstallationClick = () => {
    if (!currentFullVariant) {
      toast({ title: "Select Options", description: "Please select all product options.", variant: "default" });
      return;
    }
    if (currentFullVariant.stock === 0) {
      toast({ title: "Out of Stock", description: "This variant is currently out of stock.", variant: "destructive" });
      return;
    }
    onAddWithInstallation(product, currentFullVariant);
  };

  const handleQuickOrderClick = () => {
    if (!currentFullVariant) {
      toast({ title: "Select Options", description: "Please select all product options.", variant: "default" });
      return;
    }
    if (currentFullVariant.stock === 0) {
      toast({ title: "Out of Stock", description: "This variant is currently out of stock.", variant: "destructive" });
      return;
    }
    setIsQuickOrderDialogOpen(true);
  };

  const renderVariantSelectors = () => {
    if (!product.variantOptions || product.variantOptions.length === 0) return null;

    return product.variantOptions.map(option => (
      <div key={option.name} className="space-y-1 my-2">
        <Label htmlFor={`variant-${product.id}-${option.name}`}>{option.name}</Label>
        <Select
          value={selectedAttributes[option.name] || ''}
          onValueChange={(value) => handleAttributeChange(option.name, value)}
        >
          <SelectTrigger id={`variant-${product.id}-${option.name}`}>
            <SelectValue placeholder={`Select ${option.name}...`} />
          </SelectTrigger>
          <SelectContent>
            {option.values.map(val => (
              <SelectItem key={val} value={val}>{val}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    ));
  };


  return (
    <>
      <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg">
        <CardHeader className="p-0 relative">
          <div className="aspect-square w-full overflow-hidden bg-muted">
            <Image
              src={displayImage || `https://placehold.co/300x300.png?text=${encodeURIComponent(product.name)}`}
              alt={product.name}
              width={300}
              height={300}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              data-ai-hint={product.dataAiHint || product.name.toLowerCase().split(' ').slice(0,2).join(' ')}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-lg font-semibold mb-1 line-clamp-2">{product.name}</CardTitle>
          {renderVariantSelectors()}
          <p className="text-xl font-bold text-primary mb-1">{displayPrice.toFixed(2)} DA</p>
          
          {!product.variantOptions || product.variantOptions.length === 0 || allOptionsSelected ? (
            currentFullVariant && currentFullVariant.stock !== undefined ? (
              currentFullVariant.stock > 0 && currentFullVariant.stock <= 10 ? (
                <p className="text-xs text-destructive">Only {currentFullVariant.stock} left in stock!</p>
              ) : currentFullVariant.stock === 0 ? (
                <p className="text-xs text-destructive">Out of stock</p>
              ) : null // Sufficient stock
            ) : (product.variants && product.variants.length === 1 && product.variants[0].stock === 0) ? ( // Non-variant product out of stock
                <p className="text-xs text-destructive">Out of stock</p>
            ) : null
          ) : (
            <p className="text-xs text-muted-foreground">Please select options.</p>
          )}

        </CardContent>
        <CardFooter className="p-3 border-t flex-col space-y-2">
          <Button
            onClick={handleQuickOrderClick}
            variant="default"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            aria-label={`Quick order ${product.name}`}
            disabled={disableActions}
          >
            <Zap className="mr-2 h-4 w-4" /> Quick Order
          </Button>
          <Button
            onClick={handleAddToCart}
            variant="outline"
            className="w-full"
            aria-label={`Add ${product.name} to cart`}
            disabled={disableActions}
          >
            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
          </Button>
          {product.requiresInstallation && (
            <Button
              onClick={handleAddWithInstallationClick}
              variant="outline"
              className="w-full"
              aria-label={`Add ${product.name} to project with installation service`}
              disabled={disableActions}
            >
              <Settings2 className="mr-2 h-4 w-4" /> Add with Installation
            </Button>
          )}
        </CardFooter>
      </Card>
      <QuickOrderDialog
        isOpen={isQuickOrderDialogOpen}
        onOpenChange={setIsQuickOrderDialogOpen}
        product={product}
        selectedVariant={currentFullVariant || undefined}
      />
    </>
  );
}

