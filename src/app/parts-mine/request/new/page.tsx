
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { partCategories } from '@/data/mock'; 
import { ArrowLeft, UploadCloud, PackagePlus, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { partsService } from '@/services/partsService';

export default function NewPartRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [partName, setPartName] = useState('');
  const [partDescription, setPartDescription] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set document title on client side
  if (typeof window !== 'undefined') {
    document.title = 'Post New Part Request | The Parts Mine';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim() || !partDescription.trim() || !categorySlug) {
      toast({
        title: "Missing Information",
        description: "Please fill in Part Name, Description, and Category.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "تسجيل الدخول مطلوب / Login Required",
        description: "يرجى تسجيل الدخول أولاً لنشر طلب قطعة غيار.",
        variant: "destructive"
      });
      router.push('/login?redirect=/parts-mine/request/new');
      return;
    }

    setIsSubmitting(true);
    try {
      await partsService.requestPart({
        userId: user.id,
        partName: partName.trim(),
        partDescription: partDescription.trim(),
        categorySlug,
        deviceModel: deviceModel.trim(),
        urgency: urgency ? urgency : 'medium',
        imageUrls: [],
      });

      toast({
        title: "تم نشر طلب القطعة بنجاح! / Request Submitted!",
        description: "تم نشر طلبك بنجاح. سيقوم النظام بمطابقته وإشعار البائعين المعنيين.",
        variant: "default",
        duration: 5000,
      });

      router.push('/parts-mine');
    } catch (err: any) {
      console.error("Error submitting part request:", err);
      toast({
        title: "خطأ في إرسال الطلب / Submission Error",
        description: err.message || "تعذر حفظ طلب القطعة في قاعدة البيانات.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/parts-mine" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to The Parts Mine
      </Link>
      <Card className="shadow-xl border-border">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-headline flex items-center">
            <PackagePlus className="mr-3 h-8 w-8 text-primary" />
            Post a New Part Request
          </CardTitle>
          <CardDescription>
            Describe the spare part you need. The more details you provide, the better the AI can match it with available parts or notify potential sellers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="partName" className="font-semibold">Part Name / Title</Label>
              <Input
                id="partName"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                placeholder="e.g., Samsung Washing Machine Drain Pump, iPhone X Screen"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="partDescription" className="font-semibold">Detailed Description</Label>
              <Textarea
                id="partDescription"
                value={partDescription}
                onChange={(e) => setPartDescription(e.target.value)}
                placeholder="Provide as much detail as possible: specific model numbers of the part OR the device it's from, symptoms of the broken part, dimensions, connectors, etc."
                rows={5}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="categorySlug" className="font-semibold">Part Category</Label>
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
                <Label htmlFor="deviceModel" className="font-semibold">Original Device Name / Model (if known)</Label>
                <Input
                  id="deviceModel"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  placeholder="e.g., Dell XPS 13 9370, Toyota Corolla 2015"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="urgency" className="font-semibold">Urgency</Label>
              <Select value={urgency} onValueChange={(val) => setUrgency(val as 'low' | 'medium' | 'high' | '')}>
                <SelectTrigger id="urgency" className="mt-1">
                  <SelectValue placeholder="How urgently do you need this part?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Not very urgent</SelectItem>
                  <SelectItem value="medium">Medium - Needed soon</SelectItem>
                  <SelectItem value="high">High - Urgent replacement needed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="p-4 border-2 border-dashed rounded-md bg-muted/30">
                <Label htmlFor="partImage" className="font-semibold flex items-center mb-2">
                    <UploadCloud className="mr-2 h-5 w-5 text-primary" />
                    Upload Images/Videos (Optional)
                </Label>
                <div className="text-center space-y-1">
                    <p className="text-sm text-muted-foreground">
                        Photo & video upload functionality is coming soon. 
                        Clear images/videos greatly help in matching your part!
                    </p>
                    <p className="text-xs text-muted-foreground">
                        (Supports PNG, JPG, MP4 - Max 10MB)
                    </p>
                    <Button variant="outline" type="button" className="mt-2" disabled>
                        <UploadCloud className="mr-2 h-4 w-4" /> Choose Files (Disabled)
                    </Button>
                </div>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm flex items-start gap-2">
                <Sparkles className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                    <span className="font-semibold">AI Matching:</span> Our system will try to match your request with listed parts and notify potential sellers.
                </div>
            </div>

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 text-md flex items-center justify-center gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>جاري إرسال الطلب... / Submitting Request...</span>
                </>
              ) : (
                'إرسال طلب القطعة / Submit Part Request'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
