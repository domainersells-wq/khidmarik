
'use client';

import { useState, useEffect, type FormEvent } from 'react'; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"; 
import { TopUpDialog } from "@/components/profile/TopUpDialog";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; 
import { Textarea } from "@/components/ui/textarea"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { ShieldCheck, UserCircle, Edit3, Wallet, Landmark, CheckCircle, DollarSign, Gift, HeartHandshake, Briefcase, Warehouse, Sparkles as AiSparklesIcon, Cog, CreditCard, Truck, Link2, Link2Off, PhoneCall, CircleDollarSign, Package, History, MessageSquare, Lightbulb, UserRoundSearch, Loader2, ShoppingCart, CalendarDays, TicketIcon, Building2, BarChart3, LayoutDashboard, PlusCircle, Printer, ShieldAlert, Star, FileText, CheckCircle2, ShieldQuestion, HelpCircle, EyeOff, Eye, Camera } from "lucide-react"; 
import Link from "next/link";
import { parseServiceNotes, serializeServiceNotes, createAuditLog, type ServiceNotesPayload } from '@/lib/proofOfService';
import type { UserProfileData, OngoingService, TopUpTransaction, LinkedAccountData, StoreSubscriptionPlan, Store, ProductItem, Appointment } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { format, isToday, parseISO, formatDistanceToNow } from 'date-fns';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { bookingService } from '@/services/bookingService';
import { orderService } from '@/services/orderService';
import { financialService } from '@/services/financialService';
import { mapPlanToTier, TIER_THEMES, hexToHslTriple, DEFAULT_CUSTOMIZATION, type SubscriptionTier, type CustomizationSettings } from '@/lib/subscriptionTheme';
import { getTopUpStatusMeta } from '@/lib/financialStatusMapper';


// Helper component to format date client-side
const FormattedServiceDate = ({ dateString }: { dateString: string }) => {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    try {
      setFormattedDate(new Date(dateString).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' }));
    } catch (error) {
      console.error("Error formatting service date:", error);
      setFormattedDate("تاريخ غير صالح");
    }
  }, [dateString]);

  return <>{formattedDate === null ? "..." : formattedDate}</>;
};

const FormattedJoinedDate = ({ dateString }: { dateString?: string }) => {
  const [displayText, setDisplayText] = useState<string>("أغسطس 2026");

  useEffect(() => {
    if (!dateString) return;
    try {
      const d = new Date(dateString);
      if (!isNaN(d.getTime())) {
        setDisplayText(format(d, "dd MMMM yyyy"));
      } else {
        setDisplayText(dateString);
      }
    } catch {
      setDisplayText(dateString);
    }
  }, [dateString]);

  return <>{displayText}</>;
};

const ClientFormattedDateTime = ({ dateString }: { dateString: string }) => {
  const [displayText, setDisplayText] = useState<string>("جاري المعالجة...");

  useEffect(() => {
    try {
      setDisplayText(format(new Date(dateString), "dd MMMM yyyy, HH:mm"));
    } catch (error) {
      console.error("Error formatting date-time:", error);
      setDisplayText("تاريخ غير صالح");
    }
  }, [dateString]);

  return <>{displayText}</>;
};

const DynamicLucideIcon = ({ name, ...props }: { name?: keyof typeof LucideIcons } & LucideIcons.LucideProps) => {
  if (!name || !LucideIcons[name]) {
    return <Lightbulb {...props} />;
  }
  const IconComponent = LucideIcons[name] as LucideIcons.LucideIcon;
  return <IconComponent {...props} />;
};

const mockServiceOrders = [
  {
    reservationId: "SRV-PLB-99887",
    professionalId: "prof1",
    professionalName: "ياسين بن علي (نجار)",
    professionalCategory: "Carpentry / نجارة",
    clinicLogoUrl: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=100&h=100&fit=crop",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    timeSlot: "10:00 AM",
    patientName: "زبون تجريبي",
    reasonForVisit: "تصليح باب خشبي مكسور وتركيب قفل جديد",
    status: "completed",
    location: "Sidi Bel Abbès, Center",
    notes: JSON.stringify({
      startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      endDuration: "2 hours",
      completionNotesText: "تم إصلاح الباب بالكامل وتركيب قفل أمان ذكي جديد ونظيف للغاية.",
      gpsVerified: true,
      gpsCoords: "35.200893, -0.636422",
      gpsVerifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      workChecklist: { workDone: true, cleanUp: true, tested: true, explained: true },
      materialsUsed: [
        { name: "قفل أمان ذكي", quantity: 1, price: 4500 },
        { name: "براغي ومفصلات", quantity: 4, price: 150 }
      ],
      beforePhotos: ["/uploads/before_wood1.jpg"],
      afterPhotos: ["/uploads/after_wood1.jpg"],
      providerRating: 5,
      providerComments: "عمل ممتاز وسريع جداً، شكراً لك!",
      auditLogs: [
        { action: "CREATE_APPOINTMENT", timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), details: "تم إنشاء الطلب بنجاح", device: "Desktop", ip: "192.168.1.5" },
        { action: "START_SERVICE", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(), details: "بدء تنفيذ العمل في الموقع", device: "Mobile App", gps: "35.200893, -0.636422", ip: "105.101.42.15" },
        { action: "FINISH_SERVICE", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), details: "الحرفي أرسل تقرير الإنجاز النهائي", device: "Mobile App", gps: "35.200893, -0.636422", ip: "105.101.42.15" },
        { action: "VERIFY_OTP_SUCCESS", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(), details: "تم تأكيد الرمز واكتمال الحجز", device: "Desktop", ip: "192.168.1.5" }
      ]
    })
  },
  {
    reservationId: "SRV-ELC-44551",
    professionalId: "prof2",
    professionalName: "عبد القادر بوقرة (كهربائي)",
    professionalCategory: "Electricity / كهرباء",
    clinicLogoUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    timeSlot: "02:00 PM",
    patientName: "زبون تجريبي",
    reasonForVisit: "تركيب ثريات إضاءة جديدة وتعديل مقابس المطبخ",
    status: "waiting_verification",
    location: "Sidi Bel Abbès, El-Macta",
    notes: JSON.stringify({
      startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      endDuration: "3 hours",
      completionNotesText: "تم تركيب الإضاءة الليد بالكامل وفحص سلامة التوصيلات الكهربائية.",
      gpsVerified: true,
      gpsCoords: "35.209012, -0.627341",
      gpsVerifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      workChecklist: { workDone: true, cleanUp: true, tested: true, explained: false },
      materialsUsed: [
        { name: "مفتاح تشغيل ثنائي", quantity: 3, price: 400 },
        { name: "سلك نحاسي 2.5 مم", quantity: 15, price: 80 }
      ],
      beforePhotos: ["/uploads/before_elec1.jpg"],
      afterPhotos: ["/uploads/after_elec1.jpg"],
      otpCode: "216237",
      otpExpiresAt: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
      auditLogs: [
        { action: "CREATE_APPOINTMENT", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), details: "تم إنشاء الطلب بنجاح", device: "Desktop", ip: "192.168.1.5" },
        { action: "START_SERVICE", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000).toISOString(), details: "بدء تنفيذ العمل في الموقع", device: "Mobile App", gps: "35.209012, -0.627341", ip: "105.102.13.99" },
        { action: "FINISH_SERVICE", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), details: "الحرفي أرسل تقرير الإنجاز وبانتظار رمز الـ OTP", device: "Mobile App", gps: "35.209012, -0.627341", ip: "105.102.13.99" }
      ]
    })
  }
];

const mockStoreOrders = [
  {
    id: "ORD-MKT-77610",
    customer_id: "customer1",
    store_id: "store_abc",
    customer_name: "زبون تجريبي",
    customer_email: "client@khidmatik.dz",
    customer_phone: "+213 661234567",
    shipping_address: "شارع فلسطين، سيدي بلعباس، الجزائر",
    billing_address: "شارع فلسطين، سيدي بلعباس، الجزائر",
    payment_type: "cib",
    payment_status: "paid",
    total: 12500,
    status: "shipped",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    shipping_provider: "Yalidine Express / يالدين",
    tracking_number: "YAL-998877665",
    timeline_history: [
      { status: "pending", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), operator: "System" },
      { status: "processing", date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), operator: "Store Manager" },
      { status: "shipped", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), operator: "Carrier System" }
    ],
    order_items: [
      { id: "item1", product_name: "ثريا إضاءة مودرن ذهبية", product_image_url: "https://images.unsplash.com/photo-1543248939-ff40856f65d4?w=100&h=100&fit=crop", quantity: 1, price: 8500 },
      { id: "item2", product_name: "مصباح ليد ذكي RGB", product_image_url: "https://images.unsplash.com/photo-1550985616-10810253b84d?w=100&h=100&fit=crop", quantity: 2, price: 2000 }
    ]
  },
  {
    id: "ORD-MKT-11220",
    customer_id: "customer1",
    store_id: "store_xyz",
    customer_name: "زبون تجريبي",
    customer_email: "client@khidmatik.dz",
    customer_phone: "+213 661234567",
    shipping_address: "حي الصباح، وهران، الجزائر",
    billing_address: "حي الصباح، وهران، الجزائر",
    payment_type: "ccp",
    payment_status: "paid",
    total: 3600,
    status: "delivered",
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    shipping_provider: "Kazi Tour / كازي تور",
    tracking_number: "KZT-112233445",
    timeline_history: [
      { status: "pending", date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), operator: "System" },
      { status: "processing", date: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(), operator: "Store Manager" },
      { status: "shipped", date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), operator: "Carrier System" },
      { status: "out_for_delivery", date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(), operator: "Courier" },
      { status: "delivered", date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), operator: "Courier" }
    ],
    order_items: [
      { id: "item3", product_name: "صنبور مياه مرن من الكروم", product_image_url: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=100&h=100&fit=crop", quantity: 1, price: 3600 }
    ]
  }
];

export default function ProfilePage() {
  const { toast } = useToast();
  const { user: authUser, isLoading: isAuthLoading, hasRole, hasAnyRole } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);
  const [approvingTransactionId, setApprovingTransactionId] = useState<string | null>(null);
  const [balanceHighlight, setBalanceHighlight] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [isDigitalProjectsDialogOpen, setIsDigitalProjectsDialogOpen] = useState(false);

  // Top-Up Clarification Dialog State Hooks
  const [selectedClarifyTx, setSelectedClarifyTx] = useState<TopUpTransaction | null>(null);
  const [isClarifyDialogOpen, setIsClarifyDialogOpen] = useState(false);
  const [clarifyText, setClarifyText] = useState('');
  const [clarifyAttachmentUrl, setClarifyAttachmentUrl] = useState('');
  const [clarifyFileName, setClarifyFileName] = useState('');
  const [isClarifySubmitting, setIsClarifySubmitting] = useState(false);

  const handleOpenClarifyDialog = (tx: TopUpTransaction) => {
    setSelectedClarifyTx(tx);
    setClarifyText(tx.userClarificationText || '');
    setClarifyAttachmentUrl(tx.userClarificationAttachmentUrl || '');
    setClarifyFileName(tx.userClarificationFileName || '');
    setIsClarifyDialogOpen(true);
  };

  const handleClarifyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "حجم الملف كبير جداً",
        description: "يرجى اختيار مستند أو صورة بحجم أقل من 10 ميغابايت.",
        variant: "destructive"
      });
      return;
    }
    setClarifyFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setClarifyAttachmentUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitClarification = async () => {
    if (!selectedClarifyTx) return;
    if (!clarifyText.trim() && !clarifyAttachmentUrl) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى كتابة توضيح أو إرفاق صورة/مستند الوصل.",
        variant: "destructive"
      });
      return;
    }

    setIsClarifySubmitting(true);
    try {
      const res = financialService.submitTopUpClarification(selectedClarifyTx.id, {
        clarificationText: clarifyText.trim(),
        attachmentUrl: clarifyAttachmentUrl,
        fileName: clarifyFileName
      });

      if (res.success) {
        toast({
          title: "تم إرسال التوضيح والمستند بنجاح! 📎",
          description: "طلبك الآن قيد مراجعة وتدقيق الإدارة وسيتم الرد عليك قريباً.",
        });
        setIsClarifyDialogOpen(false);
        // Refresh local profile data
        setProfileData(prev => {
          if (!prev) return prev;
          const updatedHistory = (prev.topUpHistory || []).map(t =>
            t.id === selectedClarifyTx.id || t.transactionCode === selectedClarifyTx.transactionCode
              ? {
                  ...t,
                  status: 'pending-review' as any,
                  userClarificationText: clarifyText.trim(),
                  userClarificationAttachmentUrl: clarifyAttachmentUrl,
                  userClarificationFileName: clarifyFileName,
                  userClarificationSubmittedAt: new Date().toISOString()
                }
              : t
          );
          if (authUser?.id) {
            const uKeys = [
              'khidmatik_topups_' + authUser.id,
              'khidmatik_topups_' + financialService.normalizeUserId(authUser.id),
              'khidmatik_topups_currentUser'
            ];
            uKeys.forEach(k => {
              try { localStorage.setItem(k, JSON.stringify(updatedHistory)); } catch {}
            });
          }
          return { ...prev, topUpHistory: updatedHistory };
        });
      } else {
        toast({
          title: "تعذر الإرسال",
          description: res.error || "حدث خطأ أثناء الإرسال",
          variant: "destructive"
        });
      }
    } catch (e: any) {
      toast({
        title: "خطأ",
        description: e.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setIsClarifySubmitting(false);
    }
  };

  // New Professional Features State Hooks
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('+213 661234567');
  const [editBio, setEditBio] = useState('');
  const [isDigitalIdOpen, setIsDigitalIdOpen] = useState(false);
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false);
  const [profileNotifications, setProfileNotifications] = useState([
    { id: 'n1', type: 'order', title: 'طلب جديد بانتظار التأكيد', message: 'لديك طلب خدمة سباكة جديد من عميل في سيدي بلعباس', time: '5 دقائق', read: false, icon: 'Package' },
    { id: 'n2', type: 'wallet', title: 'تمت الموافقة على الشحن', message: 'تم إضافة 5,000 DA إلى محفظتك بنجاح', time: '15 دقيقة', read: false, icon: 'Wallet' },
    { id: 'n3', type: 'security', title: 'تسجيل دخول جديد', message: 'تم تسجيل دخول من جهاز جديد (Chrome, Windows)', time: '1 ساعة', read: true, icon: 'ShieldAlert' },
    { id: 'n4', type: 'review', title: 'تقييم جديد من عميل', message: 'حصلت على تقييم 5 نجوم من زبون "أحمد بن سعيد"', time: '3 ساعات', read: true, icon: 'Star' },
    { id: 'n5', type: 'system', title: 'تحديث المنصة', message: 'تم إضافة ميزات جديدة لتحسين تجربة المستخدم', time: '1 يوم', read: true, icon: 'Sparkles' },
  ]);
  const [isPublicPreview, setIsPublicPreview] = useState(false);

  // Admin/Role detection helpers
  const isAdmin = (authUser?.role as string) === 'super_admin' || (authUser?.role as string) === 'admin' || authUser?.role === 'ADMIN' || authUser?.role === 'SUPER_ADMIN' || authUser?.email === 'admin@khidmatik.dz';
  const isStoreOwnerUser = authUser?.isStoreOwner || false;
  const isFreelancerUser = authUser?.isFreelancer || false;
  const hasManagementAccess = isAdmin || isStoreOwnerUser || isFreelancerUser;

  // Proof of Service (OTP/Disputes/Ratings) states
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeApptId, setDisputeApptId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('Work incomplete');
  const [disputeComments, setDisputeComments] = useState('');
  
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [ratingApptId, setRatingApptId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComments, setRatingComments] = useState('');

  const [revealedOtps, setRevealedOtps] = useState<Record<string, boolean>>({});
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

  // New Orders Center state hooks
  const [activeProfileTab, setActiveProfileTab] = useState<'profile' | 'orders'>('profile');
  const [storeOrders, setStoreOrders] = useState<any[]>([]);
  const [ordersSearchTerm, setOrdersSearchTerm] = useState('');
  const [ordersTypeFilter, setOrdersTypeFilter] = useState<'all' | 'services' | 'store'>('all');
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [ordersDateFilter, setOrdersDateFilter] = useState<'all' | '7days' | 'month' | 'year'>('all');
  const [ordersSortBy, setOrdersSortBy] = useState<'newest' | 'oldest' | 'price_desc' | 'price_asc' | 'status'>('newest');
  
  const [selectedDetailServiceOrder, setSelectedDetailServiceOrder] = useState<any | null>(null);
  const [selectedDetailStoreOrder, setSelectedDetailStoreOrder] = useState<any | null>(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [returnItemName, setReturnItemName] = useState('');
  const [returnReason, setReturnReason] = useState('Damaged item');
  const [returnComments, setReturnComments] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Personal Hub state hooks
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [selectedSubTab, setSelectedSubTab] = useState<'dashboard' | 'orders' | 'maintenance' | 'assets' | 'wallet' | 'tips' | 'security'>('dashboard');
  const [isUpgradePlanOpen, setIsUpgradePlanOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState({
    plan: 'Free Customer Account / باقة الزبون المجانية',
    price: 0,
    renewsOn: 'Permanent / دائم',
    active: true,
    tier: 'free' // 'free' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  });

  const [customization, setCustomization] = useState<CustomizationSettings>({
    frameColor: undefined,
    frameShape: 'circle',
    coverStyle: 'gradient',
    identityColor: undefined,
    badgeStyle: 'classic',
    cardStyle: 'glass'
  });

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isSubInfoOpen, setIsSubInfoOpen] = useState(false);

  // Handle incoming deep-links like /profile?tab=wallet&action=clarify&requestId=TOP-2026-000125
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkParams = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const actionParam = params.get('action');
      const requestIdParam = params.get('requestId');

      if (tabParam === 'wallet') {
        setSelectedSubTab('wallet');
        setActiveProfileTab('profile');
      }

      if (actionParam === 'clarify' && requestIdParam) {
        setSelectedSubTab('wallet');
        setActiveProfileTab('profile');

        // Check current profile history or financialService store
        const allTopups = financialService.getTopUpRequests();
        const match = allTopups.find(
          t => t.id === requestIdParam || t.publicRequestNumber === requestIdParam
        );

        if (match) {
          const txItem: TopUpTransaction = {
            id: match.id,
            userId: match.userId,
            amount: match.amount,
            method: match.paymentMethod as any,
            status: 'info_required' as any,
            transactionCode: match.publicRequestNumber,
            createdAt: match.createdAt,
            processedAt: match.reviewedAt || '',
            requestedInfoNote: match.requestedInfoNote,
            requestedInfoAt: match.requestedInfoAt,
            userClarificationText: match.userClarificationText,
            userClarificationAttachmentUrl: match.userClarificationAttachmentUrl,
            userClarificationFileName: match.userClarificationFileName,
            userClarificationSubmittedAt: match.userClarificationSubmittedAt,
          };
          handleOpenClarifyDialog(txItem);
        }
      }
    };

    checkParams();
    window.addEventListener('popstate', checkParams);
    return () => window.removeEventListener('popstate', checkParams);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('khidmatik_customization');
    if (saved) {
      try {
        setCustomization(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading customization settings:', e);
      }
    }
  }, []);

  const saveCustomization = (newSettings: CustomizationSettings) => {
    setCustomization(newSettings);
    localStorage.setItem('khidmatik_customization', JSON.stringify(newSettings));
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        saveCustomization({
          ...customization,
          coverStyle: 'image',
          coverUrl: reader.result as string
        });
        toast({ title: "تم رفع صورة الغلاف / Cover Photo Uploaded", description: "تم تحديث الغلاف بنجاح." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "حجم الصورة كبير جداً",
          description: "يرجى اختيار صورة بحجم أقل من 5 ميغابايت.",
          variant: "destructive"
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Url = reader.result as string;
        setProfileData(prev => prev ? {
          ...prev,
          avatarUrl: base64Url
        } : null);

        if (authUser?.id) {
          localStorage.setItem('khidmatik_avatar_' + authUser.id, base64Url);
          try {
            await supabase.from('profiles').update({
              avatar_url: base64Url
            }).eq('id', authUser.id);
          } catch (err) {
            console.warn('Local avatar update fallback', err);
          }
        }

        toast({
          title: "تم تغيير صورة البروفيل بنجاح! 📸",
          description: "تم تحديث صورتك الرمزية بنجاح.",
        });
      };
      reader.readAsDataURL(file);
    }
  };


  // Family Profiles state
  const [familyMembers, setFamilyMembers] = useState([
    { id: 'f1', name: 'سارة (الزوجة)', role: 'Wife', associatedServices: ['Carpentry / نجارة'] },
    { id: 'f2', name: 'أمين (الابن)', role: 'Son', associatedServices: ['Dentist / طبيب أسنان'] }
  ]);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyRole, setNewFamilyRole] = useState('Son');

  // My Assets state
  const [personalAssets, setPersonalAssets] = useState([
    { id: 'a1', name: 'المنزل الرئيسي', type: 'Home', purchaseDate: '2020-05-12', lastMaintenance: '2026-03-01', nextMaintenance: '2026-09-01', warrantyExpiry: '2030-05-12' },
    { id: 'a2', name: 'سيارة Dacia Duster', type: 'Car', purchaseDate: '2022-10-18', lastMaintenance: '2026-02-15', nextMaintenance: '2026-08-15', warrantyExpiry: '2025-10-18' },
    { id: 'a3', name: 'مكيف الصالون (LG 12000)', type: 'AC', purchaseDate: '2024-06-01', lastMaintenance: '2025-05-10', nextMaintenance: '2026-05-10', warrantyExpiry: '2026-06-01' }
  ]);

  // Warranties state
  const [activeWarranties, setActiveWarranties] = useState([
    { id: 'w1', name: 'تركيب مكيف الهواء (LG)', provider: 'مؤسسة التبريد السريع', startDate: '2024-06-01', endDate: '2026-08-01', remainingDays: 45 },
    { id: 'w2', name: 'إصلاح أنابيب المطبخ', provider: 'ياسين بن علي (سباك)', startDate: '2025-11-10', endDate: '2026-11-10', remainingDays: 110 }
  ]);

  // Home Maintenance Log state
  const [maintenanceLogs, setMaintenanceLogs] = useState([
    { id: 'l1', type: 'plumbing', date: '2025-11-10', provider: 'ياسين (سباك)', description: 'تركيب صنبور مياه مرن وتغيير أنابيب التصريف في المطبخ', cost: 3600 },
    { id: 'l2', type: 'electricity', date: '2026-01-15', provider: 'عبد القادر (كهربائي)', description: 'تركيب ثريات إضاءة وتعديل المقابس', cost: 12500 },
    { id: 'l3', type: 'ac', date: '2025-05-10', provider: 'حميد (تقني تكييف)', description: 'شحن غاز وتنظيف الفلاتر الخارجية والداخلية للمكيف', cost: 4500 }
  ]);

  // Activity Timeline logs
  const [activityLogs, setActivityLogs] = useState([
    { id: 'act1', type: 'login', title: 'تسجيل دخول جديد', date: '2026-07-23 09:30', status: 'success' },
    { id: 'act2', type: 'order_create', title: 'إنشاء طلب خدمة سباكة', date: '2026-07-20 14:15', status: 'completed' },
    { id: 'act3', type: 'wallet_topup', title: 'شحن رصيد المحفظة (+5000 DA)', date: '2026-07-18 11:00', status: 'approved' },
    { id: 'act4', type: 'security', title: 'تغيير كلمة المرور', date: '2026-06-30 18:22', status: 'success' }
  ]);

  // Advanced Privacy states
  const [hidePhone, setHidePhone] = useState(false);
  const [hideLocation, setHideLocation] = useState(false);
  const [whoCanSee, setWhoCanSee] = useState('everyone');
  const [whoCanMessage, setWhoCanMessage] = useState('everyone');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    // Update remaining days dynamically based on client date
    setActiveWarranties(prev => prev.map(w => {
      const expiry = new Date(w.endDate).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
      return { ...w, remainingDays: diff };
    }));
  }, []);

  // Chat state hooks
  const [activeChatSession, setActiveChatSession] = useState<{
    type: 'service' | 'store';
    id: string;
    name: string;
    categoryOrStore: string;
  } | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Load/synchronize chat session
  const openChatSession = (type: 'service' | 'store', id: string, name: string, subName: string) => {
    setActiveChatSession({ type, id, name, categoryOrStore: subName });
    if (type === 'service') {
      const saved = localStorage.getItem('khidmatik_conversations');
      let conversations: any[] = [];
      if (saved) {
        try {
          conversations = JSON.parse(saved);
        } catch (e) {
          conversations = [];
        }
      }
      let conv = conversations.find(c => c.id === id || (c.clientName === name && c.service === subName));
      if (!conv) {
        conv = {
          id: id,
          clientName: name,
          service: subName,
          archived: false,
          messages: [
            { id: 'm_init', sender: 'me', text: `مرحباً بك! أنا ${name}. كيف يمكنني مساعدتك بخصوص طلب الخدمة؟`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ]
        };
        conversations.push(conv);
        localStorage.setItem('khidmatik_conversations', JSON.stringify(conversations));
      }
      setChatMessages(conv.messages || []);
    } else {
      const key = `order_chat_${id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setChatMessages(JSON.parse(saved));
        } catch (e) {
          setChatMessages([]);
        }
      } else {
        const defaultChat = [
          { id: 'm_init', sender: 'seller', text: `مرحباً! شكراً لطلبك من متجرنا. كيف يمكننا مساعدتك اليوم؟`, timestamp: new Date().toISOString() }
        ];
        localStorage.setItem(key, JSON.stringify(defaultChat));
        setChatMessages(defaultChat);
      }
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || !activeChatSession) return;
    const text = chatInput.trim();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timestamp = new Date().toISOString();
    const newMsgId = 'msg_' + Date.now();

    if (activeChatSession.type === 'service') {
      const newMsg = { id: newMsgId, sender: 'client', text, time };
      const updatedMessages = [...chatMessages, newMsg];
      setChatMessages(updatedMessages);
      setChatInput('');

      const saved = localStorage.getItem('khidmatik_conversations');
      let conversations: any[] = [];
      if (saved) {
        try { conversations = JSON.parse(saved); } catch (e) {}
      }
      conversations = conversations.map(c => {
        if (c.id === activeChatSession.id || (c.clientName === activeChatSession.name && c.service === activeChatSession.categoryOrStore)) {
          return { ...c, messages: [...(c.messages || []), newMsg] };
        }
        return c;
      });
      localStorage.setItem('khidmatik_conversations', JSON.stringify(conversations));

      setTimeout(() => {
        const replyMsg = {
          id: 'reply_' + Date.now(),
          sender: 'me',
          text: `شكراً لرسالتك! سأقوم بالرد عليك في أقرب وقت ممكن بخصوص تفاصيل طلبك.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setChatMessages(prev => {
          const next = [...prev, replyMsg];
          const savedLatest = localStorage.getItem('khidmatik_conversations');
          let latestConvs: any[] = [];
          if (savedLatest) {
            try { latestConvs = JSON.parse(savedLatest); } catch (e) {}
          }
          latestConvs = latestConvs.map(c => {
            if (c.id === activeChatSession.id || (c.clientName === activeChatSession.name && c.service === activeChatSession.categoryOrStore)) {
              return { ...c, messages: [...(c.messages || []), replyMsg] };
            }
            return c;
          });
          localStorage.setItem('khidmatik_conversations', JSON.stringify(latestConvs));
          return next;
        });
      }, 1500);
    } else {
      const newMsg = { id: newMsgId, sender: 'customer', text, timestamp };
      const updatedMessages = [...chatMessages, newMsg];
      setChatMessages(updatedMessages);
      setChatInput('');

      const key = `order_chat_${activeChatSession.id}`;
      localStorage.setItem(key, JSON.stringify(updatedMessages));

      setTimeout(() => {
        const replyMsg = {
          id: 'reply_' + Date.now(),
          sender: 'seller',
          text: `تم استلام استفسارك بنجاح. فريق الدعم في المتجر سيتصل بك قريباً!`,
          timestamp: new Date().toISOString()
        };

        setChatMessages(prev => {
          const next = [...prev, replyMsg];
          localStorage.setItem(key, JSON.stringify(next));
          return next;
        });
      }, 1500);
    }
  };

  // Sync profile data from Supabase
  useEffect(() => {
    const loadProfileData = async () => {
      if (!authUser) return;
      try {
        let appts = await bookingService.getAppointments(authUser.id);
        
        let orders: any[] = [];
        try {
          orders = await orderService.getCustomerOrders(authUser.id);
        } catch (e) {
          console.error('Error fetching store orders:', e);
        }

        const saved = localStorage.getItem('khidmatik_appointments');
        if (saved) {
          try {
            const list = JSON.parse(saved);
            const localMapped = list.map((appt: any) => ({
              reservationId: appt.id || appt.reservationId,
              professionalId: appt.provider_id || appt.professionalId,
              professionalName: appt.providerName || appt.professionalName || 'Professional',
              professionalCategory: appt.professionalCategory || 'Service Provider',
              clinicLogoUrl: appt.clinicLogoUrl || 'https://placehold.co/100x100.png',
              date: appt.date,
              timeSlot: appt.timeSlot,
              patientName: appt.patientName,
              reasonForVisit: appt.reasonForVisit || appt.service || 'Service Visit',
              status: appt.status,
              notes: appt.notes || '',
              location: appt.location || ''
            }));
            
            const merged = [...appts];
            localMapped.forEach((la: any) => {
              const idx = merged.findIndex(m => m.reservationId === la.reservationId);
              if (idx !== -1) {
                merged[idx] = la;
              } else {
                merged.push(la);
              }
            });
            appts = merged;
          } catch (e) {
            console.error('Error parsing local appointments:', e);
          }
        }
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        const { data: escrows } = await supabase
          .from('ongoing_services_escrow')
          .select('*')
          .eq('customer_id', authUser.id);

        const ongoingServices = escrows ? escrows.map(e => ({
          id: e.id,
          serviceName: e.service_name,
          providerName: e.provider_name,
          amountInEscrow: parseFloat(e.amount_in_escrow),
          dateBooked: e.created_at
        })) : [];

        let topUpHistory = txs ? txs.map(t => ({
          id: t.id,
          userId: t.user_id,
          amount: parseFloat(t.amount),
          method: t.method,
          status: t.status,
          transactionCode: t.transaction_code,
          createdAt: t.created_at,
          processedAt: t.processed_at
        })) : [];

        const savedTopups = localStorage.getItem('khidmatik_topups_' + authUser.id);
        if (savedTopups) {
          try {
            const localList = JSON.parse(savedTopups);
            const merged = [...topUpHistory];
            localList.forEach((lt: any) => {
              if (!merged.some(m => m.id === lt.id || m.transactionCode === lt.transactionCode)) {
                merged.unshift(lt);
              }
            });
            topUpHistory = merged;
          } catch (e) {
            console.error('Error parsing local topups:', e);
          }
        }

        // Merge from unified financialService engine
        try {
          financialService.syncTopUpsFromServer().catch(() => {});
          const engineTopups = financialService.getTopUpRequests();
          const normAuthId = financialService.normalizeUserId(authUser.id);
          engineTopups.forEach((et) => {
            if (
              et.userId === authUser.id ||
              financialService.normalizeUserId(et.userId) === normAuthId ||
              authUser.id === 'user_1534d1e7' ||
              et.userId === 'currentUser' ||
              (authUser.email && et.userEmail && authUser.email.toLowerCase() === et.userEmail.toLowerCase()) ||
              (authUser.name && et.userName && authUser.name.toLowerCase().includes(et.userName.toLowerCase()))
            ) {
              const existingIdx = topUpHistory.findIndex(t => t.id === et.id || t.transactionCode === et.publicRequestNumber);
              const mappedStatus = 
                et.status === 'APPROVED' ? 'approved' : 
                et.status === 'REJECTED' ? 'rejected' : 
                et.status === 'INFO_REQUIRED' ? 'info_required' : 
                'pending-review';
              const txItem = {
                id: et.id,
                userId: et.userId,
                amount: et.amount,
                method: et.paymentMethod as any,
                status: mappedStatus as any,
                transactionCode: et.publicRequestNumber,
                createdAt: et.createdAt,
                processedAt: et.reviewedAt || '',
                requestedInfoNote: et.requestedInfoNote,
                requestedInfoAt: et.requestedInfoAt,
                userClarificationText: et.userClarificationText,
                userClarificationAttachmentUrl: et.userClarificationAttachmentUrl,
                userClarificationFileName: et.userClarificationFileName,
                userClarificationSubmittedAt: et.userClarificationSubmittedAt,
              };
              if (existingIdx !== -1) {
                topUpHistory[existingIdx] = txItem;
              } else {
                topUpHistory.unshift(txItem);
              }
            }
          });
        } catch (e) {
          console.error('Error syncing financial engine topups:', e);
        }

        // Set realistic subscription tier based on actual user role
        if (authUser.isStoreOwner) {
          setCurrentSubscription({
            plan: 'Store Partner / شريك متجر معتمد',
            price: 4500,
            renewsOn: '2026-09-30',
            active: true,
            tier: 'bronze'
          });
        } else if (authUser.isFreelancer) {
          setCurrentSubscription({
            plan: 'Professional Artisan / حرفي معتمد',
            price: 2500,
            renewsOn: '2026-09-30',
            active: true,
            tier: 'bronze'
          });
        } else {
          setCurrentSubscription({
            plan: 'Free Customer Account / باقة الزبون المجانية',
            price: 0,
            renewsOn: 'Permanent / دائم',
            active: true,
            tier: 'free'
          });
        }

        const savedOrders = localStorage.getItem('khidmatik_orders');
        if (savedOrders) {
          try {
            const list = JSON.parse(savedOrders);
            const merged = [...orders];
            list.forEach((lo: any) => {
              if (!merged.some(m => m.id === lo.id)) {
                merged.push(lo);
              }
            });
            orders = merged;
          } catch (e) {
            console.error('Error parsing local orders:', e);
          }
        }
        setStoreOrders(orders);

        // Fetch authoritative live wallet from financialService
        const userWallet = financialService.getUserWallet(authUser.id, authUser.name);

        const savedAvatar = typeof window !== 'undefined' ? localStorage.getItem('khidmatik_avatar_' + authUser.id) : null;

        setProfileData({
          id: authUser.id,
          name: authUser.name,
          email: authUser.email,
          avatarUrl: savedAvatar || authUser.avatarUrl,
          memberSince: authUser.memberSince || 'January 2024',
          isVerified: true,
          walletBalance: userWallet.availableBalance,
          ongoingServices,
          topUpHistory,
          appointments: appts,
          isStoreOwner: authUser.isStoreOwner,
          storeId: authUser.storeId,
          isFreelancer: authUser.isFreelancer,
          linkedAccounts: [
            { platform: 'Google', identifier: authUser.email, isLinked: true, icon: LucideIcons.Laptop },
            { platform: 'Phone', identifier: '+213 661234567', isLinked: true, icon: LucideIcons.Zap },
          ]
        });
      } catch (err) {
        console.error('Error loading profile data:', err);
      }
    };
    if (authUser) loadProfileData();
  }, [authUser]);

  // Reactive listener for real-time wallet credits and top-up approvals without page reload
  useEffect(() => {
    const handleWalletUpdated = (e?: any) => {
      const targetUserId = authUser?.id || 'user_1534d1e7';
      const userWallet = financialService.getUserWallet(targetUserId, authUser?.name);
      const engineTopups = financialService.getTopUpRequests();
      const normId = financialService.normalizeUserId(targetUserId);
      const seenKeys = new Set<string>();
      const updatedUserTopups: TopUpTransaction[] = engineTopups
        .filter(
          et =>
            financialService.normalizeUserId(et.userId) === normId ||
            et.userId === targetUserId ||
            targetUserId === 'user_1534d1e7' ||
            et.userId === 'currentUser' ||
            (authUser?.email && et.userEmail && authUser.email.toLowerCase() === et.userEmail.toLowerCase())
        )
        .filter(et => {
          const k = et.id || et.publicRequestNumber;
          if (seenKeys.has(k)) return false;
          seenKeys.add(k);
          return true;
        })
        .map(et => ({
          id: et.id,
          userId: et.userId,
          amount: et.amount,
          method: et.paymentMethod as any,
          status: (et.status === 'APPROVED' ? 'approved' : et.status === 'REJECTED' ? 'rejected' : et.status === 'INFO_REQUIRED' ? 'info_required' : 'pending-review') as any,
          transactionCode: et.publicRequestNumber,
          createdAt: et.createdAt,
          processedAt: et.reviewedAt || '',
          requestedInfoNote: et.requestedInfoNote,
          requestedInfoAt: et.requestedInfoAt,
          userClarificationText: et.userClarificationText,
          userClarificationAttachmentUrl: et.userClarificationAttachmentUrl,
          userClarificationFileName: et.userClarificationFileName,
          userClarificationSubmittedAt: et.userClarificationSubmittedAt,
        }));

      setProfileData(prev => prev ? {
        ...prev,
        walletBalance: userWallet.availableBalance,
        topUpHistory: updatedUserTopups.length > 0 ? updatedUserTopups : prev.topUpHistory,
      } : null);

      setBalanceHighlight(true);
      setTimeout(() => setBalanceHighlight(false), 2500);
    };

    window.addEventListener('khidmatik:wallet-updated', handleWalletUpdated);
    window.addEventListener('khidmatik:topup-updated', handleWalletUpdated);
    window.addEventListener('khidmatik_notif_update', handleWalletUpdated);
    window.addEventListener('storage', handleWalletUpdated);
    return () => {
      window.removeEventListener('khidmatik:wallet-updated', handleWalletUpdated);
      window.removeEventListener('khidmatik:topup-updated', handleWalletUpdated);
      window.removeEventListener('khidmatik_notif_update', handleWalletUpdated);
      window.removeEventListener('storage', handleWalletUpdated);
    };
  }, [authUser]);

  useEffect(() => {
    document.title = 'My Profile | Khidmatik';
  }, []);

  // Alias user to profileData for page rendering compatibility
  const user = profileData!;

  const handleTopUpSuccess = (newTransaction: TopUpTransaction) => {
    setProfileData(prevUser => {
      if (!prevUser) return null;
      const prevHistory = prevUser.topUpHistory || [];
      const filteredPrev = prevHistory.filter(t => t.id !== newTransaction.id && t.transactionCode !== newTransaction.transactionCode);
      const updatedHistory = [newTransaction, ...filteredPrev];
      if (authUser?.id) {
        localStorage.setItem('khidmatik_topups_' + authUser.id, JSON.stringify(updatedHistory));
        const userWallet = financialService.getUserWallet(authUser.id, authUser.name);
        return {
          ...prevUser,
          walletBalance: userWallet.availableBalance,
          topUpHistory: updatedHistory,
        };
      }
      return {
        ...prevUser,
        topUpHistory: updatedHistory,
      };
    });
  };

  const handleUpgradeSubscription = (planName: string, price: number, tier: string) => {
    if (user.walletBalance < price) {
      toast({
        title: "Insufficient Balance / رصيد غير كافٍ",
        description: `Your wallet balance (${user.walletBalance} DA) is not enough to upgrade to ${planName} (${price} DA). Please top up.`,
        variant: "destructive"
      });
      return;
    }

    // Deduct balance and update state
    const updatedBalance = user.walletBalance - price;
    setProfileData(prev => prev ? { ...prev, walletBalance: updatedBalance } : null);

    // Calculate new renewal date (30 days from today)
    const today = new Date();
    today.setDate(today.getDate() + 30);
    const renewDateString = today.toISOString().split('T')[0];

    setCurrentSubscription({
      plan: planName,
      price: price,
      renewsOn: renewDateString,
      active: true,
      tier: tier as any
    });

    // Add to activity log
    const newLog = {
      id: 'act_' + Date.now(),
      type: 'security',
      title: `ترقية الاشتراك إلى ${planName}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'approved'
    };
    setActivityLogs(prev => [newLog, ...prev]);

    setIsUpgradePlanOpen(false);
    toast({
      title: "Subscription Upgraded! / تم ترقية الاشتراك",
      description: `Successfully upgraded to ${planName}. ${price} DA deducted from your escrow wallet.`,
    });
  };

  const handleRenewPlan = () => {
    if (user.walletBalance < currentSubscription.price) {
      toast({
        title: "Insufficient Balance / رصيد غير كافٍ",
        description: "يرجى شحن محفظتك أولاً لتتمكن من تجديد الاشتراك.",
        variant: "destructive"
      });
      return;
    }
    const updatedBalance = user.walletBalance - currentSubscription.price;
    setProfileData(prev => prev ? { ...prev, walletBalance: updatedBalance } : null);

    const currentRenew = new Date(currentSubscription.renewsOn);
    currentRenew.setDate(currentRenew.getDate() + 30);
    const newRenewStr = currentRenew.toISOString().split('T')[0];

    setCurrentSubscription(prev => ({
      ...prev,
      renewsOn: newRenewStr
    }));

    toast({
      title: "Subscription Renewed / تم تجديد الاشتراك",
      description: `Successfully renewed subscription for 30 more days. ${currentSubscription.price} DA deducted from your wallet.`,
    });
  };

  const handleRefreshBalance = async () => {
    setIsRefreshingBalance(true);
    try {
      await financialService.syncTopUpsFromServer().catch(() => {});
      const targetUserId = authUser?.id || 'user_1534d1e7';
      const userWallet = financialService.getUserWallet(targetUserId, authUser?.name);
      setProfileData(prev => prev ? ({
        ...prev,
        walletBalance: userWallet.availableBalance,
      }) : null);
      setBalanceHighlight(true);
      setTimeout(() => setBalanceHighlight(false), 2000);
      toast({
        title: "تم تحديث ومزامنة الرصيد بنجاح! 💳",
        description: `الرصيد المتاح الحالي في محفظتك: ${userWallet.availableBalance.toLocaleString()} DA`,
      });
    } catch (e: any) {
      toast({
        title: "خطأ في المزامنة",
        description: e.message || "تعذر مزامنة الرصيد حالياً",
        variant: "destructive"
      });
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  const handleApproveReceipt = async (transactionOrId: TopUpTransaction | string) => {
    const tx = typeof transactionOrId === 'string'
      ? user.topUpHistory?.find(t => t.id === transactionOrId || t.transactionCode === transactionOrId)
      : transactionOrId;

    if (!tx) return;
    setApprovingTransactionId(tx.id);

    try {
      // 1. Unified single atomic approval in financialService
      const targetReqId = tx.transactionCode || tx.id;
      const approvalResult = financialService.approveTopUpRequest(
        targetReqId,
        'Admin Finance Desk',
        'تم التحقق من الوصل واعتماد الرصيد ومطابقة القيد بنجاح'
      );

      if (!approvalResult.success && approvalResult.error && !approvalResult.error.includes('مسبقاً')) {
        throw new Error(approvalResult.error);
      }
      
      // 2. Fetch authoritative user wallet directly from store (single credit guarantee)
      const targetUserId = authUser?.id || 'user_1534d1e7';
      const userWallet = financialService.getUserWallet(targetUserId, authUser?.name);

      // 3. Immediate local reactive state update
      const nowStr = new Date().toISOString();
      const pointsEarned = Math.floor(tx.amount / 10);
      setProfileData(prevUser => {
        if (!prevUser) return null;
        const updatedHistory = (prevUser.topUpHistory || []).map(t =>
          t.id === tx.id || t.transactionCode === tx.transactionCode
            ? { ...t, status: 'approved' as any, processedAt: nowStr }
            : t
        );
        if (authUser?.id) {
          localStorage.setItem('khidmatik_topups_' + authUser.id, JSON.stringify(updatedHistory));
        }
        localStorage.setItem('khidmatik_topups_user_1534d1e7', JSON.stringify(updatedHistory));
        localStorage.setItem('khidmatik_topups_1534d1e7-93d2-45f3-94af-180b06fce8a2', JSON.stringify(updatedHistory));

        return {
          ...prevUser,
          walletBalance: userWallet.availableBalance,
          loyaltyPoints: (prevUser.loyaltyPoints || 0) + pointsEarned,
          topUpHistory: updatedHistory,
        };
      });

      // 4. Highlight balance card
      setBalanceHighlight(true);
      setTimeout(() => setBalanceHighlight(false), 3500);

      // 5. Server API call for persistent server-side ledger sync
      try {
        await fetch(`/api/v1/financial/topups/${encodeURIComponent(tx.id || tx.transactionCode)}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminName: 'Admin Supervisor',
            adminNotes: 'تم قبول الوصل واعتماد الرصيد ومطابقة القيد بنجاح',
          }),
        });
      } catch (e) {
        console.warn('Server topup approval fetch notification (handled gracefully):', e);
      }

      toast({
        title: "✅ تم اعتماد الوصل وتحديث الرصيد بنجاح!",
        description: `تم إيداع مبلغ +${tx.amount.toLocaleString()} دج في محفظتك الرقمية وتحديث الرصيد المتاح.`,
        duration: 5000,
      });
    } catch (e: any) {
      toast({
        title: "تعذر اعتماد الوصل",
        description: e.message || "حدث خطأ أثناء معالجة الوصل",
        variant: "destructive",
      });
    } finally {
      setApprovingTransactionId(null);
    }
  };

  const simulateAdminApproval = handleApproveReceipt;

  const handleCompleteService = async (serviceId: string) => {
    if (!user) return;
    const service = user.ongoingServices.find(s => s.id === serviceId);
    if (!service) return;
    
    await new Promise(resolve => setTimeout(resolve, 200));

    setProfileData(prevUser => prevUser ? ({
      ...prevUser,
      ongoingServices: prevUser.ongoingServices.filter(s => s.id !== serviceId),
      loyaltyPoints: (prevUser.loyaltyPoints || 0) + 50, 
    }) : null);

    toast({
      title: "Service Completed!",
      description: `Funds for "${service.serviceName}" released. You and the provider have been notified. 50 loyalty points earned!`,
    });
  };

  const handleRedeemPoints = async (description: string) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    toast({ title: "Points Redemption (Conceptual)", description: `Redeemed: ${description}.` });
  };

  const handleLinkAccount = async (platform: LinkedAccountData['platform']) => {
    if (!user) return;
    await new Promise(resolve => setTimeout(resolve, 200));
    toast({ title: `Link ${platform} Account (Conceptual)`, description: `Initiating link for ${platform}.`});
    setProfileData(prev => prev ? ({ ...prev, linkedAccounts: prev.linkedAccounts?.map(acc => acc.platform === platform ? {...acc, isLinked: true, identifier: platform === 'Phone' ? 'New Linked Phone' : `linked@${platform.toLowerCase()}.com`} : acc) }) : null);
  };

  const handleUnlinkAccount = async (platform: LinkedAccountData['platform']) => {
    if (!user) return;
    await new Promise(resolve => setTimeout(resolve, 200));
    const linkedCount = user.linkedAccounts?.filter(acc => acc.isLinked).length || 0;
    if (linkedCount <= 1 && user.linkedAccounts?.find(acc => acc.platform === platform && acc.isLinked)) {
        toast({ title: `Cannot Unlink`, description: `Must have at least one login method.`, variant: "destructive" }); return;
    }
    toast({ title: `Unlink ${platform} (Conceptual)`, description: `Unlinking ${platform}.`, variant: "destructive" });
    setProfileData(prev => prev ? ({ ...prev, linkedAccounts: prev.linkedAccounts?.map(acc => acc.platform === platform ? {...acc, isLinked: false, identifier: 'Not Linked'} : acc)}) : null);
  };

  const openDisputeModal = (apptId: string) => {
    setDisputeApptId(apptId);
    setDisputeReason('Work incomplete');
    setDisputeComments('');
    setIsDisputeOpen(true);
  };

  const handleDisputeSubmit = async () => {
    if (!disputeApptId || !profileData) return;
    
    const appt = profileData.appointments?.find(a => a.reservationId === disputeApptId);
    if (!appt) return;

    const payload = parseServiceNotes(appt.notes);
    const disputeLog = createAuditLog('DISPUTE', `Dispute opened by client. Reason: ${disputeReason}. Comments: ${disputeComments}`);
    
    payload.disputeReason = disputeReason;
    payload.disputeComments = disputeComments;
    payload.disputeTimestamp = new Date().toISOString();
    payload.auditLogs.push(disputeLog);
    
    const updatedNotes = serializeServiceNotes(payload);

    // Update locally
    const updatedAppointments = profileData.appointments?.map(a => 
      a.reservationId === disputeApptId ? { ...a, status: 'disputed' as const, notes: updatedNotes } : a
    ) || [];
    setProfileData(prev => prev ? { ...prev, appointments: updatedAppointments } : null);

    // Update in Supabase
    try {
      await supabase.from('appointments').update({ status: 'disputed', notes: updatedNotes }).eq('id', disputeApptId);
      await supabase.from('notifications').insert({
        user_id: appt.professionalId,
        title: 'Dispute Opened on Booking',
        message: `Client opened a dispute on reservation ${appt.reservationId}: ${disputeReason}`,
        type: 'appointment'
      });
    } catch (e) {
      console.warn("Offline/mock update fallback", e);
    }
    
    // Save to local storage
    const saved = localStorage.getItem('khidmatik_appointments');
    if (saved) {
      try {
        const list = JSON.parse(saved);
        const updatedList = list.map((a: any) =>
          (a.id === disputeApptId || a.reservationId === disputeApptId) ? { ...a, status: 'disputed', notes: updatedNotes } : a
        );
        localStorage.setItem('khidmatik_appointments', JSON.stringify(updatedList));
      } catch (e) {
        console.error(e);
      }
    }

    setIsDisputeOpen(false);
    toast({
      title: "Dispute Submitted Successfully",
      description: "Admin support has been notified. We will review your dispute.",
      variant: "destructive"
    });
  };

  const openRatingModal = (apptId: string) => {
    setRatingApptId(apptId);
    setRatingValue(5);
    setRatingComments('');
    setIsRatingOpen(true);
  };

  const handleRatingSubmit = async () => {
    if (!ratingApptId || !profileData) return;
    
    const appt = profileData.appointments?.find(a => a.reservationId === ratingApptId);
    if (!appt) return;

    const payload = parseServiceNotes(appt.notes);
    const ratingLog = createAuditLog('RATE_PROVIDER', `Client rated provider ${ratingValue} Stars. Review: ${ratingComments}`);
    
    payload.providerRating = ratingValue;
    payload.providerComments = ratingComments;
    payload.providerRatingTimestamp = new Date().toISOString();
    payload.auditLogs.push(ratingLog);
    
    const updatedNotes = serializeServiceNotes(payload);

    // Update locally
    const updatedAppointments = profileData.appointments?.map(a => 
      a.reservationId === ratingApptId ? { ...a, notes: updatedNotes } : a
    ) || [];
    setProfileData(prev => prev ? { ...prev, appointments: updatedAppointments } : null);

    // Update in Supabase
    try {
      await supabase.from('appointments').update({ notes: updatedNotes }).eq('id', ratingApptId);
      await supabase.from('reviews').insert({
        listing_id: appt.professionalId,
        author_id: profileData.id,
        author_name: profileData.name,
        rating: ratingValue,
        comment: ratingComments
      });
    } catch (e) {
      console.warn("Offline/mock reviews fallback", e);
    }
    
    // Save to local storage
    const saved = localStorage.getItem('khidmatik_appointments');
    if (saved) {
      try {
        const list = JSON.parse(saved);
        const updatedList = list.map((a: any) =>
          (a.id === ratingApptId || a.reservationId === ratingApptId) ? { ...a, notes: updatedNotes } : a
        );
        localStorage.setItem('khidmatik_appointments', JSON.stringify(updatedList));
      } catch (e) {
        console.error(e);
      }
    }

    setIsRatingOpen(false);
    toast({
      title: "Thank you for your rating!",
      description: "Your feedback helps maintain service quality.",
    });
  };

  const handleViewAppointmentTicket = (reservationId: string) => {
    const appointment = user.appointments?.find(appt => appt.reservationId === reservationId);
    if (!appointment) {
      toast({
        title: "Ticket Not Found",
        description: `Could not find appointment details for ID: ${reservationId}`,
        variant: "destructive"
      });
      return;
    }
    
    // Launch print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Pop-up Blocked",
        description: "Please allow pop-ups to print your ticket.",
        variant: "destructive"
      });
      return;
    }
    
    const formattedDate = format(new Date(appointment.date), "PPP");
    const gpsCoords = appointment.location?.match(/GPS Coordinates:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    const mapsLink = gpsCoords 
      ? `<a href="https://www.google.com/maps/search/?api=1&query=${gpsCoords[1]},${gpsCoords[2]}" target="_blank" style="color: #10b981; text-decoration: underline; font-weight: 500; margin-left: 10px;">View on Maps</a>`
      : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
        <head>
          <meta charset="utf-8">
          <title>Appointment Ticket - ${appointment.reservationId}</title>
          <style>
            body {
              font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
              background-color: #f3f4f6;
              color: #1f2937;
              margin: 0;
              padding: 40px 20px;
              display: flex;
              justify-content: center;
            }
            .ticket {
              width: 100%;
              max-width: 500px;
              background-color: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
              overflow: hidden;
            }
            .brand-header {
              background: linear-gradient(135deg, #10b981, #059669);
              color: #ffffff;
              padding: 24px;
              text-align: center;
            }
            .brand-header h1 {
              margin: 0;
              font-size: 22px;
              font-weight: 800;
            }
            .brand-header p {
              margin: 4px 0 0 0;
              font-size: 14px;
              opacity: 0.9;
            }
            .cut-line {
              height: 2px;
              border-top: 2px dashed #e5e7eb;
              margin: 0;
              position: relative;
            }
            .cut-line::before, .cut-line::after {
              content: '';
              position: absolute;
              top: -8px;
              width: 16px;
              height: 16px;
              background-color: #f3f4f6;
              border-radius: 50%;
              border: 1px solid #e5e7eb;
            }
            .cut-line::before { left: -9px; }
            .cut-line::after { right: -9px; }
            .ticket-body {
              padding: 30px;
            }
            .ticket-title {
              text-align: center;
              font-size: 16px;
              font-weight: 700;
              color: #111827;
              margin-bottom: 24px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .info-grid {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 20px;
            }
            .info-group {
              margin-bottom: 8px;
            }
            .info-label {
              font-size: 11px;
              font-weight: 600;
              color: #9ca3af;
              text-transform: uppercase;
            }
            .info-value {
              font-size: 15px;
              font-weight: 600;
              color: #1f2937;
              margin-top: 4px;
            }
            .full-width {
              grid-column: span 2;
            }
            .policy-box {
              background-color: #eff6ff;
              border-left: 4px solid #3b82f6;
              padding: 16px;
              border-radius: 8px;
              margin-top: 24px;
              font-size: 13px;
              color: #1e3a8a;
              line-height: 1.5;
            }
            .barcode-container {
              margin-top: 30px;
              text-align: center;
              border-top: 1px solid #f3f4f6;
              padding-top: 24px;
            }
            .barcode {
              display: inline-block;
              width: 280px;
              height: 50px;
              background: repeating-linear-gradient(90deg, 
                #111827, #111827 2px, 
                #ffffff 2px, #ffffff 6px,
                #111827 6px, #111827 7px,
                #ffffff 7px, #ffffff 10px,
                #111827 10px, #111827 12px,
                #ffffff 12px, #ffffff 15px
              );
            }
            .barcode-text {
              font-family: monospace;
              font-size: 13px;
              color: #4b5563;
              margin-top: 6px;
            }
            .ticket-footer {
              text-align: center;
              font-size: 12px;
              color: #9ca3af;
              margin-top: 24px;
            }
            @media print {
              body {
                background-color: #ffffff;
                padding: 0;
              }
              .ticket {
                box-shadow: none;
                border: 1px solid #d1d5db;
              }
              .cut-line::before, .cut-line::after {
                background-color: #ffffff;
              }
            }
          </style>
        </head>
        <body>
          <div>
            <div class="ticket">
              <div class="brand-header">
                <h1>KHIDMATIK - خدماتك</h1>
                <p>Digital Booking & Services Platform</p>
              </div>
              <div class="cut-line"></div>
              <div class="ticket-body">
                <div class="ticket-title">Service Appointment Ticket</div>
                <div class="info-grid">
                  <div class="info-group">
                    <div class="info-label">Reservation ID</div>
                    <div class="info-value" style="color: #059669; font-family: monospace; font-size: 16px;">${appointment.reservationId}</div>
                  </div>
                  <div class="info-group">
                    <div class="info-label">Status</div>
                    <div class="info-value" style="color: #3b82f6;">${appointment.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                  </div>
                  <div class="info-group full-width">
                    <div class="info-label">Service Provider / Professional</div>
                    <div class="info-value">${appointment.professionalName}</div>
                  </div>
                  <div class="info-group">
                    <div class="info-label">Patient / Client Name</div>
                    <div class="info-value">${appointment.patientName}</div>
                  </div>
                  <div class="info-group">
                    <div class="info-label">Date</div>
                    <div class="info-value">${formattedDate}</div>
                  </div>
                  <div class="info-group full-width">
                    <div class="info-label">Location / Address</div>
                    <div class="info-value">${appointment.location || 'Not Specified'} ${mapsLink}</div>
                  </div>
                  ${appointment.reasonForVisit ? `
                  <div class="info-group full-width">
                    <div class="info-label">Reason for Request</div>
                    <div class="info-value" style="font-weight: normal; font-size: 14px; color: #4b5563;">${appointment.reasonForVisit}</div>
                  </div>
                  ` : ''}
                </div>
                
                <div class="policy-box">
                  <strong>Punctuality Policy / سياسة الالتزام بالحضور</strong>
                  يرجى الحضور قبل 10 دقائق من موعد الخدمة المحدد. التأخير لأكثر من 15 دقيقة قد يؤدي إلى إلغاء موعد الحجز أو إعادة جدولته تلقائياً.
                </div>
                
                <div class="barcode-container">
                  <div class="barcode"></div>
                  <div class="barcode-text">${appointment.reservationId}</div>
                </div>
              </div>
            </div>
            <div class="ticket-footer">
              Thank you for choosing Khidmatik. Please present this ticket code upon provider arrival.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 1500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Helper variables for statistics and filters calculation
  const allServiceOrders = [
    ...(profileData?.appointments || []),
    ...mockServiceOrders.filter(mo => !(profileData?.appointments || []).some(a => a.reservationId === mo.reservationId))
  ];

  const allStoreOrders = [
    ...storeOrders,
    ...mockStoreOrders.filter(mo => !storeOrders.some(o => o.id === mo.id))
  ];

  const totalServiceOrders = allServiceOrders.length;
  const totalStoreOrders = allStoreOrders.length;
  
  const serviceInProgress = allServiceOrders.filter(a => a.status === 'confirmed' || a.status === 'en_route' || a.status === 'in_progress' || a.status === 'waiting_verification' || a.status === 'disputed').length;
  const storeInProgress = allStoreOrders.filter(o => o.status === 'pending' || o.status === 'processing' || o.status === 'shipped' || o.status === 'out_for_delivery').length;
  const totalInProgress = serviceInProgress + storeInProgress;

  const serviceCompleted = allServiceOrders.filter(a => a.status === 'completed').length;
  const storeCompleted = allStoreOrders.filter(o => o.status === 'delivered').length;
  const totalCompleted = serviceCompleted + storeCompleted;

  const serviceCancelled = allServiceOrders.filter(a => a.status === 'cancelled').length;
  const storeCancelled = allStoreOrders.filter(o => o.status === 'cancelled').length;
  const totalCancelled = serviceCancelled + storeCancelled;

  const storeSpent = allStoreOrders.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);
  const serviceSpent = allServiceOrders.reduce((acc, a) => {
    const notesPayload = parseServiceNotes(a.notes);
    const materialsCost = notesPayload.materialsUsed?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
    return acc + 3000 + materialsCost;
  }, 0);
  const totalSpent = storeSpent + serviceSpent;

  // Filter Service Orders
  const filteredServices = allServiceOrders.filter(a => {
    const term = ordersSearchTerm.toLowerCase();
    const matchesSearch = 
      a.reservationId.toLowerCase().includes(term) ||
      a.professionalName.toLowerCase().includes(term) ||
      (a.professionalCategory && a.professionalCategory.toLowerCase().includes(term)) ||
      (a.reasonForVisit && a.reasonForVisit.toLowerCase().includes(term));

    const statusMap = {
      pending: a.status === 'pending_confirmation',
      in_progress: a.status === 'confirmed' || a.status === 'en_route' || a.status === 'in_progress' || a.status === 'waiting_verification' || a.status === 'disputed',
      completed: a.status === 'completed',
      cancelled: a.status === 'cancelled'
    };
    const matchesStatus = ordersStatusFilter === 'all' || (statusMap as any)[ordersStatusFilter];

    let matchesDate = true;
    if (a.date) {
      const dateObj = new Date(a.date);
      const diffTime = Math.abs(new Date().getTime() - dateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (ordersDateFilter === '7days') matchesDate = diffDays <= 7;
      else if (ordersDateFilter === 'month') matchesDate = diffDays <= 30;
      else if (ordersDateFilter === 'year') matchesDate = diffDays <= 365;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Sort Service Orders
  const sortedServices = [...filteredServices].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    
    const getPrice = (ord: any) => {
      const notesPayload = parseServiceNotes(ord.notes);
      const materialsCost = notesPayload.materialsUsed?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
      return 3000 + materialsCost;
    };
    const priceA = getPrice(a);
    const priceB = getPrice(b);

    if (ordersSortBy === 'newest') return dateB - dateA;
    if (ordersSortBy === 'oldest') return dateA - dateB;
    if (ordersSortBy === 'price_desc') return priceB - priceA;
    if (ordersSortBy === 'price_asc') return priceA - priceB;
    return a.status.localeCompare(b.status);
  });

  // Filter Store Orders
  const filteredStores = allStoreOrders.filter(o => {
    const term = ordersSearchTerm.toLowerCase();
    const matchesSearch = 
      o.id.toLowerCase().includes(term) ||
      o.shipping_provider?.toLowerCase().includes(term) ||
      o.order_items?.some((item: any) => item.product_name.toLowerCase().includes(term));

    const statusMap = {
      pending: o.status === 'pending',
      in_progress: o.status === 'processing' || o.status === 'shipped' || o.status === 'out_for_delivery',
      completed: o.status === 'delivered',
      cancelled: o.status === 'cancelled'
    };
    const matchesStatus = ordersStatusFilter === 'all' || (statusMap as any)[ordersStatusFilter];

    let matchesDate = true;
    if (o.created_at) {
      const dateObj = new Date(o.created_at);
      const diffTime = Math.abs(new Date().getTime() - dateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (ordersDateFilter === '7days') matchesDate = diffDays <= 7;
      else if (ordersDateFilter === 'month') matchesDate = diffDays <= 30;
      else if (ordersDateFilter === 'year') matchesDate = diffDays <= 365;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Sort Store Orders
  const sortedStores = [...filteredStores].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    const priceA = parseFloat(a.total) || 0;
    const priceB = parseFloat(b.total) || 0;

    if (ordersSortBy === 'newest') return dateB - dateA;
    if (ordersSortBy === 'oldest') return dateA - dateB;
    if (ordersSortBy === 'price_desc') return priceB - priceA;
    if (ordersSortBy === 'price_asc') return priceA - priceB;
    return a.status.localeCompare(b.status);
  });

  if (isAuthLoading || (authUser && !profileData)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-2">
        <LucideIcons.Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your profile details...</p>
      </div>
    );
  }

  if (!authUser || !profileData) {
    return (
      <div className="text-center py-20 space-y-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">Please log in to view your profile.</p>
        <Button asChild><Link href="/login">Log In</Link></Button>
      </div>
    );
  }

  // --- Subscription Theme Manager Logic ---
  const activeTier = currentSubscription.tier as SubscriptionTier;
  const standardTheme = TIER_THEMES[activeTier] || TIER_THEMES.free;

  // Resolve customization (only active for platinum/diamond)
  const isPremiumUser = activeTier === 'platinum' || activeTier === 'diamond';
  
  const currentAccentColor = (isPremiumUser && customization.identityColor) 
    ? customization.identityColor 
    : standardTheme.accentColor;

  const currentAccentHsl = (isPremiumUser && customization.identityColor)
    ? hexToHslTriple(customization.identityColor)
    : standardTheme.accentHsl;

  const currentFrameColor = (isPremiumUser && customization.frameColor)
    ? customization.frameColor
    : standardTheme.accentColor;

  const currentFrameShape = (isPremiumUser && customization.frameShape)
    ? customization.frameShape
    : 'circle';

  const currentCoverStyle = (isPremiumUser && customization.coverStyle)
    ? customization.coverStyle
    : 'gradient';

  const currentCardStyle = (isPremiumUser && customization.cardStyle)
    ? customization.cardStyle
    : 'glass';

  // Get active subscription icon component
  const ActiveSubIcon = {
    free: ShieldCheck, // fallback to ShieldCheck as defined
    bronze: LucideIcons.Medal,
    silver: LucideIcons.Award,
    gold: LucideIcons.Crown,
    platinum: LucideIcons.Gem,
    diamond: LucideIcons.Sparkles
  }[activeTier] || ShieldCheck;

  return (
    <div 
      className="w-full min-h-screen space-y-6 text-foreground"
      style={{
        '--primary': currentAccentHsl,
        '--ring': currentAccentHsl,
      } as React.CSSProperties}
    >
      {/* Public Preview Alert Bar */}
      {isPublicPreview && (
        <div className="bg-gradient-to-r from-primary via-indigo-600 to-purple-600 text-white px-5 py-3 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <LucideIcons.Eye className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-xs">أنت الآن في وضع المعاينة العامة / Public Profile Preview Mode</p>
              <p className="text-[10px] text-white/80">هكذا يظهر ملفك الشخصي للزوار والعملاء الآخرين على منصة خدماتك.</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 text-xs bg-white text-primary hover:bg-white/90 font-bold px-4 rounded-xl shadow-xs"
            onClick={() => {
              setIsPublicPreview(false);
              toast({ title: "تم الخروج من وضع المعاينة", description: "عدت إلى لوحة التحكم الشخصية الكاملة." });
            }}
          >
            <LucideIcons.EyeOff className="h-3.5 w-3.5 mr-1" />
            العودة للوحة التحكم
          </Button>
        </div>
      )}

      {/* Dynamic Style Injection for visual effects */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sweepEffect {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shineEffect {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 5px ${currentFrameColor}80, inset 0 0 5px ${currentFrameColor}40; }
          50% { box-shadow: 0 0 20px ${currentFrameColor}, inset 0 0 10px ${currentFrameColor}60; }
          100% { box-shadow: 0 0 5px ${currentFrameColor}80, inset 0 0 5px ${currentFrameColor}40; }
        }
        @keyframes entranceFadeGlow {
          0% { opacity: 0; transform: scale(0.97); filter: brightness(1.2) drop-shadow(0 0 0px ${currentAccentColor}00); }
          100% { opacity: 1; transform: scale(1); filter: brightness(1) drop-shadow(0 0 15px ${currentAccentColor}30); }
        }
        @keyframes sparkle-pulse {
          0%, 100% { transform: scale(0.6) rotate(0deg); opacity: 0.3; }
          50% { transform: scale(1.1) rotate(180deg); opacity: 1; filter: drop-shadow(0 0 8px rgba(255,255,255,0.7)); }
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.4; }
          25% { transform: translateY(-20px) translateX(10px) scale(1.2); opacity: 0.8; }
          50% { transform: translateY(-10px) translateX(-5px) scale(0.9); opacity: 0.6; }
          75% { transform: translateY(-25px) translateX(15px) scale(1.1); opacity: 0.5; }
        }
        @keyframes geo-rotate {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.05); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes slide-in-bottom {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes avatar-ring-pulse {
          0%, 100% { box-shadow: 0 0 0 0 ${currentAccentColor}40; }
          50% { box-shadow: 0 0 0 8px ${currentAccentColor}00; }
        }
        @keyframes notif-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes sparkline-draw {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        .sparkle-icon-1 { animation: sparkle-pulse 2s infinite ease-in-out; }
        .sparkle-icon-2 { animation: sparkle-pulse 2.5s infinite ease-in-out 0.5s; }
        .sparkle-icon-3 { animation: sparkle-pulse 1.8s infinite ease-in-out 1s; }
        .entrance-animate { animation: entranceFadeGlow 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1; }
        .slide-in { animation: slide-in-bottom 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .slide-in-delay-1 { animation: slide-in-bottom 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .slide-in-delay-2 { animation: slide-in-bottom 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
        .avatar-ring-animate { animation: avatar-ring-pulse 2.5s infinite ease-in-out; }
        .notif-badge-bounce { animation: notif-bounce 1.5s infinite ease-in-out; }
        .sparkline-anim path { stroke-dasharray: 100; animation: sparkline-draw 1.5s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .entrance-animate, .slide-in, .slide-in-delay-1, .slide-in-delay-2,
          .animate-sweep, .animate-shine, .animate-pulse-glow,
          .avatar-ring-animate, .notif-badge-bounce, .sparkline-anim path {
            animation: none !important;
          }
        }
        .accent-card { border-top: 4px solid ${currentAccentColor} !important; }
        .frame-circle { border-radius: 9999px; }
        .frame-rounded-square { border-radius: 24%; }
        .frame-hexagon { clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); }
        .bronze-metal-border { background: linear-gradient(135deg, #b45309 0%, #d97706 50%, #78350f 100%); }
        .silver-metal-border { background: linear-gradient(135deg, #94a3b8 0%, #f1f5f9 30%, #cbd5e1 50%, #f8fafc 70%, #475569 100%); }
        .gold-metal-border {
          background: linear-gradient(135deg, #eab308 0%, #fef08a 35%, #ca8a04 50%, #fef9c3 65%, #854d0e 100%);
          position: relative; overflow: hidden;
        }
        .gold-metal-border::after {
          content: ''; position: absolute;
          top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
          transform: skewX(-25deg); animation: shineEffect 3s infinite;
        }
        .platinum-metal-border {
          background: linear-gradient(270deg, #a855f7, #6366f1, #3b82f6, #a855f7);
          background-size: 400% 400%;
          animation: sweepEffect 4s ease infinite, pulseGlow 3s ease infinite;
        }
        .diamond-metal-border {
          background: linear-gradient(270deg, #06b6d4, #3b82f6, #22d3ee, #06b6d4);
          background-size: 400% 400%;
          animation: sweepEffect 3s ease infinite, pulseGlow 2.5s ease infinite;
        }
        .cover-mesh { background-image: radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%); }
        .cover-stripes { background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 10px); }
        .stat-card-hover { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .stat-card-hover:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 8px 25px -5px rgba(0,0,0,0.1); }
      ` }} />

      {/* ═══════════ REDESIGNED PROFILE HEADER ═══════════ */}
      <Card className="w-full overflow-hidden border border-border/60 shadow-xl bg-card/90 backdrop-blur-xl rounded-3xl entrance-animate">
        {/* Cover Banner — Enhanced with Particles & Geometric Patterns */}
        <div 
          className="relative h-48 md:h-64 overflow-hidden group"
          style={{ 
            background: (currentCoverStyle === 'image' && customization.coverUrl)
              ? `url(${customization.coverUrl}) center/cover no-repeat`
              : currentCoverStyle === 'gradient' ? standardTheme.coverGradient 
              : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 60%, #0f172a 100%)'
          }}
        >
          {/* Overlay & Pattern Layers */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/50" />
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px]" />
          
          {/* Floating Geometric Shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-8 left-[10%] w-16 h-16 border border-white/10 rounded-xl" style={{ animation: 'geo-rotate 20s linear infinite' }} />
            <div className="absolute top-12 right-[15%] w-10 h-10 border border-white/8 rounded-full" style={{ animation: 'geo-rotate 15s linear infinite reverse' }} />
            <div className="absolute bottom-12 left-[30%] w-8 h-8 border border-white/6 rotate-45" style={{ animation: 'float-particle 8s ease-in-out infinite' }} />
            <div className="absolute top-6 left-[55%] w-6 h-6 bg-white/5 rounded-full" style={{ animation: 'float-particle 6s ease-in-out infinite 1s' }} />
            <div className="absolute bottom-8 right-[25%] w-12 h-12 border border-white/8 rounded-lg rotate-12" style={{ animation: 'float-particle 10s ease-in-out infinite 2s' }} />
            <div className="absolute top-16 left-[75%] w-4 h-4 bg-white/8 rounded-full" style={{ animation: 'float-particle 7s ease-in-out infinite 0.5s' }} />
          </div>

          {/* Cover Photo Upload Button (on hover) */}
          <label className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <div className="backdrop-blur-md bg-black/50 border border-white/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-white text-[10px] font-semibold hover:bg-black/60 transition-colors">
              <Camera className="h-3.5 w-3.5" /> تغيير الغلاف
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          </label>

          {/* Top-Right Badges Row */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {/* Notification Bell */}
            <button 
              onClick={() => setIsNotifCenterOpen(true)}
              className="relative backdrop-blur-md bg-black/40 border border-white/15 shadow-md rounded-xl p-2.5 text-white hover:bg-black/50 transition-all hover:scale-105"
            >
              <LucideIcons.Bell className="h-4 w-4" />
              {profileNotifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[9px] font-black flex items-center justify-center text-white notif-badge-bounce">
                  {profileNotifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {/* Verified Member Badge */}
            <div className="backdrop-blur-md bg-black/40 border border-white/15 shadow-md rounded-xl px-3.5 py-1.5 flex items-center gap-2 text-white">
              <ActiveSubIcon className="h-4 w-4 text-emerald-400" />
              <div className="text-left leading-tight">
                <p className="text-xs font-black tracking-wide">{activeTier === 'free' ? 'عضو موثق' : standardTheme.nameAr}</p>
                <p className="text-[10px] text-white/75 font-medium" dir="ltr">{activeTier === 'free' ? 'Verified Member' : 'Active Plan'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Info Overlay — Enhanced Layout & Clean Contrast */}
        <div className="relative px-5 md:px-8 pb-6 pt-3 flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-left slide-in">
            {/* Enhanced Avatar Frame with Direct Photo Change */}
            <div className="relative group/avatar shrink-0 -mt-16 md:-mt-20">
              {/* Outer Glow Ring */}
              <div 
                className="absolute -inset-1.5 rounded-3xl opacity-70 blur-md transition-all group-hover/avatar:opacity-100"
                style={{ background: `linear-gradient(135deg, ${currentAccentColor}80, ${currentAccentColor}30)` }}
              />
              <div className="relative avatar-ring-animate" style={{ borderRadius: '22px' }}>
                <Avatar className="h-32 w-32 md:h-36 md:w-36 border-4 border-background shadow-2xl rounded-2xl transition-all overflow-hidden bg-card">
                  <AvatarImage src={user.avatarUrl} alt={user.name} className="object-cover h-full w-full" />
                  <AvatarFallback className="text-4xl font-black bg-gradient-to-br from-primary/20 to-primary/5 text-primary rounded-2xl">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                {/* Clickable Hover Overlay to Change Profile Picture */}
                <label 
                  htmlFor="avatar-file-input"
                  className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-white z-20"
                >
                  <Camera className="h-6 w-6 text-white drop-shadow" />
                  <span className="text-[10px] font-bold tracking-wide">تغيير الصورة</span>
                </label>
                <input 
                  id="avatar-file-input"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload} 
                />

                {/* Camera Quick Badge Button */}
                <label
                  htmlFor="avatar-file-input"
                  className="absolute -top-1 -right-1 z-30 h-7 w-7 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-background shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                  title="تغيير صورة البروفيل"
                >
                  <Camera className="h-3.5 w-3.5" />
                </label>

                {/* Online Status Dot */}
                <div className="absolute bottom-1 right-1 h-5 w-5 bg-emerald-500 border-[3px] border-background rounded-full z-10" />
                
                {/* Tier Badge on Avatar */}
                <div 
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10 backdrop-blur-md border shadow-lg rounded-full px-2.5 py-0.5 flex items-center gap-1 bg-card/90"
                  style={{ 
                    borderColor: `${currentAccentColor}50`,
                  }}
                >
                  <ActiveSubIcon className="h-3 w-3" style={{ color: currentAccentColor }} />
                  <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: currentAccentColor }}>
                    {activeTier === 'free' ? 'FREE' : activeTier.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Information Block — High Contrast & Clean Spacing */}
            <div className="space-y-2 text-foreground slide-in-delay-1 pt-1 md:pt-2">
              {/* User Name & Verification Badges */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <h1 className="text-2xl md:text-3xl font-black font-headline tracking-tight text-foreground">
                    {user.name}
                  </h1>
                  {user.isVerified && (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                      <ShieldCheck className="h-3.5 w-3.5 fill-emerald-500/20" />
                      <span>حساب موثّق</span>
                    </Badge>
                  )}
                  <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span>4.9 (92% Trust Score)</span>
                  </Badge>
                </div>
              </div>

              {/* Username */}
              <p className="text-xs font-mono text-muted-foreground font-semibold text-center md:text-left" dir="ltr">
                @user_{user.id.substring(0, 8)}
              </p>

              {/* Status & Attributes Row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs pt-0.5">
                <Badge variant="outline" className="text-xs text-muted-foreground bg-muted/40 border-border/80 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  <span>انضم في: <FormattedJoinedDate dateString={user.memberSince} /></span>
                </Badge>
                
                <Badge variant="outline" className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>متصل الآن</span>
                </Badge>

                <Badge className="bg-primary/10 text-primary border border-primary/25 font-bold text-xs px-2.5 py-1 rounded-full shadow-2xs">
                  {user.isStoreOwner ? 'تاجر / Store Owner' : user.isFreelancer ? 'حرفي / Freelancer' : 'زبون / Client'}
                </Badge>

                <Badge variant="outline" className="text-[10px] text-muted-foreground bg-muted/30 border-border/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <LucideIcons.Monitor className="h-3 w-3" />
                  <span>Desktop • Chrome</span>
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar — Reorganized & Polished */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 shrink-0 slide-in-delay-2">
            {/* Primary: Edit Profile */}
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => {
                setEditName(user.name);
                setEditEmail(user.email);
                setIsEditProfileOpen(true);
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5" /> تعديل الملف
            </Button>

            {/* Digital ID Card */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsDigitalIdOpen(true)}
              className="bg-card hover:bg-muted/80 text-foreground font-semibold h-9 px-3.5 rounded-xl text-xs flex items-center gap-1.5 border-border shadow-2xs"
            >
              <LucideIcons.CreditCard className="h-3.5 w-3.5 text-primary" /> بطاقة الهوية
            </Button>

            {/* Public Preview Mode Button */}
            <Button 
              variant={isPublicPreview ? "secondary" : "outline"}
              size="sm" 
              onClick={() => {
                setIsPublicPreview(!isPublicPreview);
                toast({
                  title: !isPublicPreview ? "وضع المعاينة العامة" : "العودة للوضع العادي",
                  description: !isPublicPreview ? "تشاهد الآن الملف كما يراه الزوار." : "تمت العودة إلى لوحة التحكم الشخصية.",
                });
              }}
              className="bg-card hover:bg-muted/80 text-foreground font-semibold h-9 px-3.5 rounded-xl text-xs flex items-center gap-1.5 border-border shadow-2xs"
            >
              <LucideIcons.Eye className="h-3.5 w-3.5 text-primary" />
              {isPublicPreview ? 'إنهاء المعاينة' : 'عرض كزائر'}
            </Button>

            {/* Customizer (if premium) */}
            {isPremiumUser && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsCustomizerOpen(true)} 
                className="bg-card hover:bg-muted/80 text-foreground font-semibold h-9 px-3.5 rounded-xl text-xs flex items-center gap-1.5 border-border shadow-2xs"
              >
                <LucideIcons.Palette className="h-3.5 w-3.5 text-purple-500" /> تخصيص
              </Button>
            )}

            {/* Divider & Utilities */}
            <div className="flex items-center gap-1.5 pr-1 border-r border-border/70">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: "تم النسخ!", description: "تم نسخ رابط الملف الشخصي إلى الحافظة بنجاح." });
                }} 
                className="bg-card hover:bg-muted/80 text-muted-foreground hover:text-foreground h-9 px-3 rounded-xl text-xs flex items-center gap-1.5 border-border shadow-2xs"
                title="مشاركة الملف الشخصي"
              >
                <LucideIcons.Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">مشاركة</span>
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsQrOpen(true)} 
                className="bg-card hover:bg-muted/80 text-muted-foreground hover:text-foreground h-9 w-9 rounded-xl p-0 border-border shadow-2xs"
                title="رمز QR"
              >
                <LucideIcons.QrCode className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ═══ Enhanced 5-Metrics Grid Strip with Sparklines & Change Indicators ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 md:p-5 border-t border-border/50 bg-gradient-to-b from-muted/10 to-muted/30">
          {/* Stat 1: Active Orders */}
          <div className="bg-card/95 border border-border/60 rounded-2xl p-4 text-center flex flex-col justify-center items-center shadow-sm stat-card-hover group">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <LucideIcons.Package className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">الطلبات النشطة</span>
            </div>
            <span className="text-2xl md:text-3xl font-black text-primary font-mono" dir="ltr">{totalInProgress}</span>
            {/* Sparkline Mini Chart */}
            <svg className="w-16 h-4 mt-1 sparkline-anim" viewBox="0 0 60 16">
              <path d="M0 12 L10 8 L20 10 L30 6 L40 4 L50 7 L60 2" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            </svg>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex items-center gap-0.5" dir="ltr">
              <LucideIcons.TrendingUp className="h-2.5 w-2.5" /> +2 this week
            </span>
          </div>

          {/* Stat 2: Completed */}
          <div className="bg-card/95 border border-border/60 rounded-2xl p-4 text-center flex flex-col justify-center items-center shadow-sm stat-card-hover group">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <LucideIcons.CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">المكتملة</span>
            </div>
            <span className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono" dir="ltr">{totalCompleted}</span>
            <svg className="w-16 h-4 mt-1 sparkline-anim" viewBox="0 0 60 16">
              <path d="M0 14 L10 12 L20 10 L30 8 L40 5 L50 3 L60 2" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            </svg>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex items-center gap-0.5" dir="ltr">
              <LucideIcons.TrendingUp className="h-2.5 w-2.5" /> 100% rate
            </span>
          </div>

          {/* Stat 3: Escrow Secured */}
          <div className="bg-card/95 border border-border/60 rounded-2xl p-4 text-center flex flex-col justify-center items-center shadow-sm stat-card-hover group">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                <LucideIcons.ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">الضمان</span>
            </div>
            <span className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono" dir="ltr">{user.ongoingServices?.length || 0}</span>
            <svg className="w-16 h-4 mt-1 sparkline-anim" viewBox="0 0 60 16">
              <path d="M0 8 L10 10 L20 6 L30 8 L40 4 L50 6 L60 3" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            </svg>
            <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold mt-0.5" dir="ltr">Escrow Protected</span>
          </div>

          {/* Stat 4: Loyalty Points */}
          <div className="bg-card/95 border border-border/60 rounded-2xl p-4 text-center flex flex-col justify-center items-center shadow-sm stat-card-hover group">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                <LucideIcons.Sparkles className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">نقاط الوفاء</span>
            </div>
            <span className="text-2xl md:text-3xl font-black text-purple-600 dark:text-purple-400 font-mono" dir="ltr">{user.loyaltyPoints || Math.floor(totalSpent / 100)}</span>
            <svg className="w-16 h-4 mt-1 sparkline-anim" viewBox="0 0 60 16">
              <path d="M0 14 L10 10 L20 12 L30 6 L40 8 L50 4 L60 2" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            </svg>
            <span className="text-[9px] text-purple-600 dark:text-purple-400 font-bold mt-0.5 flex items-center gap-0.5" dir="ltr">
              <LucideIcons.TrendingUp className="h-2.5 w-2.5" /> +150 XP
            </span>
          </div>

          {/* Stat 5: Total Spent */}
          <div className="bg-card/95 border border-border/60 rounded-2xl p-4 text-center flex flex-col justify-center items-center shadow-sm col-span-2 sm:col-span-1 stat-card-hover group">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                <LucideIcons.CircleDollarSign className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">المعاملات</span>
            </div>
            <span className="text-xl md:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono" dir="ltr">{totalSpent.toLocaleString()} DA</span>
            <svg className="w-16 h-4 mt-1 sparkline-anim" viewBox="0 0 60 16">
              <path d="M0 12 L10 14 L20 8 L30 10 L40 6 L50 4 L60 5" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            </svg>
            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-0.5" dir="ltr">Total Volume</span>
          </div>
        </div>
      </Card>

      {/* Main Desktop Grid Wrapper (Sticky Sidebar + Full Main Content) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        
        {/* Navigation Sidebar Panel (Span 3 - Sticky Desktop Navigation) */}
        <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-20 lg:self-start">
          {/* Quick Profile Search Bar */}
          <div className="relative">
            <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="البحث في الحساب / Search Dashboard..."
              value={profileSearchQuery}
              onChange={e => setProfileSearchQuery(e.target.value)}
              className="pl-9 h-11 text-xs bg-card border-border/80 rounded-xl shadow-xs"
            />
          </div>

          <Card className="p-3 border-border/80 shadow-md bg-card/90 rounded-2xl">
            <div className="space-y-4">
              {/* Section 1: General */}
              <div>
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80 mb-2">GENERAL / عام</p>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'dashboard', titleAr: 'لوحة التحكم', titleEn: 'Dashboard Hub', icon: LucideIcons.LayoutDashboard, badge: null },
                    { id: 'orders', titleAr: 'طلباتي وحجوزاتي', titleEn: 'My Bookings & Orders', icon: LucideIcons.Package, badge: totalInProgress > 0 ? totalInProgress : null },
                    { id: 'maintenance', titleAr: 'سجل صيانة المنزل', titleEn: 'Home Maintenance Log', icon: LucideIcons.Wrench, badge: activeWarranties.length > 0 ? activeWarranties.length : null },
                    { id: 'assets', titleAr: 'ممتلكاتي وعائلتي', titleEn: 'My Assets & Family', icon: LucideIcons.Building2, badge: null },
                  ].map(tab => {
                    const TabIcon = tab.icon;
                    const isActive = selectedSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedSubTab(tab.id as any)}
                        className={`w-full py-2.5 px-3 rounded-xl transition-all text-left flex items-center justify-between text-xs select-none ${
                          isActive 
                            ? "bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/20" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-muted text-primary'}`}>
                            <TabIcon className="h-4 w-4" />
                          </div>
                          <div className="truncate leading-tight">
                            <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-foreground'}`}>{tab.titleAr}</p>
                            <p className={`text-[10px] ${isActive ? 'text-white/80' : 'text-muted-foreground'}`} dir="ltr">{tab.titleEn}</p>
                          </div>
                        </div>
                        {tab.badge !== null && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${isActive ? 'bg-white text-primary' : 'bg-primary/10 text-primary'}`}>
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Finance */}
              <div className="pt-2 border-t border-border/60">
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80 mb-2">FINANCE / المالية</p>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'wallet', titleAr: 'المحفظة والمكافآت', titleEn: 'Loyalty & Escrow Wallet', icon: LucideIcons.Wallet, badge: null },
                  ].map(tab => {
                    const TabIcon = tab.icon;
                    const isActive = selectedSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedSubTab(tab.id as any)}
                        className={`w-full py-2.5 px-3 rounded-xl transition-all text-left flex items-center justify-between text-xs select-none ${
                          isActive 
                            ? "bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/20" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-muted text-primary'}`}>
                            <TabIcon className="h-4 w-4" />
                          </div>
                          <div className="truncate leading-tight">
                            <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-foreground'}`}>{tab.titleAr}</p>
                            <p className={`text-[10px] ${isActive ? 'text-white/80' : 'text-muted-foreground'}`} dir="ltr">{tab.titleEn}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Support & Security */}
              <div className="pt-2 border-t border-border/60">
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80 mb-2">SUPPORT & SECURITY / الدعم والأمان</p>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'tips', titleAr: 'المساعدة والتوجيهات', titleEn: 'Help & Wallet Tips', icon: LucideIcons.Lightbulb, badge: null },
                    { id: 'security', titleAr: 'الأمان والخصوصية', titleEn: 'Security & Privacy', icon: LucideIcons.Lock, badge: null }
                  ].map(tab => {
                    const TabIcon = tab.icon;
                    const isActive = selectedSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedSubTab(tab.id as any)}
                        className={`w-full py-2.5 px-3 rounded-xl transition-all text-left flex items-center justify-between text-xs select-none ${
                          isActive 
                            ? "bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/20" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-muted text-primary'}`}>
                            <TabIcon className="h-4 w-4" />
                          </div>
                          <div className="truncate leading-tight">
                            <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-foreground'}`}>{tab.titleAr}</p>
                            <p className={`text-[10px] ${isActive ? 'text-white/80' : 'text-muted-foreground'}`} dir="ltr">{tab.titleEn}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Tab Content Panel (Span 9 - Full Available Width) */}
        <div className="lg:col-span-9 space-y-6 min-w-0">
          
          {/* Active Booking Countdown Banner (Always on top of the content if we have active appts today) */}
          {user.appointments?.some(a => isToday(parseISO(a.date)) && a.status !== 'completed' && a.status !== 'cancelled') && (() => {
            const nextTodayAppt = user.appointments.find(a => isToday(parseISO(a.date)) && a.status !== 'completed' && a.status !== 'cancelled')!;
            return (
              <Card className="p-4 bg-gradient-to-r from-amber-500/10 to-primary/10 border-amber-500/30 shadow-md">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 animate-pulse">
                      <LucideIcons.CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase font-extrabold text-amber-600 tracking-wider">Upcoming Booking Today / موعد اليوم القادم</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">
                        {nextTodayAppt.professionalName} ({nextTodayAppt.professionalCategory || 'Service'})
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <LucideIcons.MapPin className="h-3 w-3 text-primary" /> {nextTodayAppt.location || 'Location Not Specified'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openChatSession('service', nextTodayAppt.reservationId, nextTodayAppt.professionalName, nextTodayAppt.professionalCategory || 'Service Provider')}>
                      <LucideIcons.MessageSquare className="h-3.5 w-3.5 mr-1" /> Chat
                    </Button>
                    <Button size="sm" className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setSelectedSubTab('orders')}>
                      View Timeline
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* TAB: DASHBOARD OVERVIEW */}
          {selectedSubTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              
              {/* Quick Services access Hub (Full Desktop Grid) */}
              <Card className="p-4 md:p-5 border-muted shadow-md accent-card bg-card/90">
                <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
                      <LucideIcons.Compass className="h-5 w-5 text-primary" /> Quick Actions Hub / مركز الوصول السريع
                    </CardTitle>
                    <CardDescription className="text-xs">Quick access to request services, browse store items, and explore offerings</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <Button variant="outline" className="h-auto py-3.5 text-center flex flex-col gap-2 items-center hover:bg-primary/5 hover:border-primary/30 transition-all rounded-xl shadow-xs" asChild>
                      <Link href="/listings">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <LucideIcons.Search className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold">Request Service</span>
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-auto py-3.5 text-center flex flex-col gap-2 items-center hover:bg-primary/5 hover:border-primary/30 transition-all rounded-xl shadow-xs" asChild>
                      <Link href="/listings?category=stores">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                          <LucideIcons.ShoppingBag className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold">Store Market</span>
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-auto py-3.5 text-center flex flex-col gap-2 items-center hover:bg-primary/5 hover:border-primary/30 transition-all rounded-xl shadow-xs" asChild>
                      <Link href="/listings?category=artisan">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                          <LucideIcons.Wrench className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold">Find Artisan</span>
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-auto py-3.5 text-center flex flex-col gap-2 items-center hover:bg-primary/5 hover:border-primary/30 transition-all rounded-xl shadow-xs" onClick={() => toast({ title: "Sell Product", description: "Opening merchant product catalog..." })}>
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                        <LucideIcons.ShoppingCart className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold">Sell Product</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-3.5 text-center flex flex-col gap-2 items-center hover:bg-primary/5 hover:border-primary/30 transition-all rounded-xl shadow-xs" onClick={() => toast({ title: "Request Quote", description: "Opening custom quotes dashboard..." })}>
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                        <LucideIcons.FileText className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold">Request Quote</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-3.5 text-center flex flex-col gap-2 items-center hover:bg-primary/5 hover:border-primary/30 transition-all rounded-xl shadow-xs col-span-2 sm:col-span-1" onClick={() => toast({ title: "Digital Projects", description: "Loading digital projects proposed catalog..." })}>
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                        <LucideIcons.Briefcase className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold">Digital Project</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Section (2 Responsive Desktop Charts Side-by-Side) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                
                {/* Spending Graph Card */}
                <Card className="p-5 border-muted shadow-md accent-card bg-card/90 flex flex-col justify-between">
                  <div>
                    <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm md:text-base font-bold font-headline flex items-center gap-2">
                          <LucideIcons.BarChart3 className="h-4 w-4 text-primary" /> Monthly Spending Analysis / الإنفاق الشهري
                        </CardTitle>
                        <CardDescription className="text-xs">Visual distribution of monthly transactions over the last 6 months</CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono text-primary bg-primary/5">
                        {totalSpent.toLocaleString()} DA Total
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="relative pt-4 flex flex-col items-center">
                        <svg className="w-full h-36 text-primary" viewBox="0 0 300 80" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
                              <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                            </linearGradient>
                          </defs>
                          {/* Area */}
                          <path d="M 0 80 L 10 55 Q 60 65 110 38 T 210 15 T 290 22 L 300 80 Z" fill="url(#spendGrad)" />
                          {/* Line */}
                          <path d="M 10 55 Q 60 65 110 38 T 210 15 T 290 22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          {/* Dots */}
                          <circle cx="10" cy="55" r="4.5" fill="currentColor" />
                          <circle cx="110" cy="38" r="4.5" fill="currentColor" />
                          <circle cx="210" cy="15" r="4.5" fill="currentColor" />
                          <circle cx="290" cy="22" r="4.5" fill="currentColor" />
                        </svg>
                        <div className="flex justify-between w-full text-xs text-muted-foreground mt-3 px-1 font-mono">
                          <span>Mar</span>
                          <span>Apr</span>
                          <span>May</span>
                          <span>Jun</span>
                          <span>Jul</span>
                          <span className="font-bold text-foreground">Aug (Current)</span>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Average Monthly: ~{Math.round(totalSpent / 6).toLocaleString()} DA</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <LucideIcons.TrendingUp className="h-3.5 w-3.5" /> Normal Velocity
                    </span>
                  </div>
                </Card>

                {/* Orders Activity Graph */}
                <Card className="p-5 border-muted shadow-md accent-card bg-card/90 flex flex-col justify-between">
                  <div>
                    <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm md:text-base font-bold font-headline flex items-center gap-2">
                          <LucideIcons.Activity className="h-4 w-4" style={{ color: currentAccentColor }} /> Order Frequency / تكرار العمليات
                        </CardTitle>
                        <CardDescription className="text-xs">Quarterly distribution of completed vs in-flight orders</CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                        {totalCompleted} Completed
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="relative pt-4 flex flex-col items-center">
                        <svg className="w-full h-36" style={{ color: currentAccentColor }} viewBox="0 0 300 80" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                            </linearGradient>
                          </defs>
                          {/* Area */}
                          <path d="M 0 80 L 10 60 Q 70 35 120 48 T 220 18 T 290 12 L 300 80 Z" fill="url(#orderGrad)" />
                          {/* Line */}
                          <path d="M 10 60 Q 70 35 120 48 T 220 18 T 290 12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          {/* Dots */}
                          <circle cx="10" cy="60" r="4.5" fill="currentColor" />
                          <circle cx="120" cy="48" r="4.5" fill="currentColor" />
                          <circle cx="220" cy="18" r="4.5" fill="currentColor" />
                          <circle cx="290" cy="12" r="4.5" fill="currentColor" />
                        </svg>
                        <div className="flex justify-between w-full text-xs text-muted-foreground mt-3 px-1 font-mono">
                          <span>Q1 2026</span>
                          <span>Q2 2026</span>
                          <span>Q3 2026</span>
                          <span className="font-bold text-foreground">Q4 2026 (Active)</span>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Fulfillment Rate: {totalCompleted + totalCancelled > 0 ? Math.round((totalCompleted / (totalCompleted + totalCancelled)) * 100) : 100}%</span>
                    <span className="text-primary font-semibold flex items-center gap-1">
                      <LucideIcons.ShieldCheck className="h-3.5 w-3.5" /> 100% Escrow Protected
                    </span>
                  </div>
                </Card>
              </div>

              {/* Progress & Level Card & Achievements side-by-side */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                
                {/* Level Progress (Span 5) */}
                <Card className="p-5 border-muted shadow-md lg:col-span-5 flex flex-col justify-between accent-card bg-card/90">
                  <div>
                    <CardTitle className="text-sm md:text-base font-bold font-headline flex items-center gap-2 mb-1">
                      <LucideIcons.Award className="h-4 w-4 text-amber-500" /> User Tier Level / مستوى الحساب
                    </CardTitle>
                    <CardDescription className="text-xs">Loyalty tier requirements and progression</CardDescription>
                    
                    <div className="mt-4 text-center p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                      <span className="text-xs text-muted-foreground">Current Membership Tier</span>
                      <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">GOLD TIER / المستوى الذهبي</p>
                    </div>

                    <div className="space-y-1.5 mt-4">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="font-bold text-foreground">Points: {user.loyaltyPoints || Math.floor(totalSpent / 100)} XP</span>
                        <span className="text-muted-foreground">2,000 XP to Diamond</span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(20, ((user.loyaltyPoints || Math.floor(totalSpent / 100)) / 2000) * 100))}%` }}></div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mt-4 space-y-1.5">
                      <p className="font-semibold text-foreground">Next Tier Requirements:</p>
                      <p className="flex items-center gap-1.5"><LucideIcons.CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Complete 1 more verified order</p>
                      <p className="flex items-center gap-1.5"><LucideIcons.Circle className="h-3.5 w-3.5 text-muted-foreground" /> Maintain high satisfaction rating</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/70 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2.5 rounded-xl">
                    <p className="font-bold flex items-center gap-1">✨ Gold Tier Perks:</p>
                    <p className="mt-0.5">- 5% discount on selected store deliveries</p>
                    <p>- Priority escrow verification queue</p>
                  </div>
                </Card>

                {/* Achievements Card (Span 7) */}
                <Card className="p-5 border-muted shadow-md lg:col-span-7 accent-card bg-card/90 flex flex-col justify-between">
                  <div>
                    <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm md:text-base font-bold font-headline flex items-center gap-2">
                          <LucideIcons.CheckCircle className="h-4 w-4 text-primary" /> My Badges & Achievements / الأوسمة والمكافآت
                        </CardTitle>
                        <CardDescription className="text-xs">Milestone rewards earned by activity and transactions</CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono bg-primary/5 text-primary">
                        3 Earned
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-0 mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 border border-emerald-500/30 rounded-xl bg-emerald-500/5 flex flex-col items-center gap-1.5 transition-all hover:border-emerald-500/50">
                        <span className="text-2xl">🏆</span>
                        <p className="text-xs font-black text-foreground">First Booking</p>
                        <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-0 text-[9px] font-bold px-1.5 py-0.5">
                          Earned
                        </Badge>
                      </div>
                      <div className="p-3 border border-emerald-500/30 rounded-xl bg-emerald-500/5 flex flex-col items-center gap-1.5 transition-all hover:border-emerald-500/50">
                        <span className="text-2xl">🛍️</span>
                        <p className="text-xs font-black text-foreground">First Purchase</p>
                        <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-0 text-[9px] font-bold px-1.5 py-0.5">
                          Earned
                        </Badge>
                      </div>
                      <div className="p-3 border border-emerald-500/30 rounded-xl bg-emerald-500/5 flex flex-col items-center gap-1.5 transition-all hover:border-emerald-500/50">
                        <span className="text-2xl">⭐</span>
                        <p className="text-xs font-black text-foreground">Top Reviewer</p>
                        <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-0 text-[9px] font-bold px-1.5 py-0.5">
                          Earned
                        </Badge>
                      </div>
                      <div className="p-3 border border-dashed border-border rounded-xl bg-muted/20 opacity-70 flex flex-col items-center justify-center gap-1.5">
                        <span className="text-2xl">👑</span>
                        <p className="text-xs font-black text-muted-foreground">Power Client</p>
                        <Badge variant="outline" className="text-[9px] font-medium border-border/80">
                          In Progress
                        </Badge>
                      </div>
                    </CardContent>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Next milestone: Complete 5 marketplace reviews</span>
                    <span className="text-primary font-semibold">Reward: +250 XP</span>
                  </div>
                </Card>
              </div>

              {/* Activity Timeline */}
              <Card className="p-5 border-muted shadow-md accent-card bg-card/90">
                <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm md:text-base font-bold font-headline flex items-center gap-2">
                      <LucideIcons.History className="h-4 w-4 text-primary" /> Activity Timeline Log / السجل الزمني للنشاط
                    </CardTitle>
                    <CardDescription className="text-xs">Audit list of account activities, order updates, and secure sessions</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    Real-time Audit
                  </Badge>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  <div className="relative border-l border-border/80 pl-4 ml-2 space-y-4">
                    {activityLogs.map(log => (
                      <div key={log.id} className="relative text-xs">
                        {/* Dot */}
                        <div className="absolute -left-[21px] top-0.5 h-3.5 w-3.5 rounded-full bg-card border-2 border-primary flex items-center justify-center text-[7px]">
                          ●
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-foreground text-sm">{log.title}</span>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{log.date}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-bold bg-green-500/10 text-green-600 border-green-500/20">
                            {log.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: ORDERS & BOOKINGS (Preserves all current bookings logic/timeline/actions) */}
          {selectedSubTab === 'orders' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              
              {/* Statistics & Totals */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="p-3 text-center border-muted shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Active Orders</span>
                  <span className="text-xl font-extrabold text-primary block mt-0.5">{totalInProgress}</span>
                </Card>
                <Card className="p-3 text-center border-muted shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Completed</span>
                  <span className="text-xl font-extrabold text-green-600 block mt-0.5">{totalCompleted}</span>
                </Card>
                <Card className="p-3 text-center border-muted shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Cancelled</span>
                  <span className="text-xl font-extrabold text-red-600 block mt-0.5">{totalCancelled}</span>
                </Card>
                <Card className="p-3 text-center border-muted shadow-sm bg-primary/5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Expense</span>
                  <span className="text-xl font-extrabold text-accent block mt-0.5 truncate">{totalSpent.toLocaleString()} DA</span>
                </Card>
              </div>

              {/* Filters Controls */}
              <Card className="shadow-sm border-muted">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col md:flex-row gap-3">
                    {/* Search bar */}
                    <div className="flex-1 relative">
                      <LucideIcons.Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by ID, name, service, store..."
                        value={ordersSearchTerm}
                        onChange={e => setOrdersSearchTerm(e.target.value)}
                        className="pl-9 text-xs"
                      />
                    </div>
                    {/* Filter Type */}
                    <div className="grid grid-cols-3 gap-2 md:flex md:w-auto">
                      <select
                        value={ordersTypeFilter}
                        onChange={e => setOrdersTypeFilter(e.target.value as any)}
                        className="p-2 border border-muted rounded-md bg-background text-xs cursor-pointer text-foreground"
                      >
                        <option value="all">All Types</option>
                        <option value="services">Services Only</option>
                        <option value="store">Products Only</option>
                      </select>
                      
                      <select
                        value={ordersStatusFilter}
                        onChange={e => setOrdersStatusFilter(e.target.value as any)}
                        className="p-2 border border-muted rounded-md bg-background text-xs cursor-pointer text-foreground"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <select
                        value={ordersDateFilter}
                        onChange={e => setOrdersDateFilter(e.target.value as any)}
                        className="p-2 border border-muted rounded-md bg-background text-xs cursor-pointer text-foreground"
                      >
                        <option value="all">Any Date</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="month">Last Month</option>
                        <option value="year">Last Year</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground flex items-center gap-1"><LucideIcons.ArrowUpDown className="h-3 w-3" /> Sort by:</span>
                      <div className="flex gap-1">
                        {(['newest', 'oldest', 'price_desc', 'price_asc', 'status'] as const).map(opt => {
                          const labels: Record<string, string> = {
                            newest: 'Newest',
                            oldest: 'Oldest',
                            price_desc: 'Highest Price',
                            price_asc: 'Lowest Price',
                            status: 'Status'
                          };
                          return (
                            <button
                              key={opt}
                              onClick={() => setOrdersSortBy(opt)}
                              className={`px-2 py-1 rounded border transition-colors ${
                                ordersSortBy === opt 
                                  ? 'bg-primary text-primary-foreground border-primary font-semibold' 
                                  : 'bg-muted/30 text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              {labels[opt]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    {(ordersSearchTerm || ordersTypeFilter !== 'all' || ordersStatusFilter !== 'all' || ordersDateFilter !== 'all') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setOrdersSearchTerm('');
                          setOrdersTypeFilter('all');
                          setOrdersStatusFilter('all');
                          setOrdersDateFilter('all');
                          setOrdersSortBy('newest');
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Service Orders Section */}
              {(ordersTypeFilter === 'all' || ordersTypeFilter === 'services') && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Service Orders / طلبات الخدمات الميدانية</h3>
                    <Badge variant="secondary" className="font-mono text-xs">{sortedServices.length}</Badge>
                  </div>

                  {sortedServices.length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground bg-muted/5">
                      <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-xs">No service orders matched your criteria.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sortedServices.map(appt => {
                        const notesPayload = parseServiceNotes(appt.notes);
                        const materialsCost = notesPayload.materialsUsed?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
                        const price = 3000 + materialsCost;

                        let statusColor = 'bg-gray-100 text-gray-800';
                        if (appt.status === 'completed') statusColor = 'bg-green-100 text-green-800 border-green-200';
                        else if (appt.status === 'in_progress') statusColor = 'bg-blue-100 text-blue-800 border-blue-200';
                        else if (appt.status === 'waiting_verification') statusColor = 'bg-yellow-100 text-yellow-800 border-yellow-200 animate-pulse';
                        else if (appt.status === 'cancelled') statusColor = 'bg-red-100 text-red-800 border-red-200';
                        else if (appt.status === 'disputed') statusColor = 'bg-red-100 text-red-800 border-red-200';

                        return (
                          <Card key={appt.reservationId} className="hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
                            <CardHeader className="p-4 bg-muted/10 pb-2">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={appt.clinicLogoUrl} />
                                    <AvatarFallback>{appt.professionalName[0]}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-xs font-bold truncate max-w-[130px]">{appt.professionalName}</p>
                                    <p className="text-[9px] text-muted-foreground">{appt.professionalCategory}</p>
                                  </div>
                                </div>
                                <Badge className={`${statusColor} text-[9px] capitalize`}>
                                  {appt.status.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 text-xs space-y-2 flex-1">
                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div>
                                  <span className="text-muted-foreground block">Order Ref:</span>
                                  <span className="font-mono font-bold text-primary">{appt.reservationId}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground block">Price (Base+Parts):</span>
                                  <span className="font-bold text-accent">{price.toFixed(2)} DA</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground block">Scheduled Date:</span>
                                  <span>{appt.date ? new Date(appt.date).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground block">Location:</span>
                                  <span className="truncate block" title={appt.location}>{appt.location || 'N/A'}</span>
                                </div>
                              </div>
                              {appt.reasonForVisit && (
                                <p className="p-2 border rounded bg-muted/20 italic truncate text-[9px] text-muted-foreground">
                                  "{appt.reasonForVisit}"
                                </p>
                              )}
                            </CardContent>
                            <div className="p-4 pt-0 border-t mt-auto flex flex-wrap gap-1.5 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[9px] flex items-center gap-1"
                                onClick={() => setSelectedDetailServiceOrder(appt)}
                              >
                                <LucideIcons.Eye className="h-3 w-3" /> Details
                              </Button>
                              
                              {appt.status === 'waiting_verification' && (
                                <Button
                                  size="sm"
                                  className="h-7 text-[9px] bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-1 animate-pulse"
                                  onClick={() => setSelectedDetailServiceOrder(appt)}
                                >
                                  <LucideIcons.ShieldAlert className="h-3 w-3" /> OTP Pin
                                </Button>
                              )}

                              {appt.status === 'completed' && !notesPayload.providerRating && (
                                <Button
                                  size="sm"
                                  className="h-7 text-[9px] bg-yellow-500 hover:bg-yellow-600 text-white"
                                  onClick={() => openRatingModal(appt.reservationId)}
                                >
                                  Rate
                                </Button>
                              )}

                              {appt.status === 'pending_confirmation' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 text-[9px]"
                                  onClick={async () => {
                                    if (confirm("Are you sure you want to cancel this booking?")) {
                                      const saved = localStorage.getItem('khidmatik_appointments');
                                      if (saved) {
                                        const list = JSON.parse(saved);
                                        const updatedList = list.map((item: any) => 
                                          (item.id === appt.reservationId || item.reservationId === appt.reservationId)
                                            ? { ...item, status: 'cancelled' } : item
                                        );
                                        localStorage.setItem('khidmatik_appointments', JSON.stringify(updatedList));
                                        window.location.reload();
                                      }
                                    }
                                  }}
                                >
                                  Cancel
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[9px]"
                                onClick={() => openChatSession('service', appt.reservationId, appt.professionalName, appt.professionalCategory || 'Service Provider')}
                              >
                                <LucideIcons.MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Store Orders Section */}
              {(ordersTypeFilter === 'all' || ordersTypeFilter === 'store') && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Store Product Orders / طلبات شراء المتاجر</h3>
                    <Badge variant="secondary" className="font-mono text-xs">{sortedStores.length}</Badge>
                  </div>

                  {sortedStores.length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground bg-muted/5">
                      <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-xs">No store orders matched your criteria.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sortedStores.map(ord => {
                        let statusColor = 'bg-gray-100 text-gray-800';
                        if (ord.status === 'delivered') statusColor = 'bg-green-100 text-green-800 border-green-200';
                        else if (ord.status === 'shipped' || ord.status === 'out_for_delivery') statusColor = 'bg-blue-100 text-blue-800 border-blue-200';
                        else if (ord.status === 'pending' || ord.status === 'processing') statusColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                        else if (ord.status === 'cancelled') statusColor = 'bg-red-100 text-red-800 border-red-200';

                        return (
                          <Card key={ord.id} className="hover:shadow-md transition-shadow flex flex-col justify-between">
                            <CardHeader className="p-4 bg-muted/10 pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-xs font-bold truncate max-w-[150px]">
                                    {ord.order_items?.[0]?.product_name || 'Khidmatik Product'}
                                  </p>
                                  <p className="text-[9px] text-muted-foreground">Store ID: {ord.store_id || 'Marketplace'}</p>
                                </div>
                                <Badge className={`${statusColor} text-[9px] capitalize`}>
                                  {ord.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 text-xs space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                                  <img 
                                    src={ord.order_items?.[0]?.product_image_url || 'https://placehold.co/100x100.png'} 
                                    alt="product" 
                                    className="object-cover h-full w-full"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] flex-1">
                                  <div>
                                    <span className="text-muted-foreground block text-[9px]">Order ID:</span>
                                    <span className="font-mono font-bold text-primary">{ord.id}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block text-[9px]">Total Amount:</span>
                                    <span className="font-bold text-accent">{(parseFloat(ord.total) || 0).toFixed(2)} DA</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block text-[9px]">Items Count:</span>
                                    <span>{ord.order_items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 1} items</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block text-[9px]">Date:</span>
                                    <span>{ord.created_at ? new Date(ord.created_at).toLocaleDateString() : 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                            <div className="p-4 pt-0 border-t mt-auto flex gap-1.5 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[9px] flex items-center gap-1"
                                onClick={() => setSelectedDetailStoreOrder(ord)}
                              >
                                <LucideIcons.Eye className="h-3 w-3" /> View Details
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[9px] flex items-center gap-1"
                                onClick={() => {
                                  toast({ title: "Reordering product", description: "Successfully added items to your cart!" });
                                }}
                              >
                                <LucideIcons.RefreshCw className="h-3 w-3" /> Buy Again
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[9px]"
                                onClick={() => openChatSession('store', ord.id, ord.store_id || 'Marketplace Seller', ord.order_items?.[0]?.product_name || 'Khidmatik Product')}
                              >
                                <LucideIcons.MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>

                              {ord.status === 'delivered' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-[9px] text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    setReturnItemName(ord.order_items?.[0]?.product_name || 'Product');
                                    setIsReturnDialogOpen(true);
                                  }}
                                >
                                  Return
                                </Button>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: HOUSE MAINTENANCE LOG & WARRANTIES */}
          {selectedSubTab === 'maintenance' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              
              {/* Active Warranties grid */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <LucideIcons.ShieldAlert className="h-4 w-4 text-primary" /> Active Warranties / بطاقات الضمان النشطة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeWarranties.filter(w => w.name.toLowerCase().includes(profileSearchQuery.toLowerCase())).map(warranty => (
                    <Card key={warranty.id} className="p-4 border-muted shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute right-0 top-0 h-16 w-16 bg-primary/5 rounded-bl-full flex items-center justify-end p-2 text-primary opacity-60">
                        <LucideIcons.ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-bold text-xs">{warranty.name}</p>
                        <p className="text-[10px] text-muted-foreground">Provider: {warranty.provider}</p>
                        <div className="flex justify-between items-center text-[10px] pt-1">
                          <span>Expiry: {new Date(warranty.endDate).toLocaleDateString()}</span>
                          <span className={`font-bold px-2 py-0.5 rounded-full ${warranty.remainingDays < 30 ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'}`}>
                            {warranty.remainingDays} days left
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full text-[10px] h-7 border-primary/20 text-primary hover:bg-primary/5 mt-2"
                          onClick={() => toast({ title: "Maintenance Requested", description: `We have notified "${warranty.provider}" for review.` })}
                        >
                          Request Support / طلب الصيانة تحت الضمان
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Maintenance logs list */}
              <Card className="p-4 border-muted shadow-md accent-card">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-sm font-bold font-headline flex items-center gap-1.5">
                    <LucideIcons.Wrench className="h-4 w-4 text-primary" /> Household Maintenance Registry / سجل أعمال الصيانة المنزلية
                  </CardTitle>
                  <CardDescription className="text-xs">Archive of plumbing, electricity, and AC jobs</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="h-8 text-[10px]">
                          <TableHead className="py-0.5 text-[10px]">Type</TableHead>
                          <TableHead className="py-0.5 text-[10px]">Date</TableHead>
                          <TableHead className="py-0.5 text-[10px]">Provider</TableHead>
                          <TableHead className="py-0.5 text-[10px]">Description</TableHead>
                          <TableHead className="py-0.5 text-right text-[10px]">Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {maintenanceLogs.filter(log => log.description.toLowerCase().includes(profileSearchQuery.toLowerCase())).map(log => (
                          <TableRow key={log.id} className="h-10">
                            <TableCell className="py-1 capitalize font-bold text-primary">{log.type}</TableCell>
                            <TableCell className="py-1">{new Date(log.date).toLocaleDateString()}</TableCell>
                            <TableCell className="py-1 font-semibold">{log.provider}</TableCell>
                            <TableCell className="py-1 text-muted-foreground font-light max-w-[200px] truncate" title={log.description}>{log.description}</TableCell>
                            <TableCell className="py-1 text-right font-black text-accent">{log.cost.toLocaleString()} DA</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: ASSETS & FAMILY CONNECTOR */}
          {selectedSubTab === 'assets' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              
              {/* Assets list */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <LucideIcons.Building2 className="h-4 w-4 text-primary" /> Registered Assets / أصول وممتلكات المنزل
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {personalAssets.filter(a => a.name.toLowerCase().includes(profileSearchQuery.toLowerCase())).map(asset => (
                    <Card key={asset.id} className="p-4 border-muted shadow-sm hover:shadow-md transition-shadow relative">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                          {asset.type === 'Home' ? <LucideIcons.Building2 className="h-4 w-4" /> : asset.type === 'Car' ? <LucideIcons.Truck className="h-4 w-4" /> : <LucideIcons.Cog className="h-4 w-4" />}
                        </span>
                        <p className="font-bold text-xs">{asset.name}</p>
                      </div>
                      <div className="text-[10px] space-y-1 text-muted-foreground pt-1 border-t">
                        <p><strong>Purchase Date:</strong> {new Date(asset.purchaseDate).toLocaleDateString()}</p>
                        <p><strong>Last Service:</strong> {new Date(asset.lastMaintenance).toLocaleDateString()}</p>
                        <p className="text-primary"><strong>Next Checkup:</strong> {new Date(asset.nextMaintenance).toLocaleDateString()}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-full text-[9px] h-6 text-primary mt-2" 
                        onClick={() => toast({ title: "Service Scheduled", description: `Next checkup for ${asset.name} scheduled.` })}
                      >
                        Schedule Service / جدولة صيانة
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Family members connector */}
              <Card className="p-4 border-muted shadow-md accent-card">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-sm font-bold font-headline flex items-center gap-1.5">
                    <LucideIcons.UserCircle className="h-4 w-4 text-primary" /> Associated Family Profiles / الحسابات العائلية المرتبطة
                  </CardTitle>
                  <CardDescription className="text-xs">Link family accounts to share service access and bookings</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {familyMembers.map(member => (
                      <div key={member.id} className="flex justify-between items-center p-3 border rounded-xl bg-muted/20 text-xs">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} />
                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold">{member.name}</p>
                            <p className="text-[9px] text-muted-foreground">Relation: {member.role}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-[9px] text-destructive hover:bg-destructive/10" 
                          onClick={() => {
                            setFamilyMembers(prev => prev.filter(m => m.id !== member.id));
                            toast({ title: "Account Unlinked", description: `Successfully unlinked ${member.name}.` });
                          }}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add Family Member form input */}
                  <div className="pt-4 border-t space-y-3">
                    <h4 className="font-bold text-xs">Add Family Member Account</h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input 
                        placeholder="Family Member Full Name" 
                        value={newFamilyName} 
                        onChange={e => setNewFamilyName(e.target.value)} 
                        className="text-xs h-9"
                      />
                      <select 
                        value={newFamilyRole} 
                        onChange={e => setNewFamilyRole(e.target.value)}
                        className="p-2 border border-muted bg-background rounded-md text-xs text-foreground cursor-pointer"
                      >
                        <option value="Spouse">Spouse / الزوج(ة)</option>
                        <option value="Son">Son / الابن</option>
                        <option value="Daughter">Daughter / الابنة</option>
                        <option value="Parent">Parent / الوالد(ة)</option>
                      </select>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          if (!newFamilyName.trim()) return;
                          const newMem = { id: 'f_' + Date.now(), name: newFamilyName, role: newFamilyRole, associatedServices: [] };
                          setFamilyMembers(prev => [...prev, newMem]);
                          setNewFamilyName('');
                          toast({ title: "Family Account Added", description: `Added ${newFamilyName} successfully.` });
                        }}
                        className="h-9 text-xs"
                      >
                        Link Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: LOYALTY & ESCROW WALLET */}
          {selectedSubTab === 'wallet' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              
              {/* Escrow wallet and Account Type Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Balance display Card (Span 7) */}
                <Card className="p-6 border border-border/80 shadow-md md:col-span-7 flex flex-col justify-between bg-card rounded-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold font-headline flex items-center gap-2 text-foreground">
                          <LucideIcons.Wallet className="h-5 w-5 text-primary" />
                          <span>محفظتي الرقمية الضامنة</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5" dir="ltr">
                          My Escrow Wallet & Digital Security
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs px-2.5 py-1 rounded-full font-bold">
                        <LucideIcons.ShieldCheck className="h-3.5 w-3.5 mr-1 inline" /> حماية الضمان
                      </Badge>
                    </div>
                    
                    <div className={`my-6 p-6 rounded-2xl border text-center space-y-2 transition-all duration-500 ${
                      balanceHighlight
                        ? 'bg-emerald-500/15 border-emerald-500/60 ring-4 ring-emerald-500/20 scale-[1.02] shadow-lg shadow-emerald-500/10'
                        : 'bg-muted/20 border-border/60'
                    }`}>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                          الرصيد المتاح الحالي / AVAILABLE BALANCE
                        </span>
                        <button
                          type="button"
                          onClick={handleRefreshBalance}
                          disabled={isRefreshingBalance}
                          title="مزامنة وتحديث الرصيد فورياً"
                          className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <LucideIcons.RefreshCw className={`h-3.5 w-3.5 ${isRefreshingBalance ? 'animate-spin text-primary' : ''}`} />
                        </button>
                      </div>
                      <p className={`text-3xl md:text-4xl font-black font-mono transition-colors duration-300 ${balanceHighlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`} dir="ltr">
                        {user.walletBalance.toFixed(2)} <span className="text-lg font-semibold text-muted-foreground">DA</span>
                      </p>
                      {balanceHighlight && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-in fade-in zoom-in-95">
                          <LucideIcons.CheckCircle2 className="h-3.5 w-3.5" />
                          <span>تم تحديث وإيداع الرصيد بنجاح!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <Dialog open={isTopUpDialogOpen} onOpenChange={setIsTopUpDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2 h-11 rounded-xl font-bold text-sm shadow-sm transition-all">
                          <LucideIcons.CircleDollarSign className="h-4 w-4" />
                          <span>شحن الرصيد / Top Up</span>
                        </Button>
                      </DialogTrigger>
                      <TopUpDialog
                        currentBalance={user.walletBalance}
                        onClose={() => setIsTopUpDialogOpen(false)}
                        onTopUpSuccess={handleTopUpSuccess}
                      />
                    </Dialog>

                    <Button
                      variant="outline"
                      onClick={handleRefreshBalance}
                      disabled={isRefreshingBalance}
                      className="w-full border-border hover:bg-muted/50 flex items-center justify-center gap-2 h-11 rounded-xl font-bold text-xs shadow-sm transition-all"
                    >
                      <LucideIcons.RefreshCw className={`h-4 w-4 text-primary ${isRefreshingBalance ? 'animate-spin' : ''}`} />
                      <span>مزامنة الرصيد / Sync</span>
                    </Button>
                  </div>
                </Card>

                {/* Redesigned Subscription / Account Type Card (Span 5) */}
                {activeTier === 'free' ? (
                  <Card className="md:col-span-5 flex flex-col justify-between border border-border/80 rounded-2xl overflow-hidden shadow-md bg-card p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-bold font-headline flex items-center gap-2 text-foreground">
                            <LucideIcons.ShieldCheck className="h-5 w-5 text-primary" />
                            <span>نوع الحساب</span>
                          </CardTitle>
                          <CardDescription className="text-xs text-muted-foreground mt-0.5" dir="ltr">
                            Account Tier & Platform Status
                          </CardDescription>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                          <LucideIcons.CheckCircle className="h-3 w-3" /> نشط وموثق
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60">
                          <p className="text-sm font-bold text-foreground">حساب زبون أساسي</p>
                          <p className="text-xs text-muted-foreground" dir="ltr">Standard Client / Free Account</p>
                        </div>

                        <div className="rounded-xl border border-border/60 bg-muted/10 p-3.5 text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">اشتراك المنصة:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">مجاني 100% (0 DA)</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">حماية الضمان الرقمي (Escrow):</span>
                            <span className="font-bold text-primary">مفعلة وتلقائية</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">طلب الخدمات والشراء:</span>
                            <span className="font-bold text-foreground">غير محدود</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border mt-4">
                      <Button 
                        asChild
                        size="sm" 
                        variant="outline"
                        className="w-full text-xs h-10 font-bold flex items-center justify-center gap-2 rounded-xl border-border hover:bg-primary/5 hover:border-primary/30 text-primary"
                      >
                        <Link href="/register-provider">
                          <LucideIcons.Store className="h-4 w-4" />
                          <span>هل أنت حرفي أو تاجر؟ انضم كمزود خدمة</span>
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ) : (() => {
                  const daysLeft = (() => {
                    try {
                      const renew = new Date(currentSubscription.renewsOn).getTime();
                      const now = new Date().getTime();
                      return Math.max(0, Math.ceil((renew - now) / (1000 * 60 * 60 * 24)));
                    } catch(e) {
                      return 30;
                    }
                  })();
                  const progressPercent = Math.min(100, Math.max(0, ((30 - daysLeft) / 30) * 100));

                  return (
                    <Card className="md:col-span-5 flex flex-col justify-between border-2 overflow-hidden shadow-lg transition-all duration-300 rounded-2xl" style={{ borderColor: currentAccentColor, boxShadow: `0 8px 30px ${currentAccentColor}15` }}>
                      {/* Gradient Header */}
                      <div className="p-6 space-y-4 flex-1 bg-gradient-to-b from-muted/5 to-muted/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
                              <LucideIcons.CreditCard className="h-5 w-5" style={{ color: currentAccentColor }} />
                              <span>باقة الاشتراك</span>
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground mt-0.5" dir="ltr">
                              Platform Subscription Tier
                            </CardDescription>
                          </div>
                          <div className="p-2.5 rounded-xl bg-background shadow-xs border border-border">
                            <ActiveSubIcon className="h-6 w-6" style={{ color: currentAccentColor }} />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-base font-black" style={{ color: currentAccentColor }}>{standardTheme.nameAr}</p>
                              <p className="text-xs text-muted-foreground" dir="ltr">{standardTheme.nameEn}</p>
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
                              <LucideIcons.CheckCircle className="h-3 w-3" /> نشط / Active
                            </Badge>
                          </div>

                          {/* Subscription details block */}
                          <div className="rounded-xl border border-border/60 bg-background/70 p-3.5 text-xs space-y-2">
                            <div className="flex justify-between"><span className="text-muted-foreground">قيمة الاشتراك:</span><span className="font-extrabold">{currentSubscription.price.toLocaleString()} DA / شهر</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">تاريخ التجديد:</span><span className="font-mono">{currentSubscription.renewsOn}</span></div>
                            <div className="flex justify-between font-semibold"><span className="text-muted-foreground">الأيام المتبقية:</span><span style={{ color: currentAccentColor }}>{daysLeft} يوم</span></div>
                          </div>

                          {/* Progress to renewal */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                              <span>0%</span>
                              <span>التقدم نحو التجديد</span>
                              <span>100%</span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/30">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%`, backgroundColor: currentAccentColor }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-4 border-t border-border bg-muted/10 flex flex-col gap-2">
                        <Button 
                          size="sm" 
                          onClick={handleRenewPlan}
                          className="w-full text-xs h-10 font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 rounded-xl transition-all"
                        >
                          <LucideIcons.RefreshCw className="h-3.5 w-3.5" /> تجديد الاشتراك الآن / Renew
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setIsUpgradePlanOpen(true)}
                          className="w-full text-xs h-10 font-bold flex items-center justify-center gap-1.5 rounded-xl border border-border"
                        >
                          <LucideIcons.TrendingUp className="h-3.5 w-3.5" style={{ color: currentAccentColor }} /> ترقية باقة الاشتراك / Upgrade
                        </Button>
                      </div>
                    </Card>
                  );
                })()}
              </div>

              {/* Ongoing Escrow protected services */}
              {user.ongoingServices && user.ongoingServices.length > 0 && (
                <Card className="p-6 border border-border/80 shadow-md bg-card rounded-2xl">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
                      <LucideIcons.Lock className="h-5 w-5 text-emerald-500" />
                      <span>المدفوعات المحمية بالضمان الرقمي</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground" dir="ltr">
                      Funds Secured in Escrow (Released upon verification code exchange)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-3">
                    {user.ongoingServices.map(service => (
                      <div key={service.id} className="p-4 border border-border/80 rounded-xl bg-card text-xs flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                          <p className="font-bold text-sm text-foreground">{service.serviceName}</p>
                          <p className="text-muted-foreground text-xs mt-1">المزود: {service.providerName} | تاريخ الحجز: <FormattedServiceDate dateString={service.dateBooked} /></p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
                          <span className="font-black text-foreground text-base font-mono shrink-0" dir="ltr">{service.amountInEscrow.toFixed(2)} DA</span>
                          <Button 
                            size="sm" 
                            className="h-9 text-xs font-bold rounded-xl" 
                            onClick={() => handleCompleteService(service.id)}
                          >
                            تحرير المبلغ للمزود
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Top-up Transaction history list */}
              {user.topUpHistory && user.topUpHistory.length > 0 && (
                <Card className="p-6 border border-border/80 shadow-md bg-card rounded-2xl">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
                      <LucideIcons.History className="h-5 w-5 text-primary" />
                      <span>سجل عمليات الشحن والفواتير</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground" dir="ltr">
                      Top-up Invoice Receipts & CCP / Bank Transfers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {user.topUpHistory.map((transaction, idx) => {
                      const statusMeta = getTopUpStatusMeta(transaction.status);
                      const isInfo = statusMeta.code === 'INFO_REQUIRED' || (transaction.status as string) === 'info_required';
                      const isPending = (statusMeta.code === 'PENDING_VERIFICATION' || statusMeta.code === 'PENDING_PAYMENT_CONFIRMATION' || statusMeta.code === 'VERIFYING') && !isInfo;
                      const isApproved = statusMeta.code === 'APPROVED' || statusMeta.code === 'CREDITED';

                      return (
                        <div key={`${transaction.id || 'tx'}-${transaction.transactionCode || idx}-${idx}`} className={`p-4 border rounded-2xl space-y-3 transition-all ${
                          isInfo ? 'bg-blue-500/5 border-blue-500/40 ring-1 ring-blue-500/20 shadow-sm' :
                          isPending ? 'bg-amber-500/5 border-amber-500/30' :
                          isApproved ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-muted/30 border-border'
                        }`}>
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-lg font-black font-mono ${isApproved ? 'text-emerald-600 dark:text-emerald-400' : isInfo ? 'text-blue-600 dark:text-blue-400' : isPending ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`} dir="ltr">
                                  +{transaction.amount.toLocaleString()} DA
                                </span>
                                <Badge variant="outline" className="text-[11px] font-semibold uppercase">
                                  {(transaction.method as string) === 'ccp' ? 'بريد الجزائر (CCP)' : (transaction.method as string) === 'baridimob' ? 'BaridiMob' : 'تحويل بنكي (Bank)'}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span>رقم الطلب: <strong className="font-mono text-foreground" dir="ltr">{transaction.transactionCode}</strong></span>
                                <span>التاريخ: <ClientFormattedDateTime dateString={transaction.createdAt} /></span>
                              </div>
                            </div>
                            
                            <Badge 
                              className={`text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shrink-0 font-bold ${statusMeta.badgeClass}`}
                            >
                              {isApproved && <LucideIcons.CheckCircle className="h-3.5 w-3.5" />}
                              {isInfo && <LucideIcons.HelpCircle className="h-3.5 w-3.5 text-blue-500 animate-pulse" />}
                              {isPending && <LucideIcons.Clock className="h-3.5 w-3.5 animate-pulse" />}
                              {!isApproved && !isPending && !isInfo && <LucideIcons.AlertCircle className="h-3.5 w-3.5" />}
                              <span>{statusMeta.labelAr}</span>
                            </Badge>
                          </div>

                          {/* Admin clarification request notice & button */}
                          {isInfo && (
                            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs space-y-2.5">
                              <div className="flex items-start gap-2">
                                <LucideIcons.AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <div className="flex-1 space-y-1">
                                  <div className="font-bold text-blue-700 dark:text-blue-300">
                                    مطلوب توضيح أو إرفاق مستند من قِبل إدارة المنصة:
                                  </div>
                                  <p className="text-foreground bg-background/80 p-2.5 rounded-lg border border-blue-500/20 font-medium text-xs leading-relaxed">
                                    "{transaction.requestedInfoNote || 'يرجى تقديم صورة واضحة لوصل التحويل أو توضيح رقم العملية البريدية لإتمام المطابقة.'}"
                                  </p>
                                </div>
                              </div>

                              <div className="flex justify-end pt-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenClarifyDialog(transaction)}
                                  className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-1.5 shadow-sm"
                                >
                                  <LucideIcons.Paperclip className="h-3.5 w-3.5" />
                                  <span>تقديم التوضيح وإرفاق المستند المطلوب</span>
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Already submitted clarification summary */}
                          {transaction.userClarificationSubmittedAt && !isInfo && (
                            <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-xs space-y-1.5">
                              <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                                <span className="font-bold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                  <LucideIcons.CheckCircle2 className="h-3.5 w-3.5" /> تم تقديم الرد والمستند للإدارة بنجاح
                                </span>
                                <span className="font-mono">{transaction.userClarificationSubmittedAt}</span>
                              </div>
                              {transaction.userClarificationText && (
                                <p className="text-foreground bg-background/60 p-2 rounded-lg border border-border/60">{transaction.userClarificationText}</p>
                              )}
                              {transaction.userClarificationFileName && (
                                <div className="text-[11px] font-mono text-primary flex items-center gap-1 font-bold">
                                  <LucideIcons.FileText className="h-3.5 w-3.5" />
                                  <span>مرفق: {transaction.userClarificationFileName}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {!isInfo && (
                            <div className="text-xs text-muted-foreground bg-background/60 p-2.5 rounded-xl flex items-start gap-2 border border-border/60">
                              <LucideIcons.Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                              <p className="leading-relaxed">
                                {statusMeta.descriptionAr}
                              </p>
                            </div>
                          )}

                          {/* Admin Verification Notice (Normal User) & Admin Review Link (Admin Only) */}
                          {isPending && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2.5 border-t border-amber-500/20 bg-amber-500/5 p-3 rounded-xl">
                              <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 font-medium">
                                <LucideIcons.Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
                                <span>طلب الشحن والوصل قيد مراجعة وتدقيق الإدارة المالية — سيتم إضافة الرصيد لحسابك فور الاعتماد.</span>
                              </div>
                              {isAdmin && (
                                <Link href={`/admin/dashboard?section=topup-management&requestId=${encodeURIComponent(transaction.transactionCode || transaction.id)}`}>
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-1.5 shadow-sm transition-all whitespace-nowrap"
                                  >
                                    <LucideIcons.ExternalLink className="h-3.5 w-3.5" />
                                    <span>تدقيق واعتماد في لوحة المشرف</span>
                                  </Button>
                                </Link>
                              )}
                            </div>
                          )}

                          {isApproved && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-emerald-500/20 text-xs">
                              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                                <LucideIcons.CheckCircle2 className="h-4 w-4 shrink-0" />
                                تم اعتماد الوصل ومطابقته وإيداع المبلغ في رصيد المحفظة
                              </span>
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-mono font-bold self-start sm:self-auto">
                                +{transaction.amount.toLocaleString()} DA مضاف للرصيد
                              </Badge>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* TAB: TIPS & EXPENDITURE ANALYTICS */}
          {selectedSubTab === 'tips' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              
              {/* Trust Score Index panel */}
              <Card className="p-4 border-muted shadow-md accent-card">
                <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold font-headline flex items-center gap-1.5">
                      <LucideIcons.ShieldAlert className="h-4 w-4 text-primary" /> Trust Score Index / مؤشر الثقة الرقمية
                    </CardTitle>
                    <CardDescription className="text-xs">Based on payment speed, complete reviews, and clean cancellations</CardDescription>
                  </div>
                  <span className="text-xl font-black text-green-600 font-mono">92/100</span>
                </CardHeader>
                <CardContent className="p-0 text-xs pt-1 border-t space-y-2">
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full" style={{ width: '92%' }}></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                    <div className="space-y-1 text-green-600">
                      <p className="font-bold">✓ Positive impacts:</p>
                      <p>- 100% verified KYC identity card</p>
                      <p>- Immediate escrow fund releases</p>
                    </div>
                    <div className="space-y-1 text-amber-600">
                      <p className="font-bold">⚠️ Warning flags:</p>
                      <p>- 1 cancellation request in May</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance and Platform Tips */}
              <Card className="p-4 border-muted shadow-md accent-card">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-sm font-bold font-headline flex items-center gap-1.5">
                    <LucideIcons.Lightbulb className="h-4 w-4 text-primary" /> Service & Maintenance Recommendations / إرشادات وتوصيات
                  </CardTitle>
                  <CardDescription className="text-xs">Proactive alerts, savings recommendations, and warranties tracking</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-4">
                    <div className="p-4 border rounded-xl shadow-sm bg-card hover:shadow-md transition-all flex flex-col justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <LucideIcons.Wrench className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <h4 className="font-bold text-foreground text-sm">Seasonal AC & Heating Checkup</h4>
                          <p className="text-muted-foreground mt-1 leading-relaxed">Book certified technicians early before summer peak season to avoid emergency callout surcharges.</p>
                        </div>
                      </div>
                      <Link href="/listings?category=climatisation-chauffage">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                        >
                          Explore Verified AC Technicians
                        </Button>
                      </Link>
                    </div>

                    <div className="p-4 border rounded-xl shadow-sm bg-card hover:shadow-md transition-all flex flex-col justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <LucideIcons.ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <h4 className="font-bold text-foreground text-sm">Warranty & Escrow Protection</h4>
                          <p className="text-muted-foreground mt-1 leading-relaxed">Always verify the one-time completion OTP before releasing payments to guarantee your 30-day workmanship warranty.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Savings analysis tips */}
              <Card className="p-4 border-muted shadow-md">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="text-sm font-bold font-headline flex items-center gap-1.5">
                    <LucideIcons.Wallet className="h-4 w-4 text-amber-500" /> Wallet Financial Tips / نصائح توفير المال
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 text-xs text-muted-foreground space-y-2 mt-2">
                  <p>- 💡 <strong>Combine Services</strong>: Booking plumbing and electrical services together saves 10% in call-out fees.</p>
                  <p>- 💡 <strong>Warranties Active</strong>: Your AC service is under warranty. Do not pay for external repairs.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: ACCOUNT SECURITY & PRIVACY CONTROLS */}
          {selectedSubTab === 'security' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              
              {/* Linked Accounts */}
              <Card className="p-4 border-muted shadow-md accent-card">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-sm font-bold font-headline flex items-center gap-1.5">
                    <LucideIcons.Cog className="h-4 w-4 text-primary" /> Linked Accounts & Security / توثيق وحماية الحساب
                  </CardTitle>
                  <CardDescription className="text-xs">Manage your connected credentials</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  <div className="space-y-3">
                    {user.linkedAccounts?.map(account => {
                      const AccountIcon = account.icon;
                      return (
                        <div key={account.platform} className="flex items-center justify-between p-3 border rounded-xl bg-muted/20 text-xs">
                          <div className="flex items-center gap-3">
                            <AccountIcon className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-bold">{account.platform}</p>
                              <p className={`text-[10px] ${account.isLinked ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {account.isLinked ? `Linked: ${account.identifier}` : 'Not Linked'}
                              </p>
                            </div>
                          </div>
                          {account.isLinked ? (
                            <Button variant="link" size="sm" onClick={() => handleUnlinkAccount(account.platform)} className="text-destructive hover:text-destructive/80 text-[10px] p-0 h-auto font-bold">
                              <LucideIcons.Link2Off className="mr-1 h-3 w-3 inline-block" /> Unlink
                            </Button>
                          ) : (
                            <Button variant="link" size="sm" onClick={() => handleLinkAccount(account.platform)} className="text-primary text-[10px] p-0 h-auto font-bold">
                              <LucideIcons.Link2 className="mr-1 h-3 w-3 inline-block" /> Link
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Privacy settings */}
              <Card className="p-4 border-muted shadow-md accent-card">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-sm font-bold font-headline flex items-center gap-1.5">
                    <LucideIcons.EyeOff className="h-4 w-4 text-primary" /> Privacy Configurations / إعدادات الخصوصية المتقدمة
                  </CardTitle>
                  <CardDescription className="text-xs">Toggle address, phone visibility, and messaging preferences</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-4 text-xs">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <span className="font-bold block">Hide Phone Number / إخفاء رقم الهاتف</span>
                        <span className="text-[10px] text-muted-foreground">Keep your contact number private from non-booked professionals</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={hidePhone} 
                        onChange={e => setHidePhone(e.target.checked)}
                        className="h-4 w-4 text-primary accent-primary rounded cursor-pointer"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <span className="font-bold block">Hide Exact GPS Location / إخفاء الموقع الدقيق</span>
                        <span className="text-[10px] text-muted-foreground">Only show neighborhood name on map, share exact GPS on booking accept</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={hideLocation} 
                        onChange={e => setHideLocation(e.target.checked)}
                        className="h-4 w-4 text-primary accent-primary rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <span className="font-bold block">Who can message me / من يمكنه مراسلتي</span>
                        <span className="text-[10px] text-muted-foreground">Choose who can initiate a conversation room with you</span>
                      </div>
                      <select 
                        value={whoCanMessage} 
                        onChange={e => setWhoCanMessage(e.target.value)}
                        className="p-1 border border-muted bg-background rounded text-xs text-foreground cursor-pointer"
                      >
                        <option value="everyone">Everyone</option>
                        <option value="booked_providers">Only Booked Providers</option>
                        <option value="none">Nobody</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <span className="font-bold block">Two-Factor Authentication (2FA) / المصادقة الثنائية</span>
                        <span className="text-[10px] text-muted-foreground">Receive a verification SMS code when logging in</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={twoFactorEnabled} 
                        onChange={e => {
                          setTwoFactorEnabled(e.target.checked);
                          toast({ title: "2FA Preference Updated", description: e.target.checked ? "2FA enabled." : "2FA disabled." });
                        }}
                        className="h-4 w-4 text-primary accent-primary rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>

      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
        <DialogContent className="sm:max-w-xs text-center p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-headline">Account QR Code</DialogTitle>
            <DialogDescription>Scan to view profile or send payments</DialogDescription>
          </DialogHeader>
          <div 
            className="flex flex-col items-center justify-center my-6 p-4 bg-white rounded-xl border-4 shadow-md transition-all duration-300"
            style={{ borderColor: currentAccentColor, boxShadow: `0 0 15px ${currentAccentColor}30` }}
          >
            <svg className="w-48 h-48 text-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm11-2h7v7h-7V2zm2 2v3h3V4h-3zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 2h4v4h-4v-4zm2-4h2v2h-2v-2zm-2 2h2v2h-2v-2zm-2-2h2v2h-2v-2zm2-4h2v2h-2v-2zm-4 4h2v2h-2v-2zm2-6h2v2h-2V6zm-2 2h2v2h-2V8zm-2 4h2v2h-2v-2zm4 4h2v2h-2v-2z" />
            </svg>
            <p className="text-xs font-mono text-muted-foreground mt-4 font-bold">@user_{user.id.substring(0, 8)}</p>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button className="w-full">Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Info Popover Dialog (Requirement 2) */}
      <Dialog open={isSubInfoOpen} onOpenChange={setIsSubInfoOpen}>
        <DialogContent className="sm:max-w-md p-6 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-headline flex items-center gap-2">
              <ActiveSubIcon className="h-5 w-5" style={{ color: currentAccentColor }} />
              تفاصيل اشتراكك / Subscription Details
            </DialogTitle>
            <DialogDescription className="text-xs text-left">
              تصفح مزايا باقتك الحالية وتواريخ الفواتير والترقيات.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div 
              className="p-4 rounded-2xl border text-xs space-y-2 bg-gradient-to-br from-background via-muted/10 to-muted/20"
              style={{ borderColor: currentAccentColor + '40' }}
            >
              <div className="flex justify-between font-bold">
                <span>الباقة الحالية / Current Plan</span>
                <span style={{ color: currentAccentColor }}>{standardTheme.nameAr}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>المبلغ الشهري / Monthly Price</span>
                <span>{currentSubscription.price.toLocaleString()} DA</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>تاريخ التجديد / Renewal Date</span>
                <span className="font-mono">{currentSubscription.renewsOn}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold mb-2">مزايا الباقة / Plan Benefits</p>
              <ul className="space-y-1.5 text-xs max-h-[160px] overflow-y-auto pr-1">
                {activeTier === 'free' ? (
                  <li className="flex items-center gap-2"><LucideIcons.Check className="h-3.5 w-3.5 text-green-500" /> تصفح عادي للخدمات والمتاجر</li>
                ) : (
                  <>
                    <li className="flex items-center gap-2"><LucideIcons.Check className="h-3.5 w-3.5 text-green-500" /> ظهور مميز ومضاعف على الخريطة</li>
                    <li className="flex items-center gap-2"><LucideIcons.Check className="h-3.5 w-3.5 text-green-500" /> شارة Pro موثقة بجوار الملف</li>
                    <li className="flex items-center gap-2"><LucideIcons.Check className="h-3.5 w-3.5 text-green-500" /> دعم فني VIP فوري</li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" className="w-full text-xs" onClick={() => setIsSubInfoOpen(false)}>إغلاق / Close</Button>
            <Button className="w-full text-xs bg-primary hover:bg-primary/95 text-white" onClick={() => { setIsSubInfoOpen(false); setIsUpgradePlanOpen(true); }}>
              ترقية الباقة / Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visual Identity Customizer Dialog (Requirement 15) */}
      <Dialog open={isCustomizerOpen} onOpenChange={setIsCustomizerOpen}>
        <DialogContent className="sm:max-w-md p-6 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-headline flex items-center gap-2">
              <LucideIcons.Settings className="h-5 w-5 text-primary" />
              تخصيص الهوية البصرية / Identity Customizer
            </DialogTitle>
            <DialogDescription className="text-xs text-left">
              ميزة حصرية للمشتركين بـ Platinum و Diamond لتخصيص إطاراتهم وأغلفتهم.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Shape selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold block text-left">شكل إطار الصورة / Avatar Shape</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'circle', label: 'دائري / Circle' },
                  { id: 'rounded-square', label: 'مربع بحواف / Squircle' },
                  { id: 'hexagon', label: 'سداسي / Hexagon' },
                ].map(shape => (
                  <button
                    key={shape.id}
                    onClick={() => saveCustomization({ ...customization, frameShape: shape.id as any })}
                    className={`text-xs py-2 rounded-xl border transition-all ${
                      currentFrameShape === shape.id 
                        ? 'border-primary bg-primary/10 font-bold' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cover Style selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold block text-left">نمط الغلاف / Cover Pattern</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'solid', label: 'لون سادة / Solid' },
                  { id: 'gradient', label: 'تدرج / Gradient' },
                  { id: 'mesh', label: 'تدرج شبكي / Mesh' },
                  { id: 'stripes', label: 'خطوط معدنية / Stripes' },
                  { id: 'image', label: 'صورة مخصصة / Custom Photo' },
                ].map(style => (
                  <button
                    key={style.id}
                    onClick={() => saveCustomization({ ...customization, coverStyle: style.id as any })}
                    className={`text-xs py-2 rounded-xl border transition-all ${
                      currentCoverStyle === style.id 
                        ? 'border-primary bg-primary/10 font-bold' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom color selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold block text-left">لون الهوية البصرية / Accent Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={currentAccentColor}
                  onChange={(e) => saveCustomization({ ...customization, identityColor: e.target.value, frameColor: e.target.value })}
                  className="h-8 w-12 rounded cursor-pointer border border-border"
                />
                <span className="text-xs font-mono text-muted-foreground uppercase">{currentAccentColor}</span>
              </div>
            </div>

            {/* Custom Cover Photo Upload */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-bold block text-left">تحميل صورة الغلاف / Upload Cover Photo</label>
              <div className="flex flex-col gap-2">
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleCoverUpload}
                  className="text-xs cursor-pointer bg-background border border-border"
                />
                {customization.coverUrl && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border text-xs">
                    <span className="truncate max-w-[200px] text-[10px] text-muted-foreground font-mono">Cover Photo Loaded</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => saveCustomization({ ...customization, coverStyle: 'gradient', coverUrl: undefined })}
                      className="text-destructive h-6 px-2 hover:bg-destructive/10"
                    >
                      إزالة / Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Reset button */}
            <Button 
              variant="outline" 
              className="w-full text-xs" 
              onClick={() => saveCustomization(DEFAULT_CUSTOMIZATION[activeTier === 'diamond' ? 'diamond' : 'platinum'])}
            >
              إعادة تعيين الافتراضي / Reset Defaults
            </Button>
          </div>
          <DialogFooter>
            <Button className="w-full text-xs" onClick={() => setIsCustomizerOpen(false)}>حفظ وإغلاق / Save & Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Subscription Dialog – Redesigned */}
      <Dialog open={isUpgradePlanOpen} onOpenChange={setIsUpgradePlanOpen}>
        <DialogContent className="sm:max-w-5xl text-foreground p-0 overflow-hidden">
          {/* Header bar */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-lg font-bold font-headline flex items-center gap-2">
              <LucideIcons.Landmark className="h-5 w-5 text-primary" />
              Upgrade Subscription Plan / ترقية باقة الاشتراك
            </DialogTitle>
            <DialogDescription className="text-xs mt-1">
              Boost your store search visibility and unlock professional analytics. Payment is securely deducted from your Escrow Wallet.
            </DialogDescription>
            {/* Current plan indicator */}
            <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
              <LucideIcons.Info className="h-3.5 w-3.5" />
              Currently on: <strong className="text-foreground">{currentSubscription.plan}</strong>
              <span className="mx-1">·</span>
              <LucideIcons.Wallet className="h-3.5 w-3.5 text-accent" />
              Wallet: <strong className="text-accent">{user?.walletBalance?.toLocaleString() || 0} DA</strong>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Plan cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  name: 'Basic Plan',
                  nameAr: 'الباقة الأساسية',
                  price: 1500,
                  tier: 'bronze',
                  iconName: 'Award' as keyof typeof LucideIcons,
                  iconCls: 'text-amber-700',
                  descAr: 'مثالية للمشاريع الناشئة',
                  border: 'border-amber-700',
                  bg: 'from-amber-900/15 via-amber-800/5 to-transparent',
                  text: 'text-amber-700',
                  btnBg: 'bg-amber-700 hover:bg-amber-800 text-white',
                  badgeCls: 'bg-amber-700/10 text-amber-800 border-amber-700/30',
                  glow: '',
                  perks: [
                    { icon: 'ListChecks', label: '5 إعلانات نشطة' },
                    { icon: 'MessageCircle', label: 'دعم بريد إلكتروني' },
                    { icon: 'BarChart2', label: 'إحصاءات أساسية' },
                    { icon: 'MapPin', label: 'ظهور عادي على الخريطة' },
                    { icon: 'Clock', label: 'وقت استجابة 48 ساعة' },
                  ],
                  notIncluded: ['أولوية في البحث', 'تحليلات متقدمة', 'مدير حساب مخصص'],
                },
                {
                  name: 'Pro Plan',
                  nameAr: 'الباقة الفضية',
                  price: 3000,
                  tier: 'silver',
                  iconName: 'ShieldCheck' as keyof typeof LucideIcons,
                  iconCls: 'text-slate-400',
                  descAr: 'للمحترفين والمتاجر النشطة',
                  border: 'border-slate-400',
                  bg: 'from-slate-400/15 via-slate-300/5 to-transparent',
                  text: 'text-slate-500',
                  btnBg: 'bg-slate-500 hover:bg-slate-600 text-white',
                  badgeCls: 'bg-slate-400/10 text-slate-500 border-slate-400/30',
                  glow: 'shadow-md shadow-slate-300/30',
                  popular: true,
                  perks: [
                    { icon: 'Infinity', label: 'إعلانات غير محدودة' },
                    { icon: 'Headphones', label: 'دعم فوري (Chat)' },
                    { icon: 'TrendingUp', label: 'تحليلات متقدمة' },
                    { icon: 'MapPin', label: '1.5x تعزيز على الخريطة' },
                    { icon: 'BadgeCheck', label: 'شارة Pro موثّقة' },
                    { icon: 'Clock', label: 'استجابة خلال 24 ساعة' },
                  ],
                  notIncluded: ['مدير حساب مخصص', 'تكامل API مخصص'],
                },
                {
                  name: 'Business Premium Plan',
                  nameAr: 'الباقة الذهبية',
                  price: 7500,
                  tier: 'gold',
                  iconName: 'Star' as keyof typeof LucideIcons,
                  iconCls: 'text-yellow-500',
                  descAr: 'للأعمال التجارية المتوسطة',
                  border: 'border-yellow-500',
                  bg: 'from-yellow-500/15 via-yellow-400/5 to-transparent',
                  text: 'text-yellow-600',
                  btnBg: 'bg-yellow-500 hover:bg-yellow-600 text-white',
                  badgeCls: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
                  glow: 'shadow-md shadow-yellow-400/30',
                  perks: [
                    { icon: 'Infinity', label: 'إعلانات غير محدودة' },
                    { icon: 'UserCheck', label: 'مدير حساب مخصص' },
                    { icon: 'MapPinned', label: 'دبوس خريطة مميّز (2.5x)' },
                    { icon: 'Brain', label: 'جدولة تلقائية بالذكاء الاصطناعي' },
                    { icon: 'BarChart3', label: 'تقارير أسبوعية مفصّلة' },
                    { icon: 'Zap', label: 'استجابة فورية VIP' },
                    { icon: 'Globe', label: 'ظهور على الصفحة الرئيسية' },
                  ],
                  notIncluded: ['تكامل API مخصص'],
                },
                {
                  name: 'Enterprise Platinum',
                  nameAr: 'الباقة البلاتينية',
                  price: 12000,
                  tier: 'platinum',
                  iconName: 'Gem' as keyof typeof LucideIcons,
                  iconCls: 'text-purple-500',
                  descAr: 'للمؤسسات الكبرى والعلامات التجارية',
                  border: 'border-purple-500',
                  bg: 'from-purple-600/15 via-purple-400/5 to-transparent',
                  text: 'text-purple-600',
                  btnBg: 'bg-purple-600 hover:bg-purple-700 text-white',
                  badgeCls: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
                  glow: 'shadow-lg shadow-purple-400/30',
                  perks: [
                    { icon: 'Infinity', label: 'إعلانات غير محدودة' },
                    { icon: 'Crown', label: 'أولوية قصوى في البحث' },
                    { icon: 'UserCheck', label: 'مدير حساب كونسيرج 24/7' },
                    { icon: 'Code2', label: 'تكامل API مخصص' },
                    { icon: 'ShieldCheck', label: 'حماية ضمان موسّعة' },
                    { icon: 'Megaphone', label: 'حملات تسويقية ممولة' },
                    { icon: 'Globe', label: 'تصنيف أول – الصفحة الرئيسية' },
                    { icon: 'LayoutDashboard', label: 'لوحة تحكم مؤسسية مخصصة' },
                  ],
                  notIncluded: [],
                },
              ].map(plan => {
                const isCurrent = currentSubscription.plan === plan.name;
                const canAfford = (user?.walletBalance || 0) >= plan.price;
                const PlanIcon = LucideIcons[plan.iconName] as React.ElementType;
                return (
                  <div
                    key={plan.name}
                    className={`relative border-2 ${plan.border} rounded-2xl flex flex-col overflow-hidden transition-all duration-300 hover:scale-[1.02] ${plan.glow} ${
                      isCurrent ? 'ring-2 ring-green-500 ring-offset-2' : ''
                    }`}
                  >
                    {/* Popular ribbon */}
                    {plan.popular && (
                      <div className={`text-center text-[8px] font-black uppercase tracking-widest py-1 ${plan.badgeCls} border-b ${plan.border} animate-pulse`}>
                        <LucideIcons.Sparkles className="inline h-2.5 w-2.5 mr-1" />
                        الأكثر اختياراً · Most Popular
                      </div>
                    )}

                    {/* Card body */}
                    <div className={`bg-gradient-to-b ${plan.bg} p-4 flex flex-col gap-3 flex-1`}>
                      {/* Top row: icon + active badge */}
                      <div className="flex items-start justify-between">
                        <div className={`p-2.5 rounded-xl border-2 ${plan.border} bg-background/50 shadow-sm`}>
                          <PlanIcon className={`h-6 w-6 ${plan.iconCls}`} />
                        </div>
                        <div className="text-right">
                          {isCurrent && (
                            <span className="text-[8px] font-black uppercase bg-green-500/15 text-green-600 border border-green-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <LucideIcons.CheckCircle className="h-2.5 w-2.5" /> مفعّل
                            </span>
                          )}
                          {!canAfford && !isCurrent && (
                            <span className="text-[8px] bg-red-500/10 text-red-500 border border-red-300/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <LucideIcons.AlertCircle className="h-2.5 w-2.5" /> رصيد غير كافٍ
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Name & price */}
                      <div>
                        <p className={`font-extrabold text-sm ${plan.text} leading-tight`}>{plan.nameAr}</p>
                        <p className="text-[9px] text-muted-foreground">{plan.name}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5 italic">{plan.descAr}</p>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-black ${plan.text}`}>{plan.price.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">DA / شهر</span>
                      </div>
                      {/* Divider */}
                      <div className={`border-t ${plan.border} opacity-30`} />
                      {/* Features list */}
                      <ul className="space-y-1.5 flex-1">
                        {plan.perks.map(perk => {
                          const PerkIcon = LucideIcons[perk.icon as keyof typeof LucideIcons] as React.ElementType;
                          return (
                            <li key={perk.label} className="flex items-center gap-2 text-[9px] text-foreground/80">
                              <span className={`shrink-0 p-0.5 rounded-md ${plan.badgeCls}`}>
                                <PerkIcon className={`h-2.5 w-2.5 ${plan.text}`} />
                              </span>
                              {perk.label}
                            </li>
                          );
                        })}
                        {plan.notIncluded.map(item => (
                          <li key={item} className="flex items-center gap-2 text-[9px] text-muted-foreground/50 line-through">
                            <span className="shrink-0 p-0.5 rounded-md bg-muted/30">
                              <LucideIcons.X className="h-2.5 w-2.5" />
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA button */}
                    <div className="p-3 border-t border-border/40 bg-background/60 backdrop-blur-sm">
                      <Button
                        size="sm"
                        className={`w-full text-[11px] h-9 font-bold flex items-center justify-center gap-1.5 rounded-xl transition-all ${
                          isCurrent
                            ? 'bg-green-500/10 text-green-600 border border-green-500/30 cursor-default'
                            : plan.btnBg
                        }`}
                        disabled={isCurrent}
                        onClick={() => handleUpgradeSubscription(plan.name, plan.price, plan.tier)}
                      >
                        {isCurrent ? (
                          <><LucideIcons.CheckCircle className="h-4 w-4" /> الخطة الحالية</>
                        ) : (
                          <><LucideIcons.TrendingUp className="h-4 w-4" /> اشترك الآن</>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comparison note */}
            <div className="rounded-xl border border-border bg-muted/20 p-3 text-[9px] text-muted-foreground flex flex-wrap gap-x-6 gap-y-1">
              <span className="flex items-center gap-1"><LucideIcons.Shield className="h-3 w-3 text-green-500" /> جميع الباقات تشمل حماية الضمان الأساسي</span>
              <span className="flex items-center gap-1"><LucideIcons.RefreshCcw className="h-3 w-3 text-primary" /> تجديد تلقائي كل 30 يوماً</span>
              <span className="flex items-center gap-1"><LucideIcons.Ban className="h-3 w-3 text-red-400" /> لا يوجد إلغاء تلقائي</span>
              <span className="flex items-center gap-1"><LucideIcons.Wallet className="h-3 w-3 text-accent" /> الدفع من المحفظة الضامنة</span>
            </div>

            {/* Wallet balance bar */}
            <div className="bg-muted/30 p-3 rounded-xl flex items-center justify-between text-xs border border-border">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <LucideIcons.Wallet className="h-4 w-4 text-primary" /> Available Wallet Balance / الرصيد المتاح:
              </span>
              <strong className="text-accent flex items-center gap-1 text-sm">
                <LucideIcons.CircleDollarSign className="h-4 w-4" />
                {user?.walletBalance?.toLocaleString() || 0} DA
              </strong>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="text-center mt-12 mb-6">
        <Button 
          variant="destructive" 
          onClick={() => toast({ title: "Logging out (Conceptual)", description: "تم تسجيل الخروج بنجاح." })}
          className="px-8 py-5 h-auto text-xs font-black shadow-lg shadow-destructive/20 hover:scale-105 transition-all duration-300 rounded-xl"
        >
          <LucideIcons.LogOut className="mr-2 h-4 w-4" /> تسجيل الخروج / Log Out
        </Button>
      </div>

      {/* Dispute Modal */}
      <Dialog open={isDisputeOpen} onOpenChange={setIsDisputeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 animate-pulse" /> Open Dispute / فتح نزاع
            </DialogTitle>
            <DialogDescription>
              If the work is incomplete, of bad quality, or the professional did not show up, open a dispute to notify management.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="block mb-1.5 font-semibold text-xs">Reason for Dispute / سبب النزاع</Label>
              <select
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                className="w-full p-2.5 border rounded-md bg-background text-sm focus:ring-2 focus:ring-red-500"
              >
                <option value="Work incomplete">Work incomplete / العمل غير مكتمل</option>
                <option value="Poor quality">Poor quality / جودة سيئة</option>
                <option value="Provider did not show up">Provider did not show up / الحرفي لم يحضر</option>
                <option value="Different service executed">Different service executed / تم تنفيذ خدمة مختلفة</option>
                <option value="Other">Other / سبب آخر</option>
              </select>
            </div>
            <div>
              <Label htmlFor="disputeComments" className="block mb-1.5 font-semibold text-xs">Details / تفاصيل الشكوى</Label>
              <Textarea
                id="disputeComments"
                value={disputeComments}
                onChange={e => setDisputeComments(e.target.value)}
                placeholder="Explain the issue in detail..."
                rows={4}
                className="text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisputeOpen(false)}>Cancel / إلغاء</Button>
            <Button variant="destructive" onClick={handleDisputeSubmit} disabled={!disputeComments.trim()}>
              Submit Dispute / إرسال الشكوى
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Provider Rating Modal */}
      <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> Rate Professional / تقييم الحرفي
            </DialogTitle>
            <DialogDescription>
              Your rating helps maintain a high-quality community of service providers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-center">
            <p className="font-semibold text-sm">Select Rating:</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRatingValue(val)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star className={`h-8 w-8 ${val <= ratingValue ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
            <div className="text-left">
              <Label htmlFor="ratingComments" className="block mb-1.5 font-semibold text-xs">Review Comments (Optional)</Label>
              <Textarea
                id="ratingComments"
                value={ratingComments}
                onChange={e => setRatingComments(e.target.value)}
                placeholder="Describe your experience with the provider..."
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRatingOpen(false)}>Cancel</Button>
            <Button onClick={handleRatingSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Submit Review / تقديم التقييم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Order Details Modal */}
      <Dialog open={!!selectedDetailServiceOrder} onOpenChange={() => setSelectedDetailServiceOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDetailServiceOrder && (() => {
            const appt = selectedDetailServiceOrder;
            const notesPayload = parseServiceNotes(appt.notes);
            const materialsCost = notesPayload.materialsUsed?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
            const price = 3000 + materialsCost;
            
            const serviceStages = [
              { key: 'created', label: 'Created', labelAr: 'طلب الخدمة' },
              { key: 'accepted', label: 'Accepted', labelAr: 'مقبول' },
              { key: 'started', label: 'Started', labelAr: 'قيد التنفيذ' },
              { key: 'finished', label: 'Finished', labelAr: 'منتهي' },
              { key: 'waiting', label: 'Verification', labelAr: 'التحقق' },
              { key: 'verified', label: 'Verified', labelAr: 'مؤكد' },
              { key: 'completed', label: 'Completed', labelAr: 'مكتمل' }
            ];

            const getStageIndex = (status: string) => {
              const s = status.toLowerCase();
              if (s === 'pending_confirmation') return 0;
              if (s === 'confirmed' || s === 'en_route') return 1;
              if (s === 'in_progress') return 2;
              if (s === 'waiting_verification') return 4;
              if (s === 'completed') return 6;
              if (s === 'disputed') return 4;
              if (s === 'cancelled') return 0;
              return 0;
            };

            const currentIdx = getStageIndex(appt.status);
            const isCancelled = appt.status === 'cancelled';
            const isDisputed = appt.status === 'disputed';
            const isOtpRevealed = !!revealedOtps[appt.reservationId];

            return (
              <div className="space-y-6">
                <DialogHeader className="border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <DialogTitle className="text-xl flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" /> Service Order Details
                      </DialogTitle>
                      <DialogDescription className="text-xs mt-1">
                        Reference Code: <span className="font-mono font-bold text-primary">{appt.reservationId}</span>
                      </DialogDescription>
                    </div>
                    <Badge variant={appt.status === 'completed' ? 'outline' : 'default'} className="bg-primary/10 text-primary border-primary/20">
                      {appt.status.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  </div>
                </DialogHeader>

                {/* Stepper Progress */}
                <div className="p-4 bg-muted/20 border rounded-xl space-y-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Service Timeline Progress</p>
                  
                  <div className="flex items-center justify-between relative px-2 py-4">
                    <div className="absolute top-[25px] left-0 right-0 h-[2px] bg-muted-foreground/15 -z-0"></div>
                    {serviceStages.map((step, idx) => {
                      const isStepCompleted = !isCancelled && !isDisputed && idx <= currentIdx;
                      const isStepActive = !isCancelled && !isDisputed && idx === currentIdx;
                      
                      let dotColor = "bg-muted text-muted-foreground";
                      if (isCancelled && idx === 0) dotColor = "bg-destructive text-white";
                      else if (isDisputed && idx === 4) dotColor = "bg-destructive text-white";
                      else if (isStepActive) dotColor = "bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse";
                      else if (isStepCompleted) dotColor = "bg-green-500 text-white";

                      return (
                        <div key={step.key} className="flex flex-col items-center z-10 text-center flex-1">
                          <div className={`h-6 w-6 rounded-full ${dotColor} flex items-center justify-center text-[10px] font-extrabold transition-all duration-300`}>
                            {isCancelled && idx === 0 ? '✕' : isDisputed && idx === 4 ? '⚠️' : isStepCompleted && idx < currentIdx ? '✓' : idx + 1}
                          </div>
                          <span className="text-[10px] mt-1.5 font-bold block truncate max-w-[70px]" title={step.label}>{step.label}</span>
                          <span className="text-[9px] text-muted-foreground block truncate max-w-[70px]">{step.labelAr}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Professional details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded-xl bg-card space-y-2">
                    <h4 className="font-bold text-xs uppercase text-muted-foreground">Service Provider</h4>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={appt.clinicLogoUrl} />
                        <AvatarFallback>{appt.professionalName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold">{appt.professionalName}</p>
                        <p className="text-xs text-muted-foreground">{appt.professionalCategory}</p>
                      </div>
                    </div>
                    <div className="pt-2 flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs flex-1" onClick={() => toast({ title: "Provider Phone", description: `Calling professional at +213 555-0199...` })}>
                        <PhoneCall className="h-3.5 w-3.5 mr-1.5" /> Call
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs flex-1" onClick={() => toast({ title: "Chat Room", description: "Navigating to messenger dashboard..." })}>
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Chat
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 border rounded-xl bg-card space-y-1.5 text-xs">
                    <h4 className="font-bold text-xs uppercase text-muted-foreground">Order Specifications</h4>
                    <p><strong>Scheduled Date:</strong> {appt.date ? new Date(appt.date).toLocaleDateString() : 'N/A'} at {appt.timeSlot || 'Any Time'}</p>
                    <p><strong>Customer Name:</strong> {appt.patientName}</p>
                    <p className="truncate"><strong>Job Location:</strong> {appt.location}</p>
                    <p><strong>Base Cost:</strong> 3,000.00 DA</p>
                  </div>
                </div>

                {/* Evidence Completeness */}
                {notesPayload.endTime && (
                  <div className="border rounded-xl p-4 bg-card space-y-4">
                    <div className="flex items-center gap-1.5 text-primary border-b pb-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-bold text-xs uppercase tracking-wider">Service Completion Report</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Time Finished:</span>
                        <strong>{notesPayload.endTime ? new Date(notesPayload.endTime).toLocaleString() : 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Estimated Duration:</span>
                        <strong>{notesPayload.endDuration || 'N/A'}</strong>
                      </div>
                    </div>

                    {notesPayload.completionNotesText && (
                      <div className="space-y-1 text-xs">
                        <span className="font-bold text-muted-foreground uppercase">Work Notes</span>
                        <p className="p-3 rounded border bg-muted/30 italic">"{notesPayload.completionNotesText}"</p>
                      </div>
                    )}

                    {/* Checklist */}
                    {notesPayload.workChecklist && (
                      <div className="p-3 bg-muted/20 border rounded-lg space-y-2 text-xs">
                        <span className="font-bold text-muted-foreground uppercase block">Work Completion Checklist</span>
                        <div className="grid grid-cols-2 gap-2">
                          <span className={notesPayload.workChecklist.workDone ? "text-green-600 font-bold" : "text-muted-foreground"}>
                            {notesPayload.workChecklist.workDone ? "☑" : "☐"} Works Completed
                          </span>
                          <span className={notesPayload.workChecklist.cleanUp ? "text-green-600 font-bold" : "text-muted-foreground"}>
                            {notesPayload.workChecklist.cleanUp ? "☑" : "☐"} Cleaned Workspace
                          </span>
                          <span className={notesPayload.workChecklist.tested ? "text-green-600 font-bold" : "text-muted-foreground"}>
                            {notesPayload.workChecklist.tested ? "☑" : "☐"} Tested Service
                          </span>
                          <span className={notesPayload.workChecklist.explained ? "text-green-600 font-bold" : "text-muted-foreground"}>
                            {notesPayload.workChecklist.explained ? "☑" : "☐"} Explained to Client
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Materials Invoice Table */}
                    {notesPayload.materialsUsed && notesPayload.materialsUsed.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-bold text-muted-foreground uppercase text-xs block">Invoice / Materials Breakdown</span>
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow className="h-8">
                                <TableHead className="h-8 py-0.5 text-[10px]">Material</TableHead>
                                <TableHead className="h-8 py-0.5 text-center text-[10px]">Qty</TableHead>
                                <TableHead className="h-8 py-0.5 text-right text-[10px]">Unit Price</TableHead>
                                <TableHead className="h-8 py-0.5 text-right text-[10px]">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody className="text-xs">
                              {notesPayload.materialsUsed.map((mat, idx) => (
                                <TableRow key={idx} className="h-8">
                                  <TableCell className="py-1 font-medium">{mat.name}</TableCell>
                                  <TableCell className="py-1 text-center">{mat.quantity}</TableCell>
                                  <TableCell className="py-1 text-right">{mat.price.toFixed(2)} DA</TableCell>
                                  <TableCell className="py-1 text-right font-semibold">{(mat.quantity * mat.price).toFixed(2)} DA</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="bg-muted/30 font-bold h-8">
                                <TableCell colSpan={3} className="py-1 text-right">Materials Subtotal:</TableCell>
                                <TableCell className="py-1 text-right text-primary">
                                  {materialsCost.toFixed(2)} DA
                                </TableCell>
                              </TableRow>
                              <TableRow className="bg-primary/5 font-extrabold h-8">
                                <TableCell colSpan={3} className="py-1 text-right text-sm">Grand Total (Base + Parts):</TableCell>
                                <TableCell className="py-1 text-right text-sm text-accent">
                                  {price.toFixed(2)} DA
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Image galleries before/after */}
                    {((notesPayload.beforePhotos && notesPayload.beforePhotos.length > 0) || (notesPayload.afterPhotos && notesPayload.afterPhotos.length > 0)) && (
                      <div className="space-y-2 pt-2 border-t text-xs">
                        <span className="font-bold text-muted-foreground uppercase block">Work Photos</span>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-amber-600 uppercase block mb-1">Before Photos</span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {notesPayload.beforePhotos?.map((p, i) => (
                                <div key={i} className="aspect-video border rounded-md overflow-hidden bg-muted flex items-center justify-center cursor-zoom-in hover:scale-105 transition-transform" onClick={() => setActiveLightboxImg(p)}>
                                  <span className="text-[9px] font-mono p-1 truncate w-full text-center">{p.split('/').pop()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-green-600 uppercase block mb-1">After Photos</span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {notesPayload.afterPhotos?.map((p, i) => (
                                <div key={i} className="aspect-video border rounded-md overflow-hidden bg-muted flex items-center justify-center cursor-zoom-in hover:scale-105 transition-transform" onClick={() => setActiveLightboxImg(p)}>
                                  <span className="text-[9px] font-mono p-1 truncate w-full text-center">{p.split('/').pop()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* OTP Verification Prompt */}
                {appt.status === 'waiting_verification' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                    <div className="flex items-start gap-2 text-blue-800">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-xs">Awaiting client authorization OTP / بانتظار رمز التأكيد</p>
                        <p className="text-[10px] text-blue-700 mt-0.5">Please check the quality of work. If you approve, give this OTP to the professional to confirm transaction release.</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center py-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Verification PIN Code</span>
                      {isOtpRevealed ? (
                        <span className="text-3xl font-mono font-bold tracking-widest text-primary my-1">{notesPayload.otpCode || '548219'}</span>
                      ) : (
                        <span className="text-2xl font-mono font-bold tracking-widest text-muted-foreground my-1">••••••</span>
                      )}
                      <Button variant="ghost" size="sm" className="text-xs h-7 mt-1 text-primary" onClick={() => setRevealedOtps(prev => ({ ...prev, [appt.reservationId]: !isOtpRevealed }))}>
                        {isOtpRevealed ? "Hide Code" : "Show Verification PIN"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Dispute / Rating option */}
                {appt.status === 'completed' && !notesPayload.providerRating && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-yellow-800">Please help us by rating your experience!</span>
                    <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white" onClick={() => {
                      setSelectedDetailServiceOrder(null);
                      openRatingModal(appt.reservationId);
                    }}>Rate Provider</Button>
                  </div>
                )}

                {/* Audit Trail Logs */}
                {notesPayload.auditLogs && notesPayload.auditLogs.length > 0 && (
                  <div className="border rounded-xl p-4 bg-card space-y-3">
                    <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground block">System Audit Trail Log</span>
                    <div className="space-y-2.5 max-h-[150px] overflow-y-auto pr-1">
                      {notesPayload.auditLogs.map((log, i) => (
                        <div key={i} className="text-[11px] border-b pb-1.5 last:border-0">
                          <div className="flex justify-between font-bold text-muted-foreground">
                            <span>{log.action.replace(/_/g, ' ')}</span>
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-foreground mt-0.5">{log.details}</p>
                          <div className="flex gap-2 text-[9px] text-muted-foreground mt-0.5">
                            {log.device && <span>Device: {log.device}</span>}
                            {log.ip && <span>IP: {log.ip}</span>}
                            {log.gps && (
                              <a href={`https://www.google.com/maps/search/?api=1&query=${log.gps}`} target="_blank" className="text-primary hover:underline font-semibold flex items-center gap-0.5">
                                GPS: {log.gps} (Show Map)
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-between border-t">
                  <Button variant="link" size="sm" className="text-primary text-xs" onClick={() => handleViewAppointmentTicket(appt.reservationId)}>
                    <Printer className="h-4 w-4 mr-1.5" /> Print Invoice Receipt (PDF)
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedDetailServiceOrder(null)}>Close</Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Store Order Details Modal */}
      <Dialog open={!!selectedDetailStoreOrder} onOpenChange={() => setSelectedDetailStoreOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDetailStoreOrder && (() => {
            const ord = selectedDetailStoreOrder;
            
            const storeStages = [
              { key: 'pending', label: 'Received', labelAr: 'مستلم' },
              { key: 'processing', label: 'Prepared', labelAr: 'قيد التجهيز' },
              { key: 'shipped', label: 'Shipped', labelAr: 'مشحون' },
              { key: 'out_for_delivery', label: 'Out for Delivery', labelAr: 'للتوصيل' },
              { key: 'delivered', label: 'Delivered', labelAr: 'تم التوصيل' }
            ];

            const getStoreStageIndex = (status: string) => {
              const s = status.toLowerCase();
              if (s === 'pending') return 0;
              if (s === 'processing') return 1;
              if (s === 'shipped') return 2;
              if (s === 'out_for_delivery') return 3;
              if (s === 'delivered') return 4;
              return 0;
            };

            const currentIdx = getStoreStageIndex(ord.status);
            const isCancelled = ord.status === 'cancelled';

            return (
              <div className="space-y-6">
                <DialogHeader className="border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <DialogTitle className="text-xl flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-primary" /> Store Order Details
                      </DialogTitle>
                      <DialogDescription className="text-xs mt-1">
                        Order Ref ID: <span className="font-mono font-bold text-primary">{ord.id}</span>
                      </DialogDescription>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 capitalize">
                      {ord.status}
                    </Badge>
                  </div>
                </DialogHeader>

                {/* Progress Timeline Tracker */}
                <div className="p-4 bg-muted/20 border rounded-xl space-y-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Shipment Delivery Progress</p>
                  
                  <div className="flex items-center justify-between relative px-2 py-4">
                    <div className="absolute top-[25px] left-0 right-0 h-[2px] bg-muted-foreground/15 -z-0"></div>
                    {storeStages.map((step, idx) => {
                      const isCompleted = !isCancelled && idx <= currentIdx;
                      const isActive = !isCancelled && idx === currentIdx;

                      let dotColor = "bg-muted text-muted-foreground";
                      if (isCancelled && idx === 0) dotColor = "bg-destructive text-white";
                      else if (isActive) dotColor = "bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse";
                      else if (isCompleted) dotColor = "bg-green-500 text-white";

                      return (
                        <div key={step.key} className="flex flex-col items-center z-10 text-center flex-1">
                          <div className={`h-6 w-6 rounded-full ${dotColor} flex items-center justify-center text-[10px] font-extrabold transition-all duration-300`}>
                            {isCancelled && idx === 0 ? '✕' : isCompleted && idx < currentIdx ? '✓' : idx + 1}
                          </div>
                          <span className="text-[10px] mt-1.5 font-bold block truncate max-w-[75px]" title={step.label}>{step.label}</span>
                          <span className="text-[9px] text-muted-foreground block truncate max-w-[75px]">{step.labelAr}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Carrier and address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 border rounded-xl bg-card space-y-1.5">
                    <h4 className="font-bold text-xs uppercase text-muted-foreground">Shipping Provider</h4>
                    <p><strong>Carrier:</strong> {ord.shipping_provider || 'Yalidine Express / يالدين'}</p>
                    <p><strong>Tracking Number:</strong> <span className="font-mono font-bold">{ord.tracking_number || 'YAL-MOCK-99210'}</span></p>
                    <p><strong>Date Placed:</strong> {ord.created_at ? new Date(ord.created_at).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div className="p-3 border rounded-xl bg-card space-y-1.5">
                    <h4 className="font-bold text-xs uppercase text-muted-foreground">Delivery Destination</h4>
                    <p><strong>Recipient:</strong> {ord.customer_name}</p>
                    <p><strong>Phone:</strong> {ord.customer_phone}</p>
                    <p className="line-clamp-2"><strong>Address:</strong> {ord.shipping_address}</p>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase text-muted-foreground">Order Items</h4>
                  <div className="border rounded-xl overflow-hidden bg-card">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="h-8">
                          <TableHead className="h-8 py-1 text-[10px]">Product</TableHead>
                          <TableHead className="h-8 py-1 text-center text-[10px]">Qty</TableHead>
                          <TableHead className="h-8 py-1 text-right text-[10px]">Price</TableHead>
                          <TableHead className="h-8 py-1 text-right text-[10px]">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {ord.order_items?.map((item: any, idx: number) => (
                          <TableRow key={idx} className="h-10">
                            <TableCell className="py-1">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded overflow-hidden bg-muted border shrink-0">
                                  <img src={item.product_image_url || 'https://placehold.co/40x40.png'} className="object-cover h-full w-full" />
                                </div>
                                <span className="font-medium truncate max-w-[150px]">{item.product_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-1 text-center font-bold">{item.quantity}</TableCell>
                            <TableCell className="py-1 text-right">{(item.price || 0).toFixed(2)} DA</TableCell>
                            <TableCell className="py-1 text-right font-semibold">{(item.quantity * item.price).toFixed(2)} DA</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/15 font-bold h-9">
                          <TableCell colSpan={3} className="py-1 text-right">Grand Total Paid:</TableCell>
                          <TableCell className="py-1 text-right text-accent font-extrabold">
                            {(parseFloat(ord.total) || 0).toFixed(2)} DA
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="pt-2 flex justify-between border-t text-xs">
                  <Button variant="link" className="text-primary text-xs" onClick={() => toast({ title: "Invoice downloaded", description: "Standard PDF receipt has been compiled successfully." })}>
                    <Printer className="h-4 w-4 mr-1.5" /> Download Purchase Bill
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedDetailStoreOrder(null)}>Close</Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Return Request Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="sm:max-w-md text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <LucideIcons.RefreshCw className="h-5 w-5 text-destructive" /> Product Return Request / إرجاع منتج
            </DialogTitle>
            <DialogDescription>
              Submit a formal request to return <strong>"{returnItemName}"</strong> back to the seller.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div>
              <Label className="block mb-1.5 font-semibold">Return Reason / سبب الإرجاع</Label>
              <select
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                className="w-full p-2.5 border rounded-md bg-background text-sm text-foreground focus:ring-2 focus:ring-primary"
              >
                <option value="Damaged item">Damaged item / منتج تالف أو مكسور</option>
                <option value="Wrong item received">Wrong item received / استلام منتج خاطئ</option>
                <option value="Poor quality">Poor quality / جودة ضعيفة</option>
                <option value="No longer needed">No longer needed / لم أعد بحاجة إليه</option>
                <option value="Other">Other / سبب آخر</option>
              </select>
            </div>
            <div>
              <Label htmlFor="returnComments" className="block mb-1.5 font-semibold">Additional Details / تفاصيل إضافية</Label>
              <Textarea
                id="returnComments"
                value={returnComments}
                onChange={e => setReturnComments(e.target.value)}
                placeholder="Describe your issue with the product..."
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReturnDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              setIsReturnDialogOpen(false);
              toast({
                title: "Return Request Submitted",
                description: `Return request for "${returnItemName}" is pending store review.`,
              });
              setReturnComments('');
            }} disabled={!returnComments.trim()}>
              Submit Return Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Workspace Dialog */}
      <Dialog open={!!activeChatSession} onOpenChange={() => setActiveChatSession(null)}>
        <DialogContent className="sm:max-w-lg text-foreground flex flex-col h-[550px] p-0 overflow-hidden">
          {activeChatSession && (() => {
            return (
              <>
                <DialogHeader className="p-4 border-b bg-muted/20 shrink-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${activeChatSession.name}`} />
                      <AvatarFallback>{activeChatSession.name.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <DialogTitle className="text-sm font-bold flex items-center gap-2">
                        {activeChatSession.type === 'service' ? (
                          <LucideIcons.Briefcase className="h-4 w-4 text-primary" />
                        ) : (
                          <LucideIcons.ShoppingCart className="h-4 w-4 text-primary" />
                        )}
                        {activeChatSession.name}
                      </DialogTitle>
                      <DialogDescription className="text-[10px] text-muted-foreground truncate max-w-[300px]">
                        {activeChatSession.categoryOrStore}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                {/* Messages display container */}
                <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-muted/5 min-h-[300px]">
                  {chatMessages.map((msg, index) => {
                    const isClientSender = msg.sender === 'client' || msg.sender === 'customer';
                    const displayTime = msg.time || (msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
                    
                    return (
                      <div key={msg.id || index} className={`flex ${isClientSender ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-2xl max-w-[75%] text-xs shadow-sm space-y-1 ${
                          isClientSender 
                            ? 'bg-primary text-primary-foreground rounded-tr-none' 
                            : 'bg-card border text-foreground rounded-tl-none'
                        }`}>
                          <p className="leading-relaxed break-words">{msg.text}</p>
                          <span className="block text-[8px] opacity-75 text-right font-mono select-none">
                            {displayTime}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {chatMessages.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground space-y-2">
                      <LucideIcons.MessageSquare className="h-8 w-8 mx-auto opacity-30" />
                      <p className="text-xs">لا توجد رسائل بعد. ابدأ المحادثة الآن!</p>
                      <p className="text-[10px] opacity-75">No messages yet. Send a message to start chatting!</p>
                    </div>
                  )}
                </div>

                {/* Input form footer */}
                <div className="p-3 border-t bg-card shrink-0">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendChatMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      placeholder="اكتب رسالتك هنا... / Type message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="text-xs h-9 bg-background focus-visible:ring-1"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                      disabled={!chatInput.trim()}
                    >
                      <LucideIcons.Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Photo Lightbox Zoom Dialog */}
      <Dialog open={!!activeLightboxImg} onOpenChange={() => setActiveLightboxImg(null)}>
        <DialogContent className="max-w-3xl p-1 bg-black/95 border-none flex items-center justify-center overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>معاينة صورة الإثبات / Photo Evidence Preview</DialogTitle>
            <DialogDescription>عرض تفصيلي لصورة إثبات إنجاز الخدمة</DialogDescription>
          </DialogHeader>
          {activeLightboxImg && (
            <div className="relative w-full h-[80vh] flex flex-col items-center justify-center p-4 text-white">
              <span className="absolute top-4 left-4 bg-primary/20 text-primary border border-primary/30 rounded px-2.5 py-1 text-xs font-mono font-bold select-none z-10">
                {activeLightboxImg.split('/').pop()}
              </span>
              <div className="text-center space-y-4 max-w-md">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Camera className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg">Completion Evidence Zoom</h3>
                <p className="text-xs text-muted-foreground">
                  High-fidelity image capture simulated successfully.
                </p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-6 font-mono text-xs text-left select-all break-all text-primary/90">
                  {activeLightboxImg}
                </div>
                <Button variant="outline" className="text-white hover:text-white border-white/20 hover:bg-white/10" onClick={() => setActiveLightboxImg(null)}>
                  Close Preview
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════ EDIT PROFILE DIALOG ═══════════ */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-lg text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Edit3 className="h-5 w-5 text-primary" />
              تعديل بيانات الملف الشخصي / Edit Profile
            </DialogTitle>
            <DialogDescription className="text-xs">
              قم بتحديث معلوماتك الشخصية ورقم الهاتف ونبذة حسابك.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Avatar Section inside Edit Modal */}
            <div className="flex items-center gap-4 p-3 bg-muted/40 rounded-2xl border border-border/70">
              <Avatar className="h-16 w-16 border-2 border-primary/40 shadow-sm rounded-xl">
                <AvatarImage src={user.avatarUrl} alt={user.name} className="object-cover" />
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-xs font-bold">صورة الحساب الشخصية</p>
                <p className="text-[10px] text-muted-foreground">صيغ مدعومة: JPG, PNG, WEBP (الحد الأقصى 5MB)</p>
                <label className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer hover:bg-primary/90 transition-all shadow-xs">
                  <Camera className="h-3.5 w-3.5" />
                  <span>تغيير الصورة الآن</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">الاسم الكامل / Full Name</Label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="الاسم الكامل"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">البريد الإلكتروني / Email Address</Label>
              <Input
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                placeholder="name@example.com"
                type="email"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">رقم الهاتف / Phone Number</Label>
              <Input
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                placeholder="+213 661234567"
                dir="ltr"
                className="text-sm font-mono text-left"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">نبذة تعريفية / Bio & Description</Label>
              <Textarea
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                placeholder="اكتب نبذة موجزة عنك أو عن متجرك وخدماتك..."
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditProfileOpen(false)}>
              إلغاء / Cancel
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              onClick={async () => {
                if (!editName.trim()) {
                  toast({ title: "خطأ", description: "يرجى كتابة الاسم الكامل.", variant: "destructive" });
                  return;
                }
                setProfileData(prev => prev ? {
                  ...prev,
                  name: editName.trim(),
                  email: editEmail.trim(),
                } : null);

                // Save to Supabase
                try {
                  if (authUser?.id) {
                    await supabase.from('profiles').update({
                      name: editName.trim(),
                      email: editEmail.trim(),
                    }).eq('id', authUser.id);
                  }
                } catch (e) {
                  console.warn('Fallback local update', e);
                }

                // Add to activity logs
                setActivityLogs(prev => [
                  {
                    id: 'act_' + Date.now(),
                    type: 'security',
                    title: 'تحديث بيانات الملف الشخصي بنجاح',
                    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
                    status: 'success'
                  },
                  ...prev
                ]);

                setIsEditProfileOpen(false);
                toast({
                  title: "تم حفظ التعديلات بنجاح!",
                  description: "تم تحديث بيانات الملف الشخصي الخاصة بك بنجاح.",
                });
              }}
            >
              <LucideIcons.Check className="h-4 w-4 mr-1" />
              حفظ التغييرات / Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ DIGITAL ID CARD DIALOG ═══════════ */}
      <Dialog open={isDigitalIdOpen} onOpenChange={setIsDigitalIdOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-0 shadow-none text-white">
          <DialogHeader className="sr-only">
            <DialogTitle>بطاقة الهوية الرقمية / Digital ID Card</DialogTitle>
            <DialogDescription>بطاقة الهوية الرقمية المعتمدة للمستخدم</DialogDescription>
          </DialogHeader>
          <div className="relative rounded-3xl p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-white/20 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Holographic background highlights */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
            
            {/* Header / Brand */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg font-black text-white text-sm">
                  KH
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-wider uppercase">KHIDMATIK OFFICIAL</h3>
                  <p className="text-[10px] text-white/60 font-mono" dir="ltr">DIGITAL VERIFIED IDENTITY</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                <ShieldCheck className="h-3 w-3" /> VERIFIED
              </div>
            </div>

            {/* User Details Grid */}
            <div className="flex items-center gap-4 mb-5">
              <Avatar className="h-20 w-20 border-2 border-primary/60 shadow-xl rounded-2xl">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="text-2xl font-black bg-primary/20 text-white">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-white leading-tight">{user.name}</h4>
                <p className="text-xs text-white/70 font-mono" dir="ltr">{user.email}</p>
                <div className="flex items-center gap-2 pt-0.5">
                  <Badge className="bg-white/10 text-white border-white/20 text-[9px] font-bold">
                    {user.isStoreOwner ? 'Merchant' : user.isFreelancer ? 'Artisan' : 'Customer'}
                  </Badge>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px] font-bold">
                    Gold Tier (4.9 ★)
                  </Badge>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-2 bg-white/5 border border-white/10 rounded-2xl p-3 text-[11px] font-mono mb-4">
              <div>
                <span className="text-white/50 block text-[9px]">MEMBER ID</span>
                <span className="font-bold text-emerald-400" dir="ltr">KHD-{user.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div>
                <span className="text-white/50 block text-[9px]">MEMBER SINCE</span>
                <span className="font-bold text-white"><FormattedJoinedDate dateString={user.memberSince} /></span>
              </div>
              <div>
                <span className="text-white/50 block text-[9px]">SECURITY STATUS</span>
                <span className="font-bold text-blue-400">2FA Protected</span>
              </div>
              <div>
                <span className="text-white/50 block text-[9px]">TRUST SCORE</span>
                <span className="font-bold text-emerald-400">92% High Fidelity</span>
              </div>
            </div>

            {/* Barcode Simulated Strip */}
            <div className="text-center pt-2 border-t border-white/10">
              <div className="h-7 w-full bg-[repeating-linear-gradient(90deg,#fff,#fff_2px,transparent_2px,transparent_5px)] opacity-60 rounded" />
              <p className="text-[9px] font-mono text-white/50 mt-1" dir="ltr">AUTH-TOKEN: KH-SEC-9988-{user.id.substring(0, 6).toUpperCase()}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-xl"
                onClick={() => {
                  window.print();
                }}
              >
                <LucideIcons.Printer className="h-3.5 w-3.5 mr-1" /> طباعة البطاقة / Print
              </Button>
              <Button
                size="sm"
                className="w-full text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                onClick={() => {
                  navigator.clipboard.writeText(`https://khidmatik.dz/profile/@${user.id}`);
                  toast({ title: "تم النسخ!", description: "تم نسخ رابط بطاقة الهوية الرقمية." });
                }}
              >
                <LucideIcons.Share2 className="h-3.5 w-3.5 mr-1" /> مشاركة / Share ID
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════ NOTIFICATION CENTER DIALOG ═══════════ */}
      <Dialog open={isNotifCenterOpen} onOpenChange={setIsNotifCenterOpen}>
        <DialogContent className="sm:max-w-md text-foreground">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <LucideIcons.Bell className="h-5 w-5 text-primary" />
                مركز الإشعارات والتنبيهات / Alerts Center
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] text-muted-foreground"
                onClick={() => {
                  setProfileNotifications(prev => prev.map(n => ({ ...n, read: true })));
                  toast({ title: "تم!", description: "تم تعليم جميع الإشعارات كمقروءة." });
                }}
              >
                تعليم الكل كمقروء
              </Button>
            </div>
            <DialogDescription className="text-xs">
              آخر التحديثات والتنبيهات المباشرة الخاصة بحسابك
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 py-2">
            {profileNotifications.map(notif => {
              const IconComp = (LucideIcons as any)[notif.icon] || LucideIcons.Bell;
              return (
                <div
                  key={notif.id}
                  className={`p-3 rounded-2xl border transition-all flex items-start gap-3 text-xs ${
                    notif.read
                      ? 'bg-card border-border/70 text-muted-foreground'
                      : 'bg-primary/5 border-primary/30 text-foreground font-semibold shadow-xs'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${
                    notif.type === 'wallet' ? 'bg-emerald-500/10 text-emerald-600' :
                    notif.type === 'order' ? 'bg-primary/10 text-primary' :
                    notif.type === 'security' ? 'bg-red-500/10 text-red-600' :
                    'bg-purple-500/10 text-purple-600'
                  }`}>
                    <IconComp className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs truncate">{notif.title}</p>
                      <span className="text-[9px] text-muted-foreground font-mono">{notif.time}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{notif.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => setIsNotifCenterOpen(false)}
            >
              إغلاق / Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TopUp Clarification & Document Upload Dialog */}
      <Dialog open={isClarifyDialogOpen} onOpenChange={setIsClarifyDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg rounded-3xl p-6 text-foreground shadow-2xl border-border" dir="rtl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground font-headline">
              <LucideIcons.HelpCircle className="h-5 w-5 text-blue-500 shrink-0" />
              <span>تقديم توضيح أو إرفاق مستند إضافي</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              طلب شحن رقم: <strong className="font-mono text-foreground font-bold" dir="ltr">{selectedClarifyTx?.transactionCode}</strong> • المبلغ: <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-black" dir="ltr">+{selectedClarifyTx?.amount.toLocaleString()} DA</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            {/* Admin Note Notice Box */}
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-1.5">
              <span className="font-bold text-blue-700 dark:text-blue-300 block text-xs flex items-center gap-1.5">
                <LucideIcons.Info className="h-4 w-4" />
                الملاحظة والتوضيح المطلوب من إدارة المنصة:
              </span>
              <p className="text-foreground bg-background/90 p-3 rounded-xl border border-blue-500/20 text-xs leading-relaxed font-medium">
                "{selectedClarifyTx?.requestedInfoNote || 'يرجى تقديم صورة واضحة لوصل التحويل أو توضيح رقم العملية البريدية لإتمام التدقيق.'}"
              </p>
            </div>

            {/* User clarification text */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">توضيحك أو ردك على الإدارة:</Label>
              <Textarea
                placeholder="اكتب التوضيح المطلوب هنا (مثلاً: تم تصوير الوصل بوضوح مع إبراز الختم، أو رقم العملية البريدية الصحيح هو...)"
                value={clarifyText}
                onChange={e => setClarifyText(e.target.value)}
                className="text-xs rounded-xl min-h-[85px] bg-background"
              />
            </div>

            {/* Document / Receipt Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">إرفاق صورة الوصل أو المستند المطلوب (مستحسن):</Label>
              <div className="border-2 border-dashed border-border/80 rounded-2xl p-4 text-center hover:border-primary/60 transition-colors bg-muted/20">
                {clarifyAttachmentUrl ? (
                  <div className="space-y-3">
                    {clarifyAttachmentUrl.startsWith('data:image') || clarifyAttachmentUrl.includes('.jpg') || clarifyAttachmentUrl.includes('.png') ? (
                      <div className="relative inline-block max-h-52 rounded-xl overflow-hidden border border-border shadow-xs">
                        <img
                          src={clarifyAttachmentUrl}
                          alt="المستند المرفق"
                          className="max-h-48 mx-auto object-contain rounded-xl bg-black/5"
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-background rounded-xl border border-border flex items-center justify-center gap-2">
                        <LucideIcons.FileText className="h-5 w-5 text-primary" />
                        <span className="font-mono text-xs font-bold text-foreground">{clarifyFileName || 'مستند مرفق'}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs text-muted-foreground truncate max-w-xs font-mono">{clarifyFileName}</span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-7 text-[11px] rounded-xl px-2.5 font-bold"
                        onClick={() => {
                          setClarifyAttachmentUrl('');
                          setClarifyFileName('');
                        }}
                      >
                        <LucideIcons.Trash2 className="h-3 w-3 ml-1" />
                        إزالة الملف
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="clarify-file-input"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleClarifyFileChange}
                    />
                    <label
                      htmlFor="clarify-file-input"
                      className="cursor-pointer flex flex-col items-center justify-center gap-2 py-2.5 select-none"
                    >
                      <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                        <LucideIcons.Upload className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-xs text-foreground">اضغط لاختيار صورة الوصل أو المستند من جهازك</span>
                      <span className="text-[10px] text-muted-foreground">صورة وصل بريدي، BaridiMob، كشف حساب (JPG, PNG, PDF حتى 10MB)</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row gap-2 justify-end pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsClarifyDialogOpen(false)}
              className="text-xs rounded-xl"
            >
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitClarification}
              disabled={isClarifySubmitting || (!clarifyText.trim() && !clarifyAttachmentUrl)}
              className="text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
            >
              {isClarifySubmitting ? (
                <>
                  <LucideIcons.Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>جارٍ الإرسال...</span>
                </>
              ) : (
                <>
                  <LucideIcons.Send className="h-3.5 w-3.5" />
                  <span>إرسال التوضيح والمستند للإدارة</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
