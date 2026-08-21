
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { UserCircle, Briefcase, Image as ImageIcon, Video, FileText as FileTextIcon, Star, Link2, Edit3, UploadCloud, Eye, Award, Trash2, Plus, EyeOff, Shield, Medal, Crown, Gem, Sparkles, Lock, Share2, Percent, Settings, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { storeService } from '@/services/storeService';
import { mapPlanToTier, TIER_THEMES, hexToHslTriple, type SubscriptionTier } from '@/lib/subscriptionTheme';
import { SubscriptionPlansModal } from './SubscriptionPlansModal';

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  mediaType: string;
  url: string;
}

interface PromoCoupon {
  code: string;
  discountPercent: number;
  expiryDate: string;
  isActive: boolean;
}

interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
  reply?: string;
}

interface ProviderProfile {
  fullName: string;
  professionalTitle: string;
  specialization: string;
  profileBio: string;
  personalWebsite: string;
  linkedinProfile: string;
  otherPortfolio: string;
  profilePhoto: string;
  coverImage: string;
  portfolioItems: PortfolioItem[];
}

export function DynamicProfileModulesSection() {
  const { toast } = useToast();
  const { language } = useLanguage();

  const t = (key: string, def: string) => {
    const dict: Record<string, Record<string, string>> = {
      ar: {
        title: 'الملف الشخصي العام',
        desc: 'إدارة وتخصيص كيفية ظهور ملفك المهني للعملاء.',
        infoTitle: 'معلومات الملف الشخصي',
        infoDesc: 'قم بتحديث التفاصيل الأساسية المعروضة في ملفك الشخصي العام ليجدك العملاء.',
        fullName: 'الاسم الكامل (المعروض)',
        profTitle: 'العنوان المهني / الشعار',
        spec: 'مجال التخصص / الصناعة',
        bio: 'السيرة الذاتية / نبذة عني',
        editInfo: 'تعديل معلومات الملف الشخصي',
        brandingTitle: 'الصورة الشخصية والهوية التجارية',
        brandingDesc: 'إدارة الصورة الشخصية وصورة الغلاف الاختيارية لصفحة ملفك الشخصي.',
        uploadPhoto: 'تغيير الصورة الشخصية',
        uploadCover: 'تغيير صورة الغلاف',
        badgesTitle: 'شاراتي المكتسبة',
        badgesDesc: 'عرض الشارات المكتسبة على المنصة (مثال: موثق، الأعلى تقييماً).',
        portfolioTitle: 'إدارة معرض الأعمال',
        portfolioDesc: 'اعرض أعمالك من خلال الصور ومقاطع الفيديو ودراسات الحالة لجذب العملاء.',
        managePortfolio: 'إدارة عناصر معرض الأعمال',
        reviewsTitle: 'التقييمات والمراجعات العامة',
        reviewsDesc: 'عرض تعليقات العملاء وإدارة سمعتك المهنية والرد على المراجعات.',
        viewReviews: 'عرض والرد على التقييمات',
        linksTitle: 'الروابط الخارجية',
        linksDesc: 'إدارة روابط موقعك الشخصي وحساباتك المهنية الأخرى.',
        website: 'الموقع الشخصي / رابط معرض الأعمال',
        linkedin: 'رابط حساب LinkedIn',
        behance: 'رابط حساب Behance / Dribbble',
        updateLinks: 'تحديث الروابط الخارجية',
        save: 'حفظ التغييرات',
        close: 'إغلاق',
        addItem: 'إضافة عمل جديد',
        itemTitle: 'عنوان العمل',
        itemCategory: 'تصنيف العمل',
        mediaType: 'نوع الوسائط',
        url: 'رابط العمل / الصورة',
        delete: 'حذف',
        verified: 'تم التحقق من الهوية',
        topRated: 'مهني الأعلى تقييماً',
        quickResponder: 'سريع الاستجابة',
        pro: 'مقدم خدمة محترف',
        customPhoto: 'تخصيص رابط الصورة',
        selectSample: 'أو اختر صورة نموذجية',
        customCover: 'تخصيص رابط صورة الغلاف',
        selectCover: 'أو اختر غلافاً نموذجياً',
        activePlan: 'الباقة الحالية',
        previewPlan: 'معاينة الباقة',
        lockedFeature: 'ميزة مقفلة',
        upgradeRequired: 'مطلوب ترقية الاشتراك',
        unlockBranding: 'الترقية إلى الباقة البلاتينية أو الماسية مطلوبة لتخصيص الهوية التجارية.',
        limitReached: 'لقد تجاوزت الحد الأقصى المسموح به لهذه الباقة.',
        upgradeMessage: 'قم بترقية حسابك لفتح الميزات والروابط غير المحدودة!'
      },
      fr: {
        title: 'Mon Profil Public',
        desc: 'Gérez et personnalisez la façon dont les clients voient votre profil professionnel.',
        infoTitle: 'Informations du Profil',
        infoDesc: 'Mettez à jour les détails essentiels affichés sur votre profil public.',
        fullName: 'Nom Complet (Affiché)',
        profTitle: 'Titre Professionnel / Slogan',
        spec: 'Secteur de Spécialisation',
        bio: 'Biographie / À Propos de Moi',
        editInfo: 'Modifier les Infos de Profil',
        brandingTitle: 'Photo de Profil & Image de Couverture',
        brandingDesc: 'Gérez votre photo de profil et l\'image de couverture facultative.',
        uploadPhoto: 'Changer la Photo de Profil',
        uploadCover: 'Changer la Couverture',
        badgesTitle: 'Mes Badges',
        badgesDesc: 'Visualisez les badges obtenus (ex : Vérifié, Top Rédacteur).',
        portfolioTitle: 'Gestion du Portfolio',
        portfolioDesc: 'Présentez vos travaux pour attirer de nouveaux clients.',
        managePortfolio: 'Gérer les Éléments du Portfolio',
        reviewsTitle: 'Avis & Évaluations Publics',
        reviewsDesc: 'Consultez les retours clients et gérez votre réputation.',
        viewReviews: 'Voir & Répondre aux Avis',
        linksTitle: 'Liens Externes',
        linksDesc: 'Gérez les liens vers votre site web et vos réseaux sociaux.',
        website: 'Site Personnel / URL Portfolio',
        linkedin: 'Profil LinkedIn',
        behance: 'Profil Behance / Dribbble',
        updateLinks: 'Mettre à jour les Liens',
        save: 'Enregistrer',
        close: 'Fermer',
        addItem: 'Ajouter au Portfolio',
        itemTitle: 'Titre de l\'élément',
        itemCategory: 'Catégorie',
        mediaType: 'Type de média',
        url: 'URL du média',
        delete: 'Supprimer',
        verified: 'Identité Vérifiée',
        topRated: 'Prestataire Top Note',
        quickResponder: 'Réponse Rapide',
        pro: 'Khidmatik Pro',
        customPhoto: 'URL Photo Personnalisée',
        selectSample: 'Ou choisir une image exemple',
        customCover: 'URL Couverture Personnalisée',
        selectCover: 'Ou choisir une couverture exemple',
        activePlan: 'Plan Actif',
        previewPlan: 'Aperçu du Plan',
        lockedFeature: 'Fonctionnalité Verrouillée',
        upgradeRequired: 'Mise à niveau requise',
        unlockBranding: 'La mise à niveau vers Platinum ou Diamond est requise pour personnaliser l\'image de marque.',
        limitReached: 'Vous avez atteint le nombre maximum d\'éléments autorisés pour ce niveau.',
        upgradeMessage: 'Mettez à niveau votre compte pour débloquer des fonctionnalités illimitées !'
      },
      en: {
        title: 'My Public Profile',
        desc: 'Manage and customize how clients see your professional profile.',
        infoTitle: 'Profile Information',
        infoDesc: 'Update core details displayed on your public profile. This is how clients find you.',
        fullName: 'Full Name (As Displayed)',
        profTitle: 'Professional Title / Tagline',
        spec: 'Industry / Specialization Field',
        bio: 'Short Bio / About Me',
        editInfo: 'Edit Profile Info',
        brandingTitle: 'Profile Photo & Branding',
        brandingDesc: 'Manage profile picture and optional cover image for your profile page.',
        uploadPhoto: 'Upload/Change Profile Photo',
        uploadCover: 'Upload/Change Cover Image',
        badgesTitle: 'My Badges',
        badgesDesc: 'View badges earned on the platform (e.g., Verified, Top Rated).',
        portfolioTitle: 'Portfolio Management',
        portfolioDesc: 'Showcase your work through images, videos, and PDF case studies.',
        managePortfolio: 'Manage Portfolio Items',
        reviewsTitle: 'My Public Reviews & Ratings',
        reviewsDesc: 'View client feedback and manage your public reputation.',
        viewReviews: 'View & Respond to My Reviews',
        linksTitle: 'External Links',
        linksDesc: 'Manage links to your personal website and professional social media profiles.',
        website: 'Personal Website / Portfolio URL',
        linkedin: 'LinkedIn Profile URL',
        behance: 'Behance / Dribbble / Other Portfolio URL',
        updateLinks: 'Update External Links',
        save: 'Save Changes',
        close: 'Close',
        addItem: 'Add Portfolio Item',
        itemTitle: 'Item Title',
        itemCategory: 'Category',
        mediaType: 'Media Type',
        url: 'Media/Image URL',
        delete: 'Delete',
        verified: 'ID Verified',
        topRated: 'Top Rated Professional',
        quickResponder: 'Quick Responder',
        pro: 'Khidmatik Pro',
        customPhoto: 'Custom Photo URL',
        selectSample: 'Or select a sample image',
        customCover: 'Custom Cover URL',
        selectCover: 'Or select a sample cover',
        activePlan: 'Active Plan',
        previewPlan: 'Preview Plan',
        lockedFeature: 'Locked Feature',
        upgradeRequired: 'Subscription Upgrade Required',
        unlockBranding: 'Upgrading to Platinum or Diamond tier is required to customize branding details.',
        limitReached: 'You have reached the maximum items allowed for this tier.',
        upgradeMessage: 'Upgrade your account to unlock unlimited items!'
      }
    };
    return dict[language]?.[key] || dict['en']?.[key] || def;
  };

  const defaultProfile: ProviderProfile = {
    fullName: 'Amine Khelifa',
    professionalTitle: 'Expert Web Developer & Designer',
    specialization: 'Software Engineering / Full-Stack Development',
    profileBio: 'Passionate full stack developer with 8+ years of experience building beautiful high-performance web applications using React, Next.js, and Node.js. Ready to bring your digital vision to life.',
    personalWebsite: 'https://www.aminekhelifa.dev',
    linkedinProfile: 'https://www.linkedin.com/in/aminekhelifa',
    otherPortfolio: 'https://www.behance.net/aminekhelifa',
    profilePhoto: 'https://placehold.co/150x150.png?text=Amine',
    coverImage: 'https://placehold.co/1200x400.png?text=Professional+Cover',
    portfolioItems: [
      { id: 'port_1', title: 'Khidmatik Marketplace UI', category: 'Web Development', mediaType: 'Image', url: 'https://placehold.co/600x400.png?text=Khidmatik+UI' },
      { id: 'port_2', title: 'E-Commerce Platform Algerie', category: 'Full-Stack Integration', mediaType: 'Image', url: 'https://placehold.co/600x400.png?text=E-Commerce' },
      { id: 'port_3', title: 'Algerian Artisans Platform', category: 'UI/UX Design', mediaType: 'Image', url: 'https://placehold.co/600x400.png?text=Artisans+UX' }
    ]
  };

  const [profile, setProfile] = useState<ProviderProfile>(defaultProfile);

  // Modal Open States
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isLinksOpen, setIsLinksOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [isCoverOpen, setIsCoverOpen] = useState(false);

  // Subscription states
  const [actualTier, setActualTier] = useState<SubscriptionTier>('free');
  const selectedTier = actualTier; // Always lock layout and features to actual subscription plan!
  const [isUpgradePromptOpen, setIsUpgradePromptOpen] = useState(false);
  const [upgradePromptReason, setUpgradePromptReason] = useState('');

  // Coupon Creator states
  const [coupons, setCoupons] = useState<PromoCoupon[]>([
    { code: 'WELCOME10', discountPercent: 10, expiryDate: '2026-12-31', isActive: true },
    { code: 'SUMMER25', discountPercent: 25, expiryDate: '2026-08-31', isActive: true },
  ]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(15);
  const [newCouponExpiry, setNewCouponExpiry] = useState('2026-09-30');

  // AI SEO Generator states
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [seoDescription, setSeoDescription] = useState('');
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);

  // Custom Branding Layout settings
  const [customAccentColor, setCustomAccentColor] = useState('#a855f7');
  const [customFrameShape, setCustomFrameShape] = useState<'circle' | 'rounded-square' | 'hexagon'>('circle');

  // Customer Reviews & Replies states
  const [reviews, setReviews] = useState<Review[]>([
    { id: 'rev_1', clientName: 'Mohamed Slimani', rating: 5, comment: 'عمل ممتاز وسريع جداً، التزام تام بالوقت ودقة عالية في التفاصيل.', date: '2026-07-15' },
    { id: 'rev_2', clientName: 'Faten Bouazza', rating: 4, comment: 'تواصل راقي وخدمة ممتازة، قمنا ببعض التعديلات البسيطة وتم تنفيذها بسرعة.', date: '2026-07-10' },
  ]);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [tempReplyText, setTempReplyText] = useState('');

  // Form states for modals
  const [tempFullName, setTempFullName] = useState('');
  const [tempTitle, setTempTitle] = useState('');
  const [tempSpec, setTempSpec] = useState('');
  const [tempBio, setTempBio] = useState('');

  const [tempWebsite, setTempWebsite] = useState('');
  const [tempLinkedin, setTempLinkedin] = useState('');
  const [tempBehance, setTempBehance] = useState('');

  const [newPortTitle, setNewPortTitle] = useState('');
  const [newPortCategory, setNewPortCategory] = useState('');
  const [newPortMediaType, setNewPortMediaType] = useState('Image');
  const [newPortUrl, setNewPortUrl] = useState('');

  const [tempPhotoUrl, setTempPhotoUrl] = useState('');
  const [tempCoverUrl, setTempCoverUrl] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    const loadFromDb = async () => {
      if (!user || !user.storeId) return;
      try {
        const store: any = await storeService.getStoreById(user.storeId);
        if (store) {
          const tier = mapPlanToTier(store.subscriptionPlan);
          setActualTier(tier);
          setProfile({
            fullName: store.name,
            professionalTitle: store.tagline || '',
            specialization: store.category || '',
            profileBio: store.description || '',
            personalWebsite: store.contact.website || '',
            linkedinProfile: localStorage.getItem(`li_${user.id}`) || '',
            otherPortfolio: localStorage.getItem(`beh_${user.id}`) || '',
            profilePhoto: store.storeLogoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${store.name}`,
            coverImage: store.bannerImageUrl || 'https://placehold.co/1200x400.png?text=Professional+Cover',
            portfolioItems: JSON.parse(localStorage.getItem(`port_${user.id}`) || '[]'),
          });
        }
      } catch (e) {
        console.error('Failed to load profile from database:', e);
      }
    };
    loadFromDb();
  }, [user]);

  const saveProfile = async (updatedProfile: ProviderProfile) => {
    setProfile(updatedProfile);
    
    // Save to local storage for local-only fields
    if (user?.id) {
      localStorage.setItem(`li_${user.id}`, updatedProfile.linkedinProfile);
      localStorage.setItem(`beh_${user.id}`, updatedProfile.otherPortfolio);
      localStorage.setItem(`port_${user.id}`, JSON.stringify(updatedProfile.portfolioItems));
    }

    if (!user || !user.storeId) return;

    try {
      // 1. Update store record in Supabase
      const { error: storeError } = await supabase
        .from('stores')
        .update({
          name: updatedProfile.fullName,
          tagline: updatedProfile.professionalTitle,
          category: updatedProfile.specialization,
          description: updatedProfile.profileBio,
          store_logo_url: updatedProfile.profilePhoto,
          banner_image_url: updatedProfile.coverImage,
          website: updatedProfile.personalWebsite,
        })
        .eq('id', user.storeId);

      if (storeError) throw storeError;

      // 2. Update profiles table to sync user display name and avatar
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: updatedProfile.fullName,
          avatar_url: updatedProfile.profilePhoto,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

    } catch (e: any) {
      console.error('Failed to save profile to Supabase:', e);
      toast({
        title: 'Database Update Failed',
        description: e.message || 'Could not sync profile with remote database.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenInfo = () => {
    setTempFullName(profile.fullName);
    setTempTitle(profile.professionalTitle);
    setTempSpec(profile.specialization);
    setTempBio(profile.profileBio);
    setIsInfoOpen(true);
  };

  const handleSaveInfo = () => {
    const updated = {
      ...profile,
      fullName: tempFullName,
      professionalTitle: tempTitle,
      specialization: tempSpec,
      profileBio: tempBio
    };
    saveProfile(updated);
    setIsInfoOpen(false);
    toast({ title: t('save', 'Saved'), description: 'Profile information updated successfully.' });
  };

  const handleOpenLinks = () => {
    setTempWebsite(profile.personalWebsite);
    setTempLinkedin(profile.linkedinProfile);
    setTempBehance(profile.otherPortfolio);
    setIsLinksOpen(true);
  };

  const handleSaveLinks = () => {
    const updated = {
      ...profile,
      personalWebsite: tempWebsite,
      linkedinProfile: tempLinkedin,
      otherPortfolio: tempBehance
    };
    saveProfile(updated);
    setIsLinksOpen(false);
    toast({ title: t('save', 'Saved'), description: 'External links updated successfully.' });
  };

  const handleAddPortfolioItem = () => {
    const limit = getPortfolioLimit(selectedTier);
    if (profile.portfolioItems.length >= limit) {
      toast({
        title: t('lockedFeature', 'Locked Feature'),
        description: `${t('limitReached', 'You have reached the maximum items allowed for this tier.')} ${t('upgradeMessage', 'Upgrade your account to unlock unlimited items!')}`,
        variant: 'destructive',
      });
      return;
    }
    if (!newPortTitle.trim() || !newPortCategory.trim()) return;
    const newItem: PortfolioItem = {
      id: 'port_' + Date.now(),
      title: newPortTitle,
      category: newPortCategory,
      mediaType: newPortMediaType,
      url: newPortUrl.trim() || 'https://placehold.co/600x400.png?text=' + encodeURIComponent(newPortTitle)
    };
    const updated = {
      ...profile,
      portfolioItems: [...profile.portfolioItems, newItem]
    };
    saveProfile(updated);
    setNewPortTitle('');
    setNewPortCategory('');
    setNewPortUrl('');
    toast({ title: 'Portfolio Updated', description: 'New portfolio item added successfully.' });
  };

  const handleDeletePortfolioItem = (id: string) => {
    const updated = {
      ...profile,
      portfolioItems: profile.portfolioItems.filter(item => item.id !== id)
    };
    saveProfile(updated);
    toast({ title: 'Portfolio Updated', description: 'Portfolio item removed successfully.' });
  };

  const handleSavePhoto = (url: string) => {
    const updated = {
      ...profile,
      profilePhoto: url
    };
    saveProfile(updated);
    setIsPhotoOpen(false);
    toast({ title: 'Branding Updated', description: 'Profile photo updated successfully.' });
  };

  const handleSaveCover = (url: string) => {
    const updated = {
      ...profile,
      coverImage: url
    };
    saveProfile(updated);
    setIsCoverOpen(false);
    toast({ title: 'Branding Updated', description: 'Cover image updated successfully.' });
  };

  const handleAddCoupon = () => {
    if (!newCouponCode.trim() || newCouponDiscount <= 0) return;
    const isExist = coupons.some(c => c.code.toUpperCase() === newCouponCode.toUpperCase());
    if (isExist) {
      toast({
        title: language === 'ar' ? 'رمز موجود' : 'Code Exists',
        description: language === 'ar' ? 'هذا الرمز الترويجي موجود بالفعل.' : 'This promo code already exists.',
        variant: 'destructive',
      });
      return;
    }
    const newC: PromoCoupon = {
      code: newCouponCode.toUpperCase().trim(),
      discountPercent: newCouponDiscount,
      expiryDate: newCouponExpiry,
      isActive: true,
    };
    setCoupons([...coupons, newC]);
    setNewCouponCode('');
    toast({
      title: language === 'ar' ? 'تم إنشاء الكوبون' : 'Coupon Created',
      description: language === 'ar' ? `تم إنشاء كود الخصم ${newC.code} بنجاح.` : `Promo code ${newC.code} created successfully.`
    });
  };

  const handleToggleCoupon = (code: string) => {
    setCoupons(coupons.map(c => c.code === code ? { ...c, isActive: !c.isActive } : c));
  };

  const handleDeleteCoupon = (code: string) => {
    setCoupons(coupons.filter(c => c.code !== code));
    toast({
      title: language === 'ar' ? 'تم الحذف' : 'Coupon Deleted',
      description: language === 'ar' ? 'تم حذف الكوبون بنجاح.' : 'Promo coupon removed successfully.'
    });
  };

  const handleGenerateSEO = () => {
    setIsGeneratingSeo(true);
    setTimeout(() => {
      setIsGeneratingSeo(false);
      
      const tags = [
        profile.specialization.split('/')[0].trim(),
        language === 'ar' ? 'خدمات احترافية' : 'Professional Services',
        'Khidmatik Store',
        language === 'ar' ? 'أفضل سعر' : 'Best Quality',
        ...profile.professionalTitle.split(' ').filter(w => w.length > 3)
      ].filter(Boolean);
      
      setSeoKeywords(tags);
      setSeoDescription(
        language === 'ar' 
          ? `تصفح متجر ${profile.fullName} لـ ${profile.specialization} على منصة خذماتك. ${profile.professionalTitle}. ${profile.profileBio.slice(0, 80)}...`
          : `Browse ${profile.fullName}'s store for ${profile.specialization} on Khidmatik. ${profile.professionalTitle}. ${profile.profileBio.slice(0, 80)}...`
      );
      
      toast({
        title: language === 'ar' ? 'تم توليد الكلمات المفتاحية بالذكاء الاصطناعي' : 'AI SEO Tags Generated',
        description: language === 'ar' ? 'تم تحليل بيانات متجرك بنجاح وتوليد الأوصاف الكافية.' : 'Successfully analyzed store details and compiled Google SEO tags.'
      });
    }, 1500);
  };

  const handleSubmitReply = (reviewId: string) => {
    if (!tempReplyText.trim()) return;
    setReviews(reviews.map(r => r.id === reviewId ? { ...r, reply: tempReplyText.trim() } : r));
    setTempReplyText('');
    setActiveReplyId(null);
    toast({
      title: language === 'ar' ? 'تم الرد بنجاح' : 'Reply Submitted',
      description: language === 'ar' ? 'تم نشر ردك العام على هذا التقييم.' : 'Your public response has been posted.'
    });
  };

  const handleUpgradePlan = async (newTier: SubscriptionTier, planName: string, price: number) => {
    setActualTier(newTier);
    setIsUpgradePromptOpen(false);

    // Save locally
    if (user?.id) {
      localStorage.setItem(`tier_${user.id}`, newTier);
    }

    // Update in Supabase if user has a store
    if (user?.storeId) {
      try {
        await supabase
          .from('stores')
          .update({ subscription_plan: newTier })
          .eq('id', user.storeId);
      } catch (err) {
        console.error('Error saving subscription to Supabase:', err);
      }
    }

    toast({
      title: language === 'ar' ? '🎉 تم ترقية اشتراكك بنجاح!' : '🎉 Plan Upgraded Successfully!',
      description: language === 'ar' 
        ? `أنت الآن على ${planName}. تم فتح جميع الميزات المخصصة لهذا المستوى!` 
        : `You are now on ${planName}. All locked features for this tier are now accessible!`,
    });
  };

  // --- Subscription Theme Manager Logic ---
  const standardTheme = TIER_THEMES[selectedTier] || TIER_THEMES.free;
  const actualTheme = TIER_THEMES[actualTier] || TIER_THEMES.free;
  const actualPlanName = language === 'ar' ? actualTheme.nameAr : actualTheme.nameEn;

  const getPortfolioLimit = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return 1;
      case 'bronze': return 1;
      case 'silver': return 3;
      case 'gold': return 6;
      default: return Infinity;
    }
  };

  const getLinksConfig = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free':
      case 'bronze':
        return { website: true, linkedin: false, other: false };
      case 'silver':
        return { website: true, linkedin: true, other: false };
      default:
        return { website: true, linkedin: true, other: true };
    }
  };

  const hasCustomBranding = (tier: SubscriptionTier) => {
    return tier === 'platinum' || tier === 'diamond';
  };

  const isPremiumUser = hasCustomBranding(selectedTier);

  const ActiveSubIcon = {
    free: Shield,
    bronze: Medal,
    silver: Award,
    gold: Crown,
    platinum: Gem,
    diamond: Sparkles
  }[selectedTier] || Shield;

  const activeAccentColor = isPremiumUser ? customAccentColor : standardTheme.accentColor;

  const getAvatarFrameClass = () => {
    if (!isPremiumUser) return 'rounded-full';
    switch (customFrameShape) {
      case 'rounded-square': return 'rounded-3xl';
      case 'hexagon': return 'shape-hexagon';
      default: return 'rounded-full';
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Style Injection for visual effects */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sweepEffect {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shineEffect {
          0% { left: -150%; }
          50% { left: 150%; }
          100% { left: 150%; }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 5px ${activeAccentColor}50; }
          50% { box-shadow: 0 0 20px ${activeAccentColor}bb; }
          100% { box-shadow: 0 0 5px ${activeAccentColor}50; }
        }

        .premium-glow {
          animation: ${standardTheme.hasGlow ? 'pulseGlow 2.5s infinite ease-in-out' : 'none'};
        }

        .premium-shine-card {
          position: relative;
          overflow: hidden;
        }

        .premium-shine-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: -150%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.4) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-25deg);
          animation: ${standardTheme.hasShine ? 'shineEffect 4s infinite ease-in-out' : 'none'};
          pointer-events: none;
        }

        .premium-sweep-border {
          position: relative;
          background: ${standardTheme.hasBorderSweep ? `linear-gradient(90deg, ${activeAccentColor}, #3b82f6, ${activeAccentColor})` : 'transparent'};
          background-size: 200% 200%;
          animation: ${standardTheme.hasBorderSweep ? 'sweepEffect 3s linear infinite' : 'none'};
          padding: 3px;
        }

        .shape-hexagon {
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
      ` }} />

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <UserCircle className="h-8 w-8 text-primary" /> {t('title', 'My Public Profile')}
          </h1>
          <p className="text-muted-foreground">{t('desc', 'Manage and customize how clients see your professional profile.')}</p>
        </div>
        <Button 
          onClick={() => {
            setUpgradePromptReason(language === 'ar' ? 'استعراض واختيار باقة الاشتراك المناسبة لنشاطك' : 'Explore and choose your preferred subscription plan');
            setIsUpgradePromptOpen(true);
          }}
          className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-750 text-white font-bold shadow-sm"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {language === 'ar' ? 'ترقية / اختيار الباقة' : 'Upgrade / Choose Plan'}
        </Button>
      </header>



      {/* Visual profile teaser */}
      <div className={`relative border rounded-xl overflow-hidden shadow-sm bg-card premium-shine-card premium-glow ${standardTheme.cardBorderClass}`}>
        <div 
          className="h-40 w-full overflow-hidden bg-slate-200"
          style={{
            background: standardTheme.coverGradient,
          }}
        >
          {(profile.coverImage && (isPremiumUser || profile.coverImage.includes('placehold'))) && (
            <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="p-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16">
          <div className={`${standardTheme.hasBorderSweep ? 'premium-sweep-border' : standardTheme.avatarFrameBorder} overflow-hidden shadow-md bg-white h-32 w-32 shrink-0 ${getAvatarFrameClass()}`}>
            <div className={`h-full w-full bg-white overflow-hidden ${getAvatarFrameClass()}`}>
              <img src={profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left rtl:sm:text-right pb-2 space-y-1">
            <h2 className="text-2xl font-bold flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              {profile.fullName}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${standardTheme.badgeClass}`}>
                <ActiveSubIcon className="h-3 w-3" />
                {language === 'ar' ? standardTheme.nameAr : standardTheme.nameEn}
              </span>
            </h2>
            <p className="text-sm font-semibold text-primary">{profile.professionalTitle}</p>
            <p className="text-xs text-muted-foreground">{profile.specialization}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pb-2">
            <Button size="sm" variant="outline" onClick={() => setIsPhotoOpen(true)}>
              <ImageIcon className="h-4 w-4 mr-1.5" /> {t('uploadPhoto', 'Photo')}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                if (isPremiumUser) {
                  setIsCoverOpen(true);
                } else {
                  setUpgradePromptReason(t('unlockBranding', 'Upgrading to Platinum or Diamond tier is required to customize branding details.'));
                  setIsUpgradePromptOpen(true);
                }
              }}
            >
              <UploadCloud className="h-4 w-4 mr-1.5" /> {t('uploadCover', 'Cover')}
              {!isPremiumUser && <Lock className="h-3.5 w-3.5 ml-1 text-amber-500 shrink-0" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Core Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" /> {t('infoTitle', 'Profile Information')}
                </CardTitle>
                <CardDescription>{t('infoDesc', 'Update core details displayed on your public profile.')}</CardDescription>
              </div>
              <Button size="sm" variant="ghost" onClick={handleOpenInfo}>
                <Edit3 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-muted-foreground text-xs block">{t('fullName', 'Full Name')}</span>
                  <p className="text-base font-semibold mt-1">{profile.fullName}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground text-xs block">{t('profTitle', 'Professional Title')}</span>
                  <p className="text-base font-semibold mt-1">{profile.professionalTitle}</p>
                </div>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground text-xs block">{t('spec', 'Specialization')}</span>
                <p className="font-medium mt-1">{profile.specialization}</p>
              </div>
              <Separator />
              <div>
                <span className="font-semibold text-muted-foreground text-xs block">{t('bio', 'Bio')}</span>
                <p className="mt-2 text-muted-foreground leading-relaxed whitespace-pre-line">{profile.profileBio}</p>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5 text-primary" /> {t('portfolioTitle', 'Portfolio Management')}
                </CardTitle>
                <CardDescription>{t('portfolioDesc', 'Showcase your work to attract clients.')}</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setIsPortfolioOpen(true)}>
                <Edit3 className="h-4 w-4 mr-1.5" /> {t('managePortfolio', 'Manage')}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {profile.portfolioItems.map((item) => (
                  <div key={item.id} className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow group relative">
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="p-3 space-y-1">
                      <h4 className="font-semibold text-xs line-clamp-1">{item.title}</h4>
                      <p className="text-[10px] text-primary font-medium">{item.category}</p>
                    </div>
                  </div>
                ))}
                {profile.portfolioItems.length === 0 && (
                  <div className="col-span-3 text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                    No portfolio items added yet. Click Manage to add items.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Custom Branding & Layout Settings */}
          <Card className="relative overflow-hidden shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'تخصيص المظهر والهوية البصرية' : 'Custom Branding & Design Settings'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'تخصيص شكل إطار صورة بروفيلك وتحديد اللون الرئيسي للمتجر.' : 'Customize your avatar border shape and profile identity color.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isPremiumUser ? (
                <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 z-10">
                  <div className="bg-white/95 border shadow-lg rounded-xl p-6 max-w-sm space-y-3">
                    <Lock className="h-8 w-8 text-amber-500 mx-auto animate-bounce" />
                    <h4 className="font-bold text-xs uppercase text-slate-800">{t('lockedFeature', 'Locked Feature')}</h4>
                    <p className="text-xs text-muted-foreground">
                      {t('unlockBranding', 'Upgrading to Platinum or Diamond tier is required to customize branding details.')}
                    </p>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-750 text-white font-bold"
                      onClick={() => {
                        setUpgradePromptReason(t('unlockBranding', 'Upgrading to Platinum or Diamond tier is required to customize branding details.'));
                        setIsUpgradePromptOpen(true);
                      }}
                    >
                      {language === 'ar' ? 'ترقية الاشتراك الآن' : 'Upgrade Plan Now'}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'شكل إطار الصورة' : 'Avatar Frame Shape'}</Label>
                  <div className="flex gap-2">
                    {([
                      { id: 'circle', labelAr: 'دائري', labelEn: 'Circle' },
                      { id: 'rounded-square', labelAr: 'مربع زوايا دائرية', labelEn: 'Rounded Sq' },
                      { id: 'hexagon', labelAr: 'سداسي', labelEn: 'Hexagon' }
                    ] as const).map(shape => (
                      <button
                        key={shape.id}
                        onClick={() => setCustomFrameShape(shape.id)}
                        className={`flex-1 py-2 px-3 border rounded-lg text-xs font-semibold transition-all ${
                          customFrameShape === shape.id 
                            ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-sm' 
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {language === 'ar' ? shape.labelAr : shape.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'اللون الرئيسي للمتجر' : 'Primary Identity Color'}</Label>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="color" 
                      value={customAccentColor} 
                      onChange={(e) => setCustomAccentColor(e.target.value)} 
                      className="h-10 w-16 cursor-pointer p-0.5 border border-slate-200 rounded-lg bg-white"
                    />
                    <div className="space-y-0.5">
                      <span className="font-mono text-xs font-bold uppercase">{customAccentColor}</span>
                      <p className="text-[10px] text-muted-foreground">{language === 'ar' ? 'اختر اللون المعبر عن هوية نشاطك' : 'Choose a signature brand accent color'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Promo Coupon & Discount Creator */}
          <Card className="relative overflow-hidden shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'منشئ كوبونات الخصم والرموز الترويجية' : 'Promo Coupon & Discount Creator'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'أنشئ خصومات وعروض لزيادة زيارات العملاء وحجوزاتهم بنسبة 35%.' : 'Create promo codes to boost customer service bookings by up to 35%.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!(selectedTier === 'gold' || selectedTier === 'platinum' || selectedTier === 'diamond') ? (
                <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 z-10">
                  <div className="bg-white/95 border shadow-lg rounded-xl p-6 max-w-sm space-y-3">
                    <Lock className="h-8 w-8 text-amber-500 mx-auto animate-pulse" />
                    <h4 className="font-bold text-xs uppercase text-slate-800">{t('lockedFeature', 'Locked Feature')}</h4>
                    <p className="text-xs text-muted-foreground">
                      {language === 'ar' 
                        ? 'إنشاء رموز الخصم الترويجية متاح فقط للمشتركين في الباقة الذهبية فما فوق. قم بترقية اشتراكك للمتابعة.'
                        : 'Creating active promotional discount codes requires upgrading to Gold tier or above.'}
                    </p>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-750 text-white font-bold"
                      onClick={() => {
                        setUpgradePromptReason(language === 'ar' ? 'إنشاء رموز الخصم الترويجية متاح فقط للمشتركين في الباقة الذهبية فما فوق.' : 'Promo code creation requires upgrading to Gold tier or above.');
                        setIsUpgradePromptOpen(true);
                      }}
                    >
                      {language === 'ar' ? 'ترقية الاشتراك الآن' : 'Upgrade Plan Now'}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/20 space-y-3">
                <h4 className="text-xs font-semibold text-primary uppercase">{language === 'ar' ? 'إضافة كود ترويجي جديد' : 'New Promo Code'}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="coupon-code-in">{language === 'ar' ? 'كود الخصم' : 'Code'}</Label>
                    <Input 
                      id="coupon-code-in" 
                      value={newCouponCode} 
                      onChange={(e) => setNewCouponCode(e.target.value)} 
                      placeholder="e.g. SAVE20" 
                      className="mt-1 bg-white uppercase"
                    />
                  </div>
                  <div>
                    <Label htmlFor="coupon-pct-in">{language === 'ar' ? 'نسبة الخصم (%)' : 'Discount (%)'}</Label>
                    <Input 
                      id="coupon-pct-in" 
                      type="number"
                      value={newCouponDiscount} 
                      onChange={(e) => setNewCouponDiscount(Number(e.target.value))} 
                      min={5}
                      max={90}
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="coupon-exp-in">{language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</Label>
                    <Input 
                      id="coupon-exp-in" 
                      type="date"
                      value={newCouponExpiry} 
                      onChange={(e) => setNewCouponExpiry(e.target.value)} 
                      className="mt-1 bg-white text-xs"
                    />
                  </div>
                </div>
                <Button size="sm" onClick={handleAddCoupon} className="w-full bg-primary text-white">
                  <Plus className="h-4 w-4 mr-1" /> {language === 'ar' ? 'إنشاء وتفعيل الرمز' : 'Create & Activate Code'}
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase">{language === 'ar' ? 'الكوبونات النشطة' : 'Active Coupons'}</h4>
                {coupons.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">{language === 'ar' ? 'لا توجد كوبونات مضافة حالياً.' : 'No promo coupons added yet.'}</p>
                ) : (
                  coupons.map(c => (
                    <div key={c.code} className="flex justify-between items-center p-2.5 border rounded-lg bg-white dark:bg-slate-900/30 text-sm shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-mono font-bold text-xs uppercase">
                          {c.code}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-800">{c.discountPercent}% Off</p>
                          <p className="text-[10px] text-muted-foreground">{language === 'ar' ? 'ينتهي في' : 'Expires'}: {c.expiryDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleCoupon(c.code)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {c.isActive ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                        </button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDeleteCoupon(c.code)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI SEO & Google Meta Generator */}
          <Card className="relative overflow-hidden shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'تحسين محركات البحث بالذكاء الاصطناعي (SEO)' : 'AI SEO & Google Meta Generator'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'توليد الكلمات المفتاحية وأوصاف محركات البحث تلقائيًا لرفع ظهور متجرك في نتائج Google.' : 'Auto-compile search keywords and meta descriptions to drive organic Google search traffic.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!(selectedTier === 'platinum' || selectedTier === 'diamond') ? (
                <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 z-10">
                  <div className="bg-white/95 border shadow-lg rounded-xl p-6 max-w-sm space-y-3">
                    <Lock className="h-8 w-8 text-amber-500 mx-auto animate-pulse" />
                    <h4 className="font-bold text-xs uppercase text-slate-800">{t('lockedFeature', 'Locked Feature')}</h4>
                    <p className="text-xs text-muted-foreground">
                      {language === 'ar' 
                        ? 'توليد الكلمات المفتاحية والأوصاف بالذكاء الاصطناعي متاح فقط في الباقتين البلاتينية والماسية. قم بترقية اشتراكك للمتابعة.'
                        : 'Google SEO meta analysis and AI keytag compiling require upgrading to Platinum tier or above.'}
                    </p>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-750 text-white font-bold"
                      onClick={() => {
                        setUpgradePromptReason(language === 'ar' ? 'محلل SEO الذكي وتوليد الكلمات المفتاحية بالذكاء الاصطناعي متاح فقط للباقتين البلاتينية والماسية.' : 'AI SEO tags generator requires upgrading to Platinum tier or above.');
                        setIsUpgradePromptOpen(true);
                      }}
                    >
                      {language === 'ar' ? 'ترقية الاشتراك الآن' : 'Upgrade Plan Now'}
                    </Button>
                  </div>
                </div>
              ) : null}

              <Button 
                onClick={handleGenerateSEO} 
                disabled={isGeneratingSeo}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2"
              >
                <Sparkles className={`h-4 w-4 ${isGeneratingSeo ? 'animate-spin' : ''}`} />
                {isGeneratingSeo 
                  ? (language === 'ar' ? 'جاري التحليل وتوليد الكلمات المفتاحية...' : 'Analyzing store keywords...') 
                  : (language === 'ar' ? 'توليد وتحليل كلمات الـ SEO بالذكاء الاصطناعي' : 'Generate & Optimize AI SEO Meta Tags')}
              </Button>

              {seoKeywords.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">{language === 'ar' ? 'وصف محركات البحث المقترح (Google Meta Description)' : 'Google Meta Description'}</Label>
                    <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/20 text-xs leading-relaxed text-slate-700">
                      {seoDescription}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">{language === 'ar' ? 'الكلمات المفتاحية النشطة (Google Meta Keywords)' : 'SEO Focus Keywords'}</Label>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {seoKeywords.map(k => (
                        <span key={k} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-semibold">
                          <Check className="h-3 w-3 text-green-500" /> {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Reviews & Replies */}
          <Card className="relative overflow-hidden shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary fill-primary" />
                {language === 'ar' ? 'التقييمات والمراجعات العامة والرد عليها' : 'Reviews, Feedback & Public Replies'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'تفاعل مع مراجعات عملائك ورد عليها علنًا لبناء سمعتك المهنية.' : 'View comments from your clients and reply publicly to build credibility.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!(selectedTier === 'gold' || selectedTier === 'platinum' || selectedTier === 'diamond') ? (
                <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 z-10">
                  <div className="bg-white/95 border shadow-lg rounded-xl p-6 max-w-sm space-y-3">
                    <Lock className="h-8 w-8 text-amber-500 mx-auto animate-pulse" />
                    <h4 className="font-bold text-xs uppercase text-slate-800">{t('lockedFeature', 'Locked Feature')}</h4>
                    <p className="text-xs text-muted-foreground">
                      {language === 'ar' 
                        ? 'عرض المراجعات العامة والرد عليها متاح فقط للمشتركين في الباقة الذهبية فما فوق. قم بترقية اشتراكك للمتابعة.'
                        : 'Replying publicly to client reviews requires upgrading to Gold tier or above.'}
                    </p>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-750 text-white font-bold"
                      onClick={() => {
                        setUpgradePromptReason(language === 'ar' ? 'ميزة إدارة المراجعات العامة والرد على تقييمات العملاء متاحة في الباقة الذهبية فما فوق.' : 'Reviews public reply features require Gold tier or above.');
                        setIsUpgradePromptOpen(true);
                      }}
                    >
                      {language === 'ar' ? 'ترقية الاشتراك الآن' : 'Upgrade Plan Now'}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r.id} className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-900/10 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">{r.clientName}</h4>
                        <div className="flex gap-0.5 mt-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{r.date}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{r.comment}</p>

                    {r.reply ? (
                      <div className="p-2 border-l-2 border-primary bg-white text-xs space-y-1 mt-2">
                        <div className="flex items-center gap-1 text-primary font-bold text-[10px] uppercase">
                          <Check className="h-3 w-3" />
                          {language === 'ar' ? 'ردك العام' : 'Your Public Reply'}
                        </div>
                        <p className="text-slate-600 italic">"{r.reply}"</p>
                      </div>
                    ) : (
                      activeReplyId === r.id ? (
                        <div className="space-y-2 pt-1.5">
                          <Textarea 
                            value={tempReplyText} 
                            onChange={(e) => setTempReplyText(e.target.value)} 
                            placeholder={language === 'ar' ? 'اكتب ردك هنا...' : 'Write your public reply...'}
                            rows={2}
                            className="text-xs bg-white"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { setActiveReplyId(null); setTempReplyText(''); }}>
                              {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button size="sm" className="text-xs h-7 bg-primary text-white" onClick={() => handleSubmitReply(r.id)}>
                              {language === 'ar' ? 'إرسال الرد' : 'Submit Response'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-xs text-primary" 
                          onClick={() => { setActiveReplyId(r.id); setTempReplyText(''); }}
                        >
                          {language === 'ar' ? 'الرد على التقييم' : 'Reply to Review'}
                        </Button>
                      )
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Badges, Reviews, Links */}
        <div className="space-y-6">
          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" /> {t('badgesTitle', 'My Badges')}
              </CardTitle>
              <CardDescription>{t('badgesDesc', 'Badges displayed on your profile.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Dynamic Subscription Badge */}
              <div className={`flex items-center gap-3 p-3 border rounded-lg ${standardTheme.badgeClass} premium-glow`}>
                <ActiveSubIcon className="h-6 w-6 shrink-0" style={{ color: standardTheme.accentColor }} />
                <div className="flex-1">
                  <h4 className="font-bold text-xs">{language === 'ar' ? standardTheme.nameAr : standardTheme.nameEn}</h4>
                  <p className="text-[10px] opacity-80">{language === 'ar' ? 'مستوى الاشتراك الحالي' : 'Active membership tier'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50/50 border-green-200">
                <Award className="h-6 w-6 text-green-600 shrink-0" />
                <div>
                  <h4 className="font-semibold text-xs text-green-700">{t('verified', 'ID Verified')}</h4>
                  <p className="text-[10px] text-muted-foreground">Identity documents approved</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-yellow-50/50 border-yellow-200">
                <Star className="h-6 w-6 text-yellow-600 shrink-0" />
                <div>
                  <h4 className="font-semibold text-xs text-yellow-700">{t('topRated', 'Top Rated')}</h4>
                  <p className="text-[10px] text-muted-foreground">Excellent reviews from clients</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-blue-50/50 border-blue-200">
                <UserCircle className="h-6 w-6 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-semibold text-xs text-blue-700">{t('pro', 'Khidmatik Pro')}</h4>
                  <p className="text-[10px] text-muted-foreground">Professional provider badge</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" /> {t('linksTitle', 'External Links')}
                </CardTitle>
                <CardDescription>{t('linksDesc', 'Manage links to external portfolios.')}</CardDescription>
              </div>
              <Button size="sm" variant="ghost" onClick={handleOpenLinks}>
                <Edit3 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-mono text-muted-foreground truncate flex-1">{profile.personalWebsite || 'No website link'}</span>
              </div>
              <div className={`flex items-center justify-between p-2 border rounded-md ${!getLinksConfig(selectedTier).linkedin ? 'bg-slate-100 dark:bg-slate-800/20 opacity-60 border-dashed' : 'bg-muted/30'}`}>
                <div className="flex items-center gap-2 truncate flex-1">
                  <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-mono text-muted-foreground truncate">{!getLinksConfig(selectedTier).linkedin ? (language === 'ar' ? 'مغلق (الباقة الفضية فما فوق)' : 'Locked (Silver plan required)') : (profile.linkedinProfile || 'No LinkedIn link')}</span>
                </div>
                {!getLinksConfig(selectedTier).linkedin && <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
              </div>
              <div className={`flex items-center justify-between p-2 border rounded-md ${!getLinksConfig(selectedTier).other ? 'bg-slate-100 dark:bg-slate-800/20 opacity-60 border-dashed' : 'bg-muted/30'}`}>
                <div className="flex items-center gap-2 truncate flex-1">
                  <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-mono text-muted-foreground truncate">{!getLinksConfig(selectedTier).other ? (language === 'ar' ? 'مغلق (الباقة البلاتينية فما فوق)' : 'Locked (Platinum plan required)') : (profile.otherPortfolio || 'No Behance link')}</span>
                </div>
                {!getLinksConfig(selectedTier).other && <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
              </div>
            </CardContent>
          </Card>

          {/* Share & QR Code Card */}
          <Card className="relative overflow-hidden shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'رمز مشاركة المتجر (QR Code)' : 'Store Sharing QR Code'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'اطبع كود QR وشاركه مع عملائك للوصول السريع إلى خدمات متجرك.' : 'Print and share your QR code to drive fast customer bookings offline.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!(selectedTier === 'silver' || selectedTier === 'gold' || selectedTier === 'platinum' || selectedTier === 'diamond') ? (
                <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 z-10">
                  <div className="bg-white/95 border shadow-lg rounded-xl p-6 max-w-sm space-y-3">
                    <Lock className="h-8 w-8 text-amber-500 mx-auto animate-pulse" />
                    <h4 className="font-bold text-xs uppercase text-slate-800">{t('lockedFeature', 'Locked Feature')}</h4>
                    <p className="text-xs text-muted-foreground">
                      {language === 'ar' 
                        ? 'توليد ومشاركة كود QR متاح فقط للمشتركين في الباقة الفضية فما فوق. قم بترقية اشتراكك للمتابعة.'
                        : 'Offline printing QR code sharing tool requires upgrading to Silver tier or above.'}
                    </p>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-750 text-white font-bold"
                      onClick={() => {
                        setUpgradePromptReason(language === 'ar' ? 'ميزة مشاركة رمز QR والروابط المختصرة متاحة للمشتركين في الباقة الفضية فما فوق.' : 'QR Code sharing requires upgrading to Silver tier or above.');
                        setIsUpgradePromptOpen(true);
                      }}
                    >
                      {language === 'ar' ? 'ترقية الاشتراك الآن' : 'Upgrade Plan Now'}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col items-center justify-center p-4 border rounded-xl bg-slate-50 dark:bg-slate-900/20 shadow-inner">
                <svg className="w-36 h-36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100" height="100" rx="12" fill="white" />
                  <rect x="10" y="10" width="20" height="20" rx="3" fill="#1e293b" />
                  <rect x="13" y="13" width="14" height="14" rx="1.5" fill="white" />
                  <rect x="16" y="16" width="8" height="8" rx="0.5" fill="#1e293b" />
                  
                  <rect x="70" y="10" width="20" height="20" rx="3" fill="#1e293b" />
                  <rect x="73" y="13" width="14" height="14" rx="1.5" fill="white" />
                  <rect x="76" y="16" width="8" height="8" rx="0.5" fill="#1e293b" />
                  
                  <rect x="10" y="70" width="20" height="20" rx="3" fill="#1e293b" />
                  <rect x="13" y="73" width="14" height="14" rx="1.5" fill="white" />
                  <rect x="16" y="76" width="8" height="8" rx="0.5" fill="#1e293b" />
                  
                  <rect x="40" y="10" width="6" height="12" rx="1" fill="#1e293b" />
                  <rect x="50" y="10" width="12" height="6" rx="1" fill="#1e293b" />
                  <rect x="40" y="25" width="12" height="12" rx="1" fill="#1e293b" />
                  <rect x="55" y="22" width="8" height="18" rx="1" fill="#1e293b" />
                  
                  <rect x="10" y="40" width="18" height="6" rx="1" fill="#1e293b" />
                  <rect x="25" y="40" width="6" height="18" rx="1" fill="#1e293b" />
                  <rect x="10" y="52" width="12" height="12" rx="1" fill="#1e293b" />
                  
                  <rect x="70" y="40" width="6" height="18" rx="1" fill="#1e293b" />
                  <rect x="80" y="45" width="10" height="6" rx="1" fill="#1e293b" />
                  <rect x="70" y="62" width="20" height="12" rx="1" fill="#1e293b" />
                  
                  <rect x="40" y="70" width="12" height="6" rx="1" fill="#1e293b" />
                  <rect x="45" y="80" width="18" height="10" rx="1" fill="#1e293b" />
                  <rect x="70" y="80" width="20" height="10" rx="1" fill="#1e293b" />
                </svg>
                <span className="font-mono text-[9px] text-muted-foreground mt-3 uppercase tracking-wider truncate max-w-full">
                  khidmatik.dz/s/{profile.fullName.toLowerCase().replace(/\s+/g, '-')}
                </span>
              </div>
              <Button 
                onClick={() => toast({ title: 'QR Code Compiled', description: 'Your high-res business share QR Code downloaded.' })}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5"
              >
                <Share2 className="h-4 w-4" />
                {language === 'ar' ? 'تحميل كود الـ QR للمتجر' : 'Download High-Res QR Code'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Dialog */}
      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent className="sm:max-w-lg bg-white border text-slate-800 p-6">
          <DialogHeader>
            <DialogTitle>{t('editInfo', 'Edit Profile Info')}</DialogTitle>
            <DialogDescription>Change details displayed on your profile card.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div>
              <Label htmlFor="edit-name">{t('fullName', 'Full Name')}</Label>
              <Input id="edit-name" value={tempFullName} onChange={(e) => setTempFullName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="edit-title">{t('profTitle', 'Professional Title')}</Label>
              <Input id="edit-title" value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="edit-spec">{t('spec', 'Specialization')}</Label>
              <Input id="edit-spec" value={tempSpec} onChange={(e) => setTempSpec(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="edit-bio">{t('bio', 'Bio')}</Label>
              <Textarea id="edit-bio" value={tempBio} onChange={(e) => setTempBio(e.target.value)} rows={4} className="mt-1" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsInfoOpen(false)}>{t('close', 'Close')}</Button>
            <Button onClick={handleSaveInfo} className="bg-primary text-white">{t('save', 'Save Changes')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Links Dialog */}
      <Dialog open={isLinksOpen} onOpenChange={setIsLinksOpen}>
        <DialogContent className="sm:max-w-md bg-white border text-slate-800 p-6">
          <DialogHeader>
            <DialogTitle>{t('updateLinks', 'Update External Links')}</DialogTitle>
            <DialogDescription>Provide URLs for your external portfolios.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div>
              <Label htmlFor="link-web">{t('website', 'Personal Website')}</Label>
              <Input id="link-web" value={tempWebsite} onChange={(e) => setTempWebsite(e.target.value)} className="mt-1" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="link-ln" className={!getLinksConfig(selectedTier).linkedin ? "text-muted-foreground flex items-center gap-1" : "flex items-center gap-1"}>
                  {t('linkedin', 'LinkedIn Link')}
                  {!getLinksConfig(selectedTier).linkedin && <Lock className="h-3 w-3 text-amber-500" />}
                </Label>
                {!getLinksConfig(selectedTier).linkedin && (
                  <span className="text-[9px] text-amber-600 font-semibold">{t('upgradeRequired', 'Upgrade Required')}</span>
                )}
              </div>
              <Input 
                id="link-ln" 
                value={tempLinkedin} 
                onChange={(e) => setTempLinkedin(e.target.value)} 
                disabled={!getLinksConfig(selectedTier).linkedin}
                placeholder={!getLinksConfig(selectedTier).linkedin ? (language === 'ar' ? 'الباقة الفضية فما فوق' : 'Locked (Silver plan required)') : 'https://...'}
                className="mt-1" 
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="link-be" className={!getLinksConfig(selectedTier).other ? "text-muted-foreground flex items-center gap-1" : "flex items-center gap-1"}>
                  {t('behance', 'Behance Link')}
                  {!getLinksConfig(selectedTier).other && <Lock className="h-3 w-3 text-amber-500" />}
                </Label>
                {!getLinksConfig(selectedTier).other && (
                  <span className="text-[9px] text-amber-600 font-semibold">{t('upgradeRequired', 'Upgrade Required')}</span>
                )}
              </div>
              <Input 
                id="link-be" 
                value={tempBehance} 
                onChange={(e) => setTempBehance(e.target.value)} 
                disabled={!getLinksConfig(selectedTier).other}
                placeholder={!getLinksConfig(selectedTier).other ? (language === 'ar' ? 'الباقة البلاتينية فما فوق' : 'Locked (Platinum plan required)') : 'https://...'}
                className="mt-1" 
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsLinksOpen(false)}>{t('close', 'Close')}</Button>
            <Button onClick={handleSaveLinks} className="bg-primary text-white">{t('save', 'Save Changes')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Portfolio Management Dialog */}
      <Dialog open={isPortfolioOpen} onOpenChange={setIsPortfolioOpen}>
        <DialogContent className="sm:max-w-2xl bg-white border text-slate-800 p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('managePortfolio', 'Manage Portfolio Items')}</DialogTitle>
            <DialogDescription>Add new project files or clean up older items.</DialogDescription>
          </DialogHeader>
          
          {/* Add Form */}
          <div className="p-4 border rounded-lg bg-slate-50 space-y-3 my-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-xs text-primary uppercase">{t('addItem', 'Add Portfolio Item')}</h4>
              <span className="text-[10px] text-muted-foreground font-bold">
                {profile.portfolioItems.length} / {getPortfolioLimit(selectedTier) === Infinity ? '∞' : getPortfolioLimit(selectedTier)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="port-title-in">{t('itemTitle', 'Title')}</Label>
                <Input id="port-title-in" value={newPortTitle} onChange={(e) => setNewPortTitle(e.target.value)} placeholder="e.g. Logo Design" className="mt-1 bg-white" />
              </div>
              <div>
                <Label htmlFor="port-cat-in">{t('itemCategory', 'Category')}</Label>
                <Input id="port-cat-in" value={newPortCategory} onChange={(e) => setNewPortCategory(e.target.value)} placeholder="e.g. Graphics" className="mt-1 bg-white" />
              </div>
            </div>
            <div>
              <Label htmlFor="port-url-in">{t('url', 'Image/Media URL')}</Label>
              <Input id="port-url-in" value={newPortUrl} onChange={(e) => setNewPortUrl(e.target.value)} placeholder="e.g. https://images.unsplash.com/..." className="mt-1 bg-white" />
            </div>
            <Button size="sm" onClick={handleAddPortfolioItem} className="w-full bg-primary text-white">
              <Plus className="h-4 w-4 mr-1" /> {t('addItem', 'Add Item')}
            </Button>
          </div>

          {/* Current List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {profile.portfolioItems.map(item => (
              <div key={item.id} className="flex justify-between items-center p-2 border rounded-md bg-white text-sm">
                <div className="flex items-center gap-3">
                  <img src={item.url} alt={item.title} className="w-10 h-10 object-cover rounded" />
                  <div>
                    <h5 className="font-semibold text-xs">{item.title}</h5>
                    <span className="text-[10px] text-muted-foreground">{item.category}</span>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeletePortfolioItem(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setIsPortfolioOpen(false)}>{t('close', 'Close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Photo Dialog */}
      <Dialog open={isPhotoOpen} onOpenChange={setIsPhotoOpen}>
        <DialogContent className="sm:max-w-md bg-white border text-slate-800 p-6">
          <DialogHeader>
            <DialogTitle>{t('uploadPhoto', 'Change Profile Photo')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div>
              <Label>{t('customPhoto', 'Custom Photo URL')}</Label>
              <Input value={tempPhotoUrl} onChange={(e) => setTempPhotoUrl(e.target.value)} placeholder="https://..." className="mt-1" />
              {tempPhotoUrl && (
                <Button size="sm" className="mt-2 w-full bg-primary text-white" onClick={() => handleSavePhoto(tempPhotoUrl)}>Use Custom URL</Button>
              )}
            </div>
            <Separator />
            <div>
              <span className="text-xs font-semibold text-muted-foreground block mb-2">{t('selectSample', 'Or select a sample image')}</span>
              <div className="grid grid-cols-4 gap-2">
                {['Amine', 'Sarah', 'Kamel', 'Fatima'].map(name => {
                  const url = `https://placehold.co/150x150.png?text=${name}`;
                  return (
                    <button key={name} onClick={() => handleSavePhoto(url)} className="border rounded overflow-hidden hover:border-primary transition-colors aspect-square">
                      <img src={url} alt={name} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPhotoOpen(false)}>{t('close', 'Close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cover Image Dialog */}
      <Dialog open={isCoverOpen} onOpenChange={setIsCoverOpen}>
        <DialogContent className="sm:max-w-md bg-white border text-slate-800 p-6">
          <DialogHeader>
            <DialogTitle>{t('uploadCover', 'Change Cover Image')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div>
              <Label>{t('customCover', 'Custom Cover URL')}</Label>
              <Input value={tempCoverUrl} onChange={(e) => setTempCoverUrl(e.target.value)} placeholder="https://..." className="mt-1" />
              {tempCoverUrl && (
                <Button size="sm" className="mt-2 w-full bg-primary text-white" onClick={() => handleSaveCover(tempCoverUrl)}>Use Custom URL</Button>
              )}
            </div>
            <Separator />
            <div>
              <span className="text-xs font-semibold text-muted-foreground block mb-2">{t('selectCover', 'Or select a sample cover')}</span>
              <div className="grid grid-cols-2 gap-2">
                {['Developer', 'Designer', 'Workspace', 'Creative'].map(theme => {
                  const url = `https://placehold.co/1200x400.png?text=${theme}+Cover`;
                  return (
                    <button key={theme} onClick={() => handleSaveCover(url)} className="border rounded overflow-hidden hover:border-primary transition-colors aspect-video">
                      <img src={url} alt={theme} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCoverOpen(false)}>{t('close', 'Close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comprehensive Subscription Plans Modal */}
      <SubscriptionPlansModal
        isOpen={isUpgradePromptOpen}
        onClose={() => setIsUpgradePromptOpen(false)}
        currentTier={actualTier}
        onUpgrade={handleUpgradePlan}
        highlightReason={upgradePromptReason}
      />
    </div>
  );
}

