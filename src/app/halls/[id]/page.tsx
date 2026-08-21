
'use client';

import React, { useState } from 'react';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { BookingCalendar } from '@/components/ui/BookingCalendar';
import { format } from 'date-fns';
import { MapPin, Users, DollarSign, Star, Building, Calendar as CalendarIcon, Phone, Mail, Orbit } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const mockHalls = [
  {
    id: 'hall-1',
    name: 'The Grand Ballroom',
    description: 'A luxurious and spacious hall perfect for grand weddings and corporate events. Features high ceilings, crystal chandeliers, and a state-of-the-art sound system.',
    images: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
    floorPlan: '/placeholder.svg',
    location: 'New York, NY',
    capacity: 500,
    price: 5000,
    rating: 4.8,
    amenities: ['Wi-Fi', 'Air Conditioning', 'Parking', 'Sound System', 'Projector'],
    contact: { phone: '123-456-7890', email: 'contact@grandballroom.com' }
  },
  {
    id: 'hall-2',
    name: 'Crystal Gardens',
    description: 'An elegant and charming venue with beautiful indoor and outdoor spaces. Ideal for intimate weddings, receptions, and parties.',
    images: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
    floorPlan: '/placeholder.svg',
    location: 'Los Angeles, CA',
    capacity: 300,
    price: 3500,
    rating: 4.5,
    amenities: ['Wi-Fi', 'Parking', 'Garden', 'Catering Available'],
    contact: { phone: '987-654-3210', email: 'info@crystalgardens.com' }
  },
];

const mockBookings = [
  { date: new Date(2024, 6, 15), type: 'booked' },
  { date: new Date(2024, 6, 18), type: 'provisional' },
  { date: new Date(2024, 7, 2), type: 'booked' },
];

export default function HallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const hall = mockHalls.find(h => h.id === id);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  if (!hall) {
    notFound();
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-4xl font-bold">{hall.name}</CardTitle>
              <CardDescription className="flex items-center mt-2">
                <MapPin className="h-5 w-5 mr-2" /> {hall.location}
              </CardDescription>
            </div>
            <div className="text-right">
                <div className="flex items-center justify-end">
                    <Star className="text-yellow-400 fill-yellow-400 h-6 w-6 mr-1" />
                    <span className="text-2xl font-bold">{hall.rating}</span>
                    <span className="text-sm text-muted-foreground ml-1">/ 5</span>
                </div>
                <p className="text-sm text-muted-foreground">Based on 120 reviews</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="relative">
                <Carousel className="w-full">
                  <CarouselContent>
                    {hall.images.map((src, index) => (
                      <CarouselItem key={index}>
                        <AspectRatio ratio={16 / 9}>
                          <img src={src} alt={`${hall.name} image ${index + 1}`} className="rounded-md object-cover w-full h-full" />
                        </AspectRatio>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="absolute top-4 right-4">
                            <Orbit className="h-5 w-5 mr-2" /> 360° View
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl h-4/5">
                        <DialogHeader>
                            <DialogTitle>360° Panoramic View</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center justify-center h-full bg-gray-200 rounded-md">
                            <p className="text-muted-foreground">[360° Viewer Placeholder]</p>
                        </div>
                    </DialogContent>
                </Dialog>
              </div>
              
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">About The Hall</h2>
                <p className="text-muted-foreground">{hall.description}</p>
              </div>

              <Separator className="my-8" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Amenities</h2>
                    <div className="flex flex-wrap gap-2">
                        {hall.amenities.map(amenity => (
                            <Badge key={amenity} variant="secondary">{amenity}</Badge>
                        ))}
                    </div>
                  </div>
                   <div>
                    <h2 className="text-2xl font-semibold mb-4">Floor Plan</h2>
                    <Dialog>
                        <DialogTrigger asChild>
                            <AspectRatio ratio={4 / 3} className="cursor-pointer">
                                <img src={hall.floorPlan} alt={`${hall.name} floor plan`} className="rounded-md object-cover w-full h-full hover:opacity-80 transition-opacity" />
                            </AspectRatio>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                             <img src={hall.floorPlan} alt={`${hall.name} floor plan`} className="rounded-md" />
                        </DialogContent>
                    </Dialog>
                  </div>
              </div>

            </div>
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                    <CardTitle className="flex items-center"><CalendarIcon className="h-6 w-6 mr-2" /> Book Your Date</CardTitle>
                </CardHeader>
                <CardContent>
                    <BookingCalendar
                        bookings={mockBookings}
                        onDateSelect={handleDateSelect}
                        mode="single"
                        selected={selectedDate}
                        className="rounded-md border"
                    />
                    <div className="mt-4">
                        <p className="font-semibold text-lg">
                           Price: <span className="text-primary">${hall.price}/day</span>
                        </p>
                         <p className="text-sm text-muted-foreground flex items-center mt-1">
                            <Users className="h-4 w-4 mr-1.5" /> Up to {hall.capacity} guests
                        </p>
                    </div>
                    <Button className="w-full mt-4" disabled={!selectedDate}>
                        {selectedDate ? `Book for ${format(selectedDate, 'PPP')}` : 'Select a Date'}
                    </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
