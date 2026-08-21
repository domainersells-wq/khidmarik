
'use client';

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Zap, Hammer, AlertTriangle } from 'lucide-react';

interface EmergencySOSDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultServiceType?: ServiceType; // New prop
}

export type SosStep = 'initial' | 'selectService' | 'finalConfirmation';
export type ServiceType = 'plumbing' | 'electrical' | 'handyman' | '';

export const serviceOptions = [ // Exported for use elsewhere if needed
  { value: 'plumbing' as ServiceType, label: 'Plumbing Emergency', Icon: Wrench, description: "e.g., burst pipe, major uncontrollable leak" },
  { value: 'electrical' as ServiceType, label: 'Electrical Emergency', Icon: Zap, description: "e.g., sparks, outage risking safety, exposed live wires" },
  { value: 'handyman' as ServiceType, label: 'General Emergency', Icon: Hammer, description: "e.g., urgent security risk like broken door/window, critical structural issue" },
];

const EMERGENCY_FEE_DA = 5000; // Example fee in Algerian Dinars

export function EmergencySOSDialog({ isOpen, onOpenChange, defaultServiceType }: EmergencySOSDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<SosStep>('initial');
  const [selectedService, setSelectedService] = useState<ServiceType>(defaultServiceType || '');

  useEffect(() => {
    if (isOpen) {
      if (defaultServiceType) {
        setSelectedService(defaultServiceType);
        setStep('finalConfirmation');
      } else {
        // Reset to initial if no default is provided or if re-opened without default
        setSelectedService('');
        setStep('initial');
      }
    } else {
      // Reset when closed
      resetDialog();
    }
  }, [isOpen, defaultServiceType]);


  const resetDialog = () => {
    setStep('initial');
    setSelectedService(defaultServiceType || ''); // Re-apply default if dialog is just closed and re-opened with it
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open); // This will trigger the useEffect above if isOpen changes
  };

  const handleProceedToServiceSelection = () => {
    setStep('selectService');
  };

  const handleProceedToFinalConfirmation = () => {
    if (!selectedService) {
      toast({
        title: "Service Type Required",
        description: "Please select the type of emergency service you need.",
        variant: "destructive",
      });
      return;
    }
    setStep('finalConfirmation');
  };

  const handleActivateSOS = () => {
    // In a real app, this would trigger backend logic
    console.log(`SOS Activated for: ${selectedService} with fee ${EMERGENCY_FEE_DA} DA`);
    toast({
      title: "Emergency SOS Activated!",
      description: `${selectedServiceDetails?.label || 'Selected service'} professionals are being notified. You will be contacted shortly.`,
      variant: "default",
      duration: 7000,
    });
    onOpenChange(false); // Close dialog after activation
  };
  
  const selectedServiceDetails = serviceOptions.find(s => s.value === selectedService);

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center text-destructive mb-2">
            <AlertTriangle className="h-10 w-10 mr-2" />
            <AlertDialogTitle className="text-2xl font-bold">
              {step === 'initial' && "Emergency SOS Activation"}
              {step === 'selectService' && "Select Emergency Service"}
              {step === 'finalConfirmation' && `Confirm SOS: ${selectedServiceDetails?.label || 'Emergency'}`}
            </AlertDialogTitle>
          </div>
        </AlertDialogHeader>

        {step === 'initial' && (
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground text-center space-y-2">
              <p className="font-semibold text-lg">This feature is for URGENT situations only.</p>
              <p>
                Activating SOS will send a high-priority notification to pre-selected 24/7 emergency professionals.
                These notifications are designed to bypass silent mode on their devices.
              </p>
              <p className="font-medium text-destructive">
                An additional emergency service fee of approximately <strong className="font-bold">{EMERGENCY_FEE_DA.toLocaleString()} DA</strong> will apply, PLUS the cost of the actual service.
              </p>
            </div>
          </AlertDialogDescription>
        )}

        {step === 'selectService' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Choose the type of emergency you are experiencing:</p>
            <RadioGroup value={selectedService} onValueChange={(value: ServiceType) => setSelectedService(value)} className="space-y-3">
              {serviceOptions.map(option => {
                const OptionIcon = option.Icon;
                return (
                  <Label
                    key={option.value}
                    htmlFor={`service-${option.value}`}
                    className={`flex items-center space-x-3 p-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${selectedService === option.value ? 'border-primary ring-2 ring-primary bg-muted/50' : ''}`}
                  >
                    <RadioGroupItem value={option.value} id={`service-${option.value}`} className="sr-only" />
                    <OptionIcon className={`h-6 w-6 ${selectedService === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="flex-grow">
                      <span className="font-medium">{option.label}</span>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>
        )}

        {step === 'finalConfirmation' && selectedServiceDetails && (
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground text-center space-y-3">
               <p>You are about to activate an SOS for a <strong className="font-semibold">{selectedServiceDetails.label}</strong>.</p>
              <p>A high-priority notification will be sent immediately.</p>
              <p className="font-medium text-destructive">
                Remember, the emergency fee is approximately <strong className="font-bold">{EMERGENCY_FEE_DA.toLocaleString()} DA</strong>, plus the service cost.
              </p>
              <p className="text-sm text-muted-foreground">Are you sure you want to proceed?</p>
            </div>
          </AlertDialogDescription>
        )}
         {step === 'finalConfirmation' && !selectedServiceDetails && ( // Fallback if defaultServiceType was somehow invalid
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground text-center space-y-3">
                  <p className="font-semibold text-lg">Invalid service type for SOS.</p>
                  <p>Please go back and select a valid service type.</p>
              </div>
            </AlertDialogDescription>
        )}


        <AlertDialogFooter className="mt-4">
          {step === 'initial' && (
            <>
              <AlertDialogCancel onClick={() => handleClose(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleProceedToServiceSelection} className="bg-primary hover:bg-primary/90">
                Proceed
              </AlertDialogAction>
            </>
          )}
          {step === 'selectService' && (
            <>
              <Button variant="outline" onClick={() => setStep('initial')}>Back</Button>
              <AlertDialogAction onClick={handleProceedToFinalConfirmation} className="bg-primary hover:bg-primary/90" disabled={!selectedService}>
                Next
              </AlertDialogAction>
            </>
          )}
          {step === 'finalConfirmation' && (
            <>
              <Button variant="outline" onClick={() => {
                if (defaultServiceType) { // If came directly here, "Back" should go to "initial" or just close
                     onOpenChange(false); // Or setStep('initial') if preferred. This closes.
                } else {
                    setStep('selectService');
                }
              }}>
                {defaultServiceType ? 'Cancel' : 'Back'}
              </Button>
              <AlertDialogAction onClick={handleActivateSOS} className="bg-destructive hover:bg-destructive/90" disabled={!selectedServiceDetails}>
                Activate SOS Now
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
