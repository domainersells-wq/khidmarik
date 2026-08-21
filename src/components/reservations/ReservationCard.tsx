
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface Hall {
  id: string;
  name: string;
  location: string;
  capacity: number;
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
}

interface ReservationCardProps {
  hall: Hall;
}

export function ReservationCard({ hall }: ReservationCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <Image src={hall.image} alt={hall.name} width={400} height={250} className="object-cover" />
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle>{hall.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{hall.location}</p>
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="font-semibold">{hall.capacity} Guests</p>
            <p className="text-sm text-muted-foreground">Capacity</p>
          </div>
          <div>
            <p className="font-semibold">${hall.price}</p>
            <p className="text-sm text-muted-foreground">Starting Price</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4">
        <Button className="w-full">View Details</Button>
      </CardFooter>
    </Card>
  );
}
