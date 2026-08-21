'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter, DialogClose 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/context/LanguageContext';
import { yelpService } from '@/services/yelpService';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { FileText, MapPin, DollarSign, Image as ImageIcon, CheckCircle, Send } from 'lucide-react';

interface QuoteRequestDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
}

export function QuoteRequestDialog({ isOpen, onOpenChange, categoryName }: QuoteRequestDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleUploadImage = () => {
    // Add mock upload item
    setImages(prev => [...prev, 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&fit=crop']);
    toast({ title: language === 'ar' ? 'تم رفع صورة المشروع' : 'Project photo uploaded successfully (Mock)' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login Required',
        description: language === 'ar' ? 'يرجى تسجيل الدخول لتقديم طلب عرض السعر.' : 'Please log in to submit a quote request.',
        variant: "destructive"
      });
      return;
    }

    if (!description.trim()) {
      toast({ title: language === 'ar' ? 'الرجاء إدخال الوصف' : 'Description is required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await yelpService.createQuoteRequest(user.id, {
        description: `[Request for ${categoryName}] ` + description,
        location,
        budget: parseFloat(budget) || 0,
        imageUrls: images
      });

      setIsSuccess(true);
      toast({
        title: language === 'ar' ? 'تم إرسال الطلب' : 'Request Broadcasted',
        description: language === 'ar' ? 'تم تعميم طلبك على مقدمي الخدمة القريبين.' : 'Your request was sent to local service providers.'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setLocation('');
    setBudget('');
    setImages([]);
    setIsSuccess(false);
  };

  const isRtl = language === 'ar';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if(!open) resetForm(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline font-bold text-xl flex items-center gap-1.5">
            <FileText className="h-5 w-5 text-primary" />
            {isRtl ? `طلب عرض سعر لقسم ${categoryName}` : `Request a Quote for ${categoryName}`}
          </DialogTitle>
          <DialogDescription>
            {isRtl ? 'أدخل تفاصيل مشروعك وسنقوم بتوصيل طلبك لمجموعة من أفضل الحرفيين والشركات للحصول على عروض تنافسية.' : 'Provide your project details to get competitive quotes from top local businesses.'}
          </DialogDescription>
        </DialogHeader>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            
            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground block">{isRtl ? 'وصف العمل المطلوب *' : 'Describe the work *'}</label>
              <Textarea
                placeholder={isRtl ? 'اشرح بالتفصيل العمل الذي تحتاجه، المواد المطلوبة، والمواعيد المفضلة...' : 'Describe what needs to be done, specific dimensions, materials, preferred timing...'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground block">{isRtl ? 'الموقع وعنوان العمل' : 'Location of Service'}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={isRtl ? 'العنوان أو الحي (مثال: وسط المدينة، سيدي بلعباس)' : 'e.g. Center, Sidi Bel Abbes'}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground block">{isRtl ? 'الميزانية التقريبية (بالدينار الجزائري)' : 'Approximate Budget (DA)'}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-muted-foreground">DA</span>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Attach Photos */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground block">{isRtl ? 'أضف صور توضيحية للمشروع' : 'Project Photos'}</label>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUploadImage}
                  className="flex items-center gap-1 text-xs"
                >
                  <ImageIcon className="h-4 w-4 text-primary" />
                  {isRtl ? 'رفع صورة' : 'Upload Photo'}
                </Button>
                
                {/* Photo previews */}
                <div className="flex gap-2">
                  {images.map((url, idx) => (
                    <img key={idx} src={url} alt="project thumbnail" className="w-10 h-10 object-cover rounded-lg border shadow-sm" />
                  ))}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/95 font-headline font-bold text-base py-5 rounded-xl flex items-center justify-center gap-2"
            >
              <Send className="h-4.5 w-4.5" />
              {isRtl ? 'إرسال طلب عرض السعر' : 'Submit and Get Quotes'}
            </Button>
          </form>
        ) : (
          /* Success Screen */
          <div className="space-y-6 py-6 text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-full">
              <CheckCircle className="h-10 w-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="font-headline font-bold text-xl text-foreground">
                {isRtl ? 'تم إرسال طلبك للجميع!' : 'Your Request is Live!'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {isRtl 
                  ? `قمنا بإرسال طلبك للعديد من مزودي خدمات ${categoryName} الموثوقين في منطقتك. ستتلقى عروض الأسعار ورسائل الدردشة قريباً في ملفك الشخصي.` 
                  : `We've broadcasted your request to top-rated ${categoryName} providers in your area. You will receive quotes and chat notifications in your profile shortly.`}
              </p>
            </div>

            <div className="bg-popover border p-3.5 rounded-xl inline-flex items-center gap-2.5 text-xs text-muted-foreground font-semibold">
              <Send className="h-4 w-4 text-primary animate-pulse" />
              <span>{isRtl ? 'الطلب نشط وبانتظار ردود المزودين' : 'Quotes matching status: Active.'}</span>
            </div>

            <DialogClose asChild>
              <Button type="button" onClick={resetForm} className="w-full">
                {isRtl ? 'حسناً، فهمت' : 'Awesome, Got It'}
              </Button>
            </DialogClose>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default QuoteRequestDialog;
