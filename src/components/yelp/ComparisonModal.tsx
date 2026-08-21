'use client';

import type { Listing } from '@/types';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogClose, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { StarRating } from '@/components/listings/StarRating';
import { 
  Check, X, Phone, MapPin, Tag, Globe, 
  CheckSquare, ArrowRightLeft, ShieldCheck 
} from 'lucide-react';

interface ComparisonModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  listingA: Listing;
  listingB: Listing;
}

export function ComparisonModal({ isOpen, onOpenChange, listingA, listingB }: ComparisonModalProps) {
  const { language } = useLanguage();

  const getFeatures = (item: Listing) => {
    return (item as any).features || {
      wifi: false,
      parking: false,
      accepts_card: false,
      kid_friendly: false,
      accessible: false,
      delivery: false
    };
  };

  const featuresA = getFeatures(listingA);
  const featuresB = getFeatures(listingB);
  const isRtl = language === 'ar';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-headline font-bold text-xl flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary animate-pulse" />
            {isRtl ? 'مقارنة الخدمات والأنشطة' : 'Compare Services & Listings'}
          </DialogTitle>
          <DialogDescription>
            {isRtl ? 'مقارنة تفصيلية جنباً إلى جنب لمساعدتك في اتخاذ القرار الأفضل.' : 'Detailed side-by-side comparison to help you choose the best provider.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3.5 py-4 text-sm">
          {/* Attributes Column */}
          <div className="space-y-4 font-bold text-muted-foreground self-end pb-3">
            <div>{isRtl ? 'الاسم' : 'Name'}</div>
            <div className="h-14"></div> {/* spacer for image */}
            <div className="pt-2">{isRtl ? 'التقييم' : 'Rating'}</div>
            <div className="pt-2">{isRtl ? 'عدد المراجعات' : 'Reviews'}</div>
            <div className="pt-2">{isRtl ? 'مستوى السعر' : 'Price Level'}</div>
            <div className="pt-2">{isRtl ? 'المدينة' : 'City'}</div>
            <div className="pt-2">{isRtl ? 'الدفع بالبطاقة' : 'Accepts Cards'}</div>
            <div className="pt-2">{isRtl ? 'موقف سيارات' : 'Parking'}</div>
            <div className="pt-2">{isRtl ? 'واي فاي مجاني' : 'Free Wi-Fi'}</div>
            <div className="pt-2">{isRtl ? 'التوصيل' : 'Delivery'}</div>
            <div className="pt-2">{isRtl ? 'رقم الهاتف' : 'Phone'}</div>
          </div>

          {/* Listing A Column */}
          <div className="bg-muted/30 p-3 rounded-xl border space-y-4 text-center flex flex-col items-center">
            <h4 className="font-headline font-bold text-sm text-foreground line-clamp-1">{listingA.name}</h4>
            <img 
              src={listingA.images[0] || 'https://placehold.co/150x100.png'} 
              alt={listingA.name} 
              className="w-full h-20 object-cover rounded-lg border shadow-sm" 
            />
            
            <div className="pt-1.5 flex justify-center">
              <StarRating rating={listingA.averageRating} size={14} />
            </div>
            
            <div>{listingA.reviews.length}</div>
            
            <div>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">{listingA.pricing || '$$'}</span>
            </div>
            
            <div className="truncate w-full">{listingA.location.city}</div>
            
            <div>
              {featuresA.accepts_card ? <Check className="h-5 w-5 text-emerald-500 mx-auto" /> : <X className="h-5 w-5 text-destructive mx-auto" />}
            </div>
            <div>
              {featuresA.parking ? <Check className="h-5 w-5 text-emerald-500 mx-auto" /> : <X className="h-5 w-5 text-destructive mx-auto" />}
            </div>
            <div>
              {featuresA.wifi ? <Check className="h-5 w-5 text-emerald-500 mx-auto" /> : <X className="h-5 w-5 text-destructive mx-auto" />}
            </div>
            <div>
              {featuresA.delivery ? <Check className="h-5 w-5 text-emerald-500 mx-auto" /> : <X className="h-5 w-5 text-destructive mx-auto" />}
            </div>
            
            <div className="text-xs truncate w-full font-semibold">{listingA.contact.phone || 'N/A'}</div>
          </div>

          {/* Listing B Column */}
          <div className="bg-muted/30 p-3 rounded-xl border space-y-4 text-center flex flex-col items-center">
            <h4 className="font-headline font-bold text-sm text-foreground line-clamp-1">{listingB.name}</h4>
            <img 
              src={listingB.images[0] || 'https://placehold.co/150x100.png'} 
              alt={listingB.name} 
              className="w-full h-20 object-cover rounded-lg border shadow-sm" 
            />
            
            <div className="pt-1.5 flex justify-center">
              <StarRating rating={listingB.averageRating} size={14} />
            </div>
            
            <div>{listingB.reviews.length}</div>
            
            <div>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">{listingB.pricing || '$$'}</span>
            </div>
            
            <div className="truncate w-full">{listingB.location.city}</div>
            
            <div>
              {featuresB.accepts_card ? <Check className="h-5 w-5 text-emerald-500 mx-auto" /> : <X className="h-5 w-5 text-destructive mx-auto" />}
            </div>
            <div>
              {featuresB.parking ? <Check className="h-5 w-5 text-emerald-500 mx-auto" /> : <X className="h-5 w-5 text-destructive mx-auto" />}
            </div>
            <div>
              {featuresB.wifi ? <Check className="h-5 w-5 text-emerald-500 mx-auto" /> : <X className="h-5 w-5 text-destructive mx-auto" />}
            </div>
            <div>
              {featuresB.delivery ? <Check className="h-5 w-5 text-emerald-500 mx-auto" /> : <X className="h-5 w-5 text-destructive mx-auto" />}
            </div>
            
            <div className="text-xs truncate w-full font-semibold">{listingB.contact.phone || 'N/A'}</div>
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="ghost" className="w-full">
              {isRtl ? 'إغلاق' : 'Close'}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ComparisonModal;
