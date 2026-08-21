
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
import { ArrowLeft, UploadCloud, PackagePlus, Sparkles, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function NewPartRequestPage() {
  const { toast } = useToast();
  const [partName, setPartName] = useState('');
  const [partDescription, setPartDescription] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Post New Part Request | Marketplace | Khidmatik';
  }, []);

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

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 300)); 

    console.log("Part Request Submitted:", {
      partName,
      partDescription,
      categorySlug,
      deviceModel,
      urgency,
    });

    toast({
      title: "Part Request Submitted!",
      description: "Your request has been posted. Our AI will start searching for matches and notify relevant sellers.",
      variant: "default",
      duration: 4000, 
    });

    setPartName('');
    setPartDescription('');
    setCategorySlug('');
    setDeviceModel('');
    setUrgency('');
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
            Post a New Part Request
          </CardTitle>
          <CardDescription>
            Describe the spare part you need. The more details you provide, the better the AI can match it with available parts or notify potential sellers.
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
                placeholder="e.g., Samsung Washing Machine Drain Pump, iPhone X Screen"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="partDescription" className="font-semibold">Detailed Description *</Label>
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

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 text-md" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting Request...' : 'Submit Part Request'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
