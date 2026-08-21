
'use client';

// This section is being replaced by ProviderServiceManagementSection.tsx
// Keeping this file temporarily to avoid breaking existing imports if any,
// but its content will be minimal or redirect.
// For this update, I'll make it an empty placeholder.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function ServiceListingOversightSection() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline">Service Listing Oversight (Legacy)</h1>
        <p className="text-muted-foreground">
          This section is being replaced. Please use the new "Service Management" section.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Section Deprecated</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The functionality for managing service listings has been moved to the new "Service Management" section.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/professional-services?section=service-management">
              Go to Service Management
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
