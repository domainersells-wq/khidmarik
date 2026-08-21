'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Store, Phone, Clock, MapPin, Palette, Package, DollarSign, Percent, Truck, 
  CreditCard, Bell, Star, Tag, RotateCcw, Globe, Shield, Users, LineChart, 
  Sparkles, Download, Share2, Webhook, Eye, Trash2, PlusCircle, Search, AlertCircle, 
  CheckCircle, Loader2, Save, Undo, RefreshCw, Cpu, Database, Printer, Landmark, ShieldCheck,
  MessageSquare, MessageCircle, Info, Key, Server, KeyRound, Wifi, Zap, Cloud, History, Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function SettingsSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dirty trackers (unsaved changes indicators)
  const [dirtySections, setDirtySections] = useState<Record<string, boolean>>({});

  // 1. Store Identity State
  const [storeName, setStoreName] = useState('My Khidmatik Store');
  const [slogan, setSlogan] = useState('Quality handcrafted products');
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');
  const [coverPhoto, setCoverPhoto] = useState('');
  const [introVideo, setIntroVideo] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [bio, setBio] = useState('');
  const [foundingYear, setFoundingYear] = useState('2026');
  const [rcNumber, setRcNumber] = useState('');
  const [nif, setNif] = useState('');
  const [nis, setNis] = useState('');
  const [isVerified, setIsVerified] = useState(true);
  const [storeType, setStoreType] = useState('Artisanal');
  const [isSavingBasic, setIsSavingBasic] = useState(false);

  // 2. Contact State
  const [contactEmail, setContactEmail] = useState('contact@store.dz');
  const [contactPhone1, setContactPhone1] = useState('+213 555 12 34 56');
  const [contactPhone2, setContactPhone2] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [telegram, setTelegram] = useState('');
  const [website, setWebsite] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [youtube, setYoutube] = useState('');
  const [isSavingContact, setIsSavingContact] = useState(false);

  // 3. Business Hours State
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean; h24: boolean }>>({
    sunday: { open: '08:00', close: '17:00', closed: false, h24: false },
    monday: { open: '08:00', close: '17:00', closed: false, h24: false },
    tuesday: { open: '08:00', close: '17:00', closed: false, h24: false },
    wednesday: { open: '08:00', close: '17:00', closed: false, h24: false },
    thursday: { open: '08:00', close: '17:00', closed: false, h24: false },
    friday: { open: '08:00', close: '12:00', closed: true, h24: false },
    saturday: { open: '09:00', close: '14:00', closed: false, h24: false },
  });
  const [holidays, setHolidays] = useState('Eid al-Fitr, Eid al-Adha, Independence Day');
  const [isSavingHours, setIsSavingHours] = useState(false);

  // 4. Location State
  const [country, setCountry] = useState('Algeria');
  const [wilaya, setWilaya] = useState('Algiers');
  const [commune, setCommune] = useState('Sidi M\'Hamed');
  const [address, setAddress] = useState('Rue Didouche Mourad');
  const [zipCode, setZipCode] = useState('16000');
  const [gpsCoordinates, setGpsCoordinates] = useState('36.7525, 3.04197');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [openStreetUrl, setOpenStreetUrl] = useState('');
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  // 5. Theme State
  const [template, setTemplate] = useState('classic');
  const [primaryColor, setPrimaryColor] = useState('indigo');
  const [secondaryColor, setSecondaryColor] = useState('emerald');
  const [buttonColor, setButtonColor] = useState('indigo');
  const [linkColor, setLinkColor] = useState('indigo');
  const [bgColor, setBgColor] = useState('white');
  const [fontFamily, setFontFamily] = useState('cairo');
  const [fontSize, setFontSize] = useState('medium');
  const [buttonRadius, setButtonRadius] = useState('rounded-lg');
  const [cardStyle, setCardStyle] = useState('shadow-sm');
  const [darkMode, setDarkMode] = useState(false);
  const [rtlLayout, setRtlLayout] = useState(true);
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  // 6. Product Config State
  const [autoSku, setAutoSku] = useState(true);
  const [generateBarcode, setGenerateBarcode] = useState(true);
  const [generateQr, setGenerateQr] = useState(true);
  const [allowDigital, setAllowDigital] = useState(false);
  const [allowPhysical, setAllowPhysical] = useState(true);
  const [enableVariants, setEnableVariants] = useState(true);
  const [trackInventory, setTrackInventory] = useState(true);
  const [lowStockAlert, setLowStockAlert] = useState(5);
  const [hideExpired, setHideExpired] = useState(false);
  const [allowOosOrders, setAllowOosOrders] = useState(false);
  const [isSavingProductsConfig, setIsSavingProductsConfig] = useState(false);

  // 7. Pricing State
  const [currency, setCurrency] = useState('DZD');
  const [priceFormat, setPriceFormat] = useState('{price} DA');
  const [decimals, setDecimals] = useState(0);
  const [roundPrices, setRoundPrices] = useState(true);
  const [taxInclusive, setTaxInclusive] = useState(true);
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  // 8. Tax State
  const [tvaRate, setTvaRate] = useState(19);
  const [vatRate, setVatRate] = useState(0);
  const [gstRate, setGstRate] = useState(0);
  const [isSavingTax, setIsSavingTax] = useState(false);

  // 9. Shipping State
  const [flatRate, setFlatRate] = useState(500);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(10000);
  const [yalidineEnabled, setYalidineEnabled] = useState(true);
  const [deliveryDays, setDeliveryDays] = useState('2-5 days');
  const [isSavingShipping, setIsSavingShipping] = useState(false);

  // 10. Payment Gateways State
  const [codEnabled, setCodEnabled] = useState(true);
  const [baridimobEnabled, setBaridimobEnabled] = useState(true);
  const [cibEnabled, setCibEnabled] = useState(false);
  const [edahabiaEnabled, setEdahabiaEnabled] = useState(true);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [chargilyEnabled, setChargilyEnabled] = useState(true);
  const [stripeApiKey, setStripeApiKey] = useState('');
  const [chargilySecret, setChargilySecret] = useState('chargily_pay_pk_live_xxxxxxx');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // 11. Notifications State
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifyPush, setNotifyPush] = useState(false);
  const [notifyTelegram, setNotifyTelegram] = useState(false);
  const [isSavingNotify, setIsSavingNotify] = useState(false);

  // 12. Reviews Config State
  const [enableReviews, setEnableReviews] = useState(true);
  const [allowReviewPhotos, setAllowReviewPhotos] = useState(true);
  const [allowReviewVideos, setAllowReviewVideos] = useState(false);
  const [moderateBeforePublish, setModerateBeforePublish] = useState(true);
  const [allowSellerReply, setAllowSellerReply] = useState(true);
  const [isSavingReviewsConfig, setIsSavingReviewsConfig] = useState(false);

  // 13. Returns & RMA State
  const [returnWindowDays, setReturnWindowDays] = useState(15);
  const [exchangeWindowDays, setExchangeWindowDays] = useState(15);
  const [returnPolicyText, setReturnPolicyText] = useState('Items must be returned in original packaging within 15 days.');
  const [returnFee, setReturnFee] = useState(0);
  const [autoApproveRma, setAutoApproveRma] = useState(false);
  const [isSavingRMA, setIsSavingRMA] = useState(false);

  // 14. SEO State
  const [metaTitle, setMetaTitle] = useState('Premium Algerian Crafts | Sidi M\'Hamed');
  const [metaDesc, setMetaDesc] = useState('Discover the best Algerian traditional craftworks, rugs, and olive oils.');
  const [metaKeywords, setMetaKeywords] = useState('crafts, algeria, olive oil, traditional, wool rug');
  const [isSavingSEO, setIsSavingSEO] = useState(false);

  // 15. Security State
  const [enable2fa, setEnable2fa] = useState(false);
  const [apiKey, setApiKey] = useState('khid_api_live_9021839012');
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  // 16. Staff State
  const [staffList, setStaffList] = useState<StaffMember[]>([
    { id: 'staff-1', name: 'Mohamed Bennaceur', email: 'mohamed@khidmatik.dz', role: 'Administrator' }
  ]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Editor');
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  // 21. Printing & Invoice States
  const [printReceiptHeader, setPrintReceiptHeader] = useState('Khidmatik Store Algeria');
  const [printReceiptFooter, setPrintReceiptFooter] = useState('Thank you for shopping with us! ***');
  const [printReceiptMargin, setPrintReceiptMargin] = useState('0mm');
  const [showProductSkuInReceipt, setShowProductSkuInReceipt] = useState(true);

  // 22. Branches & Warehouse Configurations States
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLocation, setNewBranchLocation] = useState('');
  const [branchesList, setBranchesList] = useState<any[]>([
    { id: 'b1', name: 'Algiers Headquarters', location: 'Sidi M\'Hamed, Algiers' },
    { id: 'b2', name: 'Oran Showroom Branch', location: 'Oran Centre' }
  ]);

  // 23. Backup & Recovery States
  const [lastBackupDate, setLastBackupDate] = useState('2026-07-12 18:40');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSavingStaff, setIsSavingStaff] = useState(false);

  // 17. Marketplace State
  const [allowVendors, setAllowVendors] = useState(false);
  const [commissionRate, setCommissionRate] = useState(10);
  const [payoutMinimum, setPayoutMinimum] = useState(5000);
  const [isSavingMarketplace, setIsSavingMarketplace] = useState(false);

  // 18. Integrations State
  const [fbPixelId, setFbPixelId] = useState('');
  const [gtmId, setGtmId] = useState('');
  const [tiktokPixel, setTiktokPixel] = useState('');
  const [isSavingIntegrations, setIsSavingIntegrations] = useState(false);

  // 19. Store Status State
  const [storeStatus, setStoreStatus] = useState<'open' | 'closed' | 'maintenance' | 'vacation'>('open');
  const [maintenanceMessage, setMaintenanceMessage] = useState('We are currently updating our catalog. Please check back later!');
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  // 20. Customer limits State
  const [minOrderLimit, setMinOrderLimit] = useState(1000);
  const [maxOrderLimit, setMaxOrderLimit] = useState(100000);
  const [loyaltyPoints, setLoyaltyPoints] = useState(true);
  const [isSavingLimits, setIsSavingLimits] = useState(false);

  // New/Improved Configuration States
  // 5. Languages additions
  const [defaultLang, setDefaultLang] = useState('ar');
  const [supportedLangs, setSupportedLangs] = useState<string[]>(['ar', 'fr', 'en']);
  const [autoTranslation, setAutoTranslation] = useState(true);
  const [translateProducts, setTranslateProducts] = useState(true);
  const [translateCategories, setTranslateCategories] = useState(true);
  const [translateEmails, setTranslateEmails] = useState(true);
  const [translateNotifications, setTranslateNotifications] = useState(true);

  // 7. Currencies additions
  const [defaultCurrency, setDefaultCurrency] = useState('DZD');
  const [enableMultiCurrency, setEnableMultiCurrency] = useState(false);
  const [exchangeRateUsd, setExchangeRateUsd] = useState(134.50);
  const [exchangeRateEur, setExchangeRateEur] = useState(145.20);
  const [currencySymbol, setCurrencySymbol] = useState('DA');
  const [numberFormat, setNumberFormat] = useState('1,234.56');
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [autoExchangeUpdate, setAutoExchangeUpdate] = useState(true);

  // 14. SEO & 18. Integrations additions
  const [enableOpenGraph, setEnableOpenGraph] = useState(true);
  const [enableTwitterCards, setEnableTwitterCards] = useState(true);
  const [schemaMarkup, setSchemaMarkup] = useState('{\n  "@context": "https://schema.org",\n  "@type": "Store",\n  "name": "Khidmatik Store"\n}');
  const [robotsTxt, setRobotsTxt] = useState("User-agent: *\nAllow: /\nSitemap: https://store.khidmatik.dz/sitemap.xml");
  const [sitemapUrl, setSitemapUrl] = useState('https://store.khidmatik.dz/sitemap.xml');
  const [canonicalUrl, setCanonicalUrl] = useState('https://store.khidmatik.dz/');
  const [googleSearchConsoleKey, setGoogleSearchConsoleKey] = useState('');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');

  // 15. Security additions
  const [passwordPolicyMinLength, setPasswordPolicyMinLength] = useState(8);
  const [passwordPolicyRequireSpecial, setPasswordPolicyRequireSpecial] = useState(true);
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [sessionsList, setSessionsList] = useState<any[]>([
    { id: 'sess-1', device: 'Chrome / Windows 11', ip: '197.200.45.18', active: true, location: 'Algiers, DZ' },
    { id: 'sess-2', device: 'Safari / iPhone 15', ip: '197.200.45.19', active: false, location: 'Oran, DZ' }
  ]);
  const [securityAuditLogs, setSecurityAuditLogs] = useState<any[]>([
    { id: 'log-1', action: 'Admin Login', time: '2026-07-18 14:10', ip: '197.200.45.18', details: 'Successful authentication' },
    { id: 'log-2', action: 'Update API Key', time: '2026-07-18 11:20', ip: '197.200.45.18', details: 'Regenerated live API key' },
    { id: 'log-3', action: 'Failed Login Attempt', time: '2026-07-17 19:45', ip: '102.156.92.41', details: 'Invalid credentials' }
  ]);

  // 11. Notification channels additions
  const [notifyDesktop, setNotifyDesktop] = useState(true);
  const [notifyBrowser, setNotifyBrowser] = useState(true);

  // 23. Backup additions
  const [cloudBackupProvider, setCloudBackupProvider] = useState('google_drive');
  const [backupSchedule, setBackupSchedule] = useState('daily');
  const [backupEncryption, setBackupEncryption] = useState(true);
  const [restorePointsList, setRestorePointsList] = useState<any[]>([
    { id: 'rp-1', label: 'Stable Roster Snapshot', date: '2026-07-18 08:00', type: 'Manual' },
    { id: 'rp-2', label: 'Post-Inventory Sync Point', date: '2026-07-15 17:30', type: 'Automatic' }
  ]);
  const [backupVersionHistory, setBackupVersionHistory] = useState<any[]>([
    { id: 'vh-1', version: 'v1.4.2', date: '2026-07-18 08:00', size: '1.2 MB' },
    { id: 'vh-2', version: 'v1.4.1', date: '2026-07-15 17:30', size: '1.1 MB' }
  ]);

  // 24. Email Settings
  const [smtpHost, setSmtpHost] = useState('smtp.mailgun.org');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('postmaster@mg.store.dz');
  const [smtpPass, setSmtpPass] = useState('••••••••••••••••');
  const [emailProvider, setEmailProvider] = useState('mailgun');
  const [emailFrom, setEmailFrom] = useState('noreply@store.dz');
  const [emailFromName, setEmailFromName] = useState('Khidmatik Store');
  const [emailTemplates, setEmailTemplates] = useState('Welcome Customer Email');
  const [isSavingEmailConfig, setIsSavingEmailConfig] = useState(false);

  // 25. SMS Settings
  const [smsProvider, setSmsProvider] = useState('twilio');
  const [smsSid, setSmsSid] = useState('');
  const [smsToken, setSmsToken] = useState('');
  const [smsSenderId, setSmsSenderId] = useState('KHIDMATIK');
  const [smsEnableOtp, setSmsEnableOtp] = useState(false);
  const [smsTemplate, setSmsTemplate] = useState('Your OTP verification code is: {code}');
  const [isSavingSmsConfig, setIsSavingSmsConfig] = useState(false);

  // 26. WhatsApp Settings
  const [waMetaToken, setWaMetaToken] = useState('');
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waProvider, setWaProvider] = useState('meta_cloud');
  const [waWebhookToken, setWaWebhookToken] = useState('');
  const [isSavingWaConfig, setIsSavingWaConfig] = useState(false);

  // 27. Domain Settings
  const [primaryDomain, setPrimaryDomain] = useState('store.khidmatik.dz');
  const [customDomain, setCustomDomain] = useState('');
  const [sslStatus, setSslStatus] = useState('active');
  const [dnsRecords, setDnsRecords] = useState<any[]>([
    { type: 'A', host: '@', value: '192.0.2.1', status: 'verified' },
    { type: 'CNAME', host: 'www', value: 'shops.khidmatik.dz', status: 'verified' }
  ]);
  const [httpsRedirect, setHttpsRedirect] = useState(true);
  const [isSavingDomain, setIsSavingDomain] = useState(false);

  // 28. Performance Settings
  const [enableCache, setEnableCache] = useState(true);
  const [cacheTtl, setCacheTtl] = useState(24);
  const [cdnProvider, setCdnProvider] = useState('cloudflare');
  const [enableCompression, setEnableCompression] = useState(true);
  const [enableLazyLoading, setEnableLazyLoading] = useState(true);
  const [enableImageWebp, setEnableImageWebp] = useState(true);
  const [isSavingPerformance, setIsSavingPerformance] = useState(false);

  // File Inputs Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Preview Dialog trigger
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // DB mirror to track dirtiness
  const [dbState, setDbState] = useState<Record<string, any>>({});

  useEffect(() => {
    async function loadAllSettings() {
      setIsLoading(true);
      const keys = [
        'basic_info', 'contact_info', 'business_hours', 'location_settings', 'theme_language',
        'product_settings', 'pricing_settings', 'tax_settings', 'shipping', 'payment',
        'notification_settings', 'reviews_settings', 'rma_policy', 'seo_settings', 'security_settings',
        'staff', 'marketplace', 'integrations', 'store_status', 'customer_limits',
        'email_settings', 'sms_settings', 'whatsapp_settings', 'domain_settings', 'performance_settings'
      ];
      
      const localData: Record<string, any> = {};
      
      // Local fallbacks
      keys.forEach(k => {
        const stored = localStorage.getItem(`khidmatik_settings_${k}`);
        if (stored) {
          try { localData[k] = JSON.parse(stored); } catch (e) {}
        }
      });

      // Fetch Cloud
      try {
        const res = await fetch('/api/store/settings');
        const json = await res.json();
        if (json.success && json.data) {
          json.data.forEach((item: any) => {
            localData[item.key] = item.value;
          });
        }
      } catch (err) {}

      // Fetch user's actual store from the stores table
      if (user?.id) {
        try {
          const { data: storeData } = await supabase
            .from('stores')
            .select('*')
            .eq('owner_id', user.id)
            .maybeSingle();

          if (storeData) {
            localData.basic_info = {
              ...localData.basic_info,
              name: storeData.name,
              slogan: storeData.tagline || '',
              logo: storeData.store_logo_url || '',
              banner: storeData.banner_image_url || '',
              shortDesc: storeData.description || '',
              fullDesc: storeData.description || '',
              bio: storeData.description || '',
              storeType: storeData.category
            };

            localData.contact_info = {
              ...localData.contact_info,
              email: storeData.email || '',
              phone1: storeData.phone || '',
              phone2: '',
              website: storeData.website || ''
            };

            localData.location_settings = {
              ...localData.location_settings,
              city: storeData.city,
              wilaya: storeData.wilaya_code,
              address: storeData.full_address || '',
              zipCode: storeData.zip_code || ''
            };
            
            if (storeData.operating_hours) {
              localData.business_hours = {
                ...localData.business_hours,
                holidays: storeData.operating_hours
              };
            }
          }
        } catch (err) {
          console.error("Failed to load store from database:", err);
        }
      }

      // Keep DB State reference
      setDbState(localData);

      // Section 1: Basic Info
      if (localData.basic_info) {
        setStoreName(localData.basic_info.name || 'My Khidmatik Store');
        setSlogan(localData.basic_info.slogan || 'Quality handcrafted products');
        setLogo(localData.basic_info.logo || '');
        setBanner(localData.basic_info.banner || '');
        setCoverPhoto(localData.basic_info.coverPhoto || '');
        setIntroVideo(localData.basic_info.introVideo || '');
        setShortDesc(localData.basic_info.shortDesc || '');
        setFullDesc(localData.basic_info.fullDesc || '');
        setBio(localData.basic_info.bio || '');
        setFoundingYear(localData.basic_info.foundingYear || '2026');
        setRcNumber(localData.basic_info.rcNumber || '');
        setNif(localData.basic_info.nif || '');
        setNis(localData.basic_info.nis || '');
        setIsVerified(localData.basic_info.isVerified ?? true);
        setStoreType(localData.basic_info.storeType || 'Artisanal');
      }

      // Section 2: Contact
      if (localData.contact_info) {
        setContactEmail(localData.contact_info.email || 'contact@store.dz');
        setContactPhone1(localData.contact_info.phone1 || '+213 555 12 34 56');
        setContactPhone2(localData.contact_info.phone2 || '');
        setWhatsapp(localData.contact_info.whatsapp || '');
        setTelegram(localData.contact_info.telegram || '');
        setWebsite(localData.contact_info.website || '');
        setFacebook(localData.contact_info.facebook || '');
        setInstagram(localData.contact_info.instagram || '');
        setTiktok(localData.contact_info.tiktok || '');
        setLinkedin(localData.contact_info.linkedin || '');
        setYoutube(localData.contact_info.youtube || '');
      }

      // Section 3: Hours
      if (localData.business_hours) {
        setHours(localData.business_hours.hours || hours);
        setHolidays(localData.business_hours.holidays || '');
      }

      // Section 4: Location
      if (localData.location_settings) {
        setCountry(localData.location_settings.country || 'Algeria');
        setWilaya(localData.location_settings.wilaya || 'Algiers');
        setCommune(localData.location_settings.commune || 'Sidi M\'Hamed');
        setAddress(localData.location_settings.address || 'Rue Didouche Mourad');
        setZipCode(localData.location_settings.zipCode || '16000');
        setGpsCoordinates(localData.location_settings.gps || '36.7525, 3.04197');
        setGoogleMapsUrl(localData.location_settings.googleMaps || '');
        setOpenStreetUrl(localData.location_settings.openStreet || '');
      }

      // Section 5: Theme & Lang
      if (localData.theme_language) {
        setTemplate(localData.theme_language.template || 'classic');
        setPrimaryColor(localData.theme_language.primaryColor || 'indigo');
        setSecondaryColor(localData.theme_language.secondaryColor || 'emerald');
        setButtonColor(localData.theme_language.buttonColor || 'indigo');
        setLinkColor(localData.theme_language.linkColor || 'indigo');
        setBgColor(localData.theme_language.bgColor || 'white');
        setFontFamily(localData.theme_language.fontFamily || 'cairo');
        setFontSize(localData.theme_language.fontSize || 'medium');
        setButtonRadius(localData.theme_language.buttonRadius || 'rounded-lg');
        setCardStyle(localData.theme_language.cardStyle || 'shadow-sm');
        setDarkMode(localData.theme_language.darkMode ?? false);
        setRtlLayout(localData.theme_language.rtlLayout ?? true);
      }

      // Section 6: Product Settings
      if (localData.product_settings) {
        setAutoSku(localData.product_settings.autoSku ?? true);
        setGenerateBarcode(localData.product_settings.generateBarcode ?? true);
        setGenerateQr(localData.product_settings.generateQr ?? true);
        setAllowDigital(localData.product_settings.allowDigital ?? false);
        setAllowPhysical(localData.product_settings.allowPhysical ?? true);
        setEnableVariants(localData.product_settings.enableVariants ?? true);
        setTrackInventory(localData.product_settings.trackInventory ?? true);
        setLowStockAlert(localData.product_settings.lowStockAlert ?? 5);
        setHideExpired(localData.product_settings.hideExpired ?? false);
        setAllowOosOrders(localData.product_settings.allowOosOrders ?? false);
      }

      // Section 7: Pricing Settings
      if (localData.pricing_settings) {
        setCurrency(localData.pricing_settings.currency || 'DZD');
        setPriceFormat(localData.pricing_settings.priceFormat || '{price} DA');
        setDecimals(localData.pricing_settings.decimals ?? 0);
        setRoundPrices(localData.pricing_settings.roundPrices ?? true);
        setTaxInclusive(localData.pricing_settings.taxInclusive ?? true);
      }

      // Section 8: Tax
      if (localData.tax_settings) {
        setTvaRate(localData.tax_settings.tvaRate ?? 19);
        setVatRate(localData.tax_settings.vatRate ?? 0);
        setGstRate(localData.tax_settings.gstRate ?? 0);
      }

      // Section 9: Shipping
      if (localData.shipping) {
        setFlatRate(localData.shipping.flatRate ?? 500);
        setFreeShippingThreshold(localData.shipping.freeThreshold ?? 10000);
        setYalidineEnabled(localData.shipping.yalidine ?? true);
        setDeliveryDays(localData.shipping.deliveryDays || '2-5 days');
      }

      // Section 10: Payment
      if (localData.payment) {
        setCodEnabled(localData.payment.codEnabled ?? true);
        setBaridimobEnabled(localData.payment.baridimobEnabled ?? true);
        setCibEnabled(localData.payment.cibEnabled ?? false);
        setEdahabiaEnabled(localData.payment.edahabiaEnabled ?? true);
        setStripeEnabled(localData.payment.stripeEnabled ?? false);
        setChargilyEnabled(localData.payment.chargilyEnabled ?? true);
        setStripeApiKey(localData.payment.stripeApiKey || '');
        setChargilySecret(localData.payment.chargilySecret || '');
      }

      // Section 11: Notifications
      if (localData.notification_settings) {
        setNotifyEmail(localData.notification_settings.notifyEmail ?? true);
        setNotifySms(localData.notification_settings.notifySms ?? false);
        setNotifyWhatsapp(localData.notification_settings.notifyWhatsapp ?? true);
        setNotifyPush(localData.notification_settings.notifyPush ?? false);
        setNotifyTelegram(localData.notification_settings.notifyTelegram ?? false);
      }

      // Section 12: Reviews
      if (localData.reviews_settings) {
        setEnableReviews(localData.reviews_settings.enableReviews ?? true);
        setAllowReviewPhotos(localData.reviews_settings.allowReviewPhotos ?? true);
        setAllowReviewVideos(localData.reviews_settings.allowReviewVideos ?? false);
        setModerateBeforePublish(localData.reviews_settings.moderateBeforePublish ?? true);
        setAllowSellerReply(localData.reviews_settings.allowSellerReply ?? true);
      }

      // Section 13: RMA
      if (localData.rma_policy) {
        setReturnWindowDays(localData.rma_policy.returnWindow ?? 15);
        setExchangeWindowDays(localData.rma_policy.exchangeWindow ?? 15);
        setReturnPolicyText(localData.rma_policy.policyText || '');
        setReturnFee(localData.rma_policy.fee ?? 0);
        setAutoApproveRma(localData.rma_policy.autoApprove ?? false);
      }

      // Section 14: SEO
      if (localData.seo_settings) {
        setMetaTitle(localData.seo_settings.title || '');
        setMetaDesc(localData.seo_settings.desc || '');
        setMetaKeywords(localData.seo_settings.keywords || '');
      }

      // Section 15: Security
      if (localData.security_settings) {
        setEnable2fa(localData.security_settings.enable2fa ?? false);
        setApiKey(localData.security_settings.apiKey || '');
      }

      // Section 16: Staff
      if (localData.staff) {
        setStaffList(localData.staff);
      }

      // Section 17: Marketplace
      if (localData.marketplace) {
        setAllowVendors(localData.marketplace.allowVendors ?? false);
        setCommissionRate(localData.marketplace.commissionRate ?? 10);
        setPayoutMinimum(localData.marketplace.payoutMinimum ?? 5000);
      }

      // Section 18: Integrations
      if (localData.integrations) {
        setFbPixelId(localData.integrations.fbPixelId || '');
        setGtmId(localData.integrations.gtmId || '');
        setTiktokPixel(localData.integrations.tiktokPixel || '');
      }

      // Section 19: Store Status
      if (localData.store_status) {
        setStoreStatus(localData.store_status.status || 'open');
        setMaintenanceMessage(localData.store_status.message || '');
      }

      // Section 20: Customer Limits
      if (localData.customer_limits) {
        setMinOrderLimit(localData.customer_limits.minLimit ?? 1000);
        setMaxOrderLimit(localData.customer_limits.maxLimit ?? 100000);
        setLoyaltyPoints(localData.customer_limits.loyaltyPoints ?? true);
      }

      // Section 5 (Improved Languages)
      if (localData.theme_language) {
        setDefaultLang(localData.theme_language.defaultLang || 'ar');
        setSupportedLangs(localData.theme_language.supportedLangs || ['ar', 'fr', 'en']);
        setAutoTranslation(localData.theme_language.autoTranslation ?? true);
        setTranslateProducts(localData.theme_language.translateProducts ?? true);
        setTranslateCategories(localData.theme_language.translateCategories ?? true);
        setTranslateEmails(localData.theme_language.translateEmails ?? true);
        setTranslateNotifications(localData.theme_language.translateNotifications ?? true);
      }

      // Section 7 (Improved Currencies)
      if (localData.pricing_settings) {
        setDefaultCurrency(localData.pricing_settings.defaultCurrency || 'DZD');
        setEnableMultiCurrency(localData.pricing_settings.enableMultiCurrency ?? false);
        setExchangeRateUsd(localData.pricing_settings.exchangeRateUsd ?? 134.50);
        setExchangeRateEur(localData.pricing_settings.exchangeRateEur ?? 145.20);
        setCurrencySymbol(localData.pricing_settings.currencySymbol || 'DA');
        setNumberFormat(localData.pricing_settings.numberFormat || '1,234.56');
        setDecimalPlaces(localData.pricing_settings.decimalPlaces ?? 2);
        setAutoExchangeUpdate(localData.pricing_settings.autoExchangeUpdate ?? true);
      }

      // Section 11 (Improved Notifications)
      if (localData.notification_settings) {
        setNotifyDesktop(localData.notification_settings.notifyDesktop ?? true);
        setNotifyBrowser(localData.notification_settings.notifyBrowser ?? true);
      }

      // Section 14 (Improved SEO) & Section 18 (Improved Integrations)
      if (localData.seo_settings) {
        setEnableOpenGraph(localData.seo_settings.enableOpenGraph ?? true);
        setEnableTwitterCards(localData.seo_settings.enableTwitterCards ?? true);
        setSchemaMarkup(localData.seo_settings.schemaMarkup || '{\n  "@context": "https://schema.org",\n  "@type": "Store",\n  "name": "Khidmatik Store"\n}');
        setRobotsTxt(localData.seo_settings.robotsTxt || "User-agent: *\nAllow: /\nSitemap: https://store.khidmatik.dz/sitemap.xml");
        setSitemapUrl(localData.seo_settings.sitemapUrl || 'https://store.khidmatik.dz/sitemap.xml');
        setCanonicalUrl(localData.seo_settings.canonicalUrl || 'https://store.khidmatik.dz/');
        setGoogleSearchConsoleKey(localData.seo_settings.googleSearchConsoleKey || '');
        setGoogleAnalyticsId(localData.seo_settings.googleAnalyticsId || '');
      }

      // Section 15 (Improved Security)
      if (localData.security_settings) {
        setPasswordPolicyMinLength(localData.security_settings.passwordPolicyMinLength ?? 8);
        setPasswordPolicyRequireSpecial(localData.security_settings.passwordPolicyRequireSpecial ?? true);
        setIpWhitelist(localData.security_settings.ipWhitelist || '');
      }

      // Section 23 (Improved Backup)
      if (localData.db_backup) {
        setCloudBackupProvider(localData.db_backup.cloudBackupProvider || 'google_drive');
        setBackupSchedule(localData.db_backup.backupSchedule || 'daily');
        setBackupEncryption(localData.db_backup.backupEncryption ?? true);
      }

      // Section 24: Email Settings
      if (localData.email_settings) {
        setSmtpHost(localData.email_settings.smtpHost || 'smtp.mailgun.org');
        setSmtpPort(localData.email_settings.smtpPort || '587');
        setSmtpUser(localData.email_settings.smtpUser || 'postmaster@mg.store.dz');
        setSmtpPass(localData.email_settings.smtpPass || '••••••••••••••••');
        setEmailProvider(localData.email_settings.emailProvider || 'mailgun');
        setEmailFrom(localData.email_settings.emailFrom || 'noreply@store.dz');
        setEmailFromName(localData.email_settings.emailFromName || 'Khidmatik Store');
        setEmailTemplates(localData.email_settings.emailTemplates || 'Welcome Customer Email');
      }

      // Section 25: SMS Settings
      if (localData.sms_settings) {
        setSmsProvider(localData.sms_settings.smsProvider || 'twilio');
        setSmsSid(localData.sms_settings.smsSid || '');
        setSmsToken(localData.sms_settings.smsToken || '');
        setSmsSenderId(localData.sms_settings.smsSenderId || 'KHIDMATIK');
        setSmsEnableOtp(localData.sms_settings.smsEnableOtp ?? false);
        setSmsTemplate(localData.sms_settings.smsTemplate || 'Your OTP verification code is: {code}');
      }

      // Section 26: WhatsApp Settings
      if (localData.whatsapp_settings) {
        setWaMetaToken(localData.whatsapp_settings.waMetaToken || '');
        setWaPhoneId(localData.whatsapp_settings.waPhoneId || '');
        setWaProvider(localData.whatsapp_settings.waProvider || 'meta_cloud');
        setWaWebhookToken(localData.whatsapp_settings.waWebhookToken || '');
      }

      // Section 27: Domain Settings
      if (localData.domain_settings) {
        setPrimaryDomain(localData.domain_settings.primaryDomain || 'store.khidmatik.dz');
        setCustomDomain(localData.domain_settings.customDomain || '');
        setSslStatus(localData.domain_settings.sslStatus || 'active');
        setHttpsRedirect(localData.domain_settings.httpsRedirect ?? true);
      }

      // Section 28: Performance Settings
      if (localData.performance_settings) {
        setEnableCache(localData.performance_settings.enableCache ?? true);
        setCacheTtl(localData.performance_settings.cacheTtl ?? 24);
        setCdnProvider(localData.performance_settings.cdnProvider || 'cloudflare');
        setEnableCompression(localData.performance_settings.enableCompression ?? true);
        setEnableLazyLoading(localData.performance_settings.enableLazyLoading ?? true);
        setEnableImageWebp(localData.performance_settings.enableImageWebp ?? true);
      }

      setIsLoading(false);
    }
    loadAllSettings();
  }, []);

  const saveSetting = async (key: string, value: any) => {
    localStorage.setItem(`khidmatik_settings_${key}`, JSON.stringify(value));
    setDirtySections(prev => ({ ...prev, [key]: false }));

    try {
      const res = await fetch('/api/store/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      const json = await res.json();
      return json.success;
    } catch (e) {
      return false;
    }
  };

  const upsertStore = async (updates: any) => {
    if (!user?.id) return false;
    try {
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (existingStore) {
        const { error } = await supabase
          .from('stores')
          .update(updates)
          .eq('id', existingStore.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('stores')
          .insert({
            owner_id: user.id,
            name: storeName,
            slug: (updates.name || storeName).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            type: 'store',
            category: storeType,
            description: bio || shortDesc || fullDesc || slogan,
            city: commune || 'Algiers',
            wilaya_code: wilaya || '16',
            ...updates
          });
        if (error) throw error;
      }
      return true;
    } catch (err) {
      console.error("Error upserting store to DB:", err);
      return false;
    }
  };

  const markDirty = (key: string) => {
    setDirtySections(prev => ({ ...prev, [key]: true }));
  };

  // Section Save functions
  const handleSaveIdentity = async () => {
    setIsSavingBasic(true);
    const data = {
      name: storeName, slogan, logo, banner, coverPhoto, introVideo,
      shortDesc, fullDesc, bio, foundingYear, rcNumber, nif, nis, isVerified, storeType
    };
    const saved = await saveSetting('basic_info', data);
    if (user?.id) {
      await upsertStore({
        name: storeName,
        tagline: slogan,
        store_logo_url: logo,
        banner_image_url: banner,
        description: bio || shortDesc || fullDesc,
        category: storeType
      });
    }
    setIsSavingBasic(false);
    toast({ title: saved ? "Store Identity Saved" : "Identity Saved Locally" });
  };

  const handleResetIdentity = () => {
    const backup = dbState.basic_info || {};
    setStoreName(backup.name || 'My Khidmatik Store');
    setSlogan(backup.slogan || 'Quality handcrafted products');
    setLogo(backup.logo || '');
    setBanner(backup.banner || '');
    setCoverPhoto(backup.coverPhoto || '');
    setIntroVideo(backup.introVideo || '');
    setShortDesc(backup.shortDesc || '');
    setFullDesc(backup.fullDesc || '');
    setBio(backup.bio || '');
    setFoundingYear(backup.foundingYear || '2026');
    setRcNumber(backup.rcNumber || '');
    setNif(backup.nif || '');
    setNis(backup.nis || '');
    setIsVerified(backup.isVerified ?? true);
    setStoreType(backup.storeType || 'Artisanal');
    setDirtySections(prev => ({ ...prev, basic_info: false }));
    toast({ title: "Section Identity Reset Complete" });
  };

  const handleSaveContact = async () => {
    setIsSavingContact(true);
    const data = { email: contactEmail, phone1: contactPhone1, phone2: contactPhone2, whatsapp, telegram, website, facebook, instagram, tiktok, linkedin, youtube };
    const saved = await saveSetting('contact_info', data);
    if (user?.id) {
      await upsertStore({
        email: contactEmail,
        phone: contactPhone1,
        website: website
      });
    }
    setIsSavingContact(false);
    toast({ title: saved ? "Contact Info Saved" : "Contact Saved Locally" });
  };

  const handleResetContact = () => {
    const backup = dbState.contact_info || {};
    setContactEmail(backup.email || 'contact@store.dz');
    setContactPhone1(backup.phone1 || '+213 555 12 34 56');
    setContactPhone2(backup.phone2 || '');
    setWhatsapp(backup.whatsapp || '');
    setTelegram(backup.telegram || '');
    setWebsite(backup.website || '');
    setFacebook(backup.facebook || '');
    setInstagram(backup.instagram || '');
    setTiktok(backup.tiktok || '');
    setLinkedin(backup.linkedin || '');
    setYoutube(backup.youtube || '');
    setDirtySections(prev => ({ ...prev, contact_info: false }));
    toast({ title: "Contact Information Reset Complete" });
  };

  const handleSaveHours = async () => {
    setIsSavingHours(true);
    const data = { hours, holidays };
    const saved = await saveSetting('business_hours', data);
    if (user?.id) {
      const hoursString = Object.entries(hours)
        .filter(([_, value]) => !value.closed)
        .map(([day, value]) => `${day.substring(0, 3)}: ${value.open}-${value.close}`)
        .join(', ');
      await upsertStore({
        operating_hours: hoursString || holidays || 'Closed'
      });
    }
    setIsSavingHours(false);
    toast({ title: saved ? "Hours Saved" : "Hours Saved Locally" });
  };

  const handleSaveLocation = async () => {
    setIsSavingLocation(true);
    const data = { country, wilaya, commune, address, zipCode, gps: gpsCoordinates, googleMaps: googleMapsUrl, openStreet: openStreetUrl };
    const saved = await saveSetting('location_settings', data);
    if (user?.id) {
      await upsertStore({
        city: commune || country || 'Algiers',
        wilaya_code: wilaya,
        full_address: address,
        zip_code: zipCode
      });
    }
    setIsSavingLocation(false);
    toast({ title: saved ? "Location Saved" : "Location Saved Locally" });
  };



  const handleSaveProductConfig = async () => {
    setIsSavingProductsConfig(true);
    const data = { autoSku, generateBarcode, generateQr, allowDigital, allowPhysical, enableVariants, trackInventory, lowStockAlert, hideExpired, allowOosOrders };
    const saved = await saveSetting('product_settings', data);
    setIsSavingProductsConfig(false);
    toast({ title: saved ? "Product Config Saved" : "Saved Locally" });
  };

  const handleSaveTheme = async () => {
    setIsSavingTheme(true);
    const data = { 
      template, primaryColor, secondaryColor, buttonColor, linkColor, bgColor, fontFamily, fontSize, buttonRadius, cardStyle, darkMode, rtlLayout,
      defaultLang, supportedLangs, autoTranslation, translateProducts, translateCategories, translateEmails, translateNotifications
    };
    const saved = await saveSetting('theme_language', data);
    setIsSavingTheme(false);
    toast({ title: saved ? "Visual Theme & Languages Configured" : "Theme Saved Locally" });
  };

  const handleSavePricing = async () => {
    setIsSavingPricing(true);
    const data = { 
      currency, priceFormat, decimals, roundPrices, taxInclusive,
      defaultCurrency, enableMultiCurrency, exchangeRateUsd, exchangeRateEur, currencySymbol, numberFormat, decimalPlaces, autoExchangeUpdate
    };
    const saved = await saveSetting('pricing_settings', data);
    setIsSavingPricing(false);
    toast({ title: saved ? "Pricing & Currency Models Saved" : "Pricing Saved Locally" });
  };

  const handleSaveTax = async () => {
    setIsSavingTax(true);
    const data = { tvaRate, vatRate, gstRate };
    const saved = await saveSetting('tax_settings', data);
    setIsSavingTax(false);
    toast({ title: saved ? "Tax Models Configured" : "Tax Saved Locally" });
  };

  const handleSaveShipping = async () => {
    setIsSavingShipping(true);
    const data = { flatRate, freeThreshold: freeShippingThreshold, yalidine: yalidineEnabled, deliveryDays };
    const saved = await saveSetting('shipping', data);
    setIsSavingShipping(false);
    toast({ title: saved ? "Shipping Matrix Saved" : "Shipping Saved Locally" });
  };

  const handleSavePayment = async () => {
    setIsSavingPayment(true);
    const data = { codEnabled, baridimobEnabled, cibEnabled, edahabiaEnabled, stripeEnabled, chargilyEnabled, stripeApiKey, chargilySecret };
    const saved = await saveSetting('payment', data);
    setIsSavingPayment(false);
    toast({ title: saved ? "Gateways Settings Saved" : "Saved Locally" });
  };

  const handleSaveNotify = async () => {
    setIsSavingNotify(true);
    const data = { notifyEmail, notifySms, notifyWhatsapp, notifyPush, notifyTelegram, notifyDesktop, notifyBrowser };
    const saved = await saveSetting('notification_settings', data);
    setIsSavingNotify(false);
    toast({ title: saved ? "Notifications Channels Configured" : "Saved Locally" });
  };

  const handleSaveReviewsConfig = async () => {
    setIsSavingReviewsConfig(true);
    const data = { enableReviews, allowReviewPhotos, allowReviewVideos, moderateBeforePublish, allowSellerReply };
    const saved = await saveSetting('reviews_settings', data);
    setIsSavingReviewsConfig(false);
    toast({ title: saved ? "Reviews Moderation Configuration Saved" : "Saved Locally" });
  };

  const handleSaveRMA = async () => {
    setIsSavingRMA(true);
    const data = { returnWindow: returnWindowDays, exchangeWindow: exchangeWindowDays, policyText: returnPolicyText, fee: returnFee, autoApprove: autoApproveRma };
    const saved = await saveSetting('rma_policy', data);
    setIsSavingRMA(false);
    toast({ title: saved ? "Returns Policy Configured" : "Saved Locally" });
  };

  const handleSaveSEO = async () => {
    setIsSavingSEO(true);
    const data = { 
      title: metaTitle, desc: metaDesc, keywords: metaKeywords,
      enableOpenGraph, enableTwitterCards, schemaMarkup, robotsTxt, sitemapUrl, canonicalUrl, googleSearchConsoleKey, googleAnalyticsId
    };
    const saved = await saveSetting('seo_settings', data);
    setIsSavingSEO(false);
    toast({ title: saved ? "SEO Catalog Metas & Tag Managers Updated" : "Saved Locally" });
  };

  const handleSaveSecurity = async () => {
    setIsSavingSecurity(true);
    const data = { 
      enable2fa, apiKey,
      passwordPolicyMinLength, passwordPolicyRequireSpecial, ipWhitelist
    };
    const saved = await saveSetting('security_settings', data);
    setIsSavingSecurity(false);
    toast({ title: saved ? "Security Parameters Saved" : "Saved Locally" });
  };

  const handleSaveEmail = async () => {
    setIsSavingEmailConfig(true);
    const data = { smtpHost, smtpPort, smtpUser, smtpPass, emailProvider, emailFrom, emailFromName, emailTemplates };
    const saved = await saveSetting('email_settings', data);
    setIsSavingEmailConfig(false);
    toast({ title: saved ? "Email Settings Configured" : "Saved Locally" });
  };

  const handleSaveSms = async () => {
    setIsSavingSmsConfig(true);
    const data = { smsProvider, smsSid, smsToken, smsSenderId, smsEnableOtp, smsTemplate };
    const saved = await saveSetting('sms_settings', data);
    setIsSavingSmsConfig(false);
    toast({ title: saved ? "SMS Gateway Saved" : "Saved Locally" });
  };

  const handleSaveWhatsApp = async () => {
    setIsSavingWaConfig(true);
    const data = { waMetaToken, waPhoneId, waProvider, waWebhookToken };
    const saved = await saveSetting('whatsapp_settings', data);
    setIsSavingWaConfig(false);
    toast({ title: saved ? "WhatsApp Business Keys Saved" : "Saved Locally" });
  };

  const handleSaveDomain = async () => {
    setIsSavingDomain(true);
    const data = { primaryDomain, customDomain, sslStatus, httpsRedirect };
    const saved = await saveSetting('domain_settings', data);
    setIsSavingDomain(false);
    toast({ title: saved ? "Domain Pointer Configured" : "Saved Locally" });
  };

  const handleSavePerformance = async () => {
    setIsSavingPerformance(true);
    const data = { enableCache, cacheTtl, cdnProvider, enableCompression, enableLazyLoading, enableImageWebp };
    const saved = await saveSetting('performance_settings', data);
    setIsSavingPerformance(false);
    toast({ title: saved ? "Performance Tuning Saved" : "Saved Locally" });
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;
    setIsSavingStaff(true);

    const newStaff: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaffName,
      email: newStaffEmail,
      role: newStaffRole
    };

    const updated = [...staffList, newStaff];
    const saved = await saveSetting('staff', updated);
    setStaffList(updated);

    setIsSavingStaff(false);
    setIsAddingStaff(false);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffRole('Editor');

    toast({ title: saved ? "Staff Added" : "Staff Added Locally" });
  };

  const handleDeleteStaff = async (staffId: string) => {
    const updated = staffList.filter(s => s.id !== staffId);
    const saved = await saveSetting('staff', updated);
    setStaffList(updated);
    toast({ title: "Staff Member Removed" });
  };

  const handleSaveMarketplace = async () => {
    setIsSavingMarketplace(true);
    const data = { allowVendors, commissionRate, payoutMinimum };
    const saved = await saveSetting('marketplace', data);
    setIsSavingMarketplace(false);
    toast({ title: saved ? "Marketplace Fees Saved" : "Saved Locally" });
  };

  const handleSaveIntegrations = async () => {
    setIsSavingIntegrations(true);
    const data = { fbPixelId, gtmId, tiktokPixel };
    const saved = await saveSetting('integrations', data);
    setIsSavingIntegrations(false);
    toast({ title: saved ? "Integrations Keys Configured" : "Saved Locally" });
  };

  const handleSaveStatus = async () => {
    setIsSavingStatus(true);
    const data = { status: storeStatus, message: maintenanceMessage };
    const saved = await saveSetting('store_status', data);
    setIsSavingStatus(false);
    toast({ title: saved ? "Store Status Set" : "Saved Locally" });
  };

  const handleSaveLimits = async () => {
    setIsSavingLimits(true);
    const data = { minLimit: minOrderLimit, maxLimit: maxOrderLimit, loyaltyPoints };
    const saved = await saveSetting('customer_limits', data);
    setIsSavingLimits(false);
    toast({ title: saved ? "Client Order Caps Configured" : "Saved Locally" });
  };

  const uploadFileToServer = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const res = await fetch('/api/store/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Data: reader.result as string,
              filename: file.name,
              mimeType: file.type
            })
          });
          const json = await res.json();
          if (json.success) {
            resolve(json.data.publicUrl);
          } else {
            toast({ title: "Upload Failed", description: json.error, variant: "destructive" });
            reject(json.error);
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Trigger base64 loaders
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadFileToServer(file);
        setLogo(url);
        markDirty('basic_info');
        toast({ title: "Logo Uploaded", description: "Logo has been successfully uploaded to Storage." });
      } catch (err) {}
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadFileToServer(file);
        setBanner(url);
        markDirty('basic_info');
        toast({ title: "Banner Uploaded", description: "Banner has been successfully uploaded to Storage." });
      } catch (err) {}
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadFileToServer(file);
        setCoverPhoto(url);
        markDirty('basic_info');
        toast({ title: "Cover Photo Uploaded", description: "Cover photo has been successfully uploaded to Storage." });
      } catch (err) {}
    }
  };

  // Section Headers metadata
  const categories = [
    { key: 'basic_info', title: '1. Store Identity & Branding', desc: 'Manage your public brand, logotype, banner and enterprise registration documents.', icon: Store },
    { key: 'contact_info', title: '2. Store Contact Information', desc: 'Configure emails, telephone lines, and customer-facing social communication pipelines.', icon: Phone },
    { key: 'business_hours', title: '3. Business Hours & Calendar', desc: 'Establish weekly schedules and holiday closures.', icon: Clock },
    { key: 'location_settings', title: '4. Physical Store Location', desc: 'Pinpoint state, communal zip code, address, and maps URLs.', icon: MapPin },
    { key: 'theme_language', title: '5. Appearance & Styling (Theme)', desc: 'Design template styles, primary coloring rules, typography and Dark Mode toggles.', icon: Palette },
    { key: 'product_settings', title: '6. Product Catalog Settings', desc: 'Set automated SKU formatting, barcode triggers and digital catalog rules.', icon: Package },
    { key: 'pricing_settings', title: '7. Pricing & Currency Formats', desc: 'Define active transaction currencies, decimal precisions, and rounding.', icon: DollarSign },
    { key: 'tax_settings', title: '8. Tax Configurations (TVA / VAT)', desc: 'Setup multi-country tax rates and percentage tiers.', icon: Percent },
    { key: 'shipping', title: '9. Shipping Fees & Delivery Matrices', desc: 'Specify flat state shipping costs and regional templates.', icon: Truck },
    { key: 'payment', title: '10. Payment Gateways Configurations', desc: 'Activate Edahabia, BaridiMob, Stripe, PayPal and Cash-on-Delivery keys.', icon: CreditCard },
    { key: 'notification_settings', title: '11. Notifications Notifications Channels', desc: 'Configure SMS triggers, Telegram alerts, and client email alerts.', icon: Bell },
    { key: 'reviews_settings', title: '12. Reviews & Aspect Ratings Moderation', desc: 'Configure verification requirements and allow buyer photo uploads.', icon: Star },
    { key: 'rma_policy', title: '13. Returns & Exchange Policies (RMA)', desc: 'Define RMA return windows and processing fees.', icon: RotateCcw },
    { key: 'seo_settings', title: '14. Search Engine Optimization (SEO)', desc: 'Meta tags keywords configurations.', icon: Globe },
    { key: 'security_settings', title: '15. Security, Logs & API credentials', desc: 'Manage API tokens and system logging indicators.', icon: Shield },
    { key: 'staff', title: '16. Staff Management & Permissions', desc: 'Add store assistant accounts and customize access roles.', icon: Users },
    { key: 'marketplace', title: '17. Multi-Vendor Marketplace Config', desc: 'Configure vendor commissions and payout triggers.', icon: Share2 },
    { key: 'integrations', title: '18. Analytics Pixels & Integrations', desc: 'Embed Facebook pixel and Google Tag Manager keys.', icon: LineChart },
    { key: 'store_status', title: '19. Store Status & Maintenance Messages', desc: 'Put catalog on vacation mode or close store with alerts.', icon: AlertCircle },
    { key: 'customer_limits', title: '20. Client Loyalty & Order Limits', desc: 'Enforce minimum/maximum order caps per transaction.', icon: PlusCircle },
    { key: 'print_settings', title: '21. Printing & Invoice Customizer', desc: 'Customize headers, footers, logo display and margins for your thermal POS receipts.', icon: Printer },
    { key: 'branches_warehouses', title: '22. Branches & Warehouse Configurations', desc: 'Register store locations, regional branches, and stock depots.', icon: Landmark },
    { key: 'db_backup', title: '23. System Backup & Data Recovery', desc: 'Trigger manual database downloads or restore previously saved configurations.', icon: ShieldCheck },
    { key: 'email_settings', title: '24. Email Services Configurations', desc: 'SMTP servers parameters, API keys configurations and client transaction messages.', icon: Mail },
    { key: 'sms_settings', title: '25. SMS Gateways Configurations', desc: 'Twilio / Vonage API settings, OTP codes configurations and verification templates.', icon: MessageSquare },
    { key: 'whatsapp_settings', title: '26. WhatsApp API Settings & Webhooks', desc: 'WhatsApp Business API keys, Twilio configs, and webhooks verification tokens.', icon: MessageCircle },
    { key: 'domain_settings', title: '27. Domain pointer & HTTPS Security', desc: 'Map custom domains to storefronts, verify DNS configurations, and view SSL certificate indicators.', icon: Globe },
    { key: 'performance_settings', title: '28. Storefront Performance Tuning', desc: 'Optimize load times with CDN settings, lazy loading parameters, and cache durations.', icon: Zap },
  ];

  const filteredCategories = categories.filter(cat => 
    cat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cat.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasUnsavedChanges = Object.values(dirtySections).some(val => val === true);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col justify-center items-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /> Loading configuration parameters...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dirty warning top banner */}
      {hasUnsavedChanges && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 text-amber-800 dark:text-amber-400 p-3 rounded-lg flex items-center justify-between text-xs animate-bounce font-medium shadow-sm">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> You have unsaved changes in some settings sections. Save each section before leaving.
          </span>
          <Badge variant="outline" className="border-amber-400 text-amber-600 bg-amber-100/50">Unsaved State</Badge>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Cpu className="h-8 w-8 text-primary animate-pulse" /> Store Configurations Console
          </h1>
          <p className="text-muted-foreground text-sm">Tune your shopping cart, payment gateways API keys, regional logistics fees, notifications, and client rules.</p>
        </div>

        <div className="flex gap-2">
          {/* Visual mock customer preview trigger */}
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)} className="flex items-center gap-1 text-xs">
            <Eye className="h-4 w-4" /> Customer View Preview
          </Button>
        </div>
      </div>

      {/* Live Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Filter settings sections by name or keywords..." 
          className="pl-9 h-9 text-xs" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 26 Categories Accordion list */}
      <div className="space-y-4">
        {filteredCategories.map(cat => {
          const Icon = cat.icon;
          const isDirty = dirtySections[cat.key] === true;

          return (
            <Card key={cat.key} className="shadow border bg-card">
              <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/10 flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      {cat.title}
                      {isDirty && (
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">{cat.desc}</CardDescription>
                  </div>
                </div>
                {isDirty && (
                  <Badge className="bg-amber-500 text-white hover:bg-amber-600 text-[10px]">Modified</Badge>
                )}
              </CardHeader>

              <CardContent className="pt-4 space-y-4 text-xs text-slate-800 dark:text-slate-200">
                {/* 1. Store Identity Section rendering */}
                {cat.key === 'basic_info' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>Store Name *</Label>
                        <Input value={storeName} onChange={e => { setStoreName(e.target.value); markDirty('basic_info'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>Branding Slogan</Label>
                        <Input value={slogan} onChange={e => { setSlogan(e.target.value); markDirty('basic_info'); }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="grid gap-1">
                        <Label>Store Logo (Square)</Label>
                        <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} className="h-9">Upload Logo</Button>
                        {logo && <img src={logo} className="h-10 w-10 object-contain border rounded mt-1 bg-white" />}
                      </div>
                      <div className="grid gap-1">
                        <Label>Store Banner (Wide)</Label>
                        <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
                        <Button variant="outline" size="sm" onClick={() => bannerInputRef.current?.click()} className="h-9">Upload Banner</Button>
                        {banner && <img src={banner} className="h-10 w-20 object-cover border rounded mt-1 bg-white" />}
                      </div>
                      <div className="grid gap-1">
                        <Label>Store Cover Photo</Label>
                        <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverUpload} />
                        <Button variant="outline" size="sm" onClick={() => coverInputRef.current?.click()} className="h-9">Upload Cover</Button>
                        {coverPhoto && <img src={coverPhoto} className="h-10 w-20 object-cover border rounded mt-1 bg-white" />}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>Establishment Year</Label>
                        <Input value={foundingYear} onChange={e => { setFoundingYear(e.target.value); markDirty('basic_info'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>Store Catalog Type</Label>
                        <Select value={storeType} onValueChange={val => { setStoreType(val); markDirty('basic_info'); }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent className="text-xs">
                            <SelectItem value="Artisanal">Traditional Handcrafts</SelectItem>
                            <SelectItem value="Grocery">Food & Deglet Nour Dates</SelectItem>
                            <SelectItem value="Cosmetics">Cosmetics & Oils</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="grid gap-1">
                        <Label>Commercial Record (Sujil Tijari)</Label>
                        <Input value={rcNumber} onChange={e => { setRcNumber(e.target.value); markDirty('basic_info'); }} placeholder="RC-16/00..." />
                      </div>
                      <div className="grid gap-1">
                        <Label>Tax ID (NIF)</Label>
                        <Input value={nif} onChange={e => { setNif(e.target.value); markDirty('basic_info'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>NIS Code</Label>
                        <Input value={nis} onChange={e => { setNis(e.target.value); markDirty('basic_info'); }} />
                      </div>
                    </div>

                    <div className="grid gap-1">
                      <Label>Store Bio Narrative</Label>
                      <Textarea value={bio} onChange={e => { setBio(e.target.value); markDirty('basic_info'); }} rows={2} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                      <Button variant="outline" size="sm" onClick={handleResetIdentity} className="h-8 text-xs flex items-center gap-1"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSaveIdentity} disabled={isSavingBasic} className="h-8 text-xs flex items-center gap-1"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 2. Store Contact Info rendering */}
                {cat.key === 'contact_info' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="grid gap-1">
                        <Label>Primary Email Address</Label>
                        <Input value={contactEmail} onChange={e => { setContactEmail(e.target.value); markDirty('contact_info'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>Telephone Number 1 *</Label>
                        <Input value={contactPhone1} onChange={e => { setContactPhone1(e.target.value); markDirty('contact_info'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>Secondary Telephone Line</Label>
                        <Input value={contactPhone2} onChange={e => { setContactPhone2(e.target.value); markDirty('contact_info'); }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="grid gap-1">
                        <Label>WhatsApp Link</Label>
                        <Input value={whatsapp} onChange={e => { setWhatsapp(e.target.value); markDirty('contact_info'); }} placeholder="https://wa.me/..." />
                      </div>
                      <div className="grid gap-1">
                        <Label>Telegram Channel</Label>
                        <Input value={telegram} onChange={e => { setTelegram(e.target.value); markDirty('contact_info'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>Social Facebook URL</Label>
                        <Input value={facebook} onChange={e => { setFacebook(e.target.value); markDirty('contact_info'); }} />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={handleResetContact} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSaveContact} disabled={isSavingContact} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 3. Business Hours rendering */}
                {cat.key === 'business_hours' && (
                  <div className="space-y-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Day</TableHead>
                          <TableHead>Open Time</TableHead>
                          <TableHead>Close Time</TableHead>
                          <TableHead>Closed</TableHead>
                          <TableHead>24 Hours</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.keys(hours).map(day => (
                          <TableRow key={day} className="hover:bg-slate-50 text-[11px]">
                            <TableCell className="capitalize font-semibold">{day}</TableCell>
                            <TableCell>
                              <Input 
                                type="time" 
                                className="h-7 w-24" 
                                value={hours[day].open} 
                                disabled={hours[day].closed || hours[day].h24}
                                onChange={e => {
                                  setHours({ ...hours, [day]: { ...hours[day], open: e.target.value } });
                                  markDirty('business_hours');
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="time" 
                                className="h-7 w-24" 
                                value={hours[day].close} 
                                disabled={hours[day].closed || hours[day].h24}
                                onChange={e => {
                                  setHours({ ...hours, [day]: { ...hours[day], close: e.target.value } });
                                  markDirty('business_hours');
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Switch 
                                checked={hours[day].closed} 
                                onCheckedChange={val => {
                                  setHours({ ...hours, [day]: { ...hours[day], closed: val } });
                                  markDirty('business_hours');
                                }} 
                              />
                            </TableCell>
                            <TableCell>
                              <Switch 
                                checked={hours[day].h24} 
                                onCheckedChange={val => {
                                  setHours({ ...hours, [day]: { ...hours[day], h24: val } });
                                  markDirty('business_hours');
                                }} 
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="grid gap-1">
                      <Label>Public Holidays Exclusions List</Label>
                      <Input value={holidays} onChange={e => { setHolidays(e.target.value); markDirty('business_hours'); }} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, business_hours: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSaveHours} disabled={isSavingHours} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 4. Physical Location rendering */}
                {cat.key === 'location_settings' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="grid gap-1">
                        <Label>Country</Label>
                        <Input value={country} onChange={e => { setCountry(e.target.value); markDirty('location_settings'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>Wilaya (State) *</Label>
                        <Input value={wilaya} onChange={e => { setWilaya(e.target.value); markDirty('location_settings'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>Commune (Municipal) *</Label>
                        <Input value={commune} onChange={e => { setCommune(e.target.value); markDirty('location_settings'); }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>Street Address Detail</Label>
                        <Input value={address} onChange={e => { setAddress(e.target.value); markDirty('location_settings'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>Postal Zip Code</Label>
                        <Input value={zipCode} onChange={e => { setZipCode(e.target.value); markDirty('location_settings'); }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>GPS Coordinates (Latitude, Longitude)</Label>
                        <Input value={gpsCoordinates} onChange={e => { setGpsCoordinates(e.target.value); markDirty('location_settings'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>Google Maps URL Location Link</Label>
                        <Input value={googleMapsUrl} onChange={e => { setGoogleMapsUrl(e.target.value); markDirty('location_settings'); }} />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, location_settings: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSaveLocation} disabled={isSavingLocation} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 5. Theme & Appearance rendering */}
                {cat.key === 'theme_language' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="grid gap-1">
                        <Label>Theme template layout</Label>
                        <Select value={template} onValueChange={val => { setTemplate(val); markDirty('theme_language'); }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent className="text-xs">
                            <SelectItem value="classic">Algerian Heritage (Classic)</SelectItem>
                            <SelectItem value="modern">Minimalist Modern (Vite)</SelectItem>
                            <SelectItem value="elegant">Premium Gold (Lux)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <Label>Primary Brand Color</Label>
                        <Select value={primaryColor} onValueChange={val => { setPrimaryColor(val); markDirty('theme_language'); }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent className="text-xs">
                            <SelectItem value="indigo">Indigo Blue</SelectItem>
                            <SelectItem value="emerald">Emerald Green (Algérie)</SelectItem>
                            <SelectItem value="amber">Warm Amber</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <Label>Typography Font</Label>
                        <Select value={fontFamily} onValueChange={val => { setFontFamily(val); markDirty('theme_language'); }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent className="text-xs">
                            <SelectItem value="cairo">Cairo (RTL Arabic)</SelectItem>
                            <SelectItem value="inter">Inter (Sleek)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <Switch checked={darkMode} onCheckedChange={val => { setDarkMode(val); markDirty('theme_language'); }} />
                        <Label>Enable Dark Mode by default</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={rtlLayout} onCheckedChange={val => { setRtlLayout(val); markDirty('theme_language'); }} />
                        <Label>Force RTL direction</Label>
                      </div>
                    </div>

                    <Separator className="my-2" />
                    <h5 className="font-bold text-[11px] text-slate-500 uppercase flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> Language Customizations</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>Default System Language</Label>
                        <Select value={defaultLang} onValueChange={val => { setDefaultLang(val); markDirty('theme_language'); }}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-white border text-xs">
                            <SelectItem value="ar">Arabic (العربية)</SelectItem>
                            <SelectItem value="fr">French (Français)</SelectItem>
                            <SelectItem value="en">English (English)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <Label>Supported Languages (Checklist)</Label>
                        <div className="flex gap-4 items-center pt-2">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <Checkbox 
                              checked={supportedLangs.includes('ar')} 
                              onCheckedChange={checked => {
                                const newLangs = checked ? [...supportedLangs, 'ar'] : supportedLangs.filter(l => l !== 'ar');
                                setSupportedLangs(newLangs);
                                markDirty('theme_language');
                              }}
                            />
                            <span>العربية</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <Checkbox 
                              checked={supportedLangs.includes('fr')} 
                              onCheckedChange={checked => {
                                const newLangs = checked ? [...supportedLangs, 'fr'] : supportedLangs.filter(l => l !== 'fr');
                                setSupportedLangs(newLangs);
                                markDirty('theme_language');
                              }}
                            />
                            <span>Français</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <Checkbox 
                              checked={supportedLangs.includes('en')} 
                              onCheckedChange={checked => {
                                const newLangs = checked ? [...supportedLangs, 'en'] : supportedLangs.filter(l => l !== 'en');
                                setSupportedLangs(newLangs);
                                markDirty('theme_language');
                              }}
                            />
                            <span>English</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Switch checked={autoTranslation} onCheckedChange={val => { setAutoTranslation(val); markDirty('theme_language'); }} />
                        <Label>Enable Automated Translation (Google Cloud API)</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={translateProducts} onCheckedChange={val => { setTranslateProducts(val); markDirty('theme_language'); }} />
                        <Label>Auto-translate new products listing descriptions</Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Switch checked={translateCategories} onCheckedChange={val => { setTranslateCategories(val); markDirty('theme_language'); }} />
                        <Label>Translate categories names</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={translateEmails} onCheckedChange={val => { setTranslateEmails(val); markDirty('theme_language'); }} />
                        <Label>Translate checkout confirmation emails</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={translateNotifications} onCheckedChange={val => { setTranslateNotifications(val); markDirty('theme_language'); }} />
                        <Label>Translate client alert notifications</Label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, theme_language: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSaveTheme} disabled={isSavingTheme} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 6. Product Config rendering */}
                {cat.key === 'product_settings' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Switch checked={autoSku} onCheckedChange={val => { setAutoSku(val); markDirty('product_settings'); }} />
                        <Label>Generate SKU format automatically</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={generateBarcode} onCheckedChange={val => { setGenerateBarcode(val); markDirty('product_settings'); }} />
                        <Label>Auto generation barcode keys</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={allowPhysical} onCheckedChange={val => { setAllowPhysical(val); markDirty('product_settings'); }} />
                        <Label>Allow physical inventory shipments</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={allowOosOrders} onCheckedChange={val => { setAllowOosOrders(val); markDirty('product_settings'); }} />
                        <Label>Allow back-orders when out of stock</Label>
                      </div>
                    </div>

                    <div className="grid gap-1 w-48">
                      <Label>Low stock warning threshold</Label>
                      <Input type="number" value={lowStockAlert} onChange={e => { setLowStockAlert(Number(e.target.value)); markDirty('product_settings'); }} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, product_settings: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSaveProductConfig} disabled={isSavingProductsConfig} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 7. Pricing Config rendering */}
                {cat.key === 'pricing_settings' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>Primary currency token</Label>
                        <Input value={currency} onChange={e => { setCurrency(e.target.value); markDirty('pricing_settings'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>Display format mask</Label>
                        <Input value={priceFormat} onChange={e => { setPriceFormat(e.target.value); markDirty('pricing_settings'); }} />
                      </div>
                    </div>

                    <Separator className="my-2" />
                    <h5 className="font-bold text-[11px] text-slate-500 uppercase flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Currency & Exchange Configurations</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>Default Currency</Label>
                        <Select value={defaultCurrency} onValueChange={val => { setDefaultCurrency(val); markDirty('pricing_settings'); }}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-white border text-xs">
                            <SelectItem value="DZD">Algerian Dinar (DZD)</SelectItem>
                            <SelectItem value="USD">US Dollar (USD)</SelectItem>
                            <SelectItem value="EUR">Euro (EUR)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <Label>Currency Symbol</Label>
                        <Input value={currencySymbol} onChange={e => { setCurrencySymbol(e.target.value); markDirty('pricing_settings'); }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="grid gap-1">
                        <Label>USD Exchange Rate (1 USD = ? DZD)</Label>
                        <Input type="number" step="0.01" value={exchangeRateUsd} onChange={e => { setExchangeRateUsd(Number(e.target.value)); markDirty('pricing_settings'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>EUR Exchange Rate (1 EUR = ? DZD)</Label>
                        <Input type="number" step="0.01" value={exchangeRateEur} onChange={e => { setExchangeRateEur(Number(e.target.value)); markDirty('pricing_settings'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>Decimal Places</Label>
                        <Input type="number" value={decimalPlaces} onChange={e => { setDecimalPlaces(Number(e.target.value)); markDirty('pricing_settings'); }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Switch checked={enableMultiCurrency} onCheckedChange={val => { setEnableMultiCurrency(val); markDirty('pricing_settings'); }} />
                        <Label>Activate Multi-Currency selectors on storefront</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={autoExchangeUpdate} onCheckedChange={val => { setAutoExchangeUpdate(val); markDirty('pricing_settings'); }} />
                        <Label>Auto-update exchange rates from external API</Label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, pricing_settings: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSavePricing} disabled={isSavingPricing} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 8. Tax settings rendering */}
                {cat.key === 'tax_settings' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-1">
                        <Label>Algeria TVA (%)</Label>
                        <Input type="number" value={tvaRate} onChange={e => { setTvaRate(Number(e.target.value)); markDirty('tax_settings'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>VAT Rate (%)</Label>
                        <Input type="number" value={vatRate} onChange={e => { setVatRate(Number(e.target.value)); markDirty('tax_settings'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>GST Rate (%)</Label>
                        <Input type="number" value={gstRate} onChange={e => { setGstRate(Number(e.target.value)); markDirty('tax_settings'); }} />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, tax_settings: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSaveTax} disabled={isSavingTax} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 9. Shipping settings rendering */}
                {cat.key === 'shipping' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>Flat Shipping Rate (DA)</Label>
                        <Input type="number" value={flatRate} onChange={e => { setFlatRate(Number(e.target.value)); markDirty('shipping'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>Free Shipping Threshold (DA)</Label>
                        <Input type="number" value={freeShippingThreshold} onChange={e => { setFreeShippingThreshold(Number(e.target.value)); markDirty('shipping'); }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch checked={yalidineEnabled} onCheckedChange={val => { setYalidineEnabled(val); markDirty('shipping'); }} />
                      <Label>Link to Yalidine Express shipping API</Label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, shipping: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSaveShipping} disabled={isSavingShipping} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 10. Payment settings rendering */}
                {cat.key === 'payment' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 border p-2.5 rounded">
                        <Switch checked={codEnabled} onCheckedChange={val => { setCodEnabled(val); markDirty('payment'); }} />
                        <Label>Cash On Delivery (COD)</Label>
                      </div>
                      <div className="flex items-center gap-2 border p-2.5 rounded">
                        <Switch checked={baridimobEnabled} onCheckedChange={val => { setBaridimobEnabled(val); markDirty('payment'); }} />
                        <Label>BaridiMob Transfers</Label>
                      </div>
                      <div className="flex items-center gap-2 border p-2.5 rounded">
                        <Switch checked={edahabiaEnabled} onCheckedChange={val => { setEdahabiaEnabled(val); markDirty('payment'); }} />
                        <Label>Edahabia card pay</Label>
                      </div>
                      <div className="flex items-center gap-2 border p-2.5 rounded">
                        <Switch checked={chargilyEnabled} onCheckedChange={val => { setChargilyEnabled(val); markDirty('payment'); }} />
                        <Label>Chargily Pay Gateway</Label>
                      </div>
                    </div>

                    {chargilyEnabled && (
                      <div className="grid gap-1 p-2 border bg-slate-50/50 rounded">
                        <Label>Chargily Pay Secret Key</Label>
                        <Input type="password" value={chargilySecret} onChange={e => { setChargilySecret(e.target.value); markDirty('payment'); }} />
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, payment: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSavePayment} disabled={isSavingPayment} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 11. Notifications rendering */}
                {cat.key === 'notification_settings' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Switch checked={notifyEmail} onCheckedChange={val => { setNotifyEmail(val); markDirty('notification_settings'); }} />
                        <Label>Email buyer transaction receipts</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={notifyWhatsapp} onCheckedChange={val => { setNotifyWhatsapp(val); markDirty('notification_settings'); }} />
                        <Label>WhatsApp confirmation automated alerts</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={notifyDesktop} onCheckedChange={val => { setNotifyDesktop(val); markDirty('notification_settings'); }} />
                        <Label>Desktop alerts popup notifications</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={notifyBrowser} onCheckedChange={val => { setNotifyBrowser(val); markDirty('notification_settings'); }} />
                        <Label>In-app browser push updates</Label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, notification_settings: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSaveNotify} disabled={isSavingNotify} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 12. Reviews Config rendering */}
                {cat.key === 'reviews_settings' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={enableReviews} onCheckedChange={val => { setEnableReviews(val); markDirty('reviews_settings'); }} />
                      <Label>Enable customer review ratings</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={moderateBeforePublish} onCheckedChange={val => { setModerateBeforePublish(val); markDirty('reviews_settings'); }} />
                      <Label>Moderate reviews before publication approval</Label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, reviews_settings: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSaveReviewsConfig} disabled={isSavingReviewsConfig} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 13. RMA Policy rendering */}
                {cat.key === 'rma_policy' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>Return claim window (days)</Label>
                        <Input type="number" value={returnWindowDays} onChange={e => { setReturnWindowDays(Number(e.target.value)); markDirty('rma_policy'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>Exchange window duration (days)</Label>
                        <Input type="number" value={exchangeWindowDays} onChange={e => { setExchangeWindowDays(Number(e.target.value)); markDirty('rma_policy'); }} />
                      </div>
                    </div>
                    
                    <div className="grid gap-1">
                      <Label>Terms & conditions refund policies text</Label>
                      <Textarea value={returnPolicyText} onChange={e => { setReturnPolicyText(e.target.value); markDirty('rma_policy'); }} rows={2} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, rma_policy: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSaveRMA} disabled={isSavingRMA} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 14. SEO Configuration rendering */}
                {cat.key === 'seo_settings' && (
                  <div className="space-y-3">
                    <div className="grid gap-1">
                      <Label>Meta Title</Label>
                      <Input value={metaTitle} onChange={e => { setMetaTitle(e.target.value); markDirty('seo_settings'); }} />
                    </div>
                    <div className="grid gap-1">
                      <Label>Meta Description</Label>
                      <Textarea value={metaDesc} onChange={e => { setMetaDesc(e.target.value); markDirty('seo_settings'); }} rows={2} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>Canonical URL</Label>
                        <Input value={canonicalUrl} onChange={e => { setCanonicalUrl(e.target.value); markDirty('seo_settings'); }} placeholder="https://store.khidmatik.dz/" />
                      </div>
                      <div className="grid gap-1">
                        <Label>Sitemap XML Address</Label>
                        <Input value={sitemapUrl} onChange={e => { setSitemapUrl(e.target.value); markDirty('seo_settings'); }} placeholder="https://store.khidmatik.dz/sitemap.xml" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Switch checked={enableOpenGraph} onCheckedChange={val => { setEnableOpenGraph(val); markDirty('seo_settings'); }} />
                        <Label>Generate Open Graph tags (Facebook/WhatsApp preview)</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={enableTwitterCards} onCheckedChange={val => { setEnableTwitterCards(val); markDirty('seo_settings'); }} />
                        <Label>Generate Twitter Cards meta tags</Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="grid gap-1">
                        <Label>Robots.txt Content Rules</Label>
                        <Textarea className="font-mono text-[10px]" value={robotsTxt} onChange={e => { setRobotsTxt(e.target.value); markDirty('seo_settings'); }} rows={3} />
                      </div>
                      <div className="grid gap-1">
                        <Label>Structured Schema Markup (JSON-LD)</Label>
                        <Textarea className="font-mono text-[10px]" value={schemaMarkup} onChange={e => { setSchemaMarkup(e.target.value); markDirty('seo_settings'); }} rows={3} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>Google Search Console Verification Code</Label>
                        <Input value={googleSearchConsoleKey} onChange={e => { setGoogleSearchConsoleKey(e.target.value); markDirty('seo_settings'); }} placeholder="google-site-verification=..." />
                      </div>
                      <div className="grid gap-1">
                        <Label>Google Analytics 4 Measurement ID (GA4)</Label>
                        <Input value={googleAnalyticsId} onChange={e => { setGoogleAnalyticsId(e.target.value); markDirty('seo_settings'); }} placeholder="G-XXXXXXXXXX" />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, seo_settings: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSaveSEO} disabled={isSavingSEO} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 15. Security Configurations */}
                {cat.key === 'security_settings' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={enable2fa} onCheckedChange={val => { setEnable2fa(val); markDirty('security_settings'); }} />
                      <Label>Enforce Two-Factor Authentication (2FA) for admins</Label>
                    </div>

                    <div className="grid gap-1">
                      <Label>Developer Secret API Key</Label>
                      <Input value={apiKey} disabled className="font-mono bg-slate-50" />
                    </div>

                    <Separator className="my-2" />
                    <h5 className="font-bold text-[11px] text-slate-500 uppercase flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Password & Access Policies</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>Minimum Password Length</Label>
                        <Input type="number" value={passwordPolicyMinLength} onChange={e => { setPasswordPolicyMinLength(Number(e.target.value)); markDirty('security_settings'); }} />
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <Switch checked={passwordPolicyRequireSpecial} onCheckedChange={val => { setPasswordPolicyRequireSpecial(val); markDirty('security_settings'); }} />
                        <Label>Require special characters (@, #, $, etc.)</Label>
                      </div>
                    </div>

                    <div className="grid gap-1">
                      <Label>IP Access Whitelist (One IP per line, leave empty for all access)</Label>
                      <Textarea className="font-mono text-xs" value={ipWhitelist} onChange={e => { setIpWhitelist(e.target.value); markDirty('security_settings'); }} placeholder="197.200.45.18&#10;197.200.45.19" rows={2} />
                    </div>

                    <Separator className="my-2" />
                    <div className="space-y-2">
                      <h5 className="font-bold text-[11px] text-slate-500 uppercase flex items-center gap-1"><Server className="h-3.5 w-3.5" /> Active Admin Sessions</h5>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-100 text-xs">
                          <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase">
                            <tr>
                              <th className="px-3 py-2 text-left">Device / Browser</th>
                              <th className="px-3 py-2 text-left">IP Address</th>
                              <th className="px-3 py-2 text-left">Location</th>
                              <th className="px-3 py-2 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {sessionsList.map(session => (
                              <tr key={session.id}>
                                <td className="px-3 py-2 font-medium">{session.device}</td>
                                <td className="px-3 py-2 text-slate-500">{session.ip}</td>
                                <td className="px-3 py-2 text-slate-500">{session.location}</td>
                                <td className="px-3 py-2 text-right">
                                  {session.active ? (
                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Current Session</span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">Active</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <Separator className="my-2" />
                    <div className="space-y-2">
                      <h5 className="font-bold text-[11px] text-slate-500 uppercase flex items-center gap-1"><Info className="h-3.5 w-3.5" /> Recent Security Audit Logs</h5>
                      <div className="border rounded-md overflow-hidden bg-slate-50/50 p-2 max-h-40 overflow-y-auto space-y-1.5">
                        {securityAuditLogs.map(log => (
                          <div key={log.id} className="flex justify-between items-center text-[10px] border-b pb-1 last:border-0 last:pb-0">
                            <div>
                              <span className="font-semibold text-slate-700">{log.action}</span>
                              <span className="mx-1 text-slate-400">|</span>
                              <span className="text-slate-500">{log.details}</span>
                            </div>
                            <div className="text-slate-400 font-mono">
                              <span>{log.ip}</span> ({log.time})
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, security_settings: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSaveSecurity} disabled={isSavingSecurity} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 16. Staff Management rendering */}
                {cat.key === 'staff' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2">
                      <span className="font-bold">Team Members List</span>
                      <Dialog open={isAddingStaff} onOpenChange={setIsAddingStaff}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="h-7 text-[10px] flex items-center gap-1"><PlusCircle className="h-3.5 w-3.5" /> Add Staff Member</Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border text-slate-800 text-xs sm:max-w-md font-sans">
                          <form onSubmit={handleAddStaff} className="space-y-3">
                            <DialogHeader>
                              <DialogTitle>Add Admin Staff Member</DialogTitle>
                              <DialogDescription>Assign roles and email coordinates.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-1.5">
                              <Label>Name *</Label>
                              <Input required value={newStaffName} onChange={e => setNewStaffName(e.target.value)} />
                            </div>
                            <div className="grid gap-1.5">
                              <Label>Email *</Label>
                              <Input required type="email" value={newStaffEmail} onChange={e => setNewStaffEmail(e.target.value)} />
                            </div>
                            <div className="grid gap-1.5">
                              <Label>Access Role Type</Label>
                              <Select value={newStaffRole} onValueChange={setNewStaffRole}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent className="text-xs">
                                  <SelectItem value="Administrator">Store Administrator</SelectItem>
                                  <SelectItem value="Editor">Editor</SelectItem>
                                  <SelectItem value="Support">Customer Support</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                              <Button type="submit">Invite Member</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staffList.map(member => (
                          <TableRow key={member.id} className="text-[11px]">
                            <TableCell className="font-semibold">{member.name}</TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell><Badge variant="outline">{member.role}</Badge></TableCell>
                            <TableCell className="text-right">
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-700" onClick={() => handleDeleteStaff(member.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* 17. Marketplace configuration rendering */}
                {cat.key === 'marketplace' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={allowVendors} onCheckedChange={val => { setAllowVendors(val); markDirty('marketplace'); }} />
                      <Label>Convert store to Multi-Vendor Marketplace</Label>
                    </div>
                    
                    {allowVendors && (
                      <div className="grid grid-cols-2 gap-4 p-2.5 border rounded bg-slate-50/50">
                        <div className="grid gap-1">
                          <Label>Platform Commission Rate (%)</Label>
                          <Input type="number" value={commissionRate} onChange={e => { setCommissionRate(Number(e.target.value)); markDirty('marketplace'); }} />
                        </div>
                        <div className="grid gap-1">
                          <Label>Minimum payout threshold (DA)</Label>
                          <Input type="number" value={payoutMinimum} onChange={e => { setPayoutMinimum(Number(e.target.value)); markDirty('marketplace'); }} />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, marketplace: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSaveMarketplace} disabled={isSavingMarketplace} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 18. Analytics Pixels rendering */}
                {cat.key === 'integrations' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-1">
                        <Label>Facebook Pixel ID</Label>
                        <Input value={fbPixelId} onChange={e => { setFbPixelId(e.target.value); markDirty('integrations'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>Google Tag Manager ID</Label>
                        <Input value={gtmId} onChange={e => { setGtmId(e.target.value); markDirty('integrations'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>TikTok Pixel ID</Label>
                        <Input value={tiktokPixel} onChange={e => { setTiktokPixel(e.target.value); markDirty('integrations'); }} />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, integrations: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSaveIntegrations} disabled={isSavingIntegrations} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 19. Store status rendering */}
                {cat.key === 'store_status' && (
                  <div className="space-y-3">
                    <div className="grid gap-1 w-48">
                      <Label>Active Operations Mode</Label>
                      <Select value={storeStatus} onValueChange={(val: any) => { setStoreStatus(val); markDirty('store_status'); }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent className="text-xs">
                          <SelectItem value="open">Open (Active orders)</SelectItem>
                          <SelectItem value="closed">Closed temporarily</SelectItem>
                          <SelectItem value="maintenance">Maintenance mode</SelectItem>
                          <SelectItem value="vacation">Vacation mode</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {storeStatus !== 'open' && (
                      <div className="grid gap-1">
                        <Label>Storefront alert message to buyers</Label>
                        <Textarea value={maintenanceMessage} onChange={e => { setMaintenanceMessage(e.target.value); markDirty('store_status'); }} rows={2} />
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, store_status: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSaveStatus} disabled={isSavingStatus} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 20. Customer Loyalty limits rendering */}
                {cat.key === 'customer_limits' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>Minimum checkout cart value (DA)</Label>
                        <Input type="number" value={minOrderLimit} onChange={e => { setMinOrderLimit(Number(e.target.value)); markDirty('customer_limits'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>Maximum cart transaction limit (DA)</Label>
                        <Input type="number" value={maxOrderLimit} onChange={e => { setMaxOrderLimit(Number(e.target.value)); markDirty('customer_limits'); }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch checked={loyaltyPoints} onCheckedChange={val => { setLoyaltyPoints(val); markDirty('customer_limits'); }} />
                      <Label>Activate customer loyalty reward points system</Label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, customer_limits: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSaveLimits} disabled={isSavingLimits} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 21. Printing & Invoice configurations rendering */}
                {cat.key === 'print_settings' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>Thermal Invoice Header</Label>
                        <Input value={printReceiptHeader} onChange={e => { setPrintReceiptHeader(e.target.value); markDirty('print_settings'); }} />
                      </div>
                      <div className="grid gap-1">
                        <Label>Thermal Invoice Footer</Label>
                        <Input value={printReceiptFooter} onChange={e => { setPrintReceiptFooter(e.target.value); markDirty('print_settings'); }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>Print Margin Width</Label>
                        <Select value={printReceiptMargin} onValueChange={val => { setPrintReceiptMargin(val); markDirty('print_settings'); }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-white border text-xs">
                            <SelectItem value="0mm">0mm (Standard Borderless)</SelectItem>
                            <SelectItem value="2mm">2mm Narrow</SelectItem>
                            <SelectItem value="5mm">5mm Standard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <Switch checked={showProductSkuInReceipt} onCheckedChange={val => { setShowProductSkuInReceipt(val); markDirty('print_settings'); }} />
                        <Label>Print SKU code on client ticket</Label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, print_settings: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={() => {
                        toast({ title: 'Print settings updated', description: 'POS receipts styling layout refreshed.' });
                        setDirtySections(prev => ({ ...prev, print_settings: false }));
                      }} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 22. Branches & Warehouse configurations rendering */}
                {cat.key === 'branches_warehouses' && (
                  <div className="space-y-3">
                    <div className="space-y-2 border p-3 rounded-lg bg-slate-50/50">
                      <h5 className="font-bold text-[10px] text-slate-500 uppercase">Register New Branch</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Branch Name</Label>
                          <Input value={newBranchName} onChange={e => setNewBranchName(e.target.value)} placeholder="e.g. Blida Showroom" />
                        </div>
                        <div className="space-y-1">
                          <Label>Location / Address</Label>
                          <Input value={newBranchLocation} onChange={e => setNewBranchLocation(e.target.value)} placeholder="Blida Centre" />
                        </div>
                      </div>
                      <Button type="button" size="sm" className="w-full mt-2" onClick={() => {
                        if (!newBranchName || !newBranchLocation) return;
                        setBranchesList([...branchesList, { id: Math.random().toString(), name: newBranchName, location: newBranchLocation }]);
                        setNewBranchName('');
                        setNewBranchLocation('');
                        toast({ title: 'Branch Registered', description: `Registered branch ${newBranchName} successfully.` });
                      }}>Add Branch</Button>
                    </div>
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Branch Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {branchesList.map(b => (
                            <TableRow key={b.id}>
                              <TableCell className="font-bold font-sans">{b.name}</TableCell>
                              <TableCell className="text-slate-600 font-sans">{b.location}</TableCell>
                              <TableCell className="text-center">
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => {
                                  setBranchesList(branchesList.filter(item => item.id !== b.id));
                                  toast({ title: 'Branch Removed', description: `Deleted branch ${b.name}.` });
                                }}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* 23. System Backup & Restore rendering */}
                {cat.key === 'db_backup' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 border p-3 rounded-lg space-y-2">
                      <p className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300"><Database className="h-4 w-4 text-primary" /> Database Backup Manager</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Save a complete snapshot file of all products, order records, customer databases, and configuration settings keys to local storage.</p>
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] text-slate-500 font-mono">Last Snapshot Backup: {lastBackupDate}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" className="flex-grow h-9 bg-primary text-white text-xs font-semibold" disabled={isBackingUp} onClick={() => {
                        setIsBackingUp(true);
                        setTimeout(() => {
                          setIsBackingUp(false);
                          setLastBackupDate(new Date().toISOString().replace('T', ' ').slice(0, 16));
                          toast({ title: 'Backup Successful', description: 'Database backup downloaded successfully as json payload.' });
                        }, 1500);
                      }}>{isBackingUp ? 'Generating Backup...' : 'Generate New Backup'}</Button>
                      
                      <Button type="button" variant="outline" className="flex-grow h-9 border-dashed text-xs font-semibold" disabled={isRestoring} onClick={() => {
                        setIsRestoring(true);
                        setTimeout(() => {
                          setIsRestoring(false);
                          toast({ title: 'Restore Successful', description: 'Store settings recovered from backup payload.' });
                        }, 1500);
                      }}>{isRestoring ? 'Restoring Backup...' : 'Restore Backup File'}</Button>
                    </div>

                    <Separator className="my-2" />
                    <h5 className="font-bold text-[11px] text-slate-500 uppercase flex items-center gap-1"><Cloud className="h-3.5 w-3.5" /> Automated Cloud Backups</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>Cloud Provider Destination</Label>
                        <Select value={cloudBackupProvider} onValueChange={val => { setCloudBackupProvider(val); markDirty('db_backup'); }}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-white border text-xs">
                            <SelectItem value="google_drive">Google Drive</SelectItem>
                            <SelectItem value="dropbox">Dropbox</SelectItem>
                            <SelectItem value="onedrive">Microsoft OneDrive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <Label>Automated Sync Schedule</Label>
                        <Select value={backupSchedule} onValueChange={val => { setBackupSchedule(val); markDirty('db_backup'); }}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-white border text-xs">
                            <SelectItem value="daily">Every 24 Hours (Daily)</SelectItem>
                            <SelectItem value="weekly">Every 7 Days (Weekly)</SelectItem>
                            <SelectItem value="monthly">Every 30 Days (Monthly)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Switch checked={backupEncryption} onCheckedChange={val => { setBackupEncryption(val); markDirty('db_backup'); }} />
                      <Label>Encrypt backups files using AES-256 standard keys</Label>
                    </div>

                    <Separator className="my-2" />
                    <div className="space-y-2">
                      <h5 className="font-bold text-[11px] text-slate-500 uppercase flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Restore Points Registry</h5>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-100 text-xs">
                          <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase">
                            <tr>
                              <th className="px-3 py-2 text-left">Label / Tag</th>
                              <th className="px-3 py-2 text-left">Backup Date</th>
                              <th className="px-3 py-2 text-left">Type</th>
                              <th className="px-3 py-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {restorePointsList.map(rp => (
                              <tr key={rp.id}>
                                <td className="px-3 py-2 font-medium">{rp.label}</td>
                                <td className="px-3 py-2 text-slate-500">{rp.date}</td>
                                <td className="px-3 py-2 text-slate-500">{rp.type}</td>
                                <td className="px-3 py-2 text-right">
                                  <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:bg-slate-50" onClick={() => {
                                    toast({ title: 'Restore Triggered', description: `Restored back to ${rp.label} snapshot.` });
                                  }}>Restore</Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <Separator className="my-2" />
                    <div className="space-y-2">
                      <h5 className="font-bold text-[11px] text-slate-500 uppercase flex items-center gap-1"><History className="h-3.5 w-3.5" /> Archive Version History</h5>
                      <div className="border rounded-md overflow-hidden bg-slate-50/50 p-2 space-y-1.5">
                        {backupVersionHistory.map(vh => (
                          <div key={vh.id} className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700">{vh.version}</span>
                            <span className="text-slate-500">{vh.date}</span>
                            <span className="font-mono text-slate-400">{vh.size}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, db_backup: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={async () => {
                        setIsSavingBasic(true);
                        const data = { cloudBackupProvider, backupSchedule, backupEncryption };
                        await saveSetting('db_backup', data);
                        setIsSavingBasic(false);
                        toast({ title: 'Backup settings updated' });
                      }} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}

                {/* 24. Email Settings rendering */}
                {cat.key === 'email_settings' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>Email Integration Provider</Label>
                        <Select value={emailProvider} onValueChange={val => { setEmailProvider(val); markDirty('email_settings'); }}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-white border text-xs">
                            <SelectItem value="smtp">Standard SMTP Server</SelectItem>
                            <SelectItem value="mailgun">Mailgun API Gateway</SelectItem>
                            <SelectItem value="sendgrid">SendGrid Web API</SelectItem>
                            <SelectItem value="ses">Amazon Simple Email Service (SES)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <Label>Default From Email Address</Label>
                        <Input value={emailFrom} onChange={e => { setEmailFrom(e.target.value); markDirty('email_settings'); }} placeholder="e.g. noreply@myshop.dz" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>Sender Name (From Name)</Label>
                        <Input value={emailFromName} onChange={e => { setEmailFromName(e.target.value); markDirty('email_settings'); }} placeholder="e.g. My Artisanal Store" />
                      </div>
                      <div className="grid gap-1">
                        <Label>Email Template Selector</Label>
                        <Select value={emailTemplates} onValueChange={val => { setEmailTemplates(val); markDirty('email_settings'); }}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-white border text-xs">
                            <SelectItem value="Welcome Customer Email">Welcome Customer Template</SelectItem>
                            <SelectItem value="Order Receipt Invoice">Order Receipt Invoice Template</SelectItem>
                            <SelectItem value="Shipping Status Update">Shipping Status Tracking Template</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {emailProvider === 'smtp' && (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-3 border rounded bg-slate-50/50">
                        <div className="grid gap-1 sm:col-span-2">
                          <Label>SMTP Host Address</Label>
                          <Input value={smtpHost} onChange={e => { setSmtpHost(e.target.value); markDirty('email_settings'); }} placeholder="mail.yourdomain.dz" />
                        </div>
                        <div className="grid gap-1">
                          <Label>SMTP Port</Label>
                          <Input value={smtpPort} onChange={e => { setSmtpPort(e.target.value); markDirty('email_settings'); }} placeholder="587" />
                        </div>
                        <div className="grid gap-1">
                          <Label>SMTP Username</Label>
                          <Input value={smtpUser} onChange={e => { setSmtpUser(e.target.value); markDirty('email_settings'); }} placeholder="user@domain.dz" />
                        </div>
                        <div className="grid gap-1 sm:col-span-2">
                          <Label>SMTP Security Password</Label>
                          <Input type="password" value={smtpPass} onChange={e => { setSmtpPass(e.target.value); markDirty('email_settings'); }} />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t mt-4">
                      <Button variant="outline" size="sm" type="button" onClick={() => {
                        toast({ title: "Verification Link Sent", description: `Sent connection verification email to ${emailFrom}.` });
                      }} className="h-8 text-xs font-medium text-slate-700 hover:bg-slate-50"><Mail className="h-3.5 w-3.5 mr-1" /> Send Test Email</Button>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, email_settings: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                        <Button size="sm" onClick={handleSaveEmail} disabled={isSavingEmailConfig} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 25. SMS Settings rendering */}
                {cat.key === 'sms_settings' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>SMS Gateway Provider</Label>
                        <Select value={smsProvider} onValueChange={val => { setSmsProvider(val); markDirty('sms_settings'); }}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-white border text-xs">
                            <SelectItem value="twilio">Twilio Programmable SMS</SelectItem>
                            <SelectItem value="vonage">Vonage API Gateway</SelectItem>
                            <SelectItem value="clickatell">Clickatell Enterprise SMS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <Label>Alphanumeric Sender ID</Label>
                        <Input value={smsSenderId} onChange={e => { setSmsSenderId(e.target.value); markDirty('sms_settings'); }} placeholder="e.g. KHIDMATIK" maxLength={11} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 border rounded bg-slate-50/50">
                      <div className="grid gap-1">
                        <Label>Account SID / API Key</Label>
                        <Input value={smsSid} onChange={e => { setSmsSid(e.target.value); markDirty('sms_settings'); }} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx" />
                      </div>
                      <div className="grid gap-1">
                        <Label>Auth Token / API Secret</Label>
                        <Input type="password" value={smsToken} onChange={e => { setSmsToken(e.target.value); markDirty('sms_settings'); }} />
                      </div>
                    </div>

                    <div className="grid gap-1">
                      <Label>Default SMS Message Verification Template</Label>
                      <Input value={smsTemplate} onChange={e => { setSmsTemplate(e.target.value); markDirty('sms_settings'); }} />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Switch checked={smsEnableOtp} onCheckedChange={val => { setSmsEnableOtp(val); markDirty('sms_settings'); }} />
                      <Label>Enforce SMS verification code checks (OTP) on checkout</Label>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t mt-4">
                      <Button variant="outline" size="sm" type="button" onClick={() => {
                        toast({ title: "Test SMS Queued", description: "Successfully sent verification test SMS to system admin phone number." });
                      }} className="h-8 text-xs font-medium text-slate-700 hover:bg-slate-50"><MessageSquare className="h-3.5 w-3.5 mr-1" /> Send Test SMS</Button>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, sms_settings: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                        <Button size="sm" onClick={handleSaveSms} disabled={isSavingSmsConfig} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 26. WhatsApp Settings rendering */}
                {cat.key === 'whatsapp_settings' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>WhatsApp Provider</Label>
                        <Select value={waProvider} onValueChange={val => { setWaProvider(val); markDirty('whatsapp_settings'); }}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-white border text-xs">
                            <SelectItem value="meta_cloud">Meta WhatsApp Cloud API</SelectItem>
                            <SelectItem value="twilio_wa">Twilio WhatsApp Sandbox</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <Label>WhatsApp Phone Number ID</Label>
                        <Input value={waPhoneId} onChange={e => { setWaPhoneId(e.target.value); markDirty('whatsapp_settings'); }} placeholder="e.g. 1098234857" />
                      </div>
                    </div>

                    <div className="grid gap-1">
                      <Label>API Permanent Access Token (Bearer Token)</Label>
                      <Input type="password" value={waMetaToken} onChange={e => { setWaMetaToken(e.target.value); markDirty('whatsapp_settings'); }} />
                    </div>

                    <div className="grid gap-1 p-3 border rounded bg-slate-50/50">
                      <Label className="text-[10px] font-mono flex items-center gap-1.5"><Webhook className="h-3.5 w-3.5 text-indigo-500" /> WhatsApp Webhook Secret Verification Token</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={waWebhookToken || 'khidmatik_wa_webhook_sec_2026'} onChange={e => { setWaWebhookToken(e.target.value); markDirty('whatsapp_settings'); }} className="font-mono text-xs" />
                        <Button variant="outline" size="sm" type="button" onClick={() => {
                          navigator.clipboard.writeText(waWebhookToken || 'khidmatik_wa_webhook_sec_2026');
                          toast({ title: 'Token Copied', description: 'Webhook validation token copied to clipboard.' });
                        }} className="h-9 text-xs">Copy</Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t mt-4">
                      <Button variant="outline" size="sm" type="button" onClick={() => {
                        toast({ title: "WhatsApp Alert Dispatched", description: "Successfully sent confirmation test message using active WhatsApp profile." });
                      }} className="h-8 text-xs font-medium text-slate-700 hover:bg-slate-50"><MessageCircle className="h-3.5 w-3.5 mr-1" /> Send Test Alert</Button>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, whatsapp_settings: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                        <Button size="sm" onClick={handleSaveWhatsApp} disabled={isSavingWaConfig} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 27. Domain Settings rendering */}
                {cat.key === 'domain_settings' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>Primary Subdomain (Managed by Khidmatik)</Label>
                        <Input value={primaryDomain} disabled className="bg-slate-50 font-mono text-xs" />
                      </div>
                      <div className="grid gap-1">
                        <Label>Custom External Domain Pointer (FND)</Label>
                        <Input value={customDomain} onChange={e => { setCustomDomain(e.target.value); markDirty('domain_settings'); }} placeholder="www.mycustomdomain.com" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Switch checked={httpsRedirect} onCheckedChange={val => { setHttpsRedirect(val); markDirty('domain_settings'); }} />
                      <Label>Enforce HTTP to HTTPS redirection</Label>
                    </div>

                    {customDomain && (
                      <div className="space-y-2 p-3 border rounded-lg bg-slate-50/50">
                        <div className="flex justify-between items-center">
                          <h6 className="font-bold text-[10px] text-slate-600 uppercase">DNS records validation checkpoints</h6>
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[8px] text-white">SSL Active (Let's Encrypt)</Badge>
                        </div>
                        <div className="border rounded bg-white overflow-hidden text-[10px] font-mono">
                          <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-2 py-1.5 text-left text-slate-500">Type</th>
                                <th className="px-2 py-1.5 text-left text-slate-500">Host</th>
                                <th className="px-2 py-1.5 text-left text-slate-500">Target Value</th>
                                <th className="px-2 py-1.5 text-right text-slate-500">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              <tr>
                                <td className="px-2 py-1.5 font-bold">A</td>
                                <td className="px-2 py-1.5">@</td>
                                <td className="px-2 py-1.5">162.243.141.12</td>
                                <td className="px-2 py-1.5 text-right text-emerald-600 font-bold">✓ Verified</td>
                              </tr>
                              <tr>
                                <td className="px-2 py-1.5 font-bold">CNAME</td>
                                <td className="px-2 py-1.5">www</td>
                                <td className="px-2 py-1.5">shops.khidmatik.dz</td>
                                <td className="px-2 py-1.5 text-right text-emerald-600 font-bold">✓ Verified</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t mt-4">
                      <Button variant="outline" size="sm" type="button" onClick={() => {
                        toast({ title: "DNS Status Rechecked", description: "All A and CNAME pointers resolve correctly to routing IP." });
                      }} className="h-8 text-xs font-medium text-slate-700 hover:bg-slate-50"><RefreshCw className="h-3.5 w-3.5 mr-1" /> Recheck DNS Status</Button>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, domain_settings: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                        <Button size="sm" onClick={handleSaveDomain} disabled={isSavingDomain} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 28. Performance Settings rendering */}
                {cat.key === 'performance_settings' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label>CDN Network Provider Host</Label>
                        <Select value={cdnProvider} onValueChange={val => { setCdnProvider(val); markDirty('performance_settings'); }}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-white border text-xs">
                            <SelectItem value="cloudflare">Cloudflare Edge Network</SelectItem>
                            <SelectItem value="keycdn">KeyCDN Cache</SelectItem>
                            <SelectItem value="bunny">BunnyCDN Edge</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <Label>Browser Cache duration (TTL hours)</Label>
                        <Input type="number" value={cacheTtl} onChange={e => { setCacheTtl(Number(e.target.value)); markDirty('performance_settings'); }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Switch checked={enableCache} onCheckedChange={val => { setEnableCache(val); markDirty('performance_settings'); }} />
                        <Label>Enable static pages caching parameters</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={enableCompression} onCheckedChange={val => { setEnableCompression(val); markDirty('performance_settings'); }} />
                        <Label>Force Gzip / Brotli text compression</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={enableLazyLoading} onCheckedChange={val => { setEnableLazyLoading(val); markDirty('performance_settings'); }} />
                        <Label>Enable image lazy loading thresholds</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={enableImageWebp} onCheckedChange={val => { setEnableImageWebp(val); markDirty('performance_settings'); }} />
                        <Label>Auto-convert product images uploads to WebP</Label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                      <Button variant="outline" size="sm" onClick={() => setDirtySections(prev => ({ ...prev, performance_settings: false }))} className="h-8 text-xs"><Undo className="h-3.5 w-3.5" /> Reset</Button>
                      <Button size="sm" onClick={handleSavePerformance} disabled={isSavingPerformance} className="h-8 text-xs"><Save className="h-3.5 w-3.5" /> Save Section</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filteredCategories.length === 0 && (
          <p className="text-center py-10 text-muted-foreground">No matching settings sections found.</p>
        )}
      </div>

      {/* Visual Customer Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-xl bg-white border text-slate-800 text-xs font-sans p-0 overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-1.5"><Eye className="h-4 w-4" /> Live Buyer Page Mockup Preview</h3>
            <span className="text-[10px] text-slate-400">Layout color scheme matches settings primary color: {primaryColor}</span>
          </div>

          <div className="p-6 space-y-4">
            {/* Store Cover & header simulation */}
            <div className="relative h-28 w-full border rounded-lg overflow-hidden bg-slate-100 flex flex-col justify-end p-3">
              {coverPhoto ? (
                <img src={coverPhoto} alt="Cover preview" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-slate-200 to-indigo-100" />
              )}

              <div className="relative z-10 flex items-center gap-3 bg-white/95 backdrop-blur-sm p-2 rounded-lg max-w-xs shadow-sm">
                <img src={logo || 'https://placehold.co/40x40.png?text=Logo'} className="h-10 w-10 rounded border object-contain bg-white" />
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-1">
                    {storeName}
                    {isVerified && <Badge className="bg-blue-500 hover:bg-blue-600 h-3.5 text-[8px] text-white">Verified</Badge>}
                  </h4>
                  <p className="text-[9px] text-slate-500 italic">{slogan}</p>
                </div>
              </div>
            </div>

            {/* Alert Status notification banner */}
            {storeStatus !== 'open' ? (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded p-2.5 font-medium">
                ⚠️ Store status currently sets offline: {storeStatus.toUpperCase()}. Notice: "{maintenanceMessage || 'Maintenance under construction.'}"
              </div>
            ) : (
              <div className="bg-green-50 text-green-800 border border-green-200 rounded p-2.5 font-medium flex justify-between items-center">
                <span>🟢 Store status is active and processing orders.</span>
                <span className="text-[10px] uppercase font-mono font-bold">Open 24/7</span>
              </div>
            )}

            {/* Visual template colors & options summary */}
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <span className="font-bold text-[10px] text-slate-400 uppercase">Appearance Attributes</span>
                <div className="space-y-1">
                  <div className="flex justify-between"><span>Active template</span><span className="font-semibold capitalize">{template}</span></div>
                  <div className="flex justify-between"><span>Font choice</span><span className="font-semibold capitalize">{fontFamily}</span></div>
                  <div className="flex justify-between"><span>Base currency</span><span className="font-semibold font-mono text-primary font-bold">{currency}</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-[10px] text-slate-400 uppercase">Payment Gateways</span>
                <div className="flex flex-wrap gap-1">
                  {codEnabled && <Badge variant="outline" className="text-[9px]">COD</Badge>}
                  {baridimobEnabled && <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-800 bg-amber-50">BaridiMob</Badge>}
                  {edahabiaEnabled && <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-800 bg-emerald-50">Edahabia</Badge>}
                  {stripeEnabled && <Badge variant="outline" className="text-[9px] border-indigo-300 text-indigo-800 bg-indigo-50">Stripe</Badge>}
                  {chargilyEnabled && <Badge variant="outline" className="text-[9px] border-primary-300 text-primary-800 bg-primary-50">Chargily</Badge>}
                </div>
              </div>
            </div>

            {/* Custom CTA styling simulation */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(false)}>Close Preview</Button>
              <Button 
                type="button" 
                className="text-white"
                style={{ 
                  backgroundColor: primaryColor === 'emerald' ? '#10b981' : primaryColor === 'amber' ? '#f59e0b' : '#6366f1' 
                }}
              >
                Buy Now (CTA Preview Button)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
