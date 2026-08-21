
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ListedPartCard } from "@/components/parts/ListedPartCard";
import { PartRequestCard } from "@/components/parts/PartRequestCard";
import { partsService } from "@/services/partsService";
import { partCategories } from "@/data/mock";
import { algerianWilayas } from "@/data/algerian-wilayas"; // Import all wilayas
import { PackagePlus, Search, Filter, ListChecks, UserRoundSearch, Sparkles, AlertTriangle, PackageSearch, Building2, Cog, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import type { ListedPart, PartRequest } from "@/types";

const ALL_FILTER_VALUE = "_all_"; 

export default function MarketplacePage() {
  const { translate } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedProvinceCode, setSelectedProvinceCode] = useState(''); // Store Wilaya code
  const [listedParts, setListedParts] = useState<ListedPart[]>([]);
  const [partRequests, setPartRequests] = useState<PartRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = translate('marketplaceTitle', 'Marketplace') + ' | Khidmatik';
  }, [translate]);

  // Load parts and requests from Supabase
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const parts = await partsService.getListedParts();
        const reqs = await partsService.getPartRequests();
        setListedParts(parts);
        setPartRequests(reqs);
      } catch (err) {
        console.error('Error fetching marketplace data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);
  
  const conditionOptions: {value: string, label: string}[] = [
    { value: 'used-working', label: translate('usedWorking', 'Used - Working Well') },
    { value: 'used-good', label: translate('usedGood', 'Used - Good') },
    { value: 'used-fair-needs-inspection', label: translate('usedFair', 'Used - Fair (Needs Inspection)') },
    { value: 'for-parts-experts-only', label: translate('forParts', 'For Parts/Experts Only') },
  ];

  // Use imported algerianWilayas for province options
  const provinceOptions = algerianWilayas.map(wilaya => ({
    value: wilaya.code, // Use wilaya code as value
    label: `${wilaya.name_fr} (${wilaya.name})` // Display French and Arabic names
  }));

  const filteredListedParts = listedParts.filter(part => {
    const searchTermLower = searchTerm.toLowerCase();
    const nameMatch = part.partName.toLowerCase().includes(searchTermLower);
    const deviceMatch = part.originalDeviceName?.toLowerCase().includes(searchTermLower);
    const categoryMatch = selectedCategory ? part.categorySlug === selectedCategory : true;
    const conditionMatch = selectedCondition ? part.condition === selectedCondition : true;
    // Filter by wilaya code if selected
    const provinceMatch = selectedProvinceCode ? part.location?.wilayaCode === selectedProvinceCode : true;

    return (nameMatch || deviceMatch) && categoryMatch && conditionMatch && provinceMatch;
  });


  return (
    <div className="space-y-10">
      <header className="text-center py-10 bg-gradient-to-br from-accent/15 via-background to-primary/15 rounded-lg shadow-inner">
        <div className="inline-block p-4 bg-primary rounded-full mb-4 shadow">
            <Cog className="h-12 w-12 text-primary-foreground" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
          {translate('marketplaceTitle', 'Welcome to the Marketplace')}
        </h1>
        <p className="text-lg md:text-xl text-foreground mt-3 max-w-3xl mx-auto">
          {translate('marketplaceSub', 'Your specialized hub for buying and selling new & used spare parts in Algérie. Find what you need, or list what you have!')}
        </p>
      </header>

      {/* Action Buttons */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/marketplace/list-new" passHref>
          <Button className="w-full py-8 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105" size="lg">
            <PackagePlus className="mr-3 h-7 w-7" /> {translate('listPartBtn', 'List a Part for Sale')}
          </Button>
        </Link>
        <Link href="/marketplace/request/new" passHref>
          <Button className="w-full py-8 text-lg bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transition-transform hover:scale-105" size="lg">
            <UserRoundSearch className="mr-3 h-7 w-7" /> {translate('requestPartBtn', 'Request a Missing Part')}
          </Button>
        </Link>
      </div>

      {/* Search and Filters Bar */}
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
            placeholder={translate('searchPlaceholderParts', 'Search for part name, device model (e.g., Samsung S10 screen, Renault Clio headlight)...')}
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
                {partCategories.map(cat => (
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
                {conditionOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select 
              value={selectedProvinceCode === '' ? ALL_FILTER_VALUE : selectedProvinceCode} 
              onValueChange={(val) => setSelectedProvinceCode(val === ALL_FILTER_VALUE ? '' : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={translate('filterWilaya', 'Filter by Wilaya...')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>{translate('allWilayas', 'All Wilayas')}</SelectItem>
                {provinceOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
           <p className="text-xs text-muted-foreground">{translate('advancedFiltersSoon', 'Advanced filters for brand and price range coming soon.')}</p>
        </CardContent>
      </Card>
      
      {/* Recently Listed Parts */}
      <section>
        <h2 className="text-3xl font-semibold font-headline mb-6 flex items-center">
          <ListChecks className="mr-3 h-7 w-7 text-primary" /> {translate('recentlyListed', 'Recently Listed Parts')}
        </h2>
        {filteredListedParts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredListedParts.map(part => (
              <ListedPartCard key={part.id} part={part} />
            ))}
          </div>
        ) : (
          <Card className="py-8 text-center bg-muted/50 border-dashed">
            <CardContent>
              <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{translate('noPartsFound', 'No parts match your current search/filters.')}</p>
              <p className="text-sm text-muted-foreground">{translate('noPartsFoundSub', 'Try adjusting your search or view all available parts.')}</p>
            </CardContent>
          </Card>
        )}
      </section>

      <Separator className="my-10"/>

      {/* AI-Powered Suggestions Placeholder */}
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
          <ul className="list-disc list-inside text-sm space-y-1">
            <li><strong className="text-accent">{translate('smartRequestMatching', 'Smart Request Matching')}:</strong> {translate('smartRequestMatchingDesc', 'When you request a part, our AI searches listings and notifies you of matches. Sellers may also be notified.')}</li>
            <li><strong className="text-accent">{translate('enhancedSearch', 'Enhanced Search (Coming Soon)')}:</strong> {translate('enhancedSearchDesc', 'AI will suggest compatible or alternative parts.')}</li>
          </ul>
          <div className="mt-4 p-3 bg-background/50 rounded-md border border-dashed">
            <p className="font-medium text-sm">{translate('exampleAiSuggestion', 'Example AI Suggestion (Conceptual):')}</p>
            <p className="text-xs text-muted-foreground">{translate('exampleAiText', '"We noticed you recently requested a refrigerator technician. You might be interested in these refrigerator parts..."')}</p>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-10"/>
      
      {/* Active User Requests */}
      {partRequests.length > 0 && (
        <section>
          <h2 className="text-3xl font-semibold font-headline mb-6 flex items-center">
            <UserRoundSearch className="mr-3 h-7 w-7 text-primary" /> {translate('activeRequests', 'My Active Part Requests')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
            {partRequests.map(req => (
              <PartRequestCard key={req.id} request={req} />
            ))}
          </div>
        </section>
      )}
      
      <Separator className="my-10"/>

      {/* Secure Transactions Info */}
      <Card className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center">
            <ShieldCheck className="mr-3 h-6 w-6 text-blue-600 dark:text-blue-400" /> {translate('secureTransactions', 'Secure Transactions')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
            <p>
                {translate('secureTransactionsDesc', 'All transactions within the Marketplace are designed with your security in mind.')}
            </p>
            <ul className="list-disc list-inside space-y-1">
                <li><strong className="font-medium">{translate('inAppComm', 'In-App Communication')}:</strong> {translate('inAppCommDesc', 'Chat securely with sellers/buyers to discuss details and arrange delivery.')}</li>
                <li><strong className="font-medium">{translate('escrowWallet', 'Escrow Wallet Protection')}:</strong> {translate('escrowWalletDesc', 'Payments are processed through Escrow Wallet. Funds are held until you confirm receipt.')}</li>
                <li><strong className="font-medium">{translate('disputeRes', 'Dispute Resolution')}:</strong> {translate('disputeResDesc', 'A simple mechanism for dispute resolution will be available to help with any issues.')}</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}

