
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { partCategories } from '@/data/mock';
import type { PartCondition } from '@/types';
import { ArrowLeft, UploadCloud, PackagePlus, ShieldCheck, Info } from 'lucide-react';
import Link from 'next/link';

const partConditionOptions: { value: PartCondition; label: string }[] = [
  { value: 'used-working', label: 'Used - Working Well' },
  { value: 'used-good', label: 'Used - Good Condition' },
  { value: 'used-fair-needs-inspection', label: 'Used - Fair (May Need Inspection/Repair)' },
  { value: 'for-parts-experts-only', label: 'For Parts / Experts Only (Not working)' },
];

export default function ListNewPartPage() {
  const { toast } = useToast();
  const [partName, setPartName] = useState('');
  const [originalDeviceName, setOriginalDeviceName] = useState('');
  const [condition, setCondition] = useState<PartCondition | ''>('');
  const [price, setPrice] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [sellerNotes, setSellerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'List a Part for Sale | Marketplace | Khidmatik';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim() || !originalDeviceName.trim() || !condition || !price.trim() || !categorySlug || !sellerNotes.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        toast({ title: "Invalid Price", description: "Please enter a valid positive price.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 300)); 

    console.log("Part Listing Submitted:", {
      partName,
      originalDeviceName,
      condition,
      price: parseFloat(price),
      categorySlug,
      sellerNotes,
    });

    toast({
      title: "Part Listed Successfully!",
      description: `${partName} is now available in the Marketplace.`,
      variant: "default",
      duration: 4000, 
    });

    setPartName('');
    setOriginalDeviceName('');
    setCondition('');
    setPrice('');
    setCategorySlug('');
    setSellerNotes('');
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/marketplace" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Marketplace
      </Link>
      <Card className="shadow-xl border-border">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-headline flex items-center">
            <PackagePlus className="mr-3 h-8 w-8 text-primary" /> 
            List a Part for Sale
          </CardTitle>
          <CardDescription>
            Provide clear and accurate details about your spare part. Good listings sell faster!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="partName" className="font-semibold">Part Name / Title *</Label>
              <Input
                id="partName"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                placeholder="e.g., Water pump for Brandt washing machine, iPhone 11 Pro Back Glass"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="originalDeviceName" className="font-semibold">Original Device (Brand & Model) *</Label>
              <Input
                id="originalDeviceName"
                value={originalDeviceName}
                onChange={(e) => setOriginalDeviceName(e.target.value)}
                placeholder="e.g., Brandt WM1000, iPhone 11 Pro A2215, Renault Clio IV"
                required
                className="mt-1"
              />
               <p className="text-xs text-muted-foreground mt-1">Crucial for matching! If unknown, state 'Unknown' or describe device.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="condition" className="font-semibold">Part Condition *</Label>
                    <Select value={condition} onValueChange={(val) => setCondition(val as PartCondition | '')} required>
                        <SelectTrigger id="condition" className="mt-1">
                        <SelectValue placeholder="Select condition..." />
                        </SelectTrigger>
                        <SelectContent>
                        {partConditionOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="price" className="font-semibold">Price (DA) *</Label>
                    <Input
                        id="price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g., 1500"
                        required
                        min="0"
                        step="any"
                        className="mt-1"
                    />
                </div>
            </div>

            <div>
              <Label htmlFor="categorySlug" className="font-semibold">Part Category *</Label>
              <Select value={categorySlug} onValueChange={setCategorySlug} required>
                <SelectTrigger id="categorySlug" className="mt-1">
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  {partCategories.map(cat => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      <div className="flex items-center">
                        <cat.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sellerNotes" className="font-semibold">Seller Notes / Detailed Description *</Label>
              <Textarea
                id="sellerNotes"
                value={sellerNotes}
                onChange={(e) => setSellerNotes(e.target.value)}
                placeholder="Provide more details: Any known issues? Included accessories? Specific part numbers (P/N)? Compatibility info? Why are you selling it?"
                rows={5}
                required
                className="mt-1"
              />
            </div>
            
            <div className="p-4 border-2 border-dashed rounded-md bg-muted/30">
                <Label htmlFor="partImages" className="font-semibold flex items-center mb-2">
                    <UploadCloud className="mr-2 h-5 w-5 text-primary" />
                    Upload Clear Photos/Videos * (Coming Soon)
                </Label>
                <div className="text-center space-y-1">
                    <p className="text-sm text-muted-foreground">
                        Photo & video upload functionality is under development. 
                        High-quality visuals are essential for selling your part.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        (Supports PNG, JPG, MP4 - Max 10MB per file. Minimum 1 photo required.)
                    </p>
                     <Button variant="outline" type="button" className="mt-2" disabled>
                        <UploadCloud className="mr-2 h-4 w-4" /> Choose Files (Disabled)
                    </Button>
                </div>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm flex items-start gap-2">
                <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                    <span className="font-semibold">Secure Transactions:</span> All payments are processed via Khidmatik's Escrow Wallet. Chat functionality for buyer-seller communication is coming soon.
                </div>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm flex items-start gap-2">
                <Info className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                    <span className="font-semibold">Honesty Pays:</span> Be accurate and honest in your description and condition assessment to ensure smooth transactions and avoid disputes.
                </div>
            </div>


            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-md" disabled={isSubmitting}>
              {isSubmitting ? 'Listing Part...' : 'List Your Part'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
