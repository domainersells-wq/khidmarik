'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { CalendarClock, Settings, CheckCircle, XCircle, Eye, PlusCircle, Clock, User, Loader2, MapPin, Navigation, Printer, Download, ShieldAlert, Star, RefreshCw, AlertTriangle, CheckSquare, Camera, Play, CheckCircle2, EyeOff, Trash2, Plus, ArrowUp, ArrowDown, Info, Check, Shield, FileText, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { parseServiceNotes, serializeServiceNotes, createAuditLog, generateOTP, hashOTP, getDeviceAndBrowser, type ServiceNotesPayload, type MaterialItem, type WorkChecklist } from '@/lib/proofOfService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, addDays, setHours, setMinutes } from 'date-fns';

const defaultAppointments = [
  { id: 'app1', clientName: 'Amina B.', service: 'Consultation Call', date: setMinutes(setHours(addDays(new Date(), 1), 10), 0).toISOString(), status: 'Confirmed', notes: 'Discuss project scope.' },
  { id: 'app2', clientName: 'Karim L.', service: 'On-site Visit', date: setMinutes(setHours(addDays(new Date(), 2), 14), 30).toISOString(), status: 'Pending', notes: 'Site assessment.' },
  { id: 'app3', clientName: 'Yasmine D.', service: 'Digital Audit Review', date: setMinutes(setHours(addDays(new Date(), 3), 9), 0).toISOString(), status: 'Confirmed', notes: '' },
];

const defaultAvailability = {
  workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Sun'],
  startHour: '09:00',
  endHour: '17:00',
  bufferMinutes: 15,
};

export function ProviderBookingsCalendarSection() {
  const { toast } = useToast();
  const { translate } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [viewingAppointment, setViewingAppointment] = useState<any | null>(null);

  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Proof of Service Completion Report States
  const [isPossFormOpen, setIsPossFormOpen] = useState(false);
  const [reportTab, setReportTab] = useState<'summary' | 'evidence' | 'notes' | 'materials' | 'gps'>('summary');
  const [finishDuration, setFinishDuration] = useState('1 hour');
  
  // Section 2: Work Evidence
  const [beforePhotos, setBeforePhotos] = useState<string[]>(['/uploads/before_leak1.jpg', '/uploads/before_leak2.jpg']);
  const [afterPhotos, setAfterPhotos] = useState<string[]>(['/uploads/after_fixed1.jpg', '/uploads/after_fixed2.jpg']);
  
  // Section 3: Completion Notes & Character Count
  const [completionNotesText, setCompletionNotesText] = useState('');
  
  // Section 4: Materials Used
  const [materialsUsed, setMaterialsUsed] = useState<MaterialItem[]>([]);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialQty, setNewMaterialQty] = useState(1);
  const [newMaterialPrice, setNewMaterialPrice] = useState(0);
  
  // Section 5: Work Checklist
  const [workChecklist, setWorkChecklist] = useState<WorkChecklist>({
    workDone: false,
    cleanUp: false,
    tested: false,
    explained: false
  });
  
  // Section 6: GPS Verification details
  const [gpsVerified, setGpsVerified] = useState(false);
  const [gpsCoords, setGpsCoords] = useState('');
  const [gpsVerifiedAt, setGpsVerifiedAt] = useState('');

  // Submit confirmation dialog state
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // OTP Verification state
  const [enteredOtp, setEnteredOtp] = useState('');

  // Form state
  const [formClientName, setFormClientName] = useState('');
  const [formService, setFormService] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('10:00');
  const [formNotes, setFormNotes] = useState('');

  // Availability state
  const [availability, setAvailability] = useState(defaultAvailability);

  const extractLocation = (notes?: string): string => {
    if (!notes) return '';
    const match = notes.match(/Location:\s*([^\n]+)/);
    return match ? match[1].trim() : '';
  };

  const handleExportCSV = () => {
    if (appointments.length === 0) {
      toast({ title: "No Bookings", description: "There are no bookings to export." });
      return;
    }
    
    const headers = ["ID", "Client Name", "Service", "Date & Time", "Status", "Notes", "Location"];
    const rows = appointments.map(appt => [
      appt.id,
      appt.clientName,
      appt.service,
      appt.date,
      appt.status,
      appt.notes ? appt.notes.replace(/"/g, '""').replace(/\n/g, ' ') : '',
      appt.location || ''
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${val}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `khidmatik_bookings_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "CSV Exported Successfully!",
      description: `Downloaded list of ${appointments.length} appointments.`,
    });
  };

  const handleMarkEnRoute = async (id: string) => {
    const appt = appointments.find(a => a.id === id);
    const clientName = appt?.clientName || 'Client';
    const serviceName = appt?.service || 'Service Request';

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isDbAppt = uuidRegex.test(id);

    let customerEmail = 'client@khidmatik.dz';
    if (appt?.notes && appt.notes.includes('Contact Email:')) {
      const match = appt.notes.match(/Contact Email:\s*([^\s\n]+)/);
      if (match && match[1]) {
        customerEmail = match[1];
      }
    }

    if (!user || !isDbAppt) {
      const saved = localStorage.getItem('khidmatik_appointments');
      let updatedList = [];
      if (saved) {
        try {
          const list = JSON.parse(saved);
          updatedList = list.map((a: any) =>
            (a.id === id || a.reservationId === id) ? { ...a, status: 'en_route' } : a
          );
          localStorage.setItem('khidmatik_appointments', JSON.stringify(updatedList));
        } catch (e) {
          console.error(e);
        }
      }

      const updated = appointments.map(a => a.id === id ? { ...a, status: 'en_route' } : a);
      setAppointments(updated);

      toast({
        title: "🚗 Provider is En Route!",
        description: `Delivering traveling notification to ${clientName} (${customerEmail})...`,
      });

      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'en_route' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "🚗 Provider is En Route!",
        description: `Delivering traveling notification to ${clientName} (${customerEmail})...`,
      });

      loadAppointments();
    } catch (e: any) {
      console.error('Error marking en route:', e);
      toast({ title: 'Error Updating Status', description: e.message, variant: 'destructive' });
    }
  };

  const handleStartService = async (id: string) => {
    const appt = appointments.find(a => a.id === id);
    if (!appt) return;

    let gpsCoords = "Not provided";
    setIsLoading(true);

    try {
      const position = await new Promise<GeolocationPosition | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          () => resolve(null),
          { timeout: 5000 }
        );
      });
      if (position) {
        gpsCoords = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
      }
    } catch (e) {
      console.warn("Could not acquire position:", e);
    }

    const payload = parseServiceNotes(appt.notes);
    const startLog = createAuditLog('START_SERVICE', `Service execution started by professional`, gpsCoords);
    
    payload.startTime = new Date().toISOString();
    payload.startGps = gpsCoords;
    const { device } = getDeviceAndBrowser();
    payload.startDevice = device;
    payload.auditLogs.push(startLog);
    
    const updatedNotes = serializeServiceNotes(payload);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isDbAppt = uuidRegex.test(id);

    if (!user || !isDbAppt) {
      // Save locally
      const saved = localStorage.getItem('khidmatik_appointments');
      if (saved) {
        try {
          const list = JSON.parse(saved);
          const updatedList = list.map((a: any) =>
            (a.id === id || a.reservationId === id) ? { ...a, status: 'in_progress', notes: updatedNotes } : a
          );
          localStorage.setItem('khidmatik_appointments', JSON.stringify(updatedList));
        } catch (e) { console.error(e); }
      }
      
      const updated = appointments.map(a => a.id === id ? { ...a, status: 'in_progress', notes: updatedNotes } : a);
      setAppointments(updated);
      setViewingAppointment((prev: any) => prev ? { ...prev, status: 'in_progress', notes: updatedNotes } : null);
      setIsLoading(false);
      toast({ title: "Service Started!", description: "Status changed to In Progress. Logs and GPS coordinates recorded." });
      return;
    }

    try {
      await supabase.from('appointments').update({ status: 'in_progress', notes: updatedNotes }).eq('id', id);
      await supabase.from('notifications').insert({
        user_id: appt.customer_id || appt.customerId || '00000000-0000-0000-0000-000000000000',
        title: 'Service Execution Started',
        message: `The professional has started executing the service: "${appt.service}"`,
        type: 'appointment'
      });
      toast({ title: "Service Started!", description: "Status updated successfully." });
      loadAppointments();
      setViewingAppointment((prev: any) => prev ? { ...prev, status: 'in_progress', notes: updatedNotes } : null);
    } catch (e: any) {
      toast({ title: 'Error starting service', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishService = async (
    id: string, 
    duration: string, 
    finishNotesText: string, 
    beforeFiles: string[], 
    afterFiles: string[], 
    materials: MaterialItem[], 
    checklist: WorkChecklist,
    gpsVerify: boolean,
    gpsCoordVal: string,
    gpsTimeVal: string
  ) => {
    const appt = appointments.find(a => a.id === id);
    if (!appt) return;

    setIsLoading(true);
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

    const payload = parseServiceNotes(appt.notes);
    const finishLog = createAuditLog('FINISH_SERVICE', `Service completion reported. Duration: ${duration}. Notes: ${finishNotesText}`, gpsVerify ? gpsCoordVal : undefined);
    
    payload.endTime = new Date().toISOString();
    payload.endDuration = duration;
    payload.endNotes = finishNotesText;
    payload.endPhotos = [...beforeFiles, ...afterFiles]; // for legacy support
    
    // Detailed completion fields
    payload.beforePhotos = beforeFiles;
    payload.afterPhotos = afterFiles;
    payload.materialsUsed = materials;
    payload.workChecklist = checklist;
    payload.completionNotesText = finishNotesText;
    payload.gpsVerified = gpsVerify;
    payload.gpsVerifiedAt = gpsVerify ? gpsTimeVal : undefined;
    payload.gpsCoords = gpsVerify ? gpsCoordVal : undefined;
    
    payload.otpCode = otp;
    payload.otpCodeHash = otpHash;
    payload.otpExpiresAt = expiresAt;
    payload.failedOtpAttempts = 0;
    payload.otpLocked = false;
    payload.auditLogs.push(finishLog);

    const updatedNotes = serializeServiceNotes(payload);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isDbAppt = uuidRegex.test(id);

    if (!user || !isDbAppt) {
      const saved = localStorage.getItem('khidmatik_appointments');
      if (saved) {
        try {
          const list = JSON.parse(saved);
          const updatedList = list.map((a: any) =>
            (a.id === id || a.reservationId === id) ? { ...a, status: 'waiting_verification', notes: updatedNotes } : a
          );
          localStorage.setItem('khidmatik_appointments', JSON.stringify(updatedList));
        } catch (e) { console.error(e); }
      }
      
      // Save notification to local storage
      try {
        const savedNotifs = localStorage.getItem('khidmatik_notifications');
        let notifList = [];
        if (savedNotifs) {
          try { notifList = JSON.parse(savedNotifs); } catch {}
        }
        const newNotif = {
          id: 'notif_' + Date.now(),
          type: 'reservation',
          title: 'Verification OTP Generated / رمز التحقق المولد',
          message: `Your professional completed service for "${appt.service}". Verification OTP / رمز التحقق: ${otp}. Please provide this to the professional.`,
          timestamp: new Date().toISOString(),
          icon: 'ShieldCheck',
          isRead: false
        };
        localStorage.setItem('khidmatik_notifications', JSON.stringify([newNotif, ...notifList]));
        window.dispatchEvent(new Event('khidmatik_notif_update'));
      } catch (e) {
        console.error('Error saving local notification:', e);
      }
      
      const updated = appointments.map(a => a.id === id ? { ...a, status: 'waiting_verification', notes: updatedNotes } : a);
      setAppointments(updated);
      setViewingAppointment((prev: any) => prev ? { ...prev, status: 'waiting_verification', notes: updatedNotes } : null);
      setIsLoading(false);
      toast({ title: "Verification OTP Created", description: `OTP: ${otp}. Status is now Waiting Verification.` });
      return;
    }

    try {
      await supabase.from('appointments').update({ status: 'waiting_verification', notes: updatedNotes }).eq('id', id);
      await supabase.from('notifications').insert({
        user_id: appt.customer_id || appt.customerId || '00000000-0000-0000-0000-000000000000',
        title: 'Verification OTP Generated / رمز التحقق المولد',
        message: `Please verify service completion and provide this 6-digit OTP code to your professional: ${otp}.`,
        type: 'appointment'
      });
      
      // Save notification to local storage for local testing sync
      try {
        const savedNotifs = localStorage.getItem('khidmatik_notifications');
        let notifList = [];
        if (savedNotifs) {
          try { notifList = JSON.parse(savedNotifs); } catch {}
        }
        const newNotif = {
          id: 'notif_' + Date.now(),
          type: 'reservation',
          title: 'Verification OTP Generated / رمز التحقق المولد',
          message: `Please verify service completion and provide this 6-digit OTP code to your professional: ${otp}.`,
          timestamp: new Date().toISOString(),
          icon: 'ShieldCheck',
          isRead: false
        };
        localStorage.setItem('khidmatik_notifications', JSON.stringify([newNotif, ...notifList]));
        window.dispatchEvent(new Event('khidmatik_notif_update'));
      } catch (e) { console.error('Error saving local notification:', e); }

      toast({ title: "Success", description: `Verification OTP generated: ${otp}` });
      loadAppointments();
      setViewingAppointment((prev: any) => prev ? { ...prev, status: 'waiting_verification', notes: updatedNotes } : null);
    } catch (e: any) {
      toast({ title: 'Error finishing service', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (id: string, enteredCode: string) => {
    const appt = appointments.find(a => a.id === id);
    if (!appt) return;

    setIsLoading(true);
    const payload = parseServiceNotes(appt.notes);
    
    if (payload.otpLocked) {
      setIsLoading(false);
      toast({ title: "Verification Blocked", description: "This verification code has been locked due to too many failed attempts. Contact admin.", variant: "destructive" });
      return;
    }

    const now = new Date();
    const expiry = payload.otpExpiresAt ? new Date(payload.otpExpiresAt) : new Date(0);
    if (now > expiry) {
      setIsLoading(false);
      toast({ title: "OTP Expired", description: "Verification code expired. Ask the client to request a reset or contact admin.", variant: "destructive" });
      return;
    }

    const hashedInput = await hashOTP(enteredCode.trim());
    if (hashedInput === payload.otpCodeHash) {
      // OTP is valid!
      const verifyLog = createAuditLog('VERIFY_OTP_SUCCESS', `OTP code verified successfully by provider`);
      payload.auditLogs.push(verifyLog);
      
      const updatedNotes = serializeServiceNotes(payload);

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isDbAppt = uuidRegex.test(id);

      if (!user || !isDbAppt) {
        const saved = localStorage.getItem('khidmatik_appointments');
        if (saved) {
          try {
            const list = JSON.parse(saved);
            const updatedList = list.map((a: any) =>
              (a.id === id || a.reservationId === id) ? { ...a, status: 'completed', notes: updatedNotes } : a
            );
            localStorage.setItem('khidmatik_appointments', JSON.stringify(updatedList));
          } catch (e) { console.error(e); }
        }
        
        const updated = appointments.map(a => a.id === id ? { ...a, status: 'completed', notes: updatedNotes } : a);
        setAppointments(updated);
        setViewingAppointment((prev: any) => prev ? { ...prev, status: 'completed', notes: updatedNotes } : null);
        setIsLoading(false);
        setEnteredOtp('');
        toast({ title: "OTP Verified!", description: "Service marked as Completed successfully!" });
        return;
      }

      try {
        await supabase.from('appointments').update({ status: 'completed', notes: updatedNotes }).eq('id', id);
        await supabase.from('notifications').insert({
          user_id: appt.customer_id || appt.customerId || '00000000-0000-0000-0000-000000000000',
          title: 'Service Completed Successfully',
          message: `Verification code matched! Service reservation ${appt.id} is now Completed.`,
          type: 'appointment'
        });
        toast({ title: "OTP Verified!", description: "Service completed successfully!" });
        loadAppointments();
        setViewingAppointment((prev: any) => prev ? { ...prev, status: 'completed', notes: updatedNotes } : null);
        setEnteredOtp('');
      } catch (e: any) {
        toast({ title: 'Error completing service', description: e.message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Invalid OTP code
      const attempts = (payload.failedOtpAttempts || 0) + 1;
      payload.failedOtpAttempts = attempts;
      
      let details = `Invalid OTP attempt #${attempts} entered: ${enteredCode}`;
      if (attempts >= 3) {
        payload.otpLocked = true;
        details = `OTP code locked. Maximum attempts (3) exceeded.`;
      }
      
      const failLog = createAuditLog('VERIFY_OTP_FAILED', details);
      payload.auditLogs.push(failLog);
      
      const updatedNotes = serializeServiceNotes(payload);

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isDbAppt = uuidRegex.test(id);

      if (!user || !isDbAppt) {
        const saved = localStorage.getItem('khidmatik_appointments');
        if (saved) {
          try {
            const list = JSON.parse(saved);
            const updatedList = list.map((a: any) =>
              (a.id === id || a.reservationId === id) ? { ...a, notes: updatedNotes } : a
            );
            localStorage.setItem('khidmatik_appointments', JSON.stringify(updatedList));
          } catch (e) { console.error(e); }
        }
        const updated = appointments.map(a => a.id === id ? { ...a, notes: updatedNotes } : a);
        setAppointments(updated);
        setViewingAppointment((prev: any) => prev ? { ...prev, notes: updatedNotes } : null);
        setIsLoading(false);
        if (attempts >= 3) {
          toast({ title: "OTP Locked", description: "Too many failed attempts. Code locked.", variant: "destructive" });
        } else {
          toast({ title: "Invalid OTP", description: `Incorrect code entered. Attempts: ${attempts}/3.`, variant: "destructive" });
        }
        return;
      }

      try {
        await supabase.from('appointments').update({ notes: updatedNotes }).eq('id', id);
        toast({
          title: "Invalid OTP",
          description: attempts >= 3 ? "Attempts exceeded. Locked." : `Incorrect code. Attempts: ${attempts}/3.`,
          variant: "destructive"
        });
        loadAppointments();
        setViewingAppointment((prev: any) => prev ? { ...prev, notes: updatedNotes } : null);
      } catch (e: any) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const loadAppointments = async () => {
    setIsLoading(true);
    if (!user || !user.storeId) {
      const saved = localStorage.getItem('khidmatik_appointments');
      if (saved) {
        try {
          const list = JSON.parse(saved);
          const mapped = list.map((appt: any) => ({
            id: appt.id || appt.reservationId,
            clientName: appt.clientName || appt.patient_name || 'Client',
            service: appt.service || appt.reason_for_visit || 'Service',
            date: appt.date,
            status: appt.status || 'Pending',
            notes: appt.notes || '',
            location: appt.location || extractLocation(appt.notes),
          }));
          setAppointments(mapped);
        } catch {
          setAppointments(defaultAppointments);
        }
      } else {
        setAppointments(defaultAppointments);
        localStorage.setItem('khidmatik_appointments', JSON.stringify(defaultAppointments));
      }
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('provider_id', user.storeId)
        .order('date', { ascending: true });

      if (error) throw error;

      let dbMapped: any[] = [];
      if (data && data.length > 0) {
        dbMapped = data.map((appt: any) => {
          let combinedDateString = appt.date;
          try {
            if (appt.time_slot) {
              const [hours, minutes] = appt.time_slot.split(':').map(Number);
              if (!isNaN(hours) && !isNaN(minutes)) {
                const d = new Date(appt.date);
                d.setHours(hours, minutes, 0, 0);
                combinedDateString = d.toISOString();
              }
            }
          } catch (e) {
            console.error('Failed to parse date/time:', e);
          }

          return {
            id: appt.id,
            clientName: appt.patient_name,
            service: appt.reason_for_visit,
            date: combinedDateString,
            status: appt.status,
            notes: appt.notes || '',
            location: appt.location || extractLocation(appt.notes),
          };
        });
      }

      // Also load local storage bookings that match this provider
      const saved = localStorage.getItem('khidmatik_appointments');
      let localMapped: any[] = [];
      if (saved) {
        try {
          const list = JSON.parse(saved);
          localMapped = list
            .filter((appt: any) => appt.provider_id === user.storeId)
            .map((appt: any) => ({
              id: appt.id || appt.reservationId,
              clientName: appt.clientName || appt.patient_name || 'Client',
              service: appt.service || appt.reason_for_visit || 'Service',
              date: appt.date,
              status: appt.status || 'Pending',
              notes: appt.notes || '',
              location: appt.location || extractLocation(appt.notes),
            }));
        } catch (e) {
          console.error(e);
        }
      }

      // Merge data (removing duplicate reservation ids)
      const merged = [...dbMapped];
      localMapped.forEach((l: any) => {
        if (!merged.some(m => m.id === l.id)) {
          merged.push(l);
        }
      });

      setAppointments(merged);
    } catch (e) {
      console.error('Error loading appointments from Supabase:', e);
      const saved = localStorage.getItem('khidmatik_appointments');
      if (saved) {
        try {
          const list = JSON.parse(saved);
          const mapped = list.map((appt: any) => ({
            id: appt.id || appt.reservationId,
            clientName: appt.clientName || appt.patient_name || 'Client',
            service: appt.service || appt.reason_for_visit || 'Service',
            date: appt.date,
            status: appt.status || 'Pending',
            notes: appt.notes || '',
            location: appt.location || extractLocation(appt.notes),
          }));
          setAppointments(mapped);
        } catch {
          setAppointments(defaultAppointments);
        }
      } else {
        setAppointments(defaultAppointments);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadAppointments();
    }
  }, [user, authLoading]);

  useEffect(() => {
    const savedAvail = localStorage.getItem('khidmatik_availability');
    if (savedAvail) {
      try { setAvailability(JSON.parse(savedAvail)); } catch { /* use default */ }
    }
  }, []);

  const persist = (updated: any[]) => {
    setAppointments(updated);
    localStorage.setItem('khidmatik_appointments', JSON.stringify(updated));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const openAddForm = () => {
    setFormClientName('');
    setFormService('');
    setFormDate(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    setFormTime('10:00');
    setFormNotes('');
    setIsFormOpen(true);
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientName.trim() || !formService.trim() || !formDate) {
      toast({ title: translate('validationError', 'Validation Error'), description: translate('fillRequiredFields', 'Please fill all required fields.'), variant: 'destructive' });
      return;
    }
    const [hours, minutes] = formTime.split(':').map(Number);
    const dateObj = setMinutes(setHours(new Date(formDate), hours), minutes);

    if (!user || !user.storeId) {
      const newAppt = {
        id: 'app_' + Date.now(),
        clientName: formClientName.trim(),
        service: formService.trim(),
        date: dateObj.toISOString(),
        status: 'Pending',
        notes: formNotes.trim(),
      };
      const updated = [newAppt, ...appointments];
      persist(updated);
      setIsFormOpen(false);
      toast({ title: translate('appointmentAdded', 'Appointment Added'), description: translate('appointmentAddedDesc', 'New appointment has been scheduled.') });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          customer_id: '00000000-0000-0000-0000-000000000000', // System Owner fallback customer
          provider_id: user.storeId,
          date: formDate,
          time_slot: formTime,
          patient_name: formClientName.trim(),
          reason_for_visit: formService.trim(),
          status: 'Pending',
          notes: formNotes.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: translate('appointmentAdded', 'Appointment Added'), description: translate('appointmentAddedDesc', 'New appointment has been scheduled.') });
      setIsFormOpen(false);
      loadAppointments();
    } catch (e: any) {
      console.error('Error adding appointment:', e);
      toast({ title: 'Error Scheduling Appointment', description: e.message, variant: 'destructive' });
    }
  };

  const handleConfirm = async (id: string) => {
    const appt = appointments.find(a => a.id === id);
    const clientName = appt?.clientName || 'Client';
    const serviceName = appt?.service || 'Service Request';

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isDbAppt = uuidRegex.test(id);

    let customerEmail = 'client@khidmatik.dz';

    // Attempt to extract contact email from notes first
    if (appt?.notes && appt.notes.includes('Contact Email:')) {
      const match = appt.notes.match(/Contact Email:\s*([^\s\n]+)/);
      if (match && match[1]) {
        customerEmail = match[1];
      }
    } else {
      customerEmail = `${clientName.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'client'}@gmail.com`;
    }

    if (!user || !isDbAppt) {
      const saved = localStorage.getItem('khidmatik_appointments');
      let updatedList = [];
      if (saved) {
        try {
          const list = JSON.parse(saved);
          updatedList = list.map((a: any) =>
            (a.id === id || a.reservationId === id) ? { ...a, status: 'confirmed' } : a
          );
          localStorage.setItem('khidmatik_appointments', JSON.stringify(updatedList));
        } catch (e) {
          console.error(e);
        }
      }

      const updated = appointments.map(a => a.id === id ? { ...a, status: 'confirmed' } : a);
      setAppointments(updated);

      toast({
        title: "✉️ Sending Confirmation Email...",
        description: `Delivering acceptance email to ${customerEmail}...`,
      });

      setTimeout(() => {
        toast({
          title: "✉️ Email Delivered Successfully!",
          description: `Booking confirmation for "${serviceName}" has been sent to ${clientName} (${customerEmail}).`,
        });
      }, 1500);

      return;
    }

    try {
      // If we don't have it in the notes, query customer profile from DB
      if (customerEmail === 'client@khidmatik.dz' && appt) {
        const { data: dbAppt } = await supabase
          .from('appointments')
          .select('customer_id, notes')
          .eq('id', id)
          .maybeSingle();

        if (dbAppt) {
          if (dbAppt.notes && dbAppt.notes.includes('Contact Email:')) {
            const match = dbAppt.notes.match(/Contact Email:\s*([^\s\n]+)/);
            if (match && match[1]) {
              customerEmail = match[1];
            }
          }

          if (customerEmail === 'client@khidmatik.dz' && dbAppt.customer_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', dbAppt.customer_id)
              .maybeSingle();
            if (profile && profile.email) {
              customerEmail = profile.email;
            }
          }
        }
      }

      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "✉️ Sending Confirmation Email...",
        description: `Delivering acceptance email to ${customerEmail}...`,
      });

      setTimeout(() => {
        toast({
          title: "✉️ Email Delivered Successfully!",
          description: `Booking confirmation for "${serviceName}" has been sent to ${clientName} (${customerEmail}).`,
        });
      }, 1500);

      loadAppointments();
    } catch (e: any) {
      console.error('Error confirming appointment:', e);
      toast({ title: 'Error Confirming Appointment', description: e.message, variant: 'destructive' });
    }
  };

  const handleCancel = async (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isDbAppt = uuidRegex.test(id);

    if (!user || !isDbAppt) {
      const saved = localStorage.getItem('khidmatik_appointments');
      let updatedList = [];
      if (saved) {
        try {
          const list = JSON.parse(saved);
          updatedList = list.map((a: any) =>
            (a.id === id || a.reservationId === id) ? { ...a, status: 'cancelled' } : a
          );
          localStorage.setItem('khidmatik_appointments', JSON.stringify(updatedList));
        } catch (e) {
          console.error(e);
        }
      }

      const updated = appointments.map(a => a.id === id ? { ...a, status: 'cancelled' } : a);
      setAppointments(updated);
      toast({ title: translate('appointmentCancelled', 'Appointment Cancelled') });
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      toast({ title: translate('appointmentCancelled', 'Appointment Cancelled') });
      loadAppointments();
    } catch (e: any) {
      console.error('Error cancelling appointment:', e);
      toast({ title: 'Error Cancelling Appointment', description: e.message, variant: 'destructive' });
    }
  };

  const handleSaveAvailability = () => {
    localStorage.setItem('khidmatik_availability', JSON.stringify(availability));
    setIsAvailabilityOpen(false);
    toast({ title: translate('availabilitySaved', 'Availability Saved'), description: translate('availabilitySavedDesc', 'Your working hours have been updated.') });
  };

  const filteredAppointments = appointments.filter(a => {
    if (!selectedDate) return true;
    try {
      const datePart = a.date.includes('T') ? a.date.split('T')[0] : a.date;
      return datePart === format(selectedDate, 'yyyy-MM-dd');
    } catch { return false; }
  });

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'confirmed') return <Badge className="bg-green-600 hover:bg-green-600 text-white">Confirmed</Badge>;
    if (s === 'en_route') return <Badge className="bg-blue-600 hover:bg-blue-600 text-white animate-pulse">En Route</Badge>;
    if (s === 'in_progress') return <Badge className="bg-purple-600 hover:bg-purple-600 text-white animate-pulse">In Progress</Badge>;
    if (s === 'waiting_verification') return <Badge className="bg-cyan-600 hover:bg-cyan-600 text-white animate-pulse">Waiting Verification</Badge>;
    if (s === 'disputed') return <Badge variant="destructive" className="animate-bounce">Disputed</Badge>;
    if (s === 'completed') return <Badge variant="outline" className="border-green-600 text-green-600">Completed</Badge>;
    if (s === 'cancelled' || s === 'rejected') return <Badge variant="destructive">Cancelled</Badge>;
    return <Badge className="bg-amber-500 hover:bg-amber-500 text-white">Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <CalendarClock className="mr-3 h-8 w-8 text-primary" /> {translate('bookingsCalendar', 'Bookings & Calendar')}
          </h1>
          <p className="text-muted-foreground">{translate('manageAppointments', 'Manage your appointments, availability, and client bookings.')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="flex gap-1.5 items-center">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={openAddForm}>
            <PlusCircle className="mr-2 h-4 w-4" /> {translate('addAppointment', 'Add Appointment')}
          </Button>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{translate('myCalendar', 'My Calendar')}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border p-0"
              />
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => setIsAvailabilityOpen(true)}>
                <Settings className="mr-2 h-4 w-4" /> {translate('manageAvailability', 'Manage Availability')}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{translate('appointmentsFor', 'Appointments for')} {selectedDate ? format(selectedDate, 'PPP') : translate('today', 'Today')}</CardTitle>
              <CardDescription>{translate('reviewAppointments', 'Review and manage your scheduled appointments for the selected date.')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-12 gap-2">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  <span className="text-muted-foreground font-medium">{translate('loadingAppointments', 'Loading appointments...')}</span>
                </div>
              ) : filteredAppointments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{translate('time', 'Time')}</TableHead>
                      <TableHead>{translate('client', 'Client')}</TableHead>
                      <TableHead>{translate('service', 'Service')}</TableHead>
                      <TableHead>{translate('tableStatusHeader', 'Status')}</TableHead>
                      <TableHead className="text-right">{translate('tableActionsHeader', 'Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map(appt => (
                      <TableRow key={appt.id}>
                        <TableCell>{format(new Date(appt.date), 'p')}</TableCell>
                        <TableCell>{appt.clientName}</TableCell>
                        <TableCell>{appt.service}</TableCell>
                        <TableCell>{getStatusBadge(appt.status)}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewingAppointment(appt)} title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(appt.status?.toLowerCase() === 'pending' || appt.status?.toLowerCase() === 'pending_confirmation') && (
                            <Button variant="ghost" size="icon" onClick={() => handleConfirm(appt.id)} className="text-green-600" title="Accept Request">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {appt.status?.toLowerCase() === 'confirmed' && (
                            <Button variant="ghost" size="icon" onClick={() => handleMarkEnRoute(appt.id)} className="text-blue-600" title="Mark En Route">
                              <Navigation className="h-4 w-4" />
                            </Button>
                          )}
                          {appt.status?.toLowerCase() !== 'cancelled' && appt.status?.toLowerCase() !== 'rejected' && (
                            <Button variant="ghost" size="icon" onClick={() => handleCancel(appt.id)} className="text-destructive" title="Reject / Cancel Request">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">{translate('noAppointments', 'No appointments scheduled for this date.')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Appointment Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{translate('addAppointment', 'Add Appointment')}</DialogTitle>
            <DialogDescription>{translate('scheduleNewAppointment', 'Schedule a new appointment with a client.')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAppointment} className="space-y-4">
            <div>
              <Label>{translate('clientName', 'Client Name')} *</Label>
              <Input value={formClientName} onChange={e => setFormClientName(e.target.value)} placeholder="e.g., Ahmed B." />
            </div>
            <div>
              <Label>{translate('service', 'Service')} *</Label>
              <Input value={formService} onChange={e => setFormService(e.target.value)} placeholder="e.g., Consultation Call" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{translate('dateLabel', 'Date')} *</Label>
                <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
              </div>
              <div>
                <Label>{translate('time', 'Time')} *</Label>
                <Input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>{translate('notes', 'Notes')}</Label>
              <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder={translate('optionalNotes', 'Optional notes...')} rows={2} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">{translate('cancelBtn', 'Cancel')}</Button></DialogClose>
              <Button type="submit">{translate('addAppointment', 'Add Appointment')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Appointment Dialog */}
      <Dialog open={!!viewingAppointment} onOpenChange={() => setViewingAppointment(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span>{translate('appointmentDetails', 'Appointment Details')}</span>
              {viewingAppointment && (
                <span className="font-mono text-xs text-muted-foreground mr-4">ID: {viewingAppointment.id}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewingAppointment && (() => {
            const report = parseServiceNotes(viewingAppointment.notes);
            const hasReport = !!report.endTime;
            return (
              <div className="space-y-4 pt-2">
                {/* Summary Info */}
                <div className="grid grid-cols-2 gap-3 text-sm bg-muted/40 p-3 rounded-md border">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Client Name</span>
                    <span className="font-medium flex items-center gap-1"><User className="h-3.5 w-3.5" /> {viewingAppointment.clientName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Service / Category</span>
                    <span className="font-medium flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {viewingAppointment.service}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Date & Time</span>
                    <span className="font-medium flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {format(new Date(viewingAppointment.date), 'PPP p')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Status</span>
                    <span className="mt-0.5 block">{getStatusBadge(viewingAppointment.status)}</span>
                  </div>
                </div>

                {/* Location Address & Google Maps link */}
                <div className="flex items-start gap-2 border-t pt-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold block text-xs uppercase text-muted-foreground">Location / Address:</span>
                    <span className="text-muted-foreground">{viewingAppointment.location || 'Not Specified'}</span>
                    {viewingAppointment.location?.includes('GPS Coordinates:') && (
                      <div className="mt-1">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewingAppointment.location.replace('GPS Coordinates:', '').trim())}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-semibold"
                        >
                          <Navigation className="h-3 w-3" /> Open in Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Completion Report Section */}
                {hasReport && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center gap-1.5 text-primary border-b pb-1">
                      <FileText className="h-4 w-4 text-primary" />
                      <h4 className="font-bold text-sm uppercase tracking-wider">Service Completion Report / تقرير الإنجاز</h4>
                    </div>

                    {/* Execution details */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Duration of Work:</span>
                        <p className="font-semibold">{report.endDuration}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Completion Timestamp:</span>
                        <p className="font-semibold">{report.endTime ? new Date(report.endTime).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>

                    {/* Checklist */}
                    {report.workChecklist && (
                      <div className="bg-muted/20 p-3 rounded border space-y-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Work Checklist / قائمة المهام المكتملة</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <span className={report.workChecklist.workDone ? "text-green-600 font-bold" : ""}>
                              {report.workChecklist.workDone ? "☑" : "☐"} Works Completed
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <span className={report.workChecklist.cleanUp ? "text-green-600 font-bold" : ""}>
                              {report.workChecklist.cleanUp ? "☑" : "☐"} Cleaned Workspace
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <span className={report.workChecklist.tested ? "text-green-600 font-bold" : ""}>
                              {report.workChecklist.tested ? "☑" : "☐"} Tested Service
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <span className={report.workChecklist.explained ? "text-green-600 font-bold" : ""}>
                              {report.workChecklist.explained ? "☑" : "☐"} Explained to Client
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Completion Notes */}
                    {report.completionNotesText && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Completion Notes / تفاصيل العمل</span>
                        <p className="text-xs bg-muted/40 p-2.5 rounded border italic">"{report.completionNotesText}"</p>
                      </div>
                    )}

                    {/* Materials Table */}
                    {report.materialsUsed && report.materialsUsed.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Materials & Parts Used / المواد والقطع المصروفة</span>
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow className="h-8">
                                <TableHead className="h-8 py-1 text-xs">Material Name</TableHead>
                                <TableHead className="h-8 py-1 text-xs text-center">Qty</TableHead>
                                <TableHead className="h-8 py-1 text-xs text-right">Price</TableHead>
                                <TableHead className="h-8 py-1 text-xs text-right">Subtotal</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {report.materialsUsed.map((mat, i) => (
                                <TableRow key={i} className="h-8">
                                  <TableCell className="py-1 text-xs">{mat.name}</TableCell>
                                  <TableCell className="py-1 text-xs text-center">{mat.quantity}</TableCell>
                                  <TableCell className="py-1 text-xs text-right">{mat.price.toFixed(2)} DA</TableCell>
                                  <TableCell className="py-1 text-xs text-right font-medium">{(mat.quantity * mat.price).toFixed(2)} DA</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="bg-muted/20 font-bold h-8">
                                <TableCell colSpan={3} className="py-1 text-xs text-right">Total Materials Cost:</TableCell>
                                <TableCell className="py-1 text-xs text-right text-primary">
                                  {report.materialsUsed.reduce((acc, cur) => acc + (cur.quantity * cur.price), 0).toFixed(2)} DA
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Before & After Gallery */}
                    {((report.beforePhotos && report.beforePhotos.length > 0) || (report.afterPhotos && report.afterPhotos.length > 0)) && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Before & After Evidence / معرض صور الإنجاز</span>
                        <div className="grid grid-cols-2 gap-4">
                          {/* Before photos */}
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-amber-600 block">Before Photos</span>
                            <div className="grid grid-cols-2 gap-1">
                              {report.beforePhotos?.map((photo, i) => (
                                <div key={i} className="relative aspect-video rounded border overflow-hidden bg-muted flex items-center justify-center">
                                  <span className="text-[8px] font-mono text-primary text-center px-1 truncate w-full">{photo.split('/').pop()}</span>
                                </div>
                              )) || <p className="text-[10px] text-muted-foreground italic">None uploaded</p>}
                            </div>
                          </div>

                          {/* After photos */}
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-green-600 block">After Photos</span>
                            <div className="grid grid-cols-2 gap-1">
                              {report.afterPhotos?.map((photo, i) => (
                                <div key={i} className="relative aspect-video rounded border overflow-hidden bg-muted flex items-center justify-center">
                                  <span className="text-[8px] font-mono text-primary text-center px-1 truncate w-full">{photo.split('/').pop()}</span>
                                </div>
                              )) || <p className="text-[10px] text-muted-foreground italic">None uploaded</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* GPS Verification details */}
                    {report.gpsVerified && (
                      <div className="bg-green-50 border border-green-200 rounded p-2.5 text-green-800 text-xs flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
                        <div>
                          <strong className="block">GPS Verified Location</strong>
                          <span>Coords: {report.gpsCoords} | Time: {report.gpsVerifiedAt ? new Date(report.gpsVerifiedAt).toLocaleTimeString() : 'N/A'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Legacy Notes */}
                {viewingAppointment.notes && !viewingAppointment.notes.startsWith('{') && (
                  <p className="text-sm text-muted-foreground border-t pt-2 mt-2">{viewingAppointment.notes}</p>
                )}

                {/* Timeline */}
                <div className="border-t pt-3 mt-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Service Progress Tracker / حالة الخدمة</p>
                  <div className="flex items-center justify-between relative mt-2 px-1 mb-3">
                    <div className="absolute top-[9px] left-0 right-0 h-[2px] bg-muted-foreground/20 -z-0"></div>
                    {[
                      { key: 'pending_confirmation', label: 'Requested', labelAr: 'مطلوب' },
                      { key: 'confirmed', label: 'Accepted', labelAr: 'مقبول' },
                      { key: 'in_progress', label: 'In Progress', labelAr: 'قيد التنفيذ' },
                      { key: 'waiting_verification', label: 'Verification', labelAr: 'التحقق' },
                      { key: 'completed', label: 'Completed', labelAr: 'مكتمل' }
                    ].map((step, idx) => {
                      const statusHierarchy = ['pending_confirmation', 'confirmed', 'in_progress', 'waiting_verification', 'completed'];
                      const currentStatus = viewingAppointment.status.toLowerCase() === 'en_route' ? 'confirmed' : viewingAppointment.status.toLowerCase();
                      const currentIdx = statusHierarchy.indexOf(currentStatus);
                      const stepIdx = statusHierarchy.indexOf(step.key);
                      
                      const isCancelled = currentStatus === 'cancelled';
                      const isDisputed = currentStatus === 'disputed';
                      const isCompleted = !isCancelled && !isDisputed && stepIdx <= currentIdx;
                      const isActive = !isCancelled && !isDisputed && step.key === currentStatus;
                      
                      let dotColor = "bg-muted-foreground/30";
                      let textColor = "text-muted-foreground";
                      
                      if ((isCancelled || isDisputed) && idx === 0) {
                        dotColor = "bg-destructive text-white";
                        textColor = "text-destructive font-semibold";
                      } else if (isActive) {
                        dotColor = "bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse";
                        textColor = "text-primary font-bold";
                      } else if (isCompleted) {
                        dotColor = "bg-green-500 text-white";
                        textColor = "text-green-600 font-medium";
                      }
                      
                      if ((isCancelled || isDisputed) && step.key !== 'pending_confirmation') {
                        textColor = "text-muted-foreground/30";
                        dotColor = "bg-muted-foreground/10 text-muted-foreground/35";
                      }
                      
                      return (
                        <div key={step.key} className="flex flex-col items-center z-10 text-center flex-1">
                          <div className={`h-5 w-5 rounded-full ${dotColor} flex items-center justify-center text-[10px] font-bold transition-all duration-300`}>
                            {isCancelled && idx === 0 ? '✕' : isDisputed && idx === 0 ? '⚠️' : isCompleted && step.key !== currentStatus ? '✓' : idx + 1}
                          </div>
                          <span className={`text-[8px] mt-1 hidden sm:block ${textColor}`}>{step.label}</span>
                          <span className={`text-[8px] block sm:hidden ${textColor}`}>{step.labelAr}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Proof of Service Actions */}
                <div className="border-t pt-3 mt-3 space-y-3">
                  {/* 1. Start Service */}
                  {(viewingAppointment.status === 'confirmed' || viewingAppointment.status === 'en_route') && (
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-1.5"
                      onClick={() => handleStartService(viewingAppointment.id)}
                      disabled={isLoading}
                    >
                      <Play className="h-4 w-4" /> Start Service / بدء الخدمة
                    </Button>
                  )}

                  {/* 2. Finish Service Button */}
                  {viewingAppointment.status === 'in_progress' && (
                    <Button 
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center gap-1.5"
                      onClick={() => {
                        setFinishDuration('1 hour');
                        setCompletionNotesText('');
                        setMaterialsUsed([]);
                        setWorkChecklist({
                          workDone: false,
                          cleanUp: false,
                          tested: false,
                          explained: false
                        });
                        setBeforePhotos(['/uploads/before_leak1.jpg', '/uploads/before_leak2.jpg']);
                        setAfterPhotos(['/uploads/after_fixed1.jpg', '/uploads/after_fixed2.jpg']);
                        
                        // Set GPS coordinates and time on dialog load if possible
                        if (typeof navigator !== 'undefined' && navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              setGpsCoords(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
                              setGpsVerified(true);
                              setGpsVerifiedAt(new Date().toISOString());
                            },
                            () => {
                              setGpsCoords("Not available");
                              setGpsVerified(false);
                            }
                          );
                        }
                        
                        setReportTab('summary');
                        setIsPossFormOpen(true);
                      }}
                      disabled={isLoading}
                    >
                      <CheckSquare className="h-4 w-4" /> Finish Service & Completion Report / إنهاء الخدمة
                    </Button>
                  )}

                  {/* 3. OTP Verification Prompt */}
                  {viewingAppointment.status === 'waiting_verification' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                      <p className="text-xs font-semibold text-blue-800 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> OTP Verification Required / مطلوب رمز التحقق
                      </p>
                      
                      {report.otpLocked ? (
                        <p className="text-xs text-destructive font-semibold">
                          ❌ Verification locked due to 3 failed attempts. Contact administrator.
                        </p>
                      ) : (
                        <>
                          <p className="text-[11px] text-blue-700">Enter the 6-digit OTP code provided by the customer to complete this order:</p>
                          <div className="flex gap-2">
                            <Input 
                              type="text" 
                              maxLength={6} 
                              placeholder="e.g. 548219" 
                              className="text-center font-mono tracking-widest font-bold text-md"
                              value={enteredOtp}
                              onChange={e => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                              disabled={isLoading}
                            />
                            <Button 
                              className="bg-primary text-primary-foreground"
                              disabled={enteredOtp.length !== 6 || isLoading}
                              onClick={() => handleVerifyOtp(viewingAppointment.id, enteredOtp)}
                            >
                              Verify / تحقق
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground text-center">
                            Failed attempts: {report.failedOtpAttempts || 0}/3
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* 4. Dispute view */}
                  {viewingAppointment.status === 'disputed' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 space-y-1">
                      <p className="font-bold flex items-center gap-1 text-xs"><ShieldAlert className="h-4 w-4 text-red-600" /> Dispute Escalated / طلب متنازع عليه</p>
                      <p className="text-xs">Reason: <strong>{report.disputeReason}</strong></p>
                      <p className="text-xs text-muted-foreground">Client Comments: "{report.disputeComments}"</p>
                      <p className="text-[10px] text-muted-foreground border-t pt-1.5 mt-1.5">Administrator support has been paged. Please wait for dispute resolution.</p>
                    </div>
                  )}

                  {/* 5. Completed feedback view */}
                  {viewingAppointment.status === 'completed' && report.providerRating && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-xs space-y-1">
                      <p className="font-semibold flex items-center gap-1"><Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> Client Rating & Review</p>
                      <p>Score: <strong>{report.providerRating} / 5 Stars</strong></p>
                      {report.providerComments && <p className="italic text-muted-foreground">"{report.providerComments}"</p>}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{translate('close', 'Close')}</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Availability Dialog */}
      <Dialog open={isAvailabilityOpen} onOpenChange={setIsAvailabilityOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{translate('manageAvailability', 'Manage Availability')}</DialogTitle>
            <DialogDescription>{translate('setWorkingHours', 'Set your working hours and buffer time between appointments.')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{translate('startHour', 'Start Hour')}</Label>
                <Input type="time" value={availability.startHour} onChange={e => setAvailability({ ...availability, startHour: e.target.value })} />
              </div>
              <div>
                <Label>{translate('endHour', 'End Hour')}</Label>
                <Input type="time" value={availability.endHour} onChange={e => setAvailability({ ...availability, endHour: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>{translate('bufferTime', 'Buffer Time (minutes)')}</Label>
              <Input type="number" value={availability.bufferMinutes} onChange={e => setAvailability({ ...availability, bufferMinutes: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{translate('cancelBtn', 'Cancel')}</Button></DialogClose>
            <Button onClick={handleSaveAvailability}>{translate('saveServiceBtn', 'Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finish Service & Completion Report Dialog */}
      <Dialog open={isPossFormOpen} onOpenChange={setIsPossFormOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="flex items-center gap-2 text-primary font-headline">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>Finish Service & Completion Report / تقرير إنجاز الخدمة</span>
            </DialogTitle>
            <DialogDescription>
              Complete the report sections below to request customer verification.
            </DialogDescription>
          </DialogHeader>

          {/* Progress Tab Stepper */}
          <div className="flex justify-between border-b bg-muted/30 p-1.5 rounded-lg mb-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => setReportTab('summary')}
              className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1 transition-all ${
                reportTab === 'summary' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <Info className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Summary</span>
            </button>
            <button
              type="button"
              onClick={() => setReportTab('evidence')}
              className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1 transition-all ${
                reportTab === 'evidence' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <Camera className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Evidence</span>
            </button>
            <button
              type="button"
              onClick={() => setReportTab('notes')}
              className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1 transition-all ${
                reportTab === 'notes' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Checklist</span>
            </button>
            <button
              type="button"
              onClick={() => setReportTab('materials')}
              className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1 transition-all ${
                reportTab === 'materials' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Materials</span>
            </button>
            <button
              type="button"
              onClick={() => setReportTab('gps')}
              className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1 transition-all ${
                reportTab === 'gps' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <Shield className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Confirm</span>
            </button>
          </div>

          {/* Confirm overlay check */}
          {showConfirmSubmit ? (
            <div className="space-y-4 py-4 text-center animate-in fade-in zoom-in-95">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-2">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-md">هل أنت متأكد من إنهاء الخدمة؟</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                بمجرد الإرسال، سيتم قفل تقرير الإنجاز وتوليد رمز التحقق (OTP) للزبون لتأكيد الخدمة. لن تتمكن من التعديل لاحقاً.
              </p>
              <div className="flex justify-center gap-3 mt-4">
                <Button variant="outline" onClick={() => setShowConfirmSubmit(false)}>
                  تراجع / Back
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                  onClick={() => {
                    if (viewingAppointment) {
                      handleFinishService(
                        viewingAppointment.id,
                        finishDuration,
                        completionNotesText,
                        beforePhotos,
                        afterPhotos,
                        materialsUsed,
                        workChecklist,
                        gpsVerified,
                        gpsCoords,
                        gpsVerifiedAt
                      );
                    }
                    setShowConfirmSubmit(false);
                    setIsPossFormOpen(false);
                  }}
                >
                  <Check className="h-4 w-4" /> تأكيد الإرسال / Confirm Submit
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Tab 1: Service Summary */}
              {reportTab === 'summary' && viewingAppointment && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block border-b pb-1">Section 1: Service Summary</span>
                  <div className="grid grid-cols-2 gap-3 text-xs bg-muted/40 p-3 rounded-md border">
                    <div>
                      <span className="text-muted-foreground block">Service Name:</span>
                      <strong className="text-sm">{viewingAppointment.service}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Customer:</span>
                      <strong>{viewingAppointment.clientName}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Appointment Date:</span>
                      <span>{format(new Date(viewingAppointment.date), 'PPP p')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Work Started:</span>
                      <span>{parseServiceNotes(viewingAppointment.notes).startTime ? new Date(parseServiceNotes(viewingAppointment.notes).startTime!).toLocaleTimeString() : 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="block mb-1 font-semibold text-xs text-muted-foreground">Actual Execution Duration / مدة التنفيذ الفعلية *</Label>
                    <select
                      value={finishDuration}
                      onChange={e => setFinishDuration(e.target.value)}
                      className="w-full p-2 border rounded bg-background text-sm"
                    >
                      <option value="Under 30 mins">Under 30 mins / أقل من نصف ساعة</option>
                      <option value="1 hour">1 hour / ساعة واحدة</option>
                      <option value="2 hours">2 hours / ساعتين</option>
                      <option value="Half Day (4 hrs)">Half Day / نصف يوم</option>
                      <option value="Full Day (8 hrs)">Full Day / يوم كامل</option>
                      <option value="Multiple Days">Multiple Days / عدة أيام</option>
                    </select>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="button" onClick={() => setReportTab('evidence')}>
                      Next: Upload Photos →
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab 2: Work Evidence */}
              {reportTab === 'evidence' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block border-b pb-1">Section 2: Work Evidence (Max 10 Photos)</span>
                  
                  {/* Photo Gallery lists */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Before Photos list */}
                    <div className="space-y-2 border p-2.5 rounded-lg bg-muted/20">
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="text-xs font-bold text-amber-600 uppercase">Before Photos ({beforePhotos.length}/5)</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px]"
                          disabled={beforePhotos.length >= 5}
                          onClick={() => setBeforePhotos([...beforePhotos, `/uploads/before_leak_${beforePhotos.length + 1}.jpg`])}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Mock
                        </Button>
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {beforePhotos.map((photo, index) => (
                          <div key={index} className="flex items-center justify-between text-xs bg-background p-1.5 rounded border">
                            <span className="truncate flex-1 font-mono text-[10px]">{photo.split('/').pop()}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                disabled={index === 0}
                                onClick={() => {
                                  const list = [...beforePhotos];
                                  const tmp = list[index];
                                  list[index] = list[index - 1];
                                  list[index - 1] = tmp;
                                  setBeforePhotos(list);
                                }}
                              >
                                <ArrowUp className="h-3 w-3 text-muted-foreground" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                disabled={index === beforePhotos.length - 1}
                                onClick={() => {
                                  const list = [...beforePhotos];
                                  const tmp = list[index];
                                  list[index] = list[index + 1];
                                  list[index + 1] = tmp;
                                  setBeforePhotos(list);
                                }}
                              >
                                <ArrowDown className="h-3 w-3 text-muted-foreground" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-destructive hover:text-destructive"
                                onClick={() => setBeforePhotos(beforePhotos.filter((_, idx) => idx !== index))}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {beforePhotos.length === 0 && (
                          <p className="text-[10px] text-muted-foreground text-center py-2">No before photos added</p>
                        )}
                      </div>
                    </div>

                    {/* After Photos list */}
                    <div className="space-y-2 border p-2.5 rounded-lg bg-muted/20">
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="text-xs font-bold text-green-600 uppercase">After Photos ({afterPhotos.length}/5)</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px]"
                          disabled={afterPhotos.length >= 5}
                          onClick={() => setAfterPhotos([...afterPhotos, `/uploads/after_fixed_${afterPhotos.length + 1}.jpg`])}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Mock
                        </Button>
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {afterPhotos.map((photo, index) => (
                          <div key={index} className="flex items-center justify-between text-xs bg-background p-1.5 rounded border">
                            <span className="truncate flex-1 font-mono text-[10px]">{photo.split('/').pop()}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                disabled={index === 0}
                                onClick={() => {
                                  const list = [...afterPhotos];
                                  const tmp = list[index];
                                  list[index] = list[index - 1];
                                  list[index - 1] = tmp;
                                  setAfterPhotos(list);
                                }}
                              >
                                <ArrowUp className="h-3 w-3 text-muted-foreground" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                disabled={index === afterPhotos.length - 1}
                                onClick={() => {
                                  const list = [...afterPhotos];
                                  const tmp = list[index];
                                  list[index] = list[index + 1];
                                  list[index + 1] = tmp;
                                  setAfterPhotos(list);
                                }}
                              >
                                <ArrowDown className="h-3 w-3 text-muted-foreground" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-destructive hover:text-destructive"
                                onClick={() => setAfterPhotos(afterPhotos.filter((_, idx) => idx !== index))}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {afterPhotos.length === 0 && (
                          <p className="text-[10px] text-muted-foreground text-center py-2">No after photos added</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Drag and drop zone */}
                  <div className="p-5 border border-dashed rounded-lg bg-muted/40 text-center text-xs space-y-1.5">
                    <Camera className="h-5 w-5 mx-auto text-muted-foreground" />
                    <p className="font-semibold text-muted-foreground">Drag & Drop photos or click to upload</p>
                    <p className="text-[10px] text-muted-foreground">Supports direct Camera on mobile. Auto-compressed files.</p>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button type="button" variant="outline" onClick={() => setReportTab('summary')}>
                      Back
                    </Button>
                    <Button type="button" onClick={() => setReportTab('notes')}>
                      Next: Checklist & Notes →
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab 3: Completion Notes & Checklist */}
              {reportTab === 'notes' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block border-b pb-1">Section 3: Completion Notes & Checklist</span>
                  
                  {/* Notes textbox */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor="reportNotes" className="font-medium text-xs">Work Execution Notes / تفاصيل الإصلاحات والعمل المنجز *</Label>
                      <span className={`text-[10px] ${completionNotesText.length > 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {completionNotesText.length} / 500 chars
                      </span>
                    </div>
                    <Textarea
                      id="reportNotes"
                      value={completionNotesText}
                      onChange={e => setCompletionNotesText(e.target.value.slice(0, 500))}
                      placeholder="Explain fixed parts, materials and general instructions..."
                      rows={3}
                      className="text-xs"
                    />
                  </div>

                  {/* Checklist options */}
                  <div className="border rounded-lg p-3 bg-muted/20 space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Work Checklist / قائمة التحقق</span>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={workChecklist.workDone}
                          onChange={e => setWorkChecklist({ ...workChecklist, workDone: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span>☑ Works Completed / إنجاز العمل</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={workChecklist.cleanUp}
                          onChange={e => setWorkChecklist({ ...workChecklist, cleanUp: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span>☑ Workspace Cleaned / تنظيف المكان</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={workChecklist.tested}
                          onChange={e => setWorkChecklist({ ...workChecklist, tested: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span>☑ Tested & Verified / اختبار الخدمة</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={workChecklist.explained}
                          onChange={e => setWorkChecklist({ ...workChecklist, explained: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span>☑ Explained to Client / شرح للزبون</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button type="button" variant="outline" onClick={() => setReportTab('evidence')}>
                      Back
                    </Button>
                    <Button type="button" onClick={() => setReportTab('materials')}>
                      Next: Materials Used →
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab 4: Materials Used */}
              {reportTab === 'materials' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block border-b pb-1">Section 4: Materials & Parts Used (Optional)</span>
                  
                  {/* Dynamic insertion line */}
                  <div className="grid grid-cols-12 gap-2 items-end bg-muted/40 p-2.5 rounded-lg border text-xs">
                    <div className="col-span-5">
                      <Label htmlFor="matName" className="text-[10px] font-bold block mb-0.5">Item Name</Label>
                      <Input
                        id="matName"
                        placeholder="e.g. Copper pipes"
                        value={newMaterialName}
                        onChange={e => setNewMaterialName(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="matQty" className="text-[10px] font-bold block mb-0.5">Qty</Label>
                      <Input
                        id="matQty"
                        type="number"
                        min={1}
                        value={newMaterialQty}
                        onChange={e => setNewMaterialQty(parseInt(e.target.value) || 1)}
                        className="h-8 text-xs text-center"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label htmlFor="matPrice" className="text-[10px] font-bold block mb-0.5">Unit Price (DA)</Label>
                      <Input
                        id="matPrice"
                        type="number"
                        min={0}
                        value={newMaterialPrice}
                        onChange={e => setNewMaterialPrice(parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs text-right"
                      />
                    </div>
                    <div className="col-span-2">
                      <Button
                        type="button"
                        className="h-8 w-full p-0 flex items-center justify-center"
                        onClick={() => {
                          if (!newMaterialName.trim()) return;
                          setMaterialsUsed([
                            ...materialsUsed,
                            { name: newMaterialName.trim(), quantity: newMaterialQty, price: newMaterialPrice }
                          ]);
                          setNewMaterialName('');
                          setNewMaterialQty(1);
                          setNewMaterialPrice(0);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Materials list */}
                  <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-muted/50 text-[10px]">
                        <TableRow className="h-8">
                          <TableHead className="h-8 py-1 text-xs">Material</TableHead>
                          <TableHead className="h-8 py-1 text-xs text-center">Qty</TableHead>
                          <TableHead className="h-8 py-1 text-xs text-right">Price</TableHead>
                          <TableHead className="h-8 py-1 text-xs text-right">Total</TableHead>
                          <TableHead className="h-8 py-1 text-center w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {materialsUsed.map((mat, i) => (
                          <TableRow key={i} className="h-8">
                            <TableCell className="py-1 text-xs font-medium">{mat.name}</TableCell>
                            <TableCell className="py-1 text-xs text-center">{mat.quantity}</TableCell>
                            <TableCell className="py-1 text-xs text-right">{mat.price.toFixed(2)} DA</TableCell>
                            <TableCell className="py-1 text-xs text-right font-bold">{(mat.quantity * mat.price).toFixed(2)} DA</TableCell>
                            <TableCell className="py-1 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-destructive"
                                onClick={() => setMaterialsUsed(materialsUsed.filter((_, idx) => idx !== i))}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {materialsUsed.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="py-4 text-center text-xs text-muted-foreground italic">
                              No materials registered for this service completion.
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow className="bg-muted/20 font-bold h-8">
                            <TableCell colSpan={3} className="py-1 text-xs text-right">Sum Cost:</TableCell>
                            <TableCell colSpan={2} className="py-1 text-xs text-left text-primary">
                              {materialsUsed.reduce((acc, cur) => acc + (cur.quantity * cur.price), 0).toFixed(2)} DA
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button type="button" variant="outline" onClick={() => setReportTab('notes')}>
                      Back
                    </Button>
                    <Button type="button" onClick={() => setReportTab('gps')}>
                      Next: GPS & Confirm →
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab 5: GPS Location & Verification Request */}
              {reportTab === 'gps' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block border-b pb-1">Section 5: Verification & Confirm</span>
                  
                  {/* GPS Verification info */}
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4 text-green-600" /> GPS Verification Captured
                    </p>
                    <p>Coordinates: <strong>{gpsCoords || '0.000000, 0.000000'}</strong></p>
                    <p>Verified Timestamp: <span>{gpsVerifiedAt ? new Date(gpsVerifiedAt).toLocaleString() : new Date().toLocaleString()}</span></p>
                  </div>

                  {/* Warning Info */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block">Verification Required / رمز تحقق مطلوب</strong>
                      <span>لن تعتبر الخدمة مكتملة في النظام ولن يتم تحرير مستحقاتك إلا بعد تأكيد الزبون للطلب باستخدام رمز التحقق (OTP) الخاص به.</span>
                    </div>
                  </div>

                  {/* Confirm Submission */}
                  <div className="flex justify-between pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setReportTab('materials')}>
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="bg-primary text-primary-foreground font-bold flex items-center gap-1.5 px-4"
                      disabled={!completionNotesText.trim()}
                      onClick={() => setShowConfirmSubmit(true)}
                    >
                      <ShieldCheck className="h-4 w-4" /> Complete Service & Request Verification
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
