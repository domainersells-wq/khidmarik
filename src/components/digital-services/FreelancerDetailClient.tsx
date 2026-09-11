'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { storeService } from '@/services/storeService';
import { getDigitalServiceCategoryBySlug } from '@/data/mock';
import type { FreelancerProfile, PortfolioItem, ServicePackage } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { StarRating } from '@/components/listings/StarRating';
import { ReviewList } from '@/components/listings/ReviewList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Briefcase, Mail, MessageSquare, Phone, Globe, Palette, Users, DollarSign, FileText, MapPin as MapPinIcon, Clock as ClockIcon, Tag as TagIcon, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

function PortfolioItemCardDisplay({ item }: { item: PortfolioItem }) {
  return (
    <Card className="overflow-hidden">
      {item.imageUrl && (
        <div className="aspect-video bg-muted">
          <Image
            src={item.imageUrl}
            alt={item.title}
            width={400}
            height={225}
            className="object-cover w-full h-full"
            data-ai-hint={item.dataAiHint || item.title.toLowerCase().split(" ").slice(0,2).join(" ")}
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
        {item.projectUrl && (
          <Button variant="link" asChild className="p-0 h-auto">
            <a href={item.projectUrl} target="_blank" rel="noopener noreferrer">View Project</a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ServicePackageCardDisplay({ pkg }: { pkg: ServicePackage }) {
  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="text-lg">{pkg.name}</CardTitle>
        <p className="text-2xl font-bold text-primary">{pkg.price.toLocaleString()} DA</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>
        <h4 className="font-semibold text-sm mb-1">Deliverables:</h4>
        <ul className="list-disc list-inside text-sm space-y-1">
          {pkg.deliverables.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled>
          <DollarSign className="mr-2 h-4 w-4" /> Request This Package
        </Button>
      </CardFooter>
    </Card>
  );
}

export function FreelancerDetailClient({
  freelancerId,
  initialFreelancer,
}: {
  freelancerId: string;
  initialFreelancer?: FreelancerProfile | null;
}) {
  const { toast } = useToast();
  const [freelancer, setFreelancer] = useState<FreelancerProfile | null | undefined>(initialFreelancer);

  useEffect(() => {
    if (initialFreelancer !== undefined) {
      setFreelancer(initialFreelancer);
      return;
    }
    const fetchFreelancer = async () => {
      if (!freelancerId) return;
      const data = await storeService.getStoreById(freelancerId);
      if (data && (data.type as string) === 'freelancer') {
        setFreelancer(data as unknown as FreelancerProfile);
      } else {
        setFreelancer(null);
      }
    };
    fetchFreelancer();
  }, [freelancerId, initialFreelancer]);

  if (freelancer === undefined) {
    return <div className="text-center py-10">Loading freelancer profile...</div>;
  }

  if (!freelancer) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Freelancer Not Found</h1>
        <p>The freelancer profile you are looking for does not exist or has been removed.</p>
        <Link href="/digital-services" passHref>
          <Button variant="link" className="mt-4">Back to Digital Services</Button>
        </Link>
      </div>
    );
  }

  const categoryDetails = getDigitalServiceCategoryBySlug(freelancer.digitalCategorySlug);
  const CategoryIcon = categoryDetails?.icon || Palette;

  const handleContact = async () => {
    toast({
      title: `Contact ${freelancer.name}`,
      description: "Chat and escrow transactions are available on Khidmatik.",
      duration: 3000,
    });
  };

  const handleStartProject = async () => {
    toast({
      title: `Start Project with ${freelancer.name}`,
      description: "Initiating project milestone. Protected by Khidmatik Escrow.",
      duration: 3000,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link href="/digital-services" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Digital Services
      </Link>

      <header className="flex flex-col md:flex-row md:items-start gap-6 p-6 bg-card border rounded-lg shadow-lg">
        <Avatar className="h-32 w-32 border-4 border-primary shadow-md mx-auto md:mx-0">
          <AvatarImage src={freelancer.images[0] || `https://api.dicebear.com/7.x/initials/svg?seed=${freelancer.name}`} alt={freelancer.name} />
          <AvatarFallback>{freelancer.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl font-bold font-headline mb-1">{freelancer.name}</h1>
          {freelancer.tagline && <p className="text-xl text-muted-foreground mb-2">{freelancer.tagline}</p>}
          <div className="flex items-center justify-center md:justify-start gap-2 text-primary mb-2">
            <CategoryIcon className="h-5 w-5" />
            <span>{categoryDetails?.name || freelancer.digitalCategorySlug}</span>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
            <StarRating rating={freelancer.averageRating} size={20} showValue />
            <span className="text-md text-muted-foreground">({freelancer.reviews.length} reviews)</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
            {freelancer.skills.slice(0, 5).map(skill => (
              <Badge key={skill} variant="secondary">{skill}</Badge>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center md:justify-start">
            <Button onClick={handleContact} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <MessageSquare className="mr-2 h-4 w-4"/> Contact {freelancer.name.split(' ')[0]}
            </Button>
            <Button onClick={handleStartProject} variant="outline">
              <FileText className="mr-2 h-4 w-4"/> Start a Project
            </Button>
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">About Me</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-line leading-relaxed">{freelancer.description}</p>
            </CardContent>
          </Card>

          {freelancer.portfolio.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center">
                  <Briefcase className="mr-2 h-5 w-5 text-primary" /> My Portfolio
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                {freelancer.portfolio.map(item => (
                  <PortfolioItemCardDisplay key={item.id} item={item} />
                ))}
              </CardContent>
            </Card>
          )}

          {freelancer.servicePackages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-primary" /> Service Packages
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
                {freelancer.servicePackages.map(pkg => (
                  <ServicePackageCardDisplay key={pkg.id} pkg={pkg} />
                ))}
              </CardContent>
            </Card>
          )}

          <section id="reviews" className="space-y-6">
            <ReviewList
              targetId={freelancerId}
              targetType="professional"
              targetTitle={freelancer.name}
            />
          </section>
        </div>

        <aside className="md:col-span-1 space-y-6">
          <Card className="sticky top-20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Contact & Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {freelancer.location.city && (
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 mr-3 mt-1 text-primary shrink-0" />
                  <span>{freelancer.location.city} {freelancer.location.zipCode && `(${freelancer.location.zipCode})`} - Primarily Remote</span>
                </div>
              )}
              {freelancer.contact.email && (
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-3 text-primary" />
                  <a href={`mailto:${freelancer.contact.email}`} className="hover:text-primary truncate">{freelancer.contact.email}</a>
                </div>
              )}
              {freelancer.contact.phone && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3 text-primary" />
                  <a href={`tel:${freelancer.contact.phone}`} className="hover:text-primary">{freelancer.contact.phone}</a>
                </div>
              )}
              {freelancer.contact.website && (
                <div className="flex items-center">
                  <Globe className="h-5 w-5 mr-3 text-primary" />
                  <a href={freelancer.contact.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">
                    {freelancer.contact.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {freelancer.operatingHours && (
                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 mr-3 mt-1 text-primary shrink-0" />
                  <span className="whitespace-pre-line">{freelancer.operatingHours}</span>
                </div>
              )}
              {freelancer.pricing && (
                <div className="flex items-center">
                  <TagIcon className="h-5 w-5 mr-3 text-primary" />
                  <span>Typical Project Price: {freelancer.pricing}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
