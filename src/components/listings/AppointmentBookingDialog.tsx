
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Image from 'next/image'; // Added Image
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Professional, AppointmentConfig, Appointment } from '@/types'; // Added Appointment
import { CalendarDays, User, StickyNote, Loader2, Info, TicketIcon, CheckCircle, MapPin, Navigation, Printer } from 'lucide-react'; // Added CheckCircle, TicketIcon
import { format, addDays, isBefore, startOfDay, isToday } from 'date-fns'; // Added isToday
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { createAuditLog, serializeServiceNotes, type ServiceNotesPayload } from '@/lib/proofOfService';

interface AppointmentBookingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  professional: Professional; 
  onAppointmentRequested?: (appointment: Appointment) => void; // Callback for profile page update
}

export function AppointmentBookingDialog({ isOpen, onOpenChange, professional, onAppointmentRequested }: AppointmentBookingDialogProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [patientName, setPatientName] = useState('');
  const [email, setEmail] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [location, setLocation] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastRequestedAppointment, setLastRequestedAppointment] = useState<Appointment | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    } else {
      setEmail('');
    }
  }, [user, isOpen]);

  const appointmentConfig = professional.appointmentConfig;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Unsupported",
        description: "Your browser does not support geolocation. Please enter your location manually.",
        variant: "destructive"
      });
      return;
    }

    setIsLocating(true);
    
    const options = {
      enableHighAccuracy: false, // IP/WiFi fallback is much more reliable on desktop than forcing hardware GPS
      timeout: 10000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`GPS Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setIsLocating(false);
        toast({
          title: "Location Acquired!",
          description: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}. Feel free to add specific details (flat, villa number etc).`,
        });
      },
      (error) => {
        console.error("Geolocation error details:", { code: error.code, message: error.message });
        setIsLocating(false);
        let errorMsg = "Could not access your location. Please type your address manually.";
        if (error.code === 1) {
          errorMsg = "Location permission denied. Please check your browser settings or enter it manually.";
        } else if (error.code === 2) {
          errorMsg = "Position unavailable. No GPS or network location signal. Please enter it manually.";
        } else if (error.code === 3) {
          errorMsg = "Request timed out. Please enter your location manually.";
        }
        toast({
          title: "Location Error",
          description: errorMsg,
          variant: "destructive"
        });
      },
      options
    );
  };

  const handleAppointmentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !patientName.trim() || !email.trim() || !location.trim()) {
      toast({ title: "Missing Information", description: "Please complete all required fields, including date and location.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const reservationId = `APT-${professional.name.slice(0,3).toUpperCase().replace(/\s+/g, '')}-${Date.now().toString().slice(-5)}`;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const customerId = user?.id || '00000000-0000-0000-0000-000000000000';
    
    const initialLog = createAuditLog('CREATE', `Appointment request created by client for ${patientName.trim()} with provider ${professional.name}`);
    const notesPayload: ServiceNotesPayload = {
      email: email.trim(),
      reason: reasonForVisit.trim(),
      location: location.trim(),
      policyNotes: 'Please arrive 10 mins early. Delays >15 mins may require rescheduling.',
      auditLogs: [initialLog]
    };
    const contactNotes = serializeServiceNotes(notesPayload);

    try {
      // 1. Insert to Supabase appointments table
      const { error } = await supabase
        .from('appointments')
        .insert({
          customer_id: customerId,
          provider_id: professional.id,
          date: dateStr,
          time_slot: '09:00 - 17:00',
          patient_name: patientName.trim(),
          reason_for_visit: reasonForVisit.trim(),
          status: 'pending_confirmation',
          notes: contactNotes
        });

      if (error) throw error;
    } catch (dbErr) {
      console.warn('Failed writing appointment to Supabase, saving to local storage fallback', dbErr);
    }

    // 2. Append to local storage fallback for offline/demo dashboard view
    const saved = localStorage.getItem('khidmatik_appointments');
    let localList = [];
    if (saved) {
      try { localList = JSON.parse(saved); } catch { localList = []; }
    }
    const localAppt = {
      id: reservationId,
      customer_id: customerId,
      provider_id: professional.id,
      date: dateStr,
      time_slot: '09:00 - 17:00',
      patient_name: patientName.trim(),
      reason_for_visit: reasonForVisit.trim(),
      status: 'pending_confirmation',
      notes: contactNotes,
      location: location.trim()
    };
    localStorage.setItem('khidmatik_appointments', JSON.stringify([localAppt, ...localList]));

    const newAppointment: Appointment = {
        reservationId,
        professionalId: professional.id,
        professionalName: professional.name,
        professionalCategory: professional.category,
        clinicLogoUrl: professional.clinicLogoUrl,
        date: selectedDate.toISOString(),
        patientName,
        reasonForVisit,
        status: 'pending_confirmation',
        notes: contactNotes,
        location: location.trim()
    };
    
    setLastRequestedAppointment(newAppointment);
    setShowConfirmation(true);

    if (onAppointmentRequested) {
        onAppointmentRequested(newAppointment);
    }

    toast({
      title: "Appointment Request Submitted!",
      description: `Ref ID: ${newAppointment.reservationId}. We've sent your request for ${format(selectedDate, "PPP")} with ${professional.name}. You'll be contacted for confirmation.`,
      duration: 7000,
    });
    setIsSubmitting(false);
  };

  const handleCloseDialog = () => {
    onOpenChange(false);
    // Reset state fully after dialog transition
    setTimeout(() => {
        setSelectedDate(undefined);
        setPatientName('');
        setEmail('');
        setReasonForVisit('');
        setLocation('');
        setIsSubmitting(false);
        setShowConfirmation(false);
        setLastRequestedAppointment(null);
    }, 300);
  };

  const minBookingDate = appointmentConfig?.leadTimeDays
    ? addDays(startOfDay(new Date()), appointmentConfig.leadTimeDays)
    : startOfDay(new Date());
  
  const handleDownloadTicket = () => {
    if (!lastRequestedAppointment) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Pop-up Blocked",
        description: "Please allow pop-ups to print your ticket.",
        variant: "destructive"
      });
      return;
    }
    
    const formattedDate = format(new Date(lastRequestedAppointment.date), "PPP");
    const gpsCoords = lastRequestedAppointment.location?.match(/GPS Coordinates:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    const mapsLink = gpsCoords 
      ? `<a href="https://www.google.com/maps/search/?api=1&query=${gpsCoords[1]},${gpsCoords[2]}" target="_blank" style="color: #10b981; text-decoration: underline; font-weight: 500; margin-left: 10px;">View on Maps</a>`
      : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
        <head>
          <meta charset="utf-8">
          <title>Appointment Ticket - ${lastRequestedAppointment.reservationId}</title>
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
                    <div class="info-value" style="color: #059669; font-family: monospace; font-size: 16px;">${lastRequestedAppointment.reservationId}</div>
                  </div>
                  <div class="info-group">
                    <div class="info-label">Status</div>
                    <div class="info-value" style="color: #3b82f6;">Pending Confirmation</div>
                  </div>
                  <div class="info-group full-width">
                    <div class="info-label">Service Provider / Professional</div>
                    <div class="info-value">${lastRequestedAppointment.professionalName}</div>
                  </div>
                  <div class="info-group">
                    <div class="info-label">Patient / Client Name</div>
                    <div class="info-value">${lastRequestedAppointment.patientName}</div>
                  </div>
                  <div class="info-group">
                    <div class="info-label">Preferred Date</div>
                    <div class="info-value">${formattedDate}</div>
                  </div>
                  <div class="info-group full-width">
                    <div class="info-label">Location / Address</div>
                    <div class="info-value">${lastRequestedAppointment.location || 'Not Specified'} ${mapsLink}</div>
                  </div>
                  ${lastRequestedAppointment.reasonForVisit ? `
                  <div class="info-group full-width">
                    <div class="info-label">Reason for Request</div>
                    <div class="info-value" style="font-weight: normal; font-size: 14px; color: #4b5563;">${lastRequestedAppointment.reasonForVisit}</div>
                  </div>
                  ` : ''}
                </div>
                
                <div class="policy-box">
                  <strong>Punctuality Policy / سياسة الالتزام بالحضور</strong>
                  يرجى الحضور قبل 10 دقائق من موعد الخدمة المحدد. التأخير لأكثر من 15 دقيقة قد يؤدي إلى إلغاء موعد الحجز أو إعادة جدولته تلقائياً.
                </div>
                
                <div class="barcode-container">
                  <div class="barcode"></div>
                  <div class="barcode-text">${lastRequestedAppointment.reservationId}</div>
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
    toast({
      title: "Print layout launched!",
      description: "Please check your browser print dialog."
    });
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-md">
        {!showConfirmation ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {professional.clinicLogoUrl && (
                    <Image src={professional.clinicLogoUrl} alt={`${professional.name} Logo`} width={32} height={32} className="mr-2 rounded-sm" />
                )}
                <CalendarDays className="mr-2 h-5 w-5 text-primary" />
                Book Appointment with {professional.name}
              </DialogTitle>
              <DialogDescription>
                Select a date and provide details. We'll confirm availability.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAppointmentSubmit} className="space-y-4 py-2">
              <div>
                <Label htmlFor="patientName">Full Name *</Label>
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div>
                <Label htmlFor="location">Service Location / Address *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter address or click Locate Me"
                      className="pr-10"
                      required
                    />
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="flex gap-1.5 items-center shrink-0"
                  >
                    {isLocating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4 text-primary" />
                    )}
                    Locate Me
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Provide your address so the provider can travel to you.
                </p>
              </div>

              <div>
                <Label>Preferred Date *</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border p-0 mx-auto"
                  disabled={(date) => isBefore(date, minBookingDate) || isBefore(date, startOfDay(new Date())) }
                />
                {selectedDate && (
                    <p className="text-sm text-center mt-2 text-muted-foreground">
                        Selected: {format(selectedDate, "PPP")}
                    </p>
                )}
                {appointmentConfig && (
                    <p className="text-xs text-center mt-1 text-muted-foreground">
                        (Note: Bookings must be at least {appointmentConfig.leadTimeDays} day(s) in advance. Conceptual daily capacity: {appointmentConfig.dailyCapacity} slots.)
                    </p>
                )}
              </div>

              <div>
                <Label htmlFor="reasonForVisit">Reason for Visit (Optional)</Label>
                <Textarea
                  id="reasonForVisit"
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  placeholder="Briefly describe the reason (e.g., general check-up, specific symptom)"
                  rows={3}
                />
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm flex items-start gap-2">
                  <Info className="h-5 w-5 mt-0.5 shrink-0" />
                  <div>
                      <span className="font-semibold">Confirmation:</span> This is a request. The professional's office will contact you to confirm the exact time and availability.
                      <br />
                      <span className="font-semibold mt-1 block">Punctuality:</span> Please arrive at least 10 minutes before your scheduled time. Delays of more than 15 minutes may lead to your appointment being rescheduled.
                  </div>
              </div>

              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting || !selectedDate || !patientName.trim()}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Request Appointment
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : lastRequestedAppointment && (
            <>
             <DialogHeader>
                <DialogTitle className="flex items-center text-green-600">
                    <CheckCircle className="mr-2 h-6 w-6" />
                    Appointment Request Sent!
                </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-3 text-sm">
                <p>Your request details:</p>
                <ul className="list-disc list-inside pl-4 bg-muted/50 p-3 rounded-md">
                    <li><strong>Reservation ID:</strong> {lastRequestedAppointment.reservationId}</li>
                    <li><strong>Professional:</strong> {lastRequestedAppointment.professionalName}</li>
                    <li><strong>Date:</strong> {format(new Date(lastRequestedAppointment.date), "PPP")}</li>
                    <li><strong>Patient:</strong> {lastRequestedAppointment.patientName}</li>
                </ul>
                <p className="text-muted-foreground">You will receive a confirmation from the professional's office soon. Remember the punctuality policy.</p>
                <Button onClick={handleDownloadTicket} variant="outline" className="w-full mt-3 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Printer className="mr-2 h-4 w-4"/> Print / Save Ticket (PDF)
                </Button>
            </div>
            <DialogFooter>
                <Button onClick={handleCloseDialog}>Close</Button>
            </DialogFooter>
            </>
        )}
      </DialogContent>
    </Dialog>
  );
}
