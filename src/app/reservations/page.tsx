'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function ReservationsPage() {
  const { translate } = useLanguage();
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-4">{translate('reservationsTitle', 'Reservations')}</h1>
      {/* Search/Browse View */}
    </div>
  );
}
