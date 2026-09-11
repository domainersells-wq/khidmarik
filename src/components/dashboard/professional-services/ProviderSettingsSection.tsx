'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings, Shield, Bell, Activity, Download, Trash2, Link2, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/context/LanguageContext';
import { BusinessLocationManager } from '../common/BusinessLocationManager';

interface ActivityLogItem {
  id: string;
  action: string;
  time: string;
  ip: string;
}

export function ProviderSettingsSection() {
  const { toast } = useToast();
  const { language } = useLanguage();

  const t = (key: string, def: string) => {
    const dict: Record<string, Record<string, string>> = {
      ar: {
        title: 'إعدادات الحساب والتكاملات',
        desc: 'إدارة أمان حسابك، وتفضيلات الإشعارات، وربط المنصة بالتطبيقات الخارجية.',
        security: 'الأمان وحماية الحساب',
        secDesc: 'تحديث كلمة المرور وإدارة المصادقة الثنائية.',
        twoFa: 'المصادقة الثنائية (2FA)',
        twoFaDesc: 'تأمين حسابك عبر إدخال رمز إضافي عند تسجيل الدخول.',
        changePass: 'تغيير كلمة المرور',
        notifs: 'تفضيلات الإشعارات',
        notifsDesc: 'اختر كيفية تلقي التنبيهات للحجوزات والرسائل.',
        emailNotifs: 'إشعارات البريد الإلكتروني للحجوزات الجديدة',
        smsNotifs: 'رسائل قصيرة (SMS) للأمور العاجلة والطارئة',
        appNotifs: 'إشعارات داخل التطبيق للرسائل والتحديثات',
        saveNotifs: 'حفظ تفضيلات الإشعارات',
        activity: 'سجل العمليات الأخير',
        activityDesc: 'مراقبة عمليات تسجيل الدخول والتغييرات الأمنية على حسابك.',
        viewFullLog: 'عرض سجل العمليات الكامل',
        data: 'إدارة البيانات والحساب',
        dataDesc: 'تحميل نسخة من بياناتك أو طلب حذف حسابك بشكل نهائي.',
        downloadData: 'تحميل كافة بياناتي المهنية',
        deleteAccount: 'حذف الحساب نهائياً',
        integrations: 'التكاملات الخارجية والربط',
        intDesc: 'اربط حسابك بالخدمات الخارجية لمزامنة الجداول والملفات.',
        googleCalendar: 'ربط تقويم جوجل (Google Calendar)',
        canva: 'ربط كانفا (Canva)',
        linkedin: 'ربط لينكد إن (LinkedIn)',
        behance: 'ربط بيهانس (Behance)',
        terms: 'الشروط والسياسات',
        termsDesc: 'الاطلاع على شروط الخدمة وسياسة الخصوصية الخاصة بالمنصة.',
        viewTerms: 'عرض شروط الخدمة',
        viewPrivacy: 'عرض سياسة الخصوصية',
        connect: 'ربط الخدمة',
        disconnect: 'إلغاء الربط',
        connected: 'متصل',
        save: 'حفظ التغييرات',
        close: 'إغلاق',
        currPass: 'كلمة المرور الحالية',
        newPass: 'كلمة المرور الجديدة',
        confPass: 'تأكيد كلمة المرور الجديدة',
      },
      fr: {
        title: 'Paramètres du Compte',
        desc: 'Gérez la sécurité de votre compte, vos notifications et vos intégrations externes.',
        security: 'Sécurité du Compte',
        secDesc: 'Gérez la double authentification et votre mot de passe.',
        twoFa: 'Authentification Double Facteur (2FA)',
        twoFaDesc: 'Sécurisez votre compte en exigeant une vérification supplémentaire.',
        changePass: 'Changer le Mot de Passe',
        notifs: 'Préférences de Notifications',
        notifsDesc: 'Choisissez comment vous êtes notifié de vos réservations et messages.',
        emailNotifs: 'Notifications Email pour les réservations',
        smsNotifs: 'Alertes SMS pour les urgences',
        appNotifs: 'Notifications In-App pour les nouveaux messages',
        saveNotifs: 'Enregistrer les préférences',
        activity: 'Journal d\'Activité Récents',
        activityDesc: 'Suivi des connexions et des modifications de sécurité.',
        viewFullLog: 'Voir le journal complet',
        data: 'Gestion des Données',
        dataDesc: 'Téléchargez vos informations ou supprimez votre compte.',
        downloadData: 'Télécharger mes Données',
        deleteAccount: 'Supprimer mon Compte',
        integrations: 'Intégrations Externes',
        intDesc: 'Connectez Khidmatik aux autres services que vous utilisez.',
        googleCalendar: 'Google Calendar (Calendrier)',
        canva: 'Canva (Conception Graphique)',
        linkedin: 'LinkedIn (Profil Pro)',
        behance: 'Behance (Portfolio)',
        terms: 'Conditions & Règles',
        termsDesc: 'Consultez nos conditions d\'utilisation et politiques.',
        viewTerms: 'Conditions d\'Utilisation',
        viewPrivacy: 'Politique de Confidentialité',
        connect: 'Connecter',
        disconnect: 'Déconnecter',
        connected: 'Connecté',
        save: 'Enregistrer',
        close: 'Fermer',
        currPass: 'Mot de passe actuel',
        newPass: 'Nouveau mot de passe',
        confPass: 'Confirmer le mot de passe',
      },
      en: {
        title: 'Account Settings & Integrations',
        desc: 'Manage your account security, notifications, data, and third-party integrations.',
        security: 'Security & Auth',
        secDesc: 'Manage password change and two-factor authentication configuration.',
        twoFa: 'Two-Factor Authentication (2FA)',
        twoFaDesc: 'Secure your login by requiring an additional authentication token.',
        changePass: 'Change Password',
        notifs: 'Notification Preferences',
        notifsDesc: 'Choose how you receive alerts for new bookings and client updates.',
        emailNotifs: 'Email notifications for new bookings',
        smsNotifs: 'SMS alerts for urgent cancellations or issues',
        appNotifs: 'In-app notification for incoming chat messages',
        saveNotifs: 'Save Notifications Preferences',
        activity: 'Recent Activity Log',
        activityDesc: 'Monitor logins, IP addresses, and recent modifications.',
        viewFullLog: 'View Full Activity Log',
        data: 'Data Management',
        dataDesc: 'Export profile files or initiate account removal protocols.',
        downloadData: 'Download My Professional Data',
        deleteAccount: 'Delete Account Permanently',
        integrations: 'Third-Party Integrations',
        intDesc: 'Sync schedules, portfolios, and tools with external accounts.',
        googleCalendar: 'Google Calendar Sync',
        canva: 'Canva Workspace Integration',
        linkedin: 'LinkedIn Profile Link',
        behance: 'Behance Portfolio Sync',
        terms: 'Terms & Policies',
        termsDesc: 'Review Khidmatik platform user conditions and legal policies.',
        viewTerms: 'View Terms of Service',
        viewPrivacy: 'View Privacy Policy',
        connect: 'Connect',
        disconnect: 'Disconnect',
        connected: 'Connected',
        save: 'Save Changes',
        close: 'Close',
        currPass: 'Current Password',
        newPass: 'New Password',
        confPass: 'Confirm New Password',
      }
    };
    return dict[language]?.[key] || dict['en']?.[key] || def;
  };

  // State configurations
  const [twoFa, setTwoFa] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [appNotifs, setAppNotifs] = useState(true);

  const [googleCalendar, setGoogleCalendar] = useState(false);
  const [canva, setCanva] = useState(false);
  const [linkedin, setLinkedin] = useState(false);
  const [behance, setBehance] = useState(false);

  // Dialog controllers
  const [isPassOpen, setIsPassOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form entries
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confPass, setConfPass] = useState('');

  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([
    { id: 'act_1', action: 'Successful Login', time: '2026-07-05 14:02:11', ip: '197.200.41.88 (Algiers, DZ)' },
    { id: 'act_2', action: 'Profile Information Edited', time: '2026-07-05 13:17:09', ip: '197.200.41.88 (Algiers, DZ)' },
    { id: 'act_3', action: 'Document Upload (Qualifications)', time: '2026-07-05 12:44:30', ip: '197.200.41.88 (Algiers, DZ)' },
  ]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('khidmatik_provider_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.twoFa !== undefined) setTwoFa(parsed.twoFa);
        if (parsed.emailNotifs !== undefined) setEmailNotifs(parsed.emailNotifs);
        if (parsed.smsNotifs !== undefined) setSmsNotifs(parsed.smsNotifs);
        if (parsed.appNotifs !== undefined) setAppNotifs(parsed.appNotifs);
        if (parsed.googleCalendar !== undefined) setGoogleCalendar(parsed.googleCalendar);
        if (parsed.canva !== undefined) setCanva(parsed.canva);
        if (parsed.linkedin !== undefined) setLinkedin(parsed.linkedin);
        if (parsed.behance !== undefined) setBehance(parsed.behance);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveSettings = (key: string, val: boolean) => {
    const current = localStorage.getItem('khidmatik_provider_settings');
    let settingsObj: any = {};
    if (current) {
      try {
        settingsObj = JSON.parse(current);
      } catch (e) {}
    }
    settingsObj[key] = val;
    localStorage.setItem('khidmatik_provider_settings', JSON.stringify(settingsObj));
  };

  const handleToggle = (key: string, val: boolean, label: string) => {
    switch (key) {
      case 'twoFa': setTwoFa(val); break;
      case 'emailNotifs': setEmailNotifs(val); break;
      case 'smsNotifs': setSmsNotifs(val); break;
      case 'appNotifs': setAppNotifs(val); break;
    }
    saveSettings(key, val);
    toast({
      title: label,
      description: `Preference changed successfully: ${val ? 'ENABLED' : 'DISABLED'}`
    });
  };

  const handleIntegration = (key: string, val: boolean, label: string) => {
    switch (key) {
      case 'googleCalendar': setGoogleCalendar(val); break;
      case 'canva': setCanva(val); break;
      case 'linkedin': setLinkedin(val); break;
      case 'behance': setBehance(val); break;
    }
    saveSettings(key, val);
    toast({
      title: label,
      description: val ? 'Connected successfully.' : 'Disconnected successfully.',
      variant: val ? 'default' : 'destructive'
    });
  };

  const handlePasswordChange = () => {
    if (!currPass || !newPass || !confPass) {
      toast({ title: 'Validation Error', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }
    if (newPass !== confPass) {
      toast({ title: 'Passwords mismatch', description: 'New password and confirmation password do not match.', variant: 'destructive' });
      return;
    }
    setIsPassOpen(false);
    setCurrPass('');
    setNewPass('');
    setConfPass('');
    
    const newLog: ActivityLogItem = {
      id: 'act_' + Date.now(),
      action: 'Password Changed Successfully',
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ip: '197.200.41.88 (Algiers, DZ)'
    };
    setActivityLogs([newLog, ...activityLogs]);

    toast({ title: 'Password Changed', description: 'Your password has been successfully updated.' });
  };

  const handleDownloadData = () => {
    const exportData = {
      platform: 'Khidmatik',
      provider: 'Amine Khelifa',
      exportedAt: new Date().toISOString(),
      security: { twoFactorEnabled: twoFa },
      notifications: { email: emailNotifs, sms: smsNotifs, inApp: appNotifs },
      integrations: { googleCalendar, canva, linkedin, behance }
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `khidmatik-profile-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Data Exported', description: 'JSON download initialized successfully.' });
  };

  const handleDeleteAccount = () => {
    setIsDeleteOpen(false);
    toast({
      title: 'Deletion Request Sent',
      description: 'Your account deletion request has been submitted to the support team.',
      variant: 'destructive'
    });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" /> {t('title', 'Account Settings & Integrations')}
        </h1>
        <p className="text-muted-foreground">{t('desc', 'Manage settings.')}</p>
      </header>

      {/* 1. Professional & Craftsman Location & Service Area Management */}
      <BusinessLocationManager 
        businessName="ورشة وخدمات الحرفي / المهني"
        businessType="craftsman"
        initialData={{
          city: 'سيدي بلعباس',
          wilaya: 'سيدي بلعباس',
          wilayaCode: '22',
          isLocationPublic: true,
          isMobileService: true,
          serviceAreaRadius: 30,
          serviceWilayas: ['سيدي بلعباس', 'وهران', 'عين تموشنت']
        }}
        onSave={async (data) => {
          localStorage.setItem('khidmatik_provider_location', JSON.stringify(data));
        }}
      />

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary"/> {t('security', 'Security')}</CardTitle>
          <CardDescription>{t('secDesc', 'Manage security.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/10">
            <div>
              <Label htmlFor="twoFa-toggle" className="font-semibold block">{t('twoFa', '2FA')}</Label>
              <span className="text-xs text-muted-foreground">{t('twoFaDesc', 'Require additional verification.')}</span>
            </div>
            <Switch id="twoFa-toggle" checked={twoFa} onCheckedChange={(checked) => handleToggle('twoFa', checked, t('twoFa', '2FA'))} />
          </div>
          <Button variant="outline" onClick={() => setIsPassOpen(true)}>
            <KeyRound className="h-4 w-4 mr-2" /> {t('changePass', 'Change Password')}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary"/> {t('notifs', 'Notifications')}</CardTitle>
          <CardDescription>{t('notifsDesc', 'Manage alerts.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-md">
            <Label htmlFor="email-toggle" className="font-medium flex-1 cursor-pointer">{t('emailNotifs', 'Email Bookings')}</Label>
            <Switch id="email-toggle" checked={emailNotifs} onCheckedChange={(checked) => handleToggle('emailNotifs', checked, t('emailNotifs', 'Email'))} />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md">
            <Label htmlFor="sms-toggle" className="font-medium flex-1 cursor-pointer">{t('smsNotifs', 'SMS Urgent')}</Label>
            <Switch id="sms-toggle" checked={smsNotifs} onCheckedChange={(checked) => handleToggle('smsNotifs', checked, t('smsNotifs', 'SMS'))} />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md">
            <Label htmlFor="app-toggle" className="font-medium flex-1 cursor-pointer">{t('appNotifs', 'In-App Messages')}</Label>
            <Switch id="app-toggle" checked={appNotifs} onCheckedChange={(checked) => handleToggle('appNotifs', checked, t('appNotifs', 'In-App'))} />
          </div>
        </CardContent>
      </Card>

      {/* Third-Party Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5 text-primary"/> {t('integrations', 'Integrations')}</CardTitle>
          <CardDescription>{t('intDesc', 'Connect with external services.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Google Calendar */}
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/10">
            <div>
              <span className="font-semibold block text-sm">{t('googleCalendar', 'Google Calendar')}</span>
              <span className="text-[10px] text-muted-foreground">Sync listing dates and bookings</span>
            </div>
            {googleCalendar ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> {t('connected', 'Connected')}</span>
                <Button size="sm" variant="destructive" onClick={() => handleIntegration('googleCalendar', false, t('googleCalendar', 'Google Calendar'))}>{t('disconnect', 'Disconnect')}</Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => handleIntegration('googleCalendar', true, t('googleCalendar', 'Google Calendar'))}>{t('connect', 'Connect')}</Button>
            )}
          </div>
          {/* Canva */}
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/10">
            <div>
              <span className="font-semibold block text-sm">{t('canva', 'Canva')}</span>
              <span className="text-[10px] text-muted-foreground">Upload graphic content templates</span>
            </div>
            {canva ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> {t('connected', 'Connected')}</span>
                <Button size="sm" variant="destructive" onClick={() => handleIntegration('canva', false, t('canva', 'Canva'))}>{t('disconnect', 'Disconnect')}</Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => handleIntegration('canva', true, t('canva', 'Canva'))}>{t('connect', 'Connect')}</Button>
            )}
          </div>
          {/* LinkedIn */}
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/10">
            <div>
              <span className="font-semibold block text-sm">{t('linkedin', 'LinkedIn')}</span>
              <span className="text-[10px] text-muted-foreground">Link corporate profile directly</span>
            </div>
            {linkedin ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> {t('connected', 'Connected')}</span>
                <Button size="sm" variant="destructive" onClick={() => handleIntegration('linkedin', false, t('linkedin', 'LinkedIn'))}>{t('disconnect', 'Disconnect')}</Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => handleIntegration('linkedin', true, t('linkedin', 'LinkedIn'))}>{t('connect', 'Connect')}</Button>
            )}
          </div>
          {/* Behance */}
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/10">
            <div>
              <span className="font-semibold block text-sm">{t('behance', 'Behance')}</span>
              <span className="text-[10px] text-muted-foreground">Import portfolio galleries</span>
            </div>
            {behance ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> {t('connected', 'Connected')}</span>
                <Button size="sm" variant="destructive" onClick={() => handleIntegration('behance', false, t('behance', 'Behance'))}>{t('disconnect', 'Disconnect')}</Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => handleIntegration('behance', true, t('behance', 'Behance'))}>{t('connect', 'Connect')}</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary"/> {t('activity', 'Activity Log')}</CardTitle>
          <CardDescription>{t('activityDesc', 'Monitor logins.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md divide-y overflow-hidden text-xs bg-white text-slate-800">
            {activityLogs.map(log => (
              <div key={log.id} className="p-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 block">{log.action}</span>
                  <span className="text-slate-500 text-[10px]">{log.ip}</span>
                </div>
                <span className="text-muted-foreground text-[10px] font-mono">{log.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-red-100 bg-red-50/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5 text-primary"/> {t('data', 'Data Management')}</CardTitle>
          <CardDescription>{t('dataDesc', 'Download or delete account.')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1 bg-white border-slate-200" onClick={handleDownloadData}>
            <Download className="h-4 w-4 mr-2" /> {t('downloadData', 'Download Data')}
          </Button>
          <Button variant="destructive" className="flex-1" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" /> {t('deleteAccount', 'Delete Account')}
          </Button>
        </CardContent>
      </Card>

      {/* Password Change Dialog */}
      <Dialog open={isPassOpen} onOpenChange={setIsPassOpen}>
        <DialogContent className="sm:max-w-md bg-white border text-slate-800 p-6">
          <DialogHeader>
            <DialogTitle>{t('changePass', 'Change Password')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div>
              <Label htmlFor="curr-pass">{t('currPass', 'Current Password')}</Label>
              <Input id="curr-pass" type="password" value={currPass} onChange={(e) => setCurrPass(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="new-pass">{t('newPass', 'New Password')}</Label>
              <Input id="new-pass" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="conf-pass">{t('confPass', 'Confirm New Password')}</Label>
              <Input id="conf-pass" type="password" value={confPass} onChange={(e) => setConfPass(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPassOpen(false)}>{t('close', 'Close')}</Button>
            <Button onClick={handlePasswordChange} className="bg-primary text-white">{t('save', 'Save Changes')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-white border text-slate-800 p-6">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-600" /> Confirm Account Deletion</DialogTitle>
            <DialogDescription>This action is completely irreversible. All your services, history, and earnings details will be permanently deleted from Khidmatik servers.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>{t('close', 'Close')}</Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>{t('deleteAccount', 'Delete Account')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
