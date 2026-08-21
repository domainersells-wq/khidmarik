'use client';

import BookingCalendar from '@/components/ui/BookingCalendar';
import SearchBar from '@/components/listings/SearchBar';
import { useLanguage } from '@/context/LanguageContext';

export default function Page() {
  const { translate } = useLanguage();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline text-primary">{translate('banquetHallsReservations', 'Banquet Halls Reservations')}</h1>
      <SearchBar />
      <BookingCalendar />
    </div>
  );
}