
'use client';

import * as React from 'react';
import { DayPicker, DayProps } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar'; 
import { Badge } from '@/components/ui/badge';

export interface Booking {
  date: Date;
  type: 'booked' | 'provisional'; 
}

export type BookingCalendarProps = React.ComponentProps<typeof DayPicker> & {
  bookings?: Booking[];
  onDateSelect?: (date: Date) => void;
};

export const BookingCalendar = ({ bookings = [], onDateSelect, selected, ...props }: any) => {
  const [selectedDay, setSelectedDay] = React.useState<Date | undefined>(selected);

  React.useEffect(() => {
    setSelectedDay(selected);
  }, [selected]);

  const handleDayClick = (day: Date, modifiers: any) => {
    if (modifiers.disabled) {
      return;
    }
    setSelectedDay(day);
    if (onDateSelect) {
      onDateSelect(day);
    }
  };

  const DayContent = (dayProps: DayProps) => {
    const booking = bookings.find((b: any) => b.date.toDateString() === dayProps.date.toDateString());
    const isBooked = !!booking;
    
    return (
      <div className={cn("relative h-full w-full flex items-center justify-center")}>
        {dayProps.date.getDate()}
        {isBooked && (
          <Badge 
            variant={booking.type === 'booked' ? 'destructive' : 'secondary'}
            className="absolute bottom-0.5 right-0.5 h-2 w-2 p-0 border-transparent rounded-full"
          />
        )}
      </div>
    );
  };


  const bookedDays = bookings.map((b: any) => b.date);

  return (
    <Calendar
      {...props}
      mode="single"
      selected={selectedDay}
      onDayClick={handleDayClick}
      modifiers={{ booked: bookedDays }}
      modifiersClassNames={{
        booked: 'opacity-50 cursor-not-allowed',
      }}
      components={{
        Day: DayContent,
      }}
    />
  );
};

export default BookingCalendar;
