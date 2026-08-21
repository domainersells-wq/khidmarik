'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, ListChecks, Info, ShieldAlert, PackageSearch, StarOff, 
  MessageSquareWarning, Trash2, Edit, CheckCircle, Filter, Plus, 
  MapPin, Tag, PlusCircle, Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categories as initialCategories } from '@/data/mock';
import { Badge } from '@/components/ui/badge';

// Mock reported items
const mockReportedItems = [
  { id: 'report1', type: 'Product', name: 'Suspicious "Antique" Vase', reporter: 'UserX', reason: 'Potentially fake item description.', date: '2024-07-15' },
  { id: 'report2', type: 'Service', name: 'Unlicensed "Doctor" Consultation', reporter: 'UserY', reason: 'Provider claims medical expertise without credentials.', date: '2024-07-14'},
  { id: 'report3', type: 'User Profile', name: 'SpamUser123', reporter: 'AI Flag', reason: 'Multiple spam comments posted.', date: '2024-07-16'},
];

const mockReviewsForModeration = [
  { id: 'rev_mod1', listingName: 'Pizza Algéroise', userName: 'ClientA', rating: 1, comment: 'This is unacceptable! Worst pizza ever, full of insults!', status: 'Pending' },
  { id: 'rev_mod2', listingName: 'Plomberie Express', userName: 'ClientB', rating: 5, comment: 'Excellent service, very professional.', status: 'Approved' },
];

export function ContentManagementSection() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'moderation' | 'categories' | 'geography'>('moderation');
  
  // Category management states
  const [categories, setCategories] = useState(initialCategories);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatType, setNewCatType] = useState<'store' | 'professional' | 'all'>('store');

  // Geography management states
  const [cities, setCities] = useState([
    { name: 'Sidi Bel Abbès', wilaya: 'Sidi Bel Abbès (22)', zip: '22000' },
    { name: 'Alger Centre', wilaya: 'Algiers (16)', zip: '16000' },
    { name: 'Oran Ville', wilaya: 'Oran (31)', zip: '31000' }
  ]);
  const [newCityName, setNewCityName] = useState('');
  const [newCityWilaya, setNewCityWilaya] = useState('');
  const [newCityZip, setNewCityZip] = useState('');

  const handleModerateItem = (itemId: string, action: 'Approve' | 'Reject' | 'Remove' | 'Edit') => {
    toast({
      title: `Content Moderation: ${action}`,
      description: `Item ID ${itemId} has been ${action.toLowerCase()}d successfully.`,
    });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatSlug) return;
    
    const newCat = {
      id: 'cat' + (categories.length + 1),
      name: newCatName,
      slug: newCatSlug,
      icon: Tag as any,
      type: newCatType
    };
    
    setCategories(prev => [...prev, newCat]);
    setNewCatName('');
    setNewCatSlug('');
    toast({ title: 'Category Created', description: `Category ${newCatName} is now live.` });
  };

  const handleAddCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName || !newCityWilaya) return;

    setCities(prev => [...prev, { name: newCityName, wilaya: newCityWilaya, zip: newCityZip }]);
    setNewCityName('');
    setNewCityWilaya('');
    setNewCityZip('');
    toast({ title: 'City Added', description: `${newCityName} added to dynamic coverage.` });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <ShieldAlert className="mr-3 h-8 w-8 text-primary" /> Platform Settings & Content Moderation
          </h1>
          <p className="text-muted-foreground">Manage categories, coverage areas, reviews, and content moderation queues.</p>
        </div>
      </header>

      {/* Tabs list */}
      <div className="flex border-b gap-4 select-none pb-2">
        <Button
          variant={activeTab === 'moderation' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('moderation')}
          className="text-xs font-bold"
        >
          <ListChecks className="mr-1.5 h-4 w-4" /> Moderation Queue
        </Button>
        <Button
          variant={activeTab === 'categories' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('categories')}
          className="text-xs font-bold"
        >
          <Tag className="mr-1.5 h-4 w-4" /> Categories ribbon
        </Button>
        <Button
          variant={activeTab === 'geography' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('geography')}
          className="text-xs font-bold"
        >
          <MapPin className="mr-1.5 h-4 w-4" /> Cities & Neighborhoods
        </Button>
      </div>

      {activeTab === 'moderation' && (
        <div className="space-y-6">
          {/* Flagged Content queue */}
          <Card>
            <CardHeader>
              <CardTitle>Reported Content Queue</CardTitle>
              <CardDescription>Review products, services, or user profiles flagged by users or AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockReportedItems.map(item => (
                <Card key={item.id} className="p-4 bg-muted/40 border">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-semibold text-sm">{item.type}: {item.name}</p>
                      <p className="text-xs text-muted-foreground">Reported by: {item.reporter} on {item.date}</p>
                    </div>
                    <Badge variant="destructive" className="text-[10px]">{item.type}</Badge>
                  </div>
                  <p className="text-xs mt-2 text-foreground font-medium bg-background p-2.5 rounded-lg border">Reason: {item.reason}</p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => handleModerateItem(item.id, 'Approve')}><CheckCircle className="mr-1 h-3.5 w-3.5 text-green-500"/>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleModerateItem(item.id, 'Remove')}><Trash2 className="mr-1 h-3.5 w-3.5"/>Delete Content</Button>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Customer reviews queue */}
          <Card>
            <CardHeader>
              <CardTitle>Yelp Reviews Moderation</CardTitle>
              <CardDescription>Moderate, approve, or delete reported customer reviews based on guidelines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockReviewsForModeration.map(review => (
                <Card key={review.id} className="p-4 bg-muted/40 border">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-semibold text-sm">Review for "{review.listingName}" by {review.userName} ({review.rating} stars)</p>
                      <p className="text-xs italic text-muted-foreground mt-1 bg-background p-2.5 rounded-lg border">"{review.comment}"</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{review.status}</Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {review.status === 'Pending' && <Button size="sm" variant="outline" onClick={() => handleModerateItem(review.id, 'Approve')}><Check className="mr-1 h-3.5 w-3.5 text-green-500"/>Approve</Button>}
                    <Button size="sm" variant="outline" onClick={() => handleModerateItem(review.id, 'Reject')} className="text-destructive hover:bg-destructive/10"><Trash2 className="mr-1 h-3.5 w-3.5"/>Delete Review</Button>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage Ribbon Categories</CardTitle>
              <CardDescription>Add new categories to the Yelp home search ribbon page dynamically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end p-4 border rounded-xl bg-muted/30">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Category Name</span>
                  <Input 
                    type="text" 
                    placeholder="e.g. Restaurants" 
                    value={newCatName} 
                    onChange={e => setNewCatName(e.target.value)} 
                    className="h-10 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Slug identifier</span>
                  <Input 
                    type="text" 
                    placeholder="e.g. restaurants" 
                    value={newCatSlug} 
                    onChange={e => setNewCatSlug(e.target.value)} 
                    className="h-10 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Type</span>
                  <Select value={newCatType} onValueChange={(val: any) => setNewCatType(val)}>
                    <SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="store">Store / متجر</SelectItem>
                      <SelectItem value="professional">Professional / حرفي</SelectItem>
                      <SelectItem value="all">All / الكل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="h-10 bg-primary font-bold text-xs">
                  <PlusCircle className="mr-1 h-4 w-4" /> Add Category
                </Button>
              </form>

              {/* Grid lists */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-3 border rounded-xl bg-card shadow-sm flex items-center justify-between text-xs font-semibold">
                    <span className="truncate">{cat.name}</span>
                    <Badge variant="secondary" className="text-[9px]">{cat.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'geography' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage Coverage Areas</CardTitle>
              <CardDescription>Define cities, wilayas, and neighborhood options active for local matching filters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleAddCity} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end p-4 border rounded-xl bg-muted/30">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase">City / Neighborhood</span>
                  <Input 
                    type="text" 
                    placeholder="e.g. Sidi Bel Abbès" 
                    value={newCityName} 
                    onChange={e => setNewCityName(e.target.value)} 
                    className="h-10 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Wilaya State</span>
                  <Input 
                    type="text" 
                    placeholder="e.g. Sidi Bel Abbès (22)" 
                    value={newCityWilaya} 
                    onChange={e => setNewCityWilaya(e.target.value)} 
                    className="h-10 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Postal Zip Code</span>
                  <Input 
                    type="text" 
                    placeholder="e.g. 22000" 
                    value={newCityZip} 
                    onChange={e => setNewCityZip(e.target.value)} 
                    className="h-10 text-xs font-semibold"
                  />
                </div>
                <Button type="submit" className="h-10 bg-primary font-bold text-xs">
                  <Plus className="mr-1 h-4 w-4" /> Add Area
                </Button>
              </form>

              {/* Coverage list */}
              <div className="border rounded-xl overflow-hidden bg-card">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted text-muted-foreground uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-3">Location Name</th>
                      <th className="p-3">Wilaya State</th>
                      <th className="p-3 text-right">Postal Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-semibold">
                    {cities.map((city, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold text-foreground">{city.name}</td>
                        <td className="p-3">{city.wilaya}</td>
                        <td className="p-3 text-right font-mono">{city.zip || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ContentManagementSection;
