'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { storeService } from '@/services/storeService';
import { StarRating } from '@/components/listings/StarRating';
import { ReviewList } from '@/components/listings/ReviewList';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin,
  Phone,
  Globe,
  Mail,
  Tag,
  CheckCircle,
  Cog,
  ShoppingBag,
  Warehouse,
  AlertTriangle,
  CalendarClock,
  MessageSquare,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  HelpCircle,
  Video,
  Eye,
  ArrowRightLeft,
} from 'lucide-react';
import type { Store, Professional, Listing, ProductItem, Review } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ProductItemCard } from '@/components/listings/ProductItemCard';
import { GroupOrderItemCard } from '@/components/listings/GroupOrderItemCard';
import { MadeInAlgeriaBadge } from '@/components/listings/MadeInAlgeriaBadge';
import { EmergencySOSDialog, type ServiceType } from '@/components/features/EmergencySOSDialog';
import { categories as allCategories } from '@/data/mock';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

// Yelp Modular Imports
import { BookingDrawer } from '@/components/yelp/BookingDrawer';
import { QuoteRequestDialog } from '@/components/yelp/QuoteRequestDialog';
import { FloatingChatModal } from '@/components/chat/FloatingChatModal';
import { ComparisonModal } from '@/components/yelp/ComparisonModal';

const emergencyServiceCategorySlugs: string[] = ['plumbers', 'electricians', 'hvac-services', 'handyman'];
const categorySlugToServiceTypeMap: Record<string, ServiceType> = {
  plumbers: 'plumbing',
  electricians: 'electrical',
  'hvac-services': 'handyman',
  handyman: 'handyman',
};

export function ListingDetailClient({ initialListing }: { initialListing?: Listing | null }) {
  const routeParams = useParams<{ id: string }>();
  const listingId = routeParams?.id;
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();

  const [listing, setListing] = useState<Listing | null | undefined>(initialListing);

  // Existing Dialogs state
  const [isTechnicianModalOpen, setIsTechnicianModalOpen] = useState(false);
  const [currentProductForInstallation, setCurrentProductForInstallation] = useState<ProductItem | null>(null);
  const [availableInstallers, setAvailableInstallers] = useState<Professional[]>([]);
  const [isSosDialogOpen, setIsSosDialogOpen] = useState(false);
  const [currentSosServiceType, setCurrentSosServiceType] = useState<ServiceType | undefined>(undefined);

  // Yelp Dialogs / Drawers state
  const [isBookingDrawerOpen, setIsBookingDrawerOpen] = useState(false);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [comparisonTarget, setComparisonTarget] = useState<Listing | null>(null);

  // Panorama View
  const [panoramaRotation, setPanoramaRotation] = useState(0);
  const [isPanoramaActive, setIsPanoramaActive] = useState(false);

  // Default Mock FAQs
  const defaultFaqs = [
    {
      question: 'What is your average response time?',
      answer: 'We typically respond to inquiries and chat messages within 15-30 minutes.',
    },
    {
      question: 'Do you offer warranty on installations?',
      answer: 'Yes, all professional installation services include a 12-month Khidmatik-backed warranty.',
    },
    {
      question: 'Do you accept digital payments?',
      answer: 'Yes, we accept CIB, Dahabia cards, and cash on service delivery.',
    },
  ];

  useEffect(() => {
    if (initialListing !== undefined) {
      setListing(initialListing);
      return;
    }
    const fetchListing = async () => {
      if (!listingId) return;
      const data = await storeService.getStoreById(listingId);
      setListing(data);
    };
    fetchListing();
  }, [listingId, initialListing]);

  const handleOpenComparison = async () => {
    if (!listing) return;
    const related = await storeService.getStores({
      categorySlug: allCategories.find((c) => c.name === listing.category)?.slug,
    });
    const target = related.find((r) => r.id !== listing.id);
    if (target) {
      setComparisonTarget(target);
      setIsComparisonOpen(true);
    } else {
      toast({ title: 'No other providers found in this category to compare.' });
    }
  };

  if (listing === undefined) {
    return <div className="text-center py-10">Loading listing details...</div>;
  }

  if (!listing) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Listing Not Found</h1>
        <p>The listing you are looking for does not exist or has been removed.</p>
        <Link href="/listings" passHref>
          <Button variant="link" className="mt-4">
            Go back to listings
          </Button>
        </Link>
      </div>
    );
  }

  const storeListing = listing.type === 'store' ? (listing as Store) : null;
  const professionalListing = listing.type === 'professional' ? (listing as Professional) : null;

  const categoryDetails = allCategories.find((c) => c.name === listing.category);
  const CategoryIcon = categoryDetails?.icon;
  const categorySlug = categoryDetails?.slug;

  const isEmergencyCategory =
    professionalListing && categorySlug && emergencyServiceCategorySlugs.includes(categorySlug);
  const sosServiceTypeForCurrentCategory = categorySlug ? categorySlugToServiceTypeMap[categorySlug] : undefined;

  const handleEmergencySOS = () => {
    if (sosServiceTypeForCurrentCategory) {
      setCurrentSosServiceType(sosServiceTypeForCurrentCategory);
      setIsSosDialogOpen(true);
    } else {
      setCurrentSosServiceType(undefined);
      setIsSosDialogOpen(true);
    }
  };

  const handleAddWithInstallation = (product: ProductItem) => {
    if (!product.installationServiceCategory) return;
    storeService.getStores({ categorySlug: product.installationServiceCategory }).then((stores) => {
      const installers = (stores as any[]).filter(
        (l): l is Professional => (l.type as string) === 'professional' && typeof l.standardInstallationPrice === 'number'
      );
      setCurrentProductForInstallation(product);
      setAvailableInstallers(installers);
      setIsTechnicianModalOpen(true);
    });
  };

  const handleSelectTechnician = async (technician: Professional) => {
    if (!currentProductForInstallation || typeof technician.standardInstallationPrice !== 'number') return;
    const productPrice = currentProductForInstallation.variants?.[0]?.price || 0;
    const total = productPrice + technician.standardInstallationPrice;

    toast({
      title: 'Project Item Added!',
      description: `${currentProductForInstallation.name} with assembly by ${technician.name} added. Total: ${total.toFixed(2)} DA.`,
    });
    setIsTechnicianModalOpen(false);
  };

  const isRtl = language === 'ar';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* 1. cover image banner or 360 panorama */}
      <div className="relative w-full h-[250px] md:h-[350px] rounded-2xl overflow-hidden shadow-lg border bg-slate-950">
        {!isPanoramaActive ? (
          <>
            <Image
              src={listing.images[0] || 'https://placehold.co/1200x400.png'}
              alt={`${listing.name} cover`}
              layout="fill"
              objectFit="cover"
              className="brightness-75"
              priority
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsPanoramaActive(true)}
              className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white border border-white/20 flex items-center gap-1.5"
            >
              <Eye className="h-4 w-4" />
              {isRtl ? 'عرض 360°' : '360° View'}
            </Button>
          </>
        ) : (
          <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
              style={{ transform: `scale(1.1) rotateY(${panoramaRotation}deg)` }}
            >
              <div className="w-[1200px] h-[350px] relative flex gap-2">
                <img
                  src={listing.images[0] || 'https://placehold.co/800x400.png'}
                  className="w-[500px] h-full object-cover brightness-90"
                  alt="360 view 1"
                />
                <img
                  src={listing.images[1] || listing.images[0] || 'https://placehold.co/800x400.png'}
                  className="w-[500px] h-full object-cover brightness-90"
                  alt="360 view 2"
                />
              </div>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/75 p-2 rounded-full border border-white/10 z-10">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:text-primary"
                onClick={() => setPanoramaRotation((p) => p - 30)}
              >
                ◀
              </Button>
              <span className="text-xs text-white font-bold select-none">360° Drag & Rotate</span>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:text-primary"
                onClick={() => setPanoramaRotation((p) => p + 30)}
              >
                ▶
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPanoramaActive(false)}
              className="absolute top-4 right-4 text-white border-white/20 bg-black/40 hover:bg-black/60"
            >
              {isRtl ? 'إغلاق' : 'Close'}
            </Button>
          </div>
        )}
      </div>

      {/* 2. Header and info bar */}
      <header className="bg-card p-6 border rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex gap-4 items-start">
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
            {CategoryIcon ? <CategoryIcon className="h-8 w-8" /> : <Warehouse className="h-8 w-8" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-headline font-bold text-foreground">{listing.name}</h1>
              {storeListing?.isMadeInAlgeria && <MadeInAlgeriaBadge />}
            </div>

            <div className="flex items-center gap-2.5 text-sm text-muted-foreground mt-1.5 font-medium">
              <span>{listing.category}</span>
              <span>•</span>
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>{listing.location.city}</span>
            </div>
          </div>
        </div>

        {/* Action Panel Buttons */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-1.5 font-bold text-xs"
          >
            <MessageSquare className="h-4 w-4 text-primary" />
            {isRtl ? 'دردشة' : 'Chat'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsQuoteDialogOpen(true)}
            className="flex items-center gap-1.5 font-bold text-xs"
          >
            <Tag className="h-4 w-4 text-primary" />
            {isRtl ? 'طلب سعر' : 'Get Quote'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleOpenComparison}
            className="flex items-center gap-1.5 font-bold text-xs"
          >
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            {isRtl ? 'مقارنة' : 'Compare'}
          </Button>

          {isEmergencyCategory && (
            <Button variant="destructive" onClick={handleEmergencySOS} className="animate-pulse">
              <AlertTriangle className="mr-1.5 h-4 w-4" />
              SOS Emergency
            </Button>
          )}
        </div>
      </header>

      {/* 3. Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* About section */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline font-bold text-xl">
                {isRtl ? 'حول النشاط التجاري' : `About ${listing.name}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="leading-relaxed text-muted-foreground">{listing.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 pt-2">
                {[
                  { label: isRtl ? 'واي فاي مجاني' : 'Free Wi-Fi', active: true },
                  { label: isRtl ? 'موقف سيارات متاح' : 'Parking Space', active: true },
                  { label: isRtl ? 'يقبل بطاقات الدفع' : 'Card Payments', active: true },
                  { label: isRtl ? 'مناسب للعائلات' : 'Kid Friendly', active: false },
                  { label: isRtl ? 'مدخل ذوي الاحتياجات الخاصة' : 'Wheelchair Access', active: true },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <CheckCircle className={`h-4.5 w-4.5 ${item.active ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Galleries Section */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline font-bold text-xl">
                {isRtl ? 'معرض الصور والفيديو' : 'Media Gallery'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {listing.images.map((src, index) => (
                  <div
                    key={index}
                    className="aspect-video rounded-xl overflow-hidden border shadow-sm group cursor-pointer relative"
                  >
                    <img
                      src={src}
                      alt="gallery visual"
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Eye className="h-5 w-5" />
                    </div>
                  </div>
                ))}

                <div className="aspect-video rounded-xl border bg-slate-900 flex flex-col items-center justify-center text-center p-4 text-white relative cursor-pointer">
                  <Video className="h-6 w-6 text-primary mb-1 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase">
                    {isRtl ? 'شاهد عرض الفيديو' : 'Play Video Promo'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products & listings widgets */}
          {storeListing?.products && storeListing.products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline font-bold text-xl flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  {isRtl ? 'المنتجات والخدمات المعروضة' : 'Products & Services Menu'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {storeListing.products.map((product) => (
                    <ProductItemCard
                      key={product.id}
                      product={product}
                      onAddWithInstallation={handleAddWithInstallation}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Special deals */}
          {storeListing?.groupOrderItems && storeListing.groupOrderItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline font-bold text-xl">
                  {isRtl ? 'صفقات شراء جماعي مميزة' : 'Group Order Deals'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {storeListing.groupOrderItems.map((item) => (
                    <GroupOrderItemCard key={item.id} item={item} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* FAQ section */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline font-bold text-xl flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                {isRtl ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {defaultFaqs.map((faq, idx) => (
                <div key={idx} className="space-y-1">
                  <h5 className="font-bold text-sm text-foreground">Q: {faq.question}</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-4 border-l border-primary/30">
                    A: {faq.answer}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upgraded Review Center */}
          <div id="reviews" className="space-y-4">
            <h3 className="font-headline font-bold text-xl text-foreground">
              {isRtl ? 'تقييمات وآراء العملاء الموثقة' : 'Verified Reviews & Structured Ratings'}
            </h3>
            <ReviewList
              targetId={listing.id}
              targetType={listing.type === 'store' ? 'store' : 'professional'}
              targetTitle={listing.name}
              canReply={user?.id === (listing as any).ownerId}
            />
          </div>
        </div>

        {/* Right Side Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Booking Widget Panel */}
          <Card className="shadow-lg border-2 border-primary/20 sticky top-20 bg-card">
            <CardHeader className="bg-primary/5 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-headline font-bold text-lg">
                  {isRtl ? 'حجز موعد فوري' : 'Book Instantly'}
                </CardTitle>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">
                  {isRtl ? 'مؤكد تلقائياً' : 'Auto Confirm'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs font-semibold">
              <div className="flex items-center gap-3 border-b pb-2">
                <CalendarClock className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                    {isRtl ? 'مواعيد العمل اليوم' : 'Hours Open Today'}
                  </span>
                  <span className="text-foreground">{listing.operatingHours || '09:00 AM - 07:00 PM'}</span>
                </div>
              </div>

              {listing.pricing && (
                <div className="flex items-center gap-3 border-b pb-2">
                  <Tag className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                      {isRtl ? 'فئة السعر' : 'Price Level'}
                    </span>
                    <span className="text-foreground text-sm font-bold text-emerald-600">{listing.pricing}</span>
                  </div>
                </div>
              )}

              <Button
                type="button"
                onClick={() => setIsBookingDrawerOpen(true)}
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-headline font-bold py-6 text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CalendarClock className="h-4.5 w-4.5" />
                {isRtl ? 'احجز الآن' : 'Schedule Appointment'}
              </Button>
            </CardContent>
          </Card>

          {/* Details & Contact info */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline font-bold text-base">
                {isRtl ? 'بيانات الاتصال' : 'Business Info'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-semibold text-muted-foreground">
              {listing.location.fullAddress && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    {listing.location.fullAddress}, {listing.location.city}
                  </span>
                </div>
              )}

              {listing.contact.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4.5 w-4.5 text-primary shrink-0" />
                  <a href={`tel:${listing.contact.phone}`} className="text-foreground hover:underline">
                    {listing.contact.phone}
                  </a>
                </div>
              )}

              {listing.contact.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4.5 w-4.5 text-primary shrink-0" />
                  <a href={`mailto:${listing.contact.email}`} className="text-foreground hover:underline truncate">
                    {listing.contact.email}
                  </a>
                </div>
              )}

              {listing.contact.website && (
                <div className="flex items-center gap-2.5">
                  <Globe className="h-4.5 w-4.5 text-primary shrink-0" />
                  <a
                    href={listing.contact.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground hover:underline truncate"
                  >
                    {listing.contact.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-3.5 pt-3 border-t justify-center">
                <a href="#" className="p-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-full transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="p-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-full transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" className="p-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-full transition-colors">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" className="p-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-full transition-colors">
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Yelp Modular drawers & overlays integration */}
      <BookingDrawer
        isOpen={isBookingDrawerOpen}
        onOpenChange={setIsBookingDrawerOpen}
        listingName={listing.name}
        providerId={listing.id}
      />

      <QuoteRequestDialog
        isOpen={isQuoteDialogOpen}
        onOpenChange={setIsQuoteDialogOpen}
        categoryName={listing.category}
      />

      {listing && (
        <FloatingChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          targetUserId={(listing as any).ownerId || listing.id}
          targetUserName={listing.name}
          targetUserAvatar={(listing as any).logoUrl || (listing as any).imageUrl || ''}
          targetRole={listing.type === 'store' ? 'store_owner' : 'service_provider'}
          conversationType={listing.type === 'store' ? 'customer_store' : 'customer_provider'}
          contextType={listing.type === 'store' ? 'store' : 'provider'}
          contextId={listing.id}
          contextTitle={listing.name}
          contextSubtitle={listing.type === 'store' ? 'Store Inquiry' : 'Service Inquiry'}
        />
      )}

      {isComparisonOpen && comparisonTarget && (
        <ComparisonModal
          isOpen={isComparisonOpen}
          onOpenChange={setIsComparisonOpen}
          listingA={listing}
          listingB={comparisonTarget}
        />
      )}

      {/* Existing installer and SOS modals */}
      {currentProductForInstallation && (
        <Dialog open={isTechnicianModalOpen} onOpenChange={setIsTechnicianModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-1.5">
                <Cog className="text-primary h-5 w-5" />
                Select Installer for {currentProductForInstallation.installationTaskName}
              </DialogTitle>
              <DialogDesc>Choose a technician to assemble your product.</DialogDesc>
            </DialogHeader>
            <ScrollArea className="max-h-[50vh] pr-4">
              {availableInstallers.map((installer) => (
                <Card key={installer.id} className="p-3 my-2 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">{installer.name}</h4>
                      <StarRating rating={installer.averageRating} size={14} />
                    </div>
                    <Button size="sm" onClick={() => handleSelectTechnician(installer)}>
                      Choose ({installer.standardInstallationPrice} DA)
                    </Button>
                  </div>
                </Card>
              ))}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      <EmergencySOSDialog
        isOpen={isSosDialogOpen}
        onOpenChange={setIsSosDialogOpen}
        defaultServiceType={currentSosServiceType}
      />
    </div>
  );
}
