
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCheck, ShieldCheck, FileUp, Award, Loader2, Info, BadgeCheck, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';

interface VerifiedBadge {
  name: string;
  description: string;
  icon: any;
}

interface VerificationStatus {
  identity: 'Approved' | 'Pending' | 'Rejected' | 'Not Submitted';
  commercialLicense: 'Approved' | 'Pending' | 'Rejected' | 'Not Submitted' | 'Not Applicable';
  qualifications: 'Approved' | 'Pending' | 'Rejected' | 'Not Submitted';
}

export function ProviderVerificationSection() {
  const { toast } = useToast();
  const { language } = useLanguage();

  const t = (key: string, def: string) => {
    const dict: Record<string, Record<string, string>> = {
      ar: {
        title: 'التحقق والشارات المهنية',
        desc: 'إدارة عمليات التحقق من الهوية والسجل التجاري والشهادات لبناء الثقة وجذب المزيد من العملاء.',
        statusTitle: 'حالة وثائق التحقق',
        statusDesc: 'تابع حالة المستندات التي قمت بتقديمها.',
        idVerify: 'التحقق من الهوية (بطاقة التعريف الوطنية / جواز السفر)',
        licenseVerify: 'السجل التجاري / الترخيص التجاري (إن وجد)',
        qualsVerify: 'الشهادات والمؤهلات المهنية',
        submitDoc: 'تقديم المستند للمراجعة',
        uploading: 'جاري الرفع...',
        notRequired: 'غير مطلوب لفئتك المهنية.',
        demoPanelTitle: 'لوحة التحكم الإدارية (محاكاة العرض التجريبي)',
        demoPanelDesc: 'بصفتك مختبراً للمنصة، يمكنك محاكاة موافقة أو رفض الإدارة على المستندات المرفوعة فوراً لرؤية الشارات المكتسبة.',
        approve: 'قبول',
        reject: 'رفض',
        badgesTitle: 'الشارات المهنية المكتسبة',
        badgesDesc: 'تظهر هذه الشارات على ملفك الشخصي لتؤكد مصداقيتك للعملاء.',
        notEarned: 'لم تكتسب بعد. أكمل خطوات التحقق المطلوبة.',
        verifiedBadge: 'موثق الهوية',
        verifiedBadgeDesc: 'تم التحقق من وثائق الهوية الشخصية بنجاح.',
        businessBadge: 'سجل تجاري مسجل',
        businessBadgeDesc: 'تم تأكيد تسجيل النشاط التجاري.',
        qualsBadge: 'مؤهلات معتمدة',
        qualsBadgeDesc: 'تم التحقق من الشهادات والخبرات المهنية.',
        proBadge: 'محترف Khidmatik Pro',
        proBadgeDesc: 'شارة المهنيين الأكثر ثقة والأعلى تقييماً في المنصة.',
        approved: 'مقبول',
        pending: 'قيد المراجعة',
        rejected: 'مرفوض',
        notSubmitted: 'غير مقدم',
        notApplicable: 'غير مطلوب'
      },
      fr: {
        title: 'Vérification & Badges',
        desc: 'Gérez vos vérifications d\'identité, d\'entreprise et de diplômes pour instaurer la confiance.',
        statusTitle: 'Statut des Documents',
        statusDesc: 'Suivez l\'état de validation de vos justificatifs.',
        idVerify: 'Vérification d\'Identité (CNI / Passeport)',
        licenseVerify: 'Registre du Commerce / Licence (si applicable)',
        qualsVerify: 'Qualifications & Certificats Professionnels',
        submitDoc: 'Soumettre pour examen',
        uploading: 'Téléversement...',
        notRequired: 'Non requis pour votre catégorie professionnelle.',
        demoPanelTitle: 'Panneau d\'Administration Demo (Simulation)',
        demoPanelDesc: 'Simulez instantanément l\'approbation ou le rejet par l\'administration pour voir les badges s\'activer.',
        approve: 'Approuver',
        reject: 'Rejeter',
        badgesTitle: 'Mes Badges Professionnels',
        badgesDesc: 'Ces badges s\'affichent sur votre profil public pour rassurer les clients.',
        notEarned: 'Pas encore obtenu. Complétez les étapes requises.',
        verifiedBadge: 'Identité Vérifiée',
        verifiedBadgeDesc: 'Documents d\'identité validés avec succès.',
        businessBadge: 'Commerce Enregistré',
        businessBadgeDesc: 'Enregistrement commercial validé.',
        qualsBadge: 'Diplômes Certifiés',
        qualsBadgeDesc: 'Qualifications et diplômes validés.',
        proBadge: 'Khidmatik Pro',
        proBadgeDesc: 'Badge accordé aux professionnels les plus fiables.',
        approved: 'Approuvé',
        pending: 'En Attente',
        rejected: 'Rejeté',
        notSubmitted: 'Non Soumis',
        notApplicable: 'Non Applicable'
      },
      en: {
        title: 'Verification & Badges',
        desc: 'Manage your identity, business, and qualification verifications to build trust and unlock platform features.',
        statusTitle: 'Verification Status',
        statusDesc: 'Keep your verification documents up-to-date.',
        idVerify: 'Identity Verification (National ID / Passport)',
        licenseVerify: 'Commercial License / Registration (If applicable)',
        qualsVerify: 'Professional Qualifications/Certificates',
        submitDoc: 'Submit Document',
        uploading: 'Uploading...',
        notRequired: 'Not required for your professional category.',
        demoPanelTitle: 'Admin Demo Review Panel (Simulation)',
        demoPanelDesc: 'As a demo user, simulate instant admin approval or rejection of uploaded documents to see badges update.',
        approve: 'Approve',
        reject: 'Reject',
        badgesTitle: 'My Earned Badges',
        badgesDesc: 'Badges displayed on your profile to highlight your credibility and achievements.',
        notEarned: 'Not yet earned. Complete relevant verification steps.',
        verifiedBadge: 'ID Verified',
        verifiedBadgeDesc: 'Identity documents successfully verified.',
        businessBadge: 'Business Registered',
        businessBadgeDesc: 'Commercial registration confirmed (if applicable).',
        qualsBadge: 'Qualifications Certified',
        qualsBadgeDesc: 'Professional qualifications and certifications validated.',
        proBadge: 'Khidmatik Pro',
        proBadgeDesc: 'Top-rated and highly trusted professional on the platform.',
        approved: 'Approved',
        pending: 'Pending',
        rejected: 'Rejected',
        notSubmitted: 'Not Submitted',
        notApplicable: 'Not Applicable'
      }
    };
    return dict[language]?.[key] || dict['en']?.[key] || def;
  };

  const [status, setStatus] = useState<VerificationStatus>({
    identity: 'Approved',
    commercialLicense: 'Not Applicable',
    qualifications: 'Pending',
  });

  const [isUploadingId, setIsUploadingId] = useState(false);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [isUploadingQuals, setIsUploadingQuals] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('khidmatik_verification_status');
    if (stored) {
      try {
        setStatus(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveStatus = (newStatus: VerificationStatus) => {
    setStatus(newStatus);
    localStorage.setItem('khidmatik_verification_status', JSON.stringify(newStatus));
  };

  const handleFileUpload = async (fileType: 'identity' | 'commercialLicense' | 'qualifications', setIsUploadingState: React.Dispatch<React.SetStateAction<boolean>>) => {
    setIsUploadingState(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsUploadingState(false);
    
    const updated = {
      ...status,
      [fileType]: 'Pending' as const
    };
    saveStatus(updated);

    toast({
      title: 'Document Uploaded',
      description: 'Your document has been submitted for review. Use the Admin Demo Review Panel to simulate approval.',
    });
  };

  // Demo Review Simulation Triggers
  const simulateReview = (type: 'identity' | 'commercialLicense' | 'qualifications', decision: 'Approved' | 'Rejected') => {
    const updated = {
      ...status,
      [type]: decision
    };
    saveStatus(updated);
    toast({
      title: `Document ${decision}`,
      description: `Successfully simulated admin review decision: ${decision.toUpperCase()}`,
      variant: decision === 'Approved' ? 'default' : 'destructive'
    });
  };

  const getStatusBadgeColor = (val: string) => {
    switch (val) {
      case 'Approved': return 'bg-green-500 text-white';
      case 'Pending': return 'bg-amber-500 text-white animate-pulse';
      case 'Rejected': return 'bg-red-500 text-white';
      case 'Not Applicable': return 'bg-slate-100 text-slate-700 border';
      default: return 'bg-slate-200 text-slate-700';
    }
  };

  const getStatusLabel = (val: string) => {
    switch (val) {
      case 'Approved': return t('approved', 'Approved');
      case 'Pending': return t('pending', 'Pending');
      case 'Rejected': return t('rejected', 'Rejected');
      case 'Not Applicable': return t('notApplicable', 'Not Required');
      default: return t('notSubmitted', 'Not Submitted');
    }
  };

  const mockAvailableBadges: VerifiedBadge[] = [
    { name: t('verifiedBadge', 'ID Verified'), icon: ShieldCheck, description: t('verifiedBadgeDesc', 'Identity documents successfully verified.') },
    { name: t('businessBadge', 'Business Registered'), icon: ShieldCheck, description: t('businessBadgeDesc', 'Commercial registration confirmed.') },
    { name: t('qualsBadge', 'Qualifications Certified'), icon: Award, description: t('qualsBadgeDesc', 'Professional qualifications and certifications validated.') },
    { name: t('proBadge', 'Khidmatik Pro'), icon: BadgeCheck, description: t('proBadgeDesc', 'Top-rated and highly trusted professional.') },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
          <UserCheck className="h-8 w-8 text-primary" /> {t('title', 'Verification & Badges')}
        </h1>
        <p className="text-muted-foreground">{t('desc', 'Manage verification status.')}</p>
      </header>

      {/* Admin Demo Review Simulator Widget */}
      <Card className="border-primary/50 bg-primary/5 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
            <Orbit className="h-4 w-4 text-primary animate-spin" /> {t('demoPanelTitle', 'Admin Demo Review Panel (Simulation)')}
          </CardTitle>
          <CardDescription className="text-xs text-slate-600">{t('demoPanelDesc', 'Simulate approvals.')}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 border rounded-lg bg-white flex flex-col justify-between gap-3 text-xs">
            <span className="font-bold block text-slate-700 border-b pb-1">{t('idVerify', 'Identity')}</span>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => simulateReview('identity', 'Approved')}><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {t('approve', 'Approve')}</Button>
              <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => simulateReview('identity', 'Rejected')}><XCircle className="h-3.5 w-3.5 mr-1" /> {t('reject', 'Reject')}</Button>
            </div>
          </div>
          <div className="p-3 border rounded-lg bg-white flex flex-col justify-between gap-3 text-xs">
            <span className="font-bold block text-slate-700 border-b pb-1">{t('licenseVerify', 'Business')}</span>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => simulateReview('commercialLicense', 'Approved')}><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {t('approve', 'Approve')}</Button>
              <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => simulateReview('commercialLicense', 'Rejected')}><XCircle className="h-3.5 w-3.5 mr-1" /> {t('reject', 'Reject')}</Button>
            </div>
          </div>
          <div className="p-3 border rounded-lg bg-white flex flex-col justify-between gap-3 text-xs">
            <span className="font-bold block text-slate-700 border-b pb-1">{t('qualsVerify', 'Qualifications')}</span>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => simulateReview('qualifications', 'Approved')}><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {t('approve', 'Approve')}</Button>
              <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => simulateReview('qualifications', 'Rejected')}><XCircle className="h-3.5 w-3.5 mr-1" /> {t('reject', 'Reject')}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary"/> {t('statusTitle', 'Verification Status')}</CardTitle>
          <CardDescription>{t('statusDesc', 'Keep documents up-to-date.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Identity Verification */}
          <div className="p-4 border rounded-md bg-muted/30 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-sm">{t('idVerify', 'Identity')}</h4>
              <Badge className={getStatusBadgeColor(status.identity)}>
                {getStatusLabel(status.identity)}
              </Badge>
            </div>
            {status.identity !== 'Approved' && (
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <Input type="file" accept=".pdf,.jpg,.jpeg" disabled={isUploadingId} className="bg-white" />
                </div>
                <Button size="sm" onClick={() => handleFileUpload('identity', setIsUploadingId)} disabled={isUploadingId} className="w-full sm:w-auto">
                  {isUploadingId ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <FileUp className="h-4 w-4 mr-1.5" />}
                  {isUploadingId ? t('uploading', 'Uploading...') : t('submitDoc', 'Submit')}
                </Button>
              </div>
            )}
          </div>

          {/* Commercial License Verification */}
          <div className="p-4 border rounded-md bg-muted/30 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-sm">{t('licenseVerify', 'Business')}</h4>
              <Badge className={getStatusBadgeColor(status.commercialLicense)}>
                {getStatusLabel(status.commercialLicense)}
              </Badge>
            </div>
            {status.commercialLicense !== 'Approved' && status.commercialLicense !== 'Not Applicable' && (
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <Input type="file" accept=".pdf,.jpg,.jpeg" disabled={isUploadingLicense} className="bg-white" />
                </div>
                <Button size="sm" onClick={() => handleFileUpload('commercialLicense', setIsUploadingLicense)} disabled={isUploadingLicense} className="w-full sm:w-auto">
                  {isUploadingLicense ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <FileUp className="h-4 w-4 mr-1.5" />}
                  {isUploadingLicense ? t('uploading', 'Uploading...') : t('submitDoc', 'Submit')}
                </Button>
              </div>
            )}
            {status.commercialLicense === 'Not Applicable' && (
              <p className="text-xs text-muted-foreground">{t('notRequired', 'Not required.')}</p>
            )}
          </div>
          
          {/* Qualifications Verification */}
          <div className="p-4 border rounded-md bg-muted/30 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-sm">{t('qualsVerify', 'Qualifications')}</h4>
              <Badge className={getStatusBadgeColor(status.qualifications)}>
                {getStatusLabel(status.qualifications)}
              </Badge>
            </div>
            {status.qualifications !== 'Approved' && (
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <Input type="file" accept=".pdf,.jpg,.jpeg" multiple disabled={isUploadingQuals} className="bg-white" />
                </div>
                <Button size="sm" onClick={() => handleFileUpload('qualifications', setIsUploadingQuals)} disabled={isUploadingQuals} className="w-full sm:w-auto">
                  {isUploadingQuals ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <FileUp className="h-4 w-4 mr-1.5" />}
                  {isUploadingQuals ? t('uploading', 'Uploading...') : t('submitDoc', 'Submit')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-xs rtl:space-x-reverse">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-700" />
            <p>Verification helps build trust with clients and may unlock additional platform features or higher visibility. Submitted documents are reviewed by our team. This process can take 24-48 hours.</p>
          </div>
        </CardFooter>
      </Card>

      {/* Badges Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary"/> {t('badgesTitle', 'My Earned Badges')}</CardTitle>
          <CardDescription>{t('badgesDesc', 'Credibility badges.')}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockAvailableBadges.map(badge => {
            const BadgeIcon = badge.icon || Award;
            const hasBadge = 
              (badge.name === t('verifiedBadge', 'ID Verified') && status.identity === 'Approved') ||
              (badge.name === t('businessBadge', 'Business Registered') && status.commercialLicense === 'Approved') ||
              (badge.name === t('qualsBadge', 'Qualifications Certified') && status.qualifications === 'Approved') ||
              (badge.name === t('proBadge', 'Khidmatik Pro')); // Always earned for demo

            return (
              <div key={badge.name} className={`p-4 border rounded-lg flex flex-col justify-between gap-3 ${hasBadge ? 'bg-green-50 border-green-200 text-green-800' : 'bg-muted/20 opacity-50 text-slate-500'}`}>
                <div className="flex items-start gap-3">
                  <BadgeIcon className={`h-8 w-8 shrink-0 ${hasBadge ? 'text-green-600' : 'text-slate-400'}`} />
                  <div>
                    <h5 className="font-bold text-sm">{badge.name}</h5>
                    <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                  </div>
                </div>
                {!hasBadge && (
                  <span className="text-[10px] text-amber-600 font-semibold">{t('notEarned', 'Not Earned')}</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// Add simple helper component mapping since Orbit is imported dynamic but let's check Lucide exports
function Orbit({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M3 16a9 9 0 0 1 18-8" />
      <path d="M21 8a9 9 0 0 1-18 8" />
    </svg>
  );
}


