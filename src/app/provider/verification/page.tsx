'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ShieldCheck, CheckCircle2, Clock, AlertTriangle, 
  UploadCloud, FileText, ArrowRight, UserCheck, 
  Store, Briefcase, RefreshCw, XCircle, Eye, ArrowLeft, BadgeCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { providerVerificationService } from '@/services/providerVerificationService';
import { 
  ProviderVerificationProfile, 
  VerificationDocumentCategory,
  ProviderVerificationStatus 
} from '@/types/providerVerification';

export default function ProviderVerificationPage() {
  const { toast } = useToast();
  const providerId = 'prv_1'; // Active provider session

  const [profile, setProfile] = useState<ProviderVerificationProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'history'>('profile');
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [legalName, setLegalName] = useState('');
  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [businessTradeName, setBusinessTradeName] = useState('');
  const [businessStructure, setBusinessStructure] = useState<'individual_artisan' | 'registered_sole_proprietorship' | 'sarl_eurl' | 'other'>('individual_artisan');
  const [tradeRegistryNumber, setTradeRegistryNumber] = useState('');
  const [taxIdNumber, setTaxIdNumber] = useState('');
  const [artisanCardNumber, setArtisanCardNumber] = useState('');
  const [wilaya, setWilaya] = useState('Algiers (16)');
  const [address, setAddress] = useState('');

  // Document Upload State
  const [uploadCategory, setUploadCategory] = useState<VerificationDocumentCategory>('IDENTITY_NATIONAL_ID');
  const [uploadFileUrl, setUploadFileUrl] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const loadProfile = () => {
    setIsLoading(true);
    const data = providerVerificationService.getVerificationProfile(providerId);
    if (data) {
      setProfile(data);
      setLegalName(data.legalName || '');
      setNationalIdNumber(data.nationalIdNumber || '');
      setDateOfBirth(data.dateOfBirth || '');
      setBusinessTradeName(data.businessTradeName || '');
      setBusinessStructure(data.businessStructure || 'individual_artisan');
      setTradeRegistryNumber(data.tradeRegistryNumber || '');
      setTaxIdNumber(data.taxIdNumber || '');
      setArtisanCardNumber(data.artisanCardNumber || '');
      setWilaya(data.wilaya || 'Algiers (16)');
      setAddress(data.address || '');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const res = providerVerificationService.submitProfileInfo({
      providerId,
      legalName,
      nationalIdNumber,
      dateOfBirth,
      businessTradeName,
      businessStructure,
      tradeRegistryNumber,
      taxIdNumber,
      artisanCardNumber,
      wilaya,
      address,
    });

    if (res.success && res.profile) {
      setProfile(res.profile);
      toast({
        title: 'Profile Details Saved ✓',
        description: 'Identity and business details recorded. Please upload your verification documents.',
      });
      setActiveTab('documents');
    }
  };

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileUrl.trim() || !uploadFileName.trim()) {
      toast({ title: 'File Info Required', description: 'Please enter file name and document URL.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const res = providerVerificationService.uploadVerificationDocument({
        providerId,
        documentCategory: uploadCategory,
        fileName: uploadFileName,
        fileUrl: uploadFileUrl,
      });

      if (res.success && res.profile) {
        setProfile(res.profile);
        setUploadFileName('');
        setUploadFileUrl('');
        toast({
          title: 'Document Uploaded ✓',
          description: `Document attached to verification dossier.`,
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitForReview = () => {
    setIsSubmittingReview(true);
    try {
      const res = providerVerificationService.submitApplicationForReview(providerId);
      if (res.success && res.profile) {
        setProfile(res.profile);
        toast({
          title: 'KYC Dossier Submitted! 🚀',
          description: 'Your application is now Under Review by our compliance team.',
        });
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading || !profile) {
    return <div className="p-12 text-center text-muted-foreground">Loading verification dossier...</div>;
  }

  const steps = [
    { title: 'Phone Verified', completed: profile.phoneVerified },
    { title: 'Legal Profile', completed: !!profile.legalName },
    { title: 'KYC Documents', completed: profile.documents.length > 0 },
    { title: 'Official Review', completed: profile.status === 'VERIFIED' },
  ];

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Button asChild size="sm" variant="ghost" className="rounded-xl text-xs gap-1.5">
            <Link href="/profile">
              <ArrowLeft className="h-4 w-4" /> Back to Account
            </Link>
          </Button>
        </div>

        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-primary/10 via-card to-card border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase px-2.5 py-0.5 rounded-full">
                KYC Verification Portal
              </Badge>
              <span className="text-xs text-muted-foreground">• Official Merchant & Artisan Onboarding</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" /> Provider Identity & Business Verification
            </h1>
            <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
              Verify your legal identity, trade register, or artisan credentials to unlock trusted provider status, priority search placement, and higher payout limits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {profile.verifiedBadgeActive ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 shadow-sm">
                <BadgeCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block">
                    ✓ Verified Provider
                  </span>
                  <span className="text-[10px] text-muted-foreground">Official Badge Active</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-background border rounded-2xl text-right shadow-sm">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                  Current Status
                </span>
                <Badge variant="outline" className="font-bold text-xs uppercase mt-1">
                  {profile.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* 4-Step Progress Indicator */}
        <Card className="border shadow-sm bg-card rounded-2xl p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {steps.map((st, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${st.completed ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  {st.completed ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                </div>
                <span className={`text-xs font-semibold ${st.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {st.title}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Action Required / Rejection Banners */}
        {profile.status === 'ACTION_REQUIRED' && (
          <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Additional Documents Required</p>
              <p>{profile.actionRequiredNotes}</p>
            </div>
          </div>
        )}

        {profile.status === 'REJECTED' && (
          <div className="p-4 bg-rose-500/10 border-2 border-rose-500/30 rounded-2xl flex items-start gap-3 text-xs text-rose-800 dark:text-rose-300">
            <XCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Verification Application Rejected</p>
              <p>{profile.rejectionReason}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b text-xs font-semibold gap-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-1 border-b-2 transition-all ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          >
            1. Identity & Business Profile
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-3 px-1 border-b-2 transition-all ${activeTab === 'documents' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          >
            2. KYC Documents ({profile.documents.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-1 border-b-2 transition-all ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          >
            3. Verification Audit Trail
          </button>
        </div>

        {/* Tab 1: Identity & Business Details */}
        {activeTab === 'profile' && (
          <Card className="border shadow-sm bg-card rounded-2xl">
            <form onSubmit={handleSaveProfile}>
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" /> Legal & Business Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Enter your official legal details as registered on national databases.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Full Legal Name (as on National ID) *</Label>
                    <Input
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      placeholder="e.g. Sofiane Hadj"
                      required
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">National Biometric ID / Passport Number *</Label>
                    <Input
                      value={nationalIdNumber}
                      onChange={(e) => setNationalIdNumber(e.target.value)}
                      placeholder="18-digit National ID number"
                      required
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Date of Birth</Label>
                    <Input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Wilaya of Operation *</Label>
                    <Input
                      value={wilaya}
                      onChange={(e) => setWilaya(e.target.value)}
                      placeholder="e.g. Algiers (16)"
                      required
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
                    Commercial & Qualification Credentials
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Business / Trade Name</Label>
                      <Input
                        value={businessTradeName}
                        onChange={(e) => setBusinessTradeName(e.target.value)}
                        placeholder="e.g. Plomberie Express Hadj"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Trade Registry (RC) Number (if merchant)</Label>
                      <Input
                        value={tradeRegistryNumber}
                        onChange={(e) => setTradeRegistryNumber(e.target.value)}
                        placeholder="e.g. 16/00-0982312A22"
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Artisan Qualification Card # (if artisan)</Label>
                      <Input
                        value={artisanCardNumber}
                        onChange={(e) => setArtisanCardNumber(e.target.value)}
                        placeholder="e.g. ART-ALG-2021-8842"
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Tax ID (NIF / NIS) Number</Label>
                      <Input
                        value={taxIdNumber}
                        onChange={(e) => setTaxIdNumber(e.target.value)}
                        placeholder="e.g. 001916029384910"
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Physical Workshop / Storefront Address</Label>
                    <Textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street address, building, floor, city..."
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4 bg-muted/20 border-t flex justify-end">
                <Button type="submit" className="font-semibold text-xs rounded-xl h-9">
                  Save & Continue to Documents <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Tab 2: Document Uploads & Review Submission */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            
            {/* Upload Box */}
            <Card className="border shadow-sm bg-card rounded-2xl p-5">
              <form onSubmit={handleUploadDocument} className="space-y-4 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <UploadCloud className="h-5 w-5 text-primary" /> Upload Identity & Qualification Document
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Document Type *</Label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as VerificationDocumentCategory)}
                      className="w-full h-9 rounded-xl border bg-background px-3 text-xs font-medium"
                    >
                      <option value="IDENTITY_NATIONAL_ID">National ID Card (Recto/Verso)</option>
                      <option value="IDENTITY_PASSPORT">Biometric Passport</option>
                      <option value="ARTISAN_CARD">Artisan Professional Card</option>
                      <option value="TRADE_REGISTER_RC">Trade Register (Registre de Commerce)</option>
                      <option value="TAX_CARD_NIF">Tax Registration Card (NIF/NIS)</option>
                      <option value="DIPLOMA_CERTIFICATE">Vocational Diploma / Qualification</option>
                      <option value="PROOF_OF_ADDRESS">Proof of Address (Utility Bill)</option>
                      <option value="PROFILE_PHOTO">Official Profile Photo</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">File Title / Label *</Label>
                    <Input
                      value={uploadFileName}
                      onChange={(e) => setUploadFileName(e.target.value)}
                      placeholder="e.g. carte_artisan_2026.pdf"
                      required
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Secure File URL *</Label>
                    <Input
                      value={uploadFileUrl}
                      onChange={(e) => setUploadFileUrl(e.target.value)}
                      placeholder="https://example.com/doc.pdf"
                      required
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[11px] text-muted-foreground">
                    🔒 Documents are encrypted and protected by strict Row Level Security.
                  </span>
                  <Button type="submit" disabled={isUploading} size="sm" className="rounded-xl h-8 text-xs font-semibold">
                    {isUploading ? 'Attaching...' : 'Attach Document'}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Attached Documents List */}
            <Card className="border shadow-sm bg-card rounded-2xl overflow-hidden">
              <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" /> Attached KYC Documents ({profile.documents.length})
                </span>
              </div>

              <div className="divide-y text-xs">
                {profile.documents.length > 0 ? (
                  profile.documents.map((doc) => (
                    <div key={doc.id} className="p-4 flex items-center justify-between gap-3 hover:bg-muted/10">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{doc.fileName}</p>
                          <p className="text-[11px] text-muted-foreground capitalize">
                            {doc.documentCategory.replace(/_/g, ' ')} • Uploaded {doc.uploadedAt}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={
                            doc.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                              : 'bg-muted text-muted-foreground'
                          }
                        >
                          {doc.status}
                        </Badge>
                        <Button asChild size="sm" variant="ghost" className="h-8 text-xs">
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground italic">
                    No documents attached yet. Please upload your national ID and qualifications above.
                  </div>
                )}
              </div>

              {profile.status !== 'VERIFIED' && profile.status !== 'UNDER_REVIEW' && (
                <div className="p-4 bg-muted/20 border-t flex justify-end">
                  <Button
                    onClick={handleSubmitForReview}
                    disabled={isSubmittingReview || profile.documents.length === 0}
                    className="bg-primary font-bold text-xs rounded-xl h-9 px-5"
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Application for Official Review'}
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Tab 3: History & Audit Log */}
        {activeTab === 'history' && (
          <Card className="border shadow-sm bg-card rounded-2xl p-5 space-y-3">
            <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" /> Verification Audit History
            </span>

            <div className="space-y-3 border-l-2 border-primary/30 pl-4 ml-2 py-1 text-xs">
              {profile.history.map((h) => (
                <div key={h.id} className="relative space-y-0.5">
                  <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{h.action.replace(/_/g, ' ')}</span>
                    <span className="text-muted-foreground font-mono text-[10px]">{h.createdAt}</span>
                  </div>
                  <p className="text-muted-foreground text-[11px]">{h.notes}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
