'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Mail,
  Smartphone,
  Volume2,
  ShoppingCart,
  Calendar,
  CreditCard,
  MessageSquare,
  Star,
  ShieldAlert,
  Award,
  Wallet,
  Megaphone,
  Check,
  Globe
} from 'lucide-react';
import { NotificationPreferences } from '@/types/notifications';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: NotificationPreferences;
  onSave: (newPrefs: Partial<NotificationPreferences>) => Promise<void>;
}

export function NotificationPreferencesModal({
  isOpen,
  onClose,
  preferences,
  onSave
}: NotificationPreferencesModalProps) {
  const { translate } = useLanguage();
  const { user } = useAuth();
  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences>(preferences);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalPrefs(preferences);
    setPushPermission(pushNotificationService.getPermissionStatus());
  }, [preferences, isOpen]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setLocalPrefs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleRequestPush = async () => {
    const res = await pushNotificationService.requestPermission();
    setPushPermission(res);
    if (res === 'granted' && user?.id) {
      await pushNotificationService.registerAndSubscribe(user.id);
      setLocalPrefs(prev => ({ ...prev, pushEnabled: true }));
    } else {
      setLocalPrefs(prev => ({ ...prev, pushEnabled: false }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localPrefs);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold font-headline">
                {translate('notificationPref', 'Notification Preferences')}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {translate('notificationPrefSub', 'Customize delivery channels and types of alerts you receive.')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 my-2">
          {/* SECTION 1: Delivery Channels */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              {translate('deliveryChannels', 'Delivery Channels')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* In-App */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-card/60 hover:bg-card transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <Label className="font-semibold text-sm cursor-pointer" htmlFor="inapp-switch">
                      {translate('inAppNotif', 'In-App Alerts')}
                    </Label>
                    <p className="text-xs text-muted-foreground">{translate('inAppDesc', 'Toast & sheet popups')}</p>
                  </div>
                </div>
                <Switch
                  id="inapp-switch"
                  checked={localPrefs.inAppEnabled}
                  onCheckedChange={() => handleToggle('inAppEnabled')}
                />
              </div>

              {/* Browser Push */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-card/60 hover:bg-card transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <Label className="font-semibold text-sm cursor-pointer" htmlFor="push-switch">
                      {translate('browserPush', 'Browser Push')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {pushPermission === 'granted' ? (
                        <span className="text-emerald-600 font-medium">● {translate('enabled', 'Enabled')}</span>
                      ) : (
                        translate('osNotification', 'Desktop & mobile push')
                      )}
                    </p>
                  </div>
                </div>
                {pushPermission === 'granted' ? (
                  <Switch
                    id="push-switch"
                    checked={localPrefs.pushEnabled}
                    onCheckedChange={() => handleToggle('pushEnabled')}
                  />
                ) : (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleRequestPush}>
                    {translate('enable', 'Enable')}
                  </Button>
                )}
              </div>

              {/* Email */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-card/60 hover:bg-card transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <Label className="font-semibold text-sm cursor-pointer" htmlFor="email-switch">
                      {translate('emailNotif', 'Email Summaries')}
                    </Label>
                    <p className="text-xs text-muted-foreground">{translate('emailDesc', 'HTML receipts & updates')}</p>
                  </div>
                </div>
                <Switch
                  id="email-switch"
                  checked={localPrefs.emailEnabled}
                  onCheckedChange={() => handleToggle('emailEnabled')}
                />
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-card/60 hover:bg-card transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500">
                    <Volume2 className="h-4 w-4" />
                  </div>
                  <div>
                    <Label className="font-semibold text-sm cursor-pointer" htmlFor="sound-switch">
                      {translate('soundEffects', 'Sound Chimes')}
                    </Label>
                    <p className="text-xs text-muted-foreground">{translate('soundDesc', 'Audible alert tone')}</p>
                  </div>
                </div>
                <Switch
                  id="sound-switch"
                  checked={localPrefs.soundEnabled}
                  onCheckedChange={() => handleToggle('soundEnabled')}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* SECTION 2: Notification Topics */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              {translate('alertCategories', 'Notification Topics & Activities')}
            </h4>
            <div className="space-y-2.5">
              {/* Orders */}
              <div className="flex items-center justify-between p-2.5 px-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-green-500/10 text-green-600">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{translate('orderUpdates', 'Orders & Deliveries')}</p>
                    <p className="text-xs text-muted-foreground">{translate('orderUpdatesDesc', 'New orders, dispatch status, acceptance, and cancellations')}</p>
                  </div>
                </div>
                <Switch
                  checked={localPrefs.notifyOrders}
                  onCheckedChange={() => handleToggle('notifyOrders')}
                />
              </div>

              {/* Bookings */}
              <div className="flex items-center justify-between p-2.5 px-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{translate('bookingUpdates', 'Craftsmen & Service Bookings')}</p>
                    <p className="text-xs text-muted-foreground">{translate('bookingUpdatesDesc', 'Appointment reservations, confirmations, and reminders')}</p>
                  </div>
                </div>
                <Switch
                  checked={localPrefs.notifyBookings}
                  onCheckedChange={() => handleToggle('notifyBookings')}
                />
              </div>

              {/* Payments & Escrow */}
              <div className="flex items-center justify-between p-2.5 px-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{translate('paymentUpdates', 'Payments, Escrow & Refunds')}</p>
                    <p className="text-xs text-muted-foreground">{translate('paymentUpdatesDesc', 'Deposit confirmations, escrow releases, refunds, and failures')}</p>
                  </div>
                </div>
                <Switch
                  checked={localPrefs.notifyPayments}
                  onCheckedChange={() => handleToggle('notifyPayments')}
                />
              </div>

              {/* Withdrawals */}
              <div className="flex items-center justify-between p-2.5 px-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-600">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{translate('withdrawalUpdates', 'Seller & Craftsman Payouts')}</p>
                    <p className="text-xs text-muted-foreground">{translate('withdrawalUpdatesDesc', 'CCP & bank withdrawal approval and dispatch status')}</p>
                  </div>
                </div>
                <Switch
                  checked={localPrefs.notifyWithdrawals}
                  onCheckedChange={() => handleToggle('notifyWithdrawals')}
                />
              </div>

              {/* Messages */}
              <div className="flex items-center justify-between p-2.5 px-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-600">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{translate('messageUpdates', 'Direct Messages & Chat')}</p>
                    <p className="text-xs text-muted-foreground">{translate('messageUpdatesDesc', 'Messages from customers, sellers, or craftsmen')}</p>
                  </div>
                </div>
                <Switch
                  checked={localPrefs.notifyMessages}
                  onCheckedChange={() => handleToggle('notifyMessages')}
                />
              </div>

              {/* Reviews & Disputes */}
              <div className="flex items-center justify-between p-2.5 px-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-600">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{translate('disputesAndReviews', 'Disputes & Reviews')}</p>
                    <p className="text-xs text-muted-foreground">{translate('disputesAndReviewsDesc', 'Escrow dispute cases, arbitration updates, and reviews')}</p>
                  </div>
                </div>
                <Switch
                  checked={localPrefs.notifyDisputes && localPrefs.notifyReviews}
                  onCheckedChange={(checked) => {
                    setLocalPrefs(prev => ({
                      ...prev,
                      notifyDisputes: checked,
                      notifyReviews: checked
                    }));
                  }}
                />
              </div>

              {/* Verification */}
              <div className="flex items-center justify-between p-2.5 px-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{translate('verificationUpdates', 'Account & KYC Verification')}</p>
                    <p className="text-xs text-muted-foreground">{translate('verificationUpdatesDesc', 'Approval or revision requests for provider badge and store')}</p>
                  </div>
                </div>
                <Switch
                  checked={localPrefs.notifyVerification}
                  onCheckedChange={() => handleToggle('notifyVerification')}
                />
              </div>

              {/* Announcements */}
              <div className="flex items-center justify-between p-2.5 px-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-violet-500/10 text-violet-600">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{translate('adminAnnouncements', 'Khidmatik Platform Announcements')}</p>
                    <p className="text-xs text-muted-foreground">{translate('announcementsDesc', 'Platform updates, service releases, and policy notices')}</p>
                  </div>
                </div>
                <Switch
                  checked={localPrefs.notifyAnnouncements}
                  onCheckedChange={() => handleToggle('notifyAnnouncements')}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {translate('cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-1.5">
            <Check className="h-4 w-4" />
            {isSaving ? translate('saving', 'Saving...') : translate('savePreferences', 'Save Preferences')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
