'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ListedPartCard } from "@/components/parts/ListedPartCard";
import { PartRequestCard } from "@/components/parts/PartRequestCard";
import { mockListedParts, mockPartRequests, partCategories } from "@/data/mock";
import { PackagePlus, Search, ListChecks, UserRoundSearch, Sparkles, PackageSearch, Cog, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const ALL_FILTER_VALUE = "_all_";

export function PartsMineClient() {
  const { translate } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');

  const conditionOptions: { value: string; label: string }[] = [
    { value: 'used-working', label: translate('usedWorking', 'Used - Working Well') },
    { value: 'used-good', label: translate('usedGood', 'Used - Good') },
    { value: 'used-fair-needs-inspection', label: translate('usedFair', 'Used - Fair (Needs Inspection)') },
    { value: 'for-parts-experts-only', label: translate('forParts', 'For Parts/Experts Only') },
  ];

  const provinceOptions = [
    { value: 'sidi-bel-abbes', label: 'Sidi Bel Abbès' },
    { value: 'oran', label: 'Oran' },
    { value: 'algiers', label: 'Algiers' },
  ];

  const filteredListedParts = mockListedParts.filter((part) => {
    const searchTermLower = searchTerm.toLowerCase();
    const nameMatch = part.partName.toLowerCase().includes(searchTermLower);
    const deviceMatch = part.originalDeviceName?.toLowerCase().includes(searchTermLower);
    const categoryMatch = selectedCategory ? part.categorySlug === selectedCategory : true;
    const conditionMatch = selectedCondition ? part.condition === selectedCondition : true;
    const provinceMatch = selectedProvince
      ? part.location?.province?.toLowerCase().replace(/\s+/g, '-') === selectedProvince
      : true;

    return (nameMatch || deviceMatch) && categoryMatch && conditionMatch && provinceMatch;
  });

  return (
    <div className="space-y-10">
      <header className="text-center py-10 bg-gradient-to-br from-accent/15 via-background to-primary/15 rounded-lg shadow-inner">
        <div className="inline-block p-4 bg-primary rounded-full mb-4 shadow">
          <Cog className="h-12 w-12 text-primary-foreground" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
          {translate('partsMineTitle', 'Welcome to The Parts Mine')}
        </h1>
        <p className="text-lg md:text-xl text-foreground mt-3 max-w-3xl mx-auto">
          {translate(
            'partsMineSub',
            'Your specialized marketplace for buying and selling new & used spare parts. Find what you need, or list what you have!'
          )}
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/parts-mine/list-new" passHref>
          <Button
            className="w-full py-8 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105"
            size="lg"
          >
            <PackagePlus className="mr-3 h-7 w-7" /> {translate('listPartBtn', 'List a Part for Sale')}
          </Button>
        </Link>
        <Link href="/parts-mine/request/new" passHref>
          <Button
            className="w-full py-8 text-lg bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transition-transform hover:scale-105"
            size="lg"
          >
            <UserRoundSearch className="mr-3 h-7 w-7" /> {translate('requestPartBtn', 'Request a Missing Part')}
          </Button>
        </Link>
      </div>

      <Card className="shadow-xl border-border">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center font-headline">
            <Search className="mr-3 h-6 w-6 text-primary" /> {translate('findSpareParts', 'Find Spare Parts')}
          </CardTitle>
          <CardDescription>
            {translate('findSparePartsDesc', 'Search by part name, device model, or use the filters below.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            placeholder={translate(
              'searchPlaceholderParts',
              'Search for part name, device model (e.g., Samsung S10 screen, Renault Clio headlight)...'
            )}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 text-md"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select
              value={selectedCategory === '' ? ALL_FILTER_VALUE : selectedCategory}
              onValueChange={(val) => setSelectedCategory(val === ALL_FILTER_VALUE ? '' : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={translate('filterCategory', 'Filter by Category...')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>{translate('allCategories', 'All Categories')}</SelectItem>
                {partCategories.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug}>
                    <div className="flex items-center">
                      <cat.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedCondition === '' ? ALL_FILTER_VALUE : selectedCondition}
              onValueChange={(val) => setSelectedCondition(val === ALL_FILTER_VALUE ? '' : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={translate('filterCondition', 'Filter by Condition...')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>{translate('allConditions', 'All Conditions')}</SelectItem>
                {conditionOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedProvince === '' ? ALL_FILTER_VALUE : selectedProvince}
              onValueChange={(val) => setSelectedProvince(val === ALL_FILTER_VALUE ? '' : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={translate('filterWilaya', 'Filter by Wilaya...')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>{translate('allWilayas', 'All Wilayas')}</SelectItem>
                {provinceOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-3xl font-semibold font-headline mb-6 flex items-center">
          <ListChecks className="mr-3 h-7 w-7 text-primary" /> {translate('recentlyListed', 'Recently Listed Parts')}
        </h2>
        {filteredListedParts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredListedParts.map((part) => (
              <ListedPartCard key={part.id} part={part} />
            ))}
          </div>
        ) : (
          <Card className="py-8 text-center bg-muted/50 border-dashed">
            <CardContent>
              <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {translate('noPartsFound', 'No parts match your current search/filters.')}
              </p>
              <p className="text-sm text-muted-foreground">
                {translate('noPartsFoundSub', 'Try adjusting your search or view all available parts.')}
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <Separator className="my-10" />

      <Card className="bg-accent/10 border-accent/30 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center">
            <Sparkles className="mr-3 h-6 w-6 text-accent" /> {translate('aiDiscovery', 'AI-Powered Discovery')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground mb-2">
            {translate('aiDiscoverySub', 'Our AI helps you find what you need!')}
          </p>
        </CardContent>
      </Card>

      <Separator className="my-10" />

      {mockPartRequests.length > 0 && (
        <section>
          <h2 className="text-3xl font-semibold font-headline mb-6 flex items-center">
            <UserRoundSearch className="mr-3 h-7 w-7 text-primary" />{' '}
            {translate('activeRequests', 'My Active Part Requests')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
            {mockPartRequests.map((req) => (
              <PartRequestCard key={req.id} request={req} />
            ))}
          </div>
        </section>
      )}

      <Separator className="my-10" />

      <Card className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center">
            <ShieldCheck className="mr-3 h-6 w-6 text-blue-600 dark:text-blue-400" />{' '}
            {translate('secureTransactions', 'Secure Transactions')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            {translate(
              'secureTransactionsDesc',
              'All transactions within the Marketplace are designed with your security in mind.'
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
