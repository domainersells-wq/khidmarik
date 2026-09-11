
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, UploadCloud, Briefcase, Store, Sparkles, Loader2, UserCheck, Users, CheckCircle, DollarSign, FileUp, BadgeCheck, Globe } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { categories as allCategories } from '@/data/mock';
import type { StoreSubscriptionPlan } from '@/types';
import { supabase } from '@/lib/supabase';
import { storeService } from '@/services/storeService';

const categoriesRequiringSponsorship: string[] = ['plumbers', 'electricians', 'doctors'];

const subscriptionPlans = [
  {
    id: 'basic' as StoreSubscriptionPlan,
    name: 'Basic Plan',
    price: '1500 DA/month',
    features: ['List up to 20 products', 'Standard Storefront', 'Basic Analytics'],
    icon: Briefcase,
  },
  {
    id: 'pro' as StoreSubscriptionPlan,
    name: 'Pro Plan',
    price: '4500 DA/month',
    features: ['Unlimited Products', 'Customizable Storefront', 'Advanced Marketing Tools', 'Priority Support'],
    icon: Sparkles,
  }
];

export default function RegisterProviderPage() {
  const { toast } = useToast();

  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [listingType, setListingType] = useState<'store' | 'professional' | 'freelancer' | ''>('');
  const [businessName, setBusinessName] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [listingDescription, setListingDescription] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<StoreSubscriptionPlan | ''>('');
  const [sponsor1Id, setSponsor1Id] = useState('');
  const [sponsor2Id, setSponsor2Id] = useState('');

  // Freelancer specific state
  const [freelancerTagline, setFreelancerTagline] = useState('');
  const [freelancerSkills, setFreelancerSkills] = useState('');
  const [freelancerCategory, setFreelancerCategory] = useState('web-development');
  const [freelancerBasePrice, setFreelancerBasePrice] = useState('5000');

  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [commercialRegisterFile, setCommercialRegisterFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Register Your Business or Profession | Khidmatik';
  }, []);

  const validateForm = () => {
    if (!contactName.trim()) { toast({ title: "Validation Error", description: "Contact name is required.", variant: "destructive" }); return false; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { toast({ title: "Validation Error", description: "Valid email is required.", variant: "destructive" }); return false; }
    if (password.length < 6) { toast({ title: "Validation Error", description: "Password must be at least 6 characters.", variant: "destructive" }); return false; }
    if (password !== confirmPassword) { toast({ title: "Validation Error", description: "Passwords do not match.", variant: "destructive" }); return false; }
    if (!listingType) { toast({ title: "Validation Error", description: "Please select a listing type.", variant: "destructive" }); return false; }
    if (!businessName.trim()) { toast({ title: "Validation Error", description: "Business/Profession name is required.", variant: "destructive" }); return false; }
    if (listingType !== 'freelancer' && !categoryInput.trim()) { toast({ title: "Validation Error", description: "Category is required.", variant: "destructive" }); return false; }
    if (listingType === 'freelancer' && !freelancerTagline.trim()) { toast({ title: "Validation Error", description: "Tagline is required.", variant: "destructive" }); return false; }
    if (listingType === 'freelancer' && !freelancerSkills.trim()) { toast({ title: "Validation Error", description: "Skills are required.", variant: "destructive" }); return false; }
    if (!listingDescription.trim()) { toast({ title: "Validation Error", description: "Listing description is required.", variant: "destructive" }); return false; }
    if (listingType === 'store' && !selectedPlan) { toast({ title: "Validation Error", description: "Please select a store subscription plan.", variant: "destructive" }); return false; }
    
    // Conceptual validation for file uploads
    if (!idCardFile) { toast({ title: "Validation Error", description: "ID Card is required for verification.", variant: "destructive"}); return false; }
    if (listingType === 'store' && !commercialRegisterFile) { toast({ title: "Validation Error", description: "Commercial Register is required for store verification.", variant: "destructive"}); return false; }


    const selectedCategoryObject = allCategories.find(cat => cat.name.toLowerCase() === categoryInput.toLowerCase());
    const currentCategorySlug = selectedCategoryObject?.slug;
    const needsSponsorship = listingType === 'professional' && currentCategorySlug && categoriesRequiringSponsorship.includes(currentCategorySlug);
    if (needsSponsorship && (!sponsor1Id.trim() || !sponsor2Id.trim())) { toast({ title: "Validation Error", description: "Sponsor IDs are required for this category.", variant: "destructive" }); return false; }
    return true;
  };

  const resetForm = () => {
    setContactName(''); setEmail(''); setPassword(''); setConfirmPassword(''); setListingType('');
    setBusinessName(''); setCategoryInput(''); setListingDescription('');
    setSelectedPlan(''); setSponsor1Id(''); setSponsor2Id('');
    setFreelancerTagline(''); setFreelancerSkills(''); setFreelancerCategory('web-development'); setFreelancerBasePrice('5000');
    setIdCardFile(null); setCommercialRegisterFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFileState: React.Dispatch<React.SetStateAction<File | null>>, documentType: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
      const maxSizeMB = 5;
      if (!allowedTypes.includes(file.type)) {
        toast({ title: "Invalid File Type", description: `Please upload a PDF or JPG for ${documentType}.`, variant: "destructive" });
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({ title: "File Too Large", description: `${documentType} must be less than ${maxSizeMB}MB.`, variant: "destructive" });
        return;
      }
      setFileState(file);
      toast({ title: `${documentType} Selected`, description: `${file.name} (${(file.size / 1024).toFixed(1)}KB) ready for upload.`, variant: "default" });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // 1. Sign up the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: contactName,
            role: listingType === 'store' ? 'store_owner' : 'service_provider'
          }
        }
      });

      if (authError) {
        toast({ title: "Registration Error", description: authError.message, variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const ownerId = authData.user?.id;
      if (!ownerId) {
        toast({ title: "Registration Error", description: "Failed to initialize user session.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const categoryNameMap: Record<string, string> = {
        'web-development': 'Web Development',
        'graphic-design': 'Graphic Design',
        'writing-translation': 'Writing & Translation',
        'digital-marketing': 'Digital Marketing',
        'video-editing': 'Video Editing'
      };

      // 2. Create the store/provider profile record in public.stores
      await storeService.createStore({
        owner_id: ownerId,
        name: businessName,
        type: listingType as 'store' | 'professional' | 'freelancer',
        images: [],
        category: listingType === 'freelancer' ? (categoryNameMap[freelancerCategory] || 'Digital Services') : categoryInput,
        description: listingDescription,
        contact: {
          phone: '',
          email: email,
          website: '',
        },
        location: {
          city: 'Algiers',
          fullAddress: listingType === 'freelancer' ? 'Remote / Online' : '',
          zipCode: '',
          wilayaCode: '16',
        },
        bannerImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=60',
        storeLogoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(businessName),
        isMadeInAlgeria: false,
        subscriptionPlan: selectedPlan || 'basic',
        operatingHours: '09:00 - 17:00',
        ...(listingType === 'freelancer' ? {
          tagline: freelancerTagline,
          skills: freelancerSkills.split(',').map(s => s.trim()),
          digitalCategorySlug: freelancerCategory,
          servicePrice: parseFloat(freelancerBasePrice) || 5000,
        } : {})
      } as any);

      toast({
        title: "Registration Successful!",
        description: "Your business has been successfully registered and listed! You can now log in.",
        duration: 5000,
      });
      resetForm();
    } catch (err: any) {
      console.error("Failed to register business:", err);
      toast({
        title: "Registration Failed",
        description: err.message || "An unexpected error occurred during database insert.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategoryObject = allCategories.find(cat => cat.name.toLowerCase() === categoryInput.toLowerCase());
  const currentCategorySlug = selectedCategoryObject?.slug;
  const showSponsorshipSection = listingType === 'professional' && currentCategorySlug && categoriesRequiringSponsorship.includes(currentCategorySlug);

  return (
    <div className="flex justify-center items-start py-8">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">List Your Service on Khidmatik</CardTitle>
          <CardDescription>Register to list your store or professional service. Document verification and potential sponsorship are required to ensure a trusted platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="contactName">Your Full Name (or Business Contact Person) *</Label>
              <Input id="contactName" type="text" placeholder="John Doe" required value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Password (min. 6 characters) *</Label>
              <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Business/Profession Details</h3>
              <div>
                <Label htmlFor="listingType">I am registering a: *</Label>
                <Select value={listingType} onValueChange={(value: 'store' | 'professional' | 'freelancer' | '') => {
                  setListingType(value);
                  if (value === 'freelancer') {
                    setCategoryInput('Digital Services');
                  }
                }} required>
                  <SelectTrigger id="listingType" className="mt-1"><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="store"><Store className="mr-2 h-4 w-4 inline-block" /> Store / Shop</SelectItem>
                    <SelectItem value="professional"><Briefcase className="mr-2 h-4 w-4 inline-block" /> Professional Service / Craft</SelectItem>
                    <SelectItem value="freelancer"><Globe className="mr-2 h-4 w-4 inline-block" /> Digital & Remote Freelance Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div>
                <Label htmlFor="businessName">Business/Profession Name *</Label>
                <Input id="businessName" type="text" placeholder="e.g., Springfield Bakery or John Doe Plumbing" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
              </div>
              {listingType === 'freelancer' && (
                <div className="space-y-4 border-l-2 border-primary pl-4 py-2 bg-muted/20 rounded-r-lg">
                  <div>
                    <Label htmlFor="freelancerCategory">Digital Specialization *</Label>
                    <Select value={freelancerCategory} onValueChange={(value) => setFreelancerCategory(value)}>
                      <SelectTrigger id="freelancerCategory" className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web-development">Web & Software Development / تطوير المواقع والبرمجيات</SelectItem>
                        <SelectItem value="graphic-design">Graphic Design & Creative / التصميم والابداع الرقمي</SelectItem>
                        <SelectItem value="writing-translation">Writing & Translation / الكتابة والترجمة</SelectItem>
                        <SelectItem value="digital-marketing">Digital Marketing / التسويق الرقمي</SelectItem>
                        <SelectItem value="video-editing">Video Editing & Animation / المونتاج وتعديل الفيديو</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="freelancerTagline">Tagline / شعار الخدمة (e.g. Crafting Fast & Reliable Web Solutions) *</Label>
                    <Input 
                      id="freelancerTagline" 
                      type="text" 
                      placeholder="e.g. Building Next.js Apps" 
                      value={freelancerTagline} 
                      onChange={(e) => setFreelancerTagline(e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="freelancerSkills">Key Skills (Comma separated, e.g. React, UI Design, Photoshop) *</Label>
                    <Input 
                      id="freelancerSkills" 
                      type="text" 
                      placeholder="React, CSS, SEO..." 
                      value={freelancerSkills} 
                      onChange={(e) => setFreelancerSkills(e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="freelancerBasePrice">Starting Base Price (DA) *</Label>
                    <Input 
                      id="freelancerBasePrice" 
                      type="number" 
                      placeholder="5000" 
                      value={freelancerBasePrice} 
                      onChange={(e) => setFreelancerBasePrice(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
              )}
              {listingType !== 'freelancer' && (
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input id="category" type="text" placeholder="e.g., Restaurant, Plumber (Type exact category name)" value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)} required />
                  <p className="text-xs text-muted-foreground mt-1">Hint: Available categories include {allCategories.map(c=>c.name).slice(0,5).join(', ')}... etc.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="listingDescription">Listing Description *</Label>
                <Textarea id="listingDescription" placeholder="Describe your business or service..." rows={4} value={listingDescription} onChange={(e) => setListingDescription(e.target.value)} required />
              </div>
            </div>

            {listingType === 'store' && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center"><DollarSign className="mr-2 h-5 w-5 text-primary"/>Choose Your Store Plan *</h3>
                  <p className="text-sm text-muted-foreground">Select a monthly subscription. Payments via Khidmatik Escrow Wallet.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {subscriptionPlans.map((plan) => {
                      const PlanIcon = plan.icon;
                      return (
                        <Card key={plan.id} className={`cursor-pointer hover:shadow-lg transition-shadow p-1 ${selectedPlan === plan.id ? 'ring-2 ring-primary border-primary' : 'border-border'}`} onClick={() => setSelectedPlan(plan.id)}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-xl flex items-center"><PlanIcon className="mr-2 h-5 w-5 text-muted-foreground"/>{plan.name}</CardTitle>
                              {selectedPlan === plan.id && <CheckCircle className="h-6 w-6 text-primary" />}
                            </div>
                            <CardDescription className="font-semibold text-lg text-primary">{plan.price}</CardDescription>
                          </CardHeader>
                          <CardContent><ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">{plan.features.map(feature => <li key={feature}>{feature}</li>)}</ul></CardContent>
                        </Card>
                      );
                    })}
                  </div>
                   {selectedPlan && (<p className="text-xs text-center text-muted-foreground">Selected: {subscriptionPlans.find(p=>p.id === selectedPlan)?.name}. Fee processed upon verification.</p>)}
                </div>
              </>
            )}

            <Separator className="my-6" />
            
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center"><UserCheck className="mr-2 h-5 w-5 text-primary"/>Identity & Business Verification *</h3>
                
                {/* ID Card Upload */}
                <div className="p-4 border-2 border-dashed rounded-md bg-muted/50 space-y-2">
                    <Label htmlFor="idCardUpload" className="font-semibold flex items-center">
                        <FileUp className="mr-2 h-5 w-5 text-primary" /> ID Card (PDF or JPG, Max 5MB) *
                    </Label>
                    <Input 
                        id="idCardUpload" 
                        type="file" 
                        accept=".pdf,.jpg,.jpeg" 
                        onChange={(e) => handleFileChange(e, setIdCardFile, "ID Card")} 
                        className="text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                    {idCardFile && <p className="text-xs text-green-600 flex items-center"><BadgeCheck className="h-4 w-4 mr-1"/>Selected: {idCardFile.name}</p>}
                </div>

                {/* Commercial Register Upload (Conditional) */}
                {listingType === 'store' && (
                    <div className="p-4 border-2 border-dashed rounded-md bg-muted/50 space-y-2">
                        <Label htmlFor="commercialRegisterUpload" className="font-semibold flex items-center">
                            <FileUp className="mr-2 h-5 w-5 text-primary" /> Commercial Register (PDF or JPG, Max 5MB) *
                        </Label>
                        <Input 
                            id="commercialRegisterUpload" 
                            type="file" 
                            accept=".pdf,.jpg,.jpeg" 
                            onChange={(e) => handleFileChange(e, setCommercialRegisterFile, "Commercial Register")}
                            className="text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        {commercialRegisterFile && <p className="text-xs text-green-600 flex items-center"><BadgeCheck className="h-4 w-4 mr-1"/>Selected: {commercialRegisterFile.name}</p>}
                         <p className="text-xs text-muted-foreground">Required for store registrations to verify business legitimacy.</p>
                    </div>
                )}
                
                <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 mt-2">
                    <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-blue-700" />
                    <div className="text-xs">
                        <p className="font-medium">Important: Verification</p>
                        <p>Documents are for verification only, handled securely. Approval typically takes 24-48 hours.</p>
                    </div>
                </div>
            </div>


            {showSponsorshipSection && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4 p-4 border rounded-md bg-accent/10">
                  <h3 className="text-lg font-semibold flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>Sponsorship for {categoryInput} *</h3>
                  <p className="text-sm text-muted-foreground">For '{categoryInput}', endorsements from two Khidmatik pros (4.5+ stars) needed. (Conceptual)</p>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="sponsor1Id">Sponsor 1 (Khidmatik ID/Email) *</Label>
                      <Input id="sponsor1Id" type="text" placeholder="Sponsor 1 ID/Email" value={sponsor1Id} onChange={(e) => setSponsor1Id(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="sponsor2Id">Sponsor 2 (Khidmatik ID/Email) *</Label>
                      <Input id="sponsor2Id" type="text" placeholder="Sponsor 2 ID/Email" value={sponsor2Id} onChange={(e) => setSponsor2Id(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                   <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 mt-2">
                    <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-blue-700" />
                    <div className="text-xs">
                        <p className="font-medium">Sponsorship Process</p>
                        <p>Sponsors contacted to confirm endorsement. Maintains quality and trust.</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Button type="submit" className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Submitting...' : 'Register & Submit for Verification'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col items-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">Log in</Link>
          </p>
          <p className="text-sm text-muted-foreground">
            Different registration?{' '}
            <Link href="/register/choice" className="font-medium text-primary hover:underline">See options</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

