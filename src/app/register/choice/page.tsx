
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Briefcase, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from 'next';

// export const metadata: Metadata = { // Cannot use in client component
//   title: 'Choose Registration Type | Khidmatik',
//   description: 'Select how you want to join Khidmatik - as a user or as a service provider/merchant.',
// };

export default function RegistrationChoicePage() {

  if (typeof window !== 'undefined') {
    document.title = 'Choose Registration Type | Khidmatik';
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-md shadow-xl border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Join Khidmatik</CardTitle>
          <CardDescription className="text-md">
            How would you like to use Khidmatik today?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <Link href="/login" passHref>
            <Button variant="outline" className="w-full h-auto py-6 text-left justify-start text-lg hover:bg-accent/50">
              <User className="mr-4 h-8 w-8 text-primary" />
              <div>
                <span className="font-semibold">Create a Personal Account</span>
                <p className="text-sm text-muted-foreground">To find services, shop, and explore.</p>
              </div>
              <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
            </Button>
          </Link>

          <Link href="/register-provider" passHref>
            <Button variant="default" className="w-full h-auto py-6 text-left justify-start text-lg bg-primary hover:bg-primary/90 text-primary-foreground">
              <Briefcase className="mr-4 h-8 w-8 text-primary-foreground/80" />
              <div>
                <span className="font-semibold">List Your Business or Service</span>
                <p className="text-sm text-primary-foreground/90">Register as a merchant or professional.</p>
              </div>
              <ArrowRight className="ml-auto h-5 w-5 text-primary-foreground/80" />
            </Button>
          </Link>
        </CardContent>
      </Card>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log In
        </Link>
      </p>
    </div>
  );
}
