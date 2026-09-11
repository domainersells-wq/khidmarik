'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  MessageSquare, 
  ShieldCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  Phone, 
  MapPin, 
  Wrench, 
  KeyRound, 
  Radio, 
  Smartphone,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface WhatsAppNotificationCardProps {
  customerName?: string;
  orderNumber: string;
  technicianName?: string;
  technicianPhone?: string;
  technicianAvatar?: string;
  technicianProfession?: string;
  installationDate?: string;
  startOtpCode?: string;
  completionOtpCode?: string;
  trackingLink?: string;
}

export function WhatsAppNotificationCard({
  customerName = 'أمين بن علي',
  orderNumber = 'KHD-ORD-2026-8801',
  technicianName = 'كريم بلحاج',
  technicianPhone = '0661 23 45 67',
  technicianAvatar = 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80',
  technicianProfession = 'فني تكييف وتبريد معتمد',
  installationDate = 'غداً في تمام الساعة 09:30 صباحاً',
  startOtpCode = '849201',
  completionOtpCode = '631584',
  trackingLink = 'https://khidmatik.dz/track/KHD-ORD-2026-8801',
}: WhatsAppNotificationCardProps) {
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);
  const [smsSent, setSmsSent] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOtp(text);
    toast({
      title: `تم نسخ ${label}`,
      description: text,
    });
    setTimeout(() => setCopiedOtp(null), 2500);
  };

  const handleSimulateSmsFallback = () => {
    setSmsSent(true);
    toast({
      title: 'تم إرسال رسالة SMS مجانية كبديل للطوارئ',
      description: `تم إرسال رموز التحقق ${startOtpCode} و ${completionOtpCode} إلى هاتفك بنجاح في حال ضعف تغطية الإنترنت.`,
    });
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto text-right">
      {/* WhatsApp Message Bubble Simulation */}
      <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-background to-card p-5 shadow-lg space-y-4">
        {/* WhatsApp Header Badge */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 px-3 py-1">
            <MessageSquare className="h-3.5 w-3.5 fill-white" />
            <span>إشعار WhatsApp Business الرسمي</span>
          </Badge>
          <span className="text-[11px] text-muted-foreground font-mono">Verified Service Alert</span>
        </div>

        {/* Message Content */}
        <div className="space-y-3 text-sm leading-relaxed text-foreground">
          <p>
            مرحباً بك يا <strong>{customerName}</strong> 👋،
          </p>
          <p className="text-muted-foreground text-xs">
            تم بنجاح تأكيد صفقتك المتكاملة رقم <strong className="text-foreground font-mono">{orderNumber}</strong>، وتعيين الفني المعتمد الخاص بك لتركيب الجهاز بضمان رسمي:
          </p>

          {/* Craftsman Mini Card */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-background/90 border border-emerald-500/30 shadow-xs flex-row-reverse">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-500 shrink-0">
              <Image
                src={technicianAvatar}
                alt={technicianName}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">
                  معتمد وموثق ID
                </Badge>
                <h4 className="font-bold text-sm text-foreground">{technicianName}</h4>
              </div>
              <p className="text-xs text-muted-foreground">{technicianProfession}</p>
              <div className="flex items-center justify-end gap-2 text-xs font-semibold text-primary pt-0.5">
                <span>{technicianPhone}</span>
                <Phone className="h-3 w-3" />
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-2.5 rounded-lg text-xs space-y-1">
            <p className="font-semibold text-foreground">
              📅 موعد الزيارة والتركيب: <span className="text-primary">{installationDate}</span>
            </p>
            <p className="text-muted-foreground">
              📍 تم التنسيق التلقائي ليصل الفني مع وصول مندوب شحن الجهاز.
            </p>
          </div>

          {/* Dual Step OTP Protection */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
              <KeyRound className="h-4 w-4" />
              <span>رموز الأمان والحماية المزدوجة (Dual-Step OTP)</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              لا تعطي الرمز الأول إلا عند وصول الفني وبدء العمل، والرمز الثاني عند انتهاء التركيب واختبار الجهاز بنجاح:
            </p>
            
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Start OTP */}
              <div className="p-2 bg-background rounded-lg border text-center space-y-1">
                <span className="text-[10px] text-muted-foreground block">رمز بدء العمل (START OTP)</span>
                <div className="flex items-center justify-center gap-1.5">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-muted-foreground"
                    onClick={() => copyToClipboard(startOtpCode, 'رمز البدء')}
                  >
                    {copiedOtp === startOtpCode ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  <span className="font-mono font-black text-sm text-foreground tracking-wider">{startOtpCode}</span>
                </div>
              </div>

              {/* Completion OTP */}
              <div className="p-2 bg-background rounded-lg border text-center space-y-1">
                <span className="text-[10px] text-muted-foreground block">رمز الإتمام والضمان (COMPLETION OTP)</span>
                <div className="flex items-center justify-center gap-1.5">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-muted-foreground"
                    onClick={() => copyToClipboard(completionOtpCode, 'رمز الإتمام')}
                  >
                    {copiedOtp === completionOtpCode ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  <span className="font-mono font-black text-sm text-foreground tracking-wider">{completionOtpCode}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-border flex flex-col sm:flex-row gap-2">
          <Button 
            asChild
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs gap-1.5"
          >
            <a href={trackingLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              فتح رابط التتبع المباشر بالواتساب
            </a>
          </Button>

          <Button
            variant="outline"
            onClick={handleSimulateSmsFallback}
            disabled={smsSent}
            className="rounded-xl text-xs gap-1.5 font-semibold"
          >
            <Smartphone className="h-3.5 w-3.5 text-primary" />
            {smsSent ? 'تم إرسال SMS الطوارئ' : 'إرسال الرموز عبر SMS بديلة'}
          </Button>
        </div>
      </div>
    </div>
  );
}
