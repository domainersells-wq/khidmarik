'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  KeyRound, ShieldCheck, Clock, RefreshCw, 
  Save, AlertCircle, CheckCircle2, Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { privateDeliveryCodeService } from '@/services/privateDeliveryCodeService';
import { PlatformDeliverySettings } from '@/types/privateDeliveryCode';

export function DeliverySettingsSection() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlatformDeliverySettings>(
    privateDeliveryCodeService.getPlatformDeliverySettings()
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSettings(privateDeliveryCodeService.getPlatformDeliverySettings());
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    try {
      const updated = privateDeliveryCodeService.updatePlatformDeliverySettings(settings);
      setSettings(updated);
      toast({
        title: 'Settings Saved ✓',
        description: 'Platform delivery verification and inspection timer settings updated.',
      });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-primary/10 via-card to-card border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase px-2.5 py-0.5 rounded-full">
              Platform Security
            </Badge>
            <span className="text-xs text-muted-foreground">• Delivery Confirmation Config</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-primary" /> Delivery Confirmation & Inspection Settings
          </h2>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            Configure private confirmation OTP generation, lockout thresholds, and doorstep inspection timers.
          </p>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="font-semibold rounded-xl h-10 px-5 gap-2 shrink-0">
          <Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Core Verification Rules */}
        <Card className="border shadow-sm bg-card rounded-2xl">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Core Verification Rules
            </CardTitle>
            <CardDescription className="text-xs">
              Cryptographic code generation and attempt lockout parameters.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Enable Delivery Confirmation Code</Label>
                <p className="text-[11px] text-muted-foreground">
                  Require customer OTP verification before an order can be marked as delivered.
                </p>
              </div>
              <Switch
                checked={settings.deliveryConfirmationEnabled}
                onCheckedChange={(val) => setSettings({ ...settings, deliveryConfirmationEnabled: val })}
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t">
              <Label className="text-xs font-semibold">Code Length (Digits)</Label>
              <Input
                type="number"
                min={4}
                max={8}
                value={settings.deliveryCodeLength}
                onChange={(e) => setSettings({ ...settings, deliveryCodeLength: parseInt(e.target.value) || 6 })}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">Standard 6-digit cryptographic PIN recommended.</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t">
              <Label className="text-xs font-semibold">Max Failed Attempts (Lockout Limit)</Label>
              <Input
                type="number"
                min={3}
                max={10}
                value={settings.maxDeliveryCodeAttempts}
                onChange={(e) => setSettings({ ...settings, maxDeliveryCodeAttempts: parseInt(e.target.value) || 5 })}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">Number of incorrect tries before the code is permanently locked.</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t">
              <Label className="text-xs font-semibold">Code Expiration (Days)</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={settings.deliveryCodeExpirationDays}
                onChange={(e) => setSettings({ ...settings, deliveryCodeExpirationDays: parseInt(e.target.value) || 15 })}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">Code expires if unverified after this duration.</p>
            </div>
          </CardContent>
        </Card>

        {/* Doorstep Inspection Session Rules */}
        <Card className="border shadow-sm bg-card rounded-2xl">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Doorstep Inspection Session
            </CardTitle>
            <CardDescription className="text-xs">
              Parameters governing customer product checking before code reveal.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Inspection Session Duration (Minutes)</Label>
              <Input
                type="number"
                min={3}
                max={30}
                value={settings.deliveryInspectionMinutes}
                onChange={(e) => setSettings({ ...settings, deliveryInspectionMinutes: parseInt(e.target.value) || 10 })}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Time granted to the customer to physically examine items before accepting/rejecting.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Require Customer Inspection</Label>
                <p className="text-[11px] text-muted-foreground">
                  Prompt customer to initiate inspection before revealing the confirmation code.
                </p>
              </div>
              <Switch
                checked={settings.requireCustomerInspection}
                onCheckedChange={(val) => setSettings({ ...settings, requireCustomerInspection: val })}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Allow Customer Code Regeneration</Label>
                <p className="text-[11px] text-muted-foreground">
                  Permit the customer to invalidate and generate a new code if compromised.
                </p>
              </div>
              <Switch
                checked={settings.allowCodeRegeneration}
                onCheckedChange={(val) => setSettings({ ...settings, allowCodeRegeneration: val })}
              />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 border-t p-4">
            <p className="text-[11px] text-muted-foreground">
              🛡️ All changes apply immediately to newly generated orders and live inspection sessions.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
