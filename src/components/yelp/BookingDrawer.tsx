'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter, DialogClose 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { CalendarDays, Clock, Users, CheckCircle, Bell, Trash2, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BookingDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  listingName: string;
  providerId: string;
  onBookingSuccess?: (bookingDetails: any) => void;
}

const AVAILABLE_SLOTS = [
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM'
];

export function BookingDrawer({ isOpen, onOpenChange, listingName, providerId, onBookingSuccess }: BookingDrawerProps) {
  const { language } = useLanguage();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [guestCount, setGuestCount] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  const handleConfirm = () => {
    if (!date) {
      toast({ title: language === 'ar' ? 'الرجاء اختيار تاريخ' : 'Please select a date', variant: 'destructive' });
      return;
    }
    if (!selectedSlot) {
      toast({ title: language === 'ar' ? 'الرجاء اختيار وقت' : 'Please select a time slot', variant: 'destructive' });
      return;
    }

    const booking = {
      id: 'bk_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      date: format(date, 'yyyy-MM-dd'),
      timeSlot: selectedSlot,
      guestCount,
      notes,
      listingName,
      createdAt: new Date().toISOString()
    };

    // Save to local storage for persistence
    const key = 'khidmatik_appointments';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    current.push({
      ...booking,
      reservationId: booking.id,
      professionalId: providerId,
      professionalName: listingName,
      patientName: 'Amine User',
      status: 'confirmed',
      notes: booking.notes
    });
    localStorage.setItem(key, JSON.stringify(current));

    setConfirmedBooking(booking);

    toast({
      title: language === 'ar' ? 'تم تأكيد الحجز بنجاح!' : 'Booking Confirmed!',
      description: language === 'ar' ? 'سوف نرسل لك تذكيرًا قبل الحجز بـ 24 ساعة.' : 'We will send you an automatic reminder 24 hours prior.',
    });

    if (onBookingSuccess) onBookingSuccess(booking);
  };

  const handleCancelBooking = () => {
    // Remove booking logic
    const key = 'khidmatik_appointments';
    let current = JSON.parse(localStorage.getItem(key) || '[]');
    if (confirmedBooking) {
      current = current.filter((b: any) => b.reservationId !== confirmedBooking.id);
      localStorage.setItem(key, JSON.stringify(current));
    }

    setConfirmedBooking(null);
    setSelectedSlot('');
    toast({
      title: language === 'ar' ? 'تم إلغاء الحجز' : 'Booking Cancelled',
      variant: 'destructive'
    });
  };

  const isRtl = language === 'ar';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-headline font-bold text-xl flex items-center gap-1.5">
            <CalendarDays className="h-5 w-5 text-primary" />
            {isRtl ? `حجز موعد في ${listingName}` : `Book Appointment at ${listingName}`}
          </DialogTitle>
          <DialogDescription>
            {isRtl ? 'اختر اليوم والوقت المناسب للحصول على الخدمة.' : 'Select the date and time to reserve your slot.'}
          </DialogDescription>
        </DialogHeader>

        {!confirmedBooking ? (
          <div className="space-y-6 py-2">
            
            {/* Date Calendar */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground block">{isRtl ? 'اختر التاريخ *' : 'Select Date *'}</label>
              <div className="border rounded-xl p-2 flex justify-center bg-muted/20">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border shadow"
                  disabled={{ before: new Date() }}
                />
              </div>
            </div>

            {/* Time Slots */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground block">{isRtl ? 'اختر الوقت *' : 'Select Time Slot *'}</label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={cn(
                      "px-3 py-2 text-xs font-semibold rounded-lg border text-center transition-all duration-200",
                      selectedSlot === slot 
                        ? "bg-primary border-primary text-primary-foreground shadow-sm" 
                        : "bg-background hover:bg-muted text-foreground border-border/80"
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Guests Count */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground block">{isRtl ? 'عدد الأشخاص *' : 'Number of Guests *'}</label>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                  className="w-24"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground block">{isRtl ? 'ملاحظات إضافية' : 'Notes / Special Requests'}</label>
              <Input
                type="text"
                placeholder={isRtl ? 'مثل: تفاصيل العطل، طلبات خاصة...' : 'e.g. details about the issue...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              type="button"
              onClick={handleConfirm}
              className="w-full bg-primary hover:bg-primary/95 font-headline font-bold text-base py-6 rounded-xl"
            >
              {isRtl ? 'تأكيد الحجز' : 'Confirm Reservation'}
            </Button>
          </div>
        ) : (
          /* Confirmation View */
          <div className="space-y-6 py-4 text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-full">
              <CheckCircle className="h-10 w-10 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="font-headline font-bold text-lg text-foreground">{isRtl ? 'تم تأكيد الحجز' : 'Reservation Confirmed'}</h3>
              <p className="text-sm text-muted-foreground">{isRtl ? 'الرمز التعريفي للحجز:' : 'Booking ID:'} <span className="font-mono font-bold text-primary">{confirmedBooking.id}</span></p>
            </div>

            <div className="border rounded-xl p-4 bg-muted/30 text-start space-y-3.5 text-sm">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="h-4.5 w-4.5 text-primary" />
                <span className="font-medium text-foreground">{confirmedBooking.date}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="h-4.5 w-4.5 text-primary" />
                <span className="font-medium text-foreground">{confirmedBooking.timeSlot}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Users className="h-4.5 w-4.5 text-primary" />
                <span className="font-medium text-foreground">{confirmedBooking.guestCount} {isRtl ? 'أشخاص' : 'guests'}</span>
              </div>
              <div className="bg-popover border p-3 rounded-lg flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                <Bell className="h-4 w-4 text-primary shrink-0 animate-bounce" />
                <span>{isRtl ? 'تم تفعيل التذكير التلقائي بالرسائل القصيرة' : 'SMS and email reminder active.'}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmedBooking(null)}
                className="flex-1 flex items-center justify-center gap-1"
              >
                <Edit className="h-4 w-4" />
                {isRtl ? 'تعديل الحجز' : 'Reschedule'}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleCancelBooking}
                className="flex-1 flex items-center justify-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                {isRtl ? 'إلغاء الحجز' : 'Cancel Booking'}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="ghost" className="w-full">
              {isRtl ? 'إغلاق' : 'Close'}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BookingDrawer;
