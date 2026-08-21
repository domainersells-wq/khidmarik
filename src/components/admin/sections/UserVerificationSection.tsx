'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  Edit, 
  Search, 
  UserCheck, 
  Store, 
  Briefcase, 
  DollarSign, 
  Package, 
  Flag,
  FileText
} from 'lucide-react';

export function UserVerificationSection() {
  const { toast } = useToast();
  const { translate } = useLanguage();
  
  // Current tab state
  const [activeTab, setActiveTab] = useState<'kyc' | 'stores' | 'services' | 'withdrawals' | 'products' | 'complaints'>('kyc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom dialog comments state
  const [commentText, setCommentText] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isCommentOpen, setIsCommentOpen] = useState(false);

  // Mock approval datasets
  const [kycQueue, setKycQueue] = useState([
    { id: 'kyc-1', name: 'Nabil Benz', email: 'nabil@example.com', type: 'Professional', submitted: '2 hours ago', status: 'Pending' },
    { id: 'kyc-2', name: 'Karim Brahimi', email: 'karim@example.com', type: 'Store Owner', submitted: 'Yesterday', status: 'Pending' }
  ]);

  const [storesQueue, setStoresQueue] = useState([
    { id: 'store-1', name: 'DzTech Electronics', owner: 'Amine Dz', category: 'Hardware', submitted: '3 hours ago', status: 'Pending' },
    { id: 'store-2', name: 'Oran Fashion Hub', owner: 'Sarah Oran', category: 'Clothing', submitted: '2 days ago', status: 'Pending' }
  ]);

  const [servicesQueue, setServicesQueue] = useState([
    { id: 'service-1', name: 'Home Plumbing Care', provider: 'Yacine Plumber', category: 'Maintenance', submitted: '5 hours ago', status: 'Pending' },
    { id: 'service-2', name: 'Web Development Studio', provider: 'Dev Solutions', category: 'IT Services', submitted: '3 days ago', status: 'Pending' }
  ]);

  const [withdrawalsQueue, setWithdrawalsQueue] = useState([
    { id: 'with-1', provider: 'Yacine Plumber', amount: '24,500 DA', bank: 'CCP Algeria', submitted: '1 hour ago', status: 'Pending' },
    { id: 'with-2', provider: 'DzTech Store', amount: '89,000 DA', bank: 'BDL Bank', submitted: '5 hours ago', status: 'Pending' }
  ]);

  const [productsQueue, setProductsQueue] = useState([
    { id: 'prod-1', title: 'iPhone 15 Pro Max (Refurbished)', seller: 'DzTech Electronics', price: '185,000 DA', submitted: '10 mins ago', status: 'Pending' },
    { id: 'prod-2', title: 'Wireless Bluetooth Headset', seller: 'Alger Shop', price: '4,200 DA', submitted: '4 hours ago', status: 'Pending' }
  ]);

  const [complaintsQueue, setComplaintsQueue] = useState([
    { id: 'comp-1', reporter: 'Client Mourad', target: 'DzTech Electronics', reason: 'Delayed Yalidine shipment', submitted: '1 hour ago', status: 'Pending' },
    { id: 'comp-2', reporter: 'Guest Yasser', target: 'Home Plumbing Care', reason: 'Unfinished plumber works', submitted: 'Yesterday', status: 'Pending' }
  ]);

  const handleApproveItem = (id: string, tab: string) => {
    toast({
      title: "Approval Confirmed",
      description: `Item ID ${id} in ${tab} approved successfully. Notifications sent.`,
    });
    updateStatus(id, tab, 'Approved');
  };

  const handleRejectItem = (id: string, tab: string) => {
    toast({
      title: "Item Rejected",
      description: `Item ID ${id} in ${tab} marked as rejected.`,
      variant: "destructive"
    });
    updateStatus(id, tab, 'Rejected');
  };

  const handleRequestEdit = (id: string, tab: string) => {
    toast({
      title: "Revision Requested",
      description: `Applicant for Item ID ${id} has been notified to edit and resubmit documents.`,
    });
    updateStatus(id, tab, 'Action Needed');
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !selectedItemId) return;
    toast({
      title: "Comment Logged",
      description: `Internal audit comment added: "${commentText}"`,
    });
    setCommentText('');
    setIsCommentOpen(false);
  };

  const updateStatus = (id: string, tab: string, newStatus: string) => {
    const updateHelper = (list: any[]) => list.map(item => item.id === id ? { ...item, status: newStatus } : item);
    if (tab === 'kyc') setKycQueue(prev => updateHelper(prev));
    if (tab === 'stores') setStoresQueue(prev => updateHelper(prev));
    if (tab === 'services') setServicesQueue(prev => updateHelper(prev));
    if (tab === 'withdrawals') setWithdrawalsQueue(prev => updateHelper(prev));
    if (tab === 'products') setProductsQueue(prev => updateHelper(prev));
    if (tab === 'complaints') setComplaintsQueue(prev => updateHelper(prev));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold text-[10px]">Approved</Badge>;
      case 'Rejected':
        return <Badge variant="destructive" className="font-bold text-[10px]">Rejected</Badge>;
      case 'Action Needed':
        return <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200 font-bold text-[10px]">Action Needed</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 font-bold text-[10px]">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 font-sans text-left rtl:text-right">
      <header>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-primary" /> Approval Center (مركز الموافقات)
        </h1>
        <p className="text-xs text-muted-foreground">Authorize platform registrations, document verification updates, merchant payout requests, and complaints.</p>
      </header>

      {/* Segmented Control Tabs */}
      <div className="flex border-b text-xs font-semibold overflow-x-auto gap-4 custom-sidebar-scrollbar whitespace-nowrap">
        {[
          { key: 'kyc', label: 'Verifications', icon: UserCheck },
          { key: 'stores', label: 'Store Applications', icon: Store },
          { key: 'services', label: 'Service Applications', icon: Briefcase },
          { key: 'withdrawals', label: 'Withdrawal Requests', icon: DollarSign },
          { key: 'products', label: 'Product Moderation', icon: Package },
          { key: 'complaints', label: 'Complaints & Reports', icon: Flag }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any);
                setSearchQuery('');
              }}
              className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === tab.key 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Table Card */}
      <Card className="border rounded-2xl shadow-sm overflow-hidden bg-card">
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-sm font-bold text-slate-800">Pending Review Pipeline</CardTitle>
          <CardDescription className="text-xs">Select actions to authorize, request reviews, or record administrative comments.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          
          {/* KYC Queue */}
          {activeTab === 'kyc' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="text-xs font-bold">Applicant Name</TableHead>
                  <TableHead className="text-xs font-bold">Email Address</TableHead>
                  <TableHead className="text-xs font-bold">Registration Target</TableHead>
                  <TableHead className="text-xs font-bold">Submitted</TableHead>
                  <TableHead className="text-xs font-bold">Verification Status</TableHead>
                  <TableHead className="text-right text-xs font-bold">Audit Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kycQueue.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors">
                    <TableCell className="text-xs font-semibold">{item.name}</TableCell>
                    <TableCell className="text-xs font-mono">{item.email}</TableCell>
                    <TableCell className="text-xs">{item.type}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.submitted}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right space-x-1.5">
                      {item.status === 'Pending' && (
                        <>
                          <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg text-green-600 hover:bg-green-50 border-green-200" onClick={() => handleApproveItem(item.id, 'kyc')}>Approve</Button>
                          <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleRejectItem(item.id, 'kyc')}>Reject</Button>
                          <Button size="sm" variant="ghost" className="h-8 text-[11px] rounded-lg text-slate-500" onClick={() => handleRequestEdit(item.id, 'kyc')}>Request Edit</Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400" onClick={() => { setSelectedItemId(item.id); setIsCommentOpen(true); }}><MessageSquare className="h-4 w-4" /></Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Stores Queue */}
          {activeTab === 'stores' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="text-xs font-bold">Store Name</TableHead>
                  <TableHead className="text-xs font-bold">Owner Email</TableHead>
                  <TableHead className="text-xs font-bold">Store Category</TableHead>
                  <TableHead className="text-xs font-bold">Submitted</TableHead>
                  <TableHead className="text-xs font-bold">Approval Status</TableHead>
                  <TableHead className="text-right text-xs font-bold">Audit Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storesQueue.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors">
                    <TableCell className="text-xs font-semibold">{item.name}</TableCell>
                    <TableCell className="text-xs font-mono">{item.owner}</TableCell>
                    <TableCell className="text-xs">{item.category}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.submitted}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right space-x-1.5">
                      {item.status === 'Pending' && (
                        <>
                          <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg text-green-600 hover:bg-green-50 border-green-200" onClick={() => handleApproveItem(item.id, 'stores')}>Approve</Button>
                          <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleRejectItem(item.id, 'stores')}>Reject</Button>
                          <Button size="sm" variant="ghost" className="h-8 text-[11px] rounded-lg text-slate-500" onClick={() => handleRequestEdit(item.id, 'stores')}>Request Edit</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Services Queue */}
          {activeTab === 'services' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="text-xs font-bold">Service Title</TableHead>
                  <TableHead className="text-xs font-bold">Provider Profile</TableHead>
                  <TableHead className="text-xs font-bold">Main Category</TableHead>
                  <TableHead className="text-xs font-bold">Submitted</TableHead>
                  <TableHead className="text-xs font-bold">Approval Status</TableHead>
                  <TableHead className="text-right text-xs font-bold">Audit Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicesQueue.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors">
                    <TableCell className="text-xs font-semibold">{item.name}</TableCell>
                    <TableCell className="text-xs font-semibold">{item.provider}</TableCell>
                    <TableCell className="text-xs">{item.category}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.submitted}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right space-x-1.5">
                      {item.status === 'Pending' && (
                        <>
                          <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg text-green-600 hover:bg-green-50 border-green-200" onClick={() => handleApproveItem(item.id, 'services')}>Approve</Button>
                          <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleRejectItem(item.id, 'services')}>Reject</Button>
                          <Button size="sm" variant="ghost" className="h-8 text-[11px] rounded-lg text-slate-500" onClick={() => handleRequestEdit(item.id, 'services')}>Request Edit</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Withdrawals Queue */}
          {activeTab === 'withdrawals' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="text-xs font-bold">Merchant Name</TableHead>
                  <TableHead className="text-xs font-bold">Withdrawal Amount</TableHead>
                  <TableHead className="text-xs font-bold">Transfer Target</TableHead>
                  <TableHead className="text-xs font-bold">Submitted</TableHead>
                  <TableHead className="text-xs font-bold">Transaction Status</TableHead>
                  <TableHead className="text-right text-xs font-bold">Audit Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawalsQueue.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors">
                    <TableCell className="text-xs font-semibold">{item.provider}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.amount}</TableCell>
                    <TableCell className="text-xs font-mono">{item.bank}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.submitted}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right space-x-1.5">
                      {item.status === 'Pending' && (
                        <>
                          <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg text-green-600 hover:bg-green-50 border-green-200" onClick={() => handleApproveItem(item.id, 'withdrawals')}>Authorize Transfer</Button>
                          <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleRejectItem(item.id, 'withdrawals')}>Hold Payout</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Product Queue */}
          {activeTab === 'products' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="text-xs font-bold">Product Title</TableHead>
                  <TableHead className="text-xs font-bold">Store Seller</TableHead>
                  <TableHead className="text-xs font-bold">Pricing</TableHead>
                  <TableHead className="text-xs font-bold">Submitted</TableHead>
                  <TableHead className="text-xs font-bold">Moderation Status</TableHead>
                  <TableHead className="text-right text-xs font-bold">Audit Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsQueue.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors">
                    <TableCell className="text-xs font-semibold">{item.title}</TableCell>
                    <TableCell className="text-xs font-semibold">{item.seller}</TableCell>
                    <TableCell className="text-xs font-mono">{item.price}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.submitted}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right space-x-1.5">
                      {item.status === 'Pending' && (
                        <>
                          <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg text-green-600 hover:bg-green-50 border-green-200" onClick={() => handleApproveItem(item.id, 'products')}>Approve Listing</Button>
                          <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleRejectItem(item.id, 'products')}>Flag Listing</Button>
                          <Button size="sm" variant="ghost" className="h-8 text-[11px] rounded-lg text-slate-500" onClick={() => handleRequestEdit(item.id, 'products')}>Request Revision</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Complaints Queue */}
          {activeTab === 'complaints' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="text-xs font-bold">Reporter</TableHead>
                  <TableHead className="text-xs font-bold">Accused Entity</TableHead>
                  <TableHead className="text-xs font-bold">Reason/Violation</TableHead>
                  <TableHead className="text-xs font-bold">Submitted</TableHead>
                  <TableHead className="text-xs font-bold">Resolution Status</TableHead>
                  <TableHead className="text-right text-xs font-bold">Audit Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaintsQueue.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors">
                    <TableCell className="text-xs font-semibold">{item.reporter}</TableCell>
                    <TableCell className="text-xs font-semibold text-red-600">{item.target}</TableCell>
                    <TableCell className="text-xs">{item.reason}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.submitted}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right space-x-1.5">
                      {item.status === 'Pending' && (
                        <>
                          <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg text-green-600 hover:bg-green-50 border-green-200" onClick={() => handleApproveItem(item.id, 'complaints')}>Resolve Complaint</Button>
                          <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleRejectItem(item.id, 'complaints')}>Dismiss Complaint</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

        </CardContent>
      </Card>

      {/* Internal Audit Comment Dialog */}
      <Dialog open={isCommentOpen} onOpenChange={setIsCommentOpen}>
        <DialogContent className="rounded-2xl max-w-sm font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Log Internal Audit Comment</DialogTitle>
            <DialogDescription className="text-xs">Add an administrative note or feedback explanation for audits.</DialogDescription>
          </DialogHeader>
          <div className="my-2">
            <Textarea 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Record decision details here..."
              className="rounded-xl border-input text-xs min-h-[90px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl text-xs h-9" onClick={() => setIsCommentOpen(false)}>Cancel</Button>
            <Button className="rounded-xl text-xs h-9 bg-primary" onClick={handleAddComment}>Save Comment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
