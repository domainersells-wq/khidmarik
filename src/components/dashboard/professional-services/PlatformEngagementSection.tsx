
'use client';

// This section, if kept for the Professional Dashboard, should focus on *their* engagement metrics,
// e.g., how clients engage with *their* profile and services.
// The previous content was more admin-focused (platform-wide engagement).

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, MessageSquare, Star, ThumbsUp, Users } from 'lucide-react'; // Changed icons
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function PlatformEngagementSection() {
  const { toast } = useToast();
  const router = useRouter();

  const handleViewReviews = () => {
    // This could navigate to a more detailed review management page within their DynamicProfileModules section or a dedicated one
    // For now, it can conceptually link or be part of DynamicProfileModules.
    router.push('/dashboard/professional-services?section=profile-modules#reviews'); 
    toast({ title: 'Viewing Your Reviews', description: 'Manage and respond to client reviews on your profile page.' });
  };

  const handleViewAnalytics = () => {
     router.push('/dashboard/professional-services?section=analytics');
     toast({ title: 'Viewing Your Analytics', description: 'Check your performance metrics like profile views and service popularity.' });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary" /> Client Engagement & Reputation
        </h1>
        <p className="text-muted-foreground">Understand how clients interact with your profile and services, and manage your online reputation.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Star className="mr-2 h-5 w-5 text-primary"/>My Reviews & Ratings</CardTitle>
          <CardDescription>Monitor client feedback and respond to reviews to build trust.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
                Your public reviews and average star rating are key to attracting new clients. Regularly check and respond to feedback.
            </p>
            {/* Conceptual: Display summary of ratings */}
            <div className="p-3 bg-muted/30 rounded-md text-center">
                <p className="text-3xl font-bold">4.8 / 5.0</p>
                <p className="text-sm text-muted-foreground">(Based on 25 reviews)</p>
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleViewReviews}>
                <Eye className="mr-2 h-4 w-4" /> View & Manage My Reviews
            </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Eye className="mr-2 h-5 w-5 text-primary"/>Profile & Service Performance</CardTitle>
          <CardDescription>See how clients are discovering and interacting with your offerings.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
                Track views on your profile and individual service pages to understand what's popular.
            </p>
            {/* Conceptual: Display key performance indicators */}
            <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2 border rounded-md"><p className="font-semibold text-xl">150</p><p className="text-xs text-muted-foreground">Profile Views (Last 7d)</p></div>
                <div className="p-2 border rounded-md"><p className="font-semibold text-xl">450</p><p className="text-xs text-muted-foreground">Total Service Views (Last 7d)</p></div>
            </div>
        </CardContent>
         <CardFooter>
            <Button onClick={handleViewAnalytics}>
                <Eye className="mr-2 h-4 w-4" /> Go to My Analytics Dashboard
            </Button>
        </CardFooter>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-primary"/>Client Communication</CardTitle>
          <CardDescription>Manage your messages and respond to client inquiries promptly.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
                Effective communication is key to client satisfaction. Use the dedicated messaging section to manage all client interactions.
            </p>
        </CardContent>
        <CardFooter>
            <Button onClick={() => router.push('/dashboard/professional-services?section=client-communication')}>
                <MessageSquare className="mr-2 h-4 w-4" /> Open Client Communication Center
            </Button>
        </CardFooter>
      </Card>

    </div>
  );
}
