'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  FileText,
  ShieldCheck,
  BadgeCheck,
  Eye,
  Ban,
  UploadCloud,
  History
} from 'lucide-react';
import { providerVerificationService } from '@/services/providerVerificationService';
import { 
  ProviderVerificationProfile, 
  ProviderVerificationStatus 
} from '@/types/providerVerification';
import { 
  adminDataService, 
  AdminStore, 
  AdminService, 
  AdminWithdrawal, 
  AdminProduct, 
  AdminDispute 
} from '@/services/adminDataService';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';

export function UserVerificationSection() {
  const { toast } = useToast();
  const { translate } = useLanguage();
  
  // Current tab state
  const [activeTab, setActiveTab] = useState<'kyc' | 'stores' | 'services' | 'withdrawals' | 'products' | 'complaints'>('kyc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real KYC Profiles from providerVerificationService
  const [kycProfiles, setKycProfiles] = useState<ProviderVerificationProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ProviderVerificationProfile | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Decision Modal State
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REJECT' | 'REQUEST_DOCUMENTS' | 'SUSPEND'>('APPROVE');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionRequiredNotes, setActionRequiredNotes] = useState('');
  const [mediatorNotes, setMediatorNotes] = useState('');
  const [isExecutingDecision, setIsExecutingDecision] = useState(false);

  // Real Persistent Queues from adminDataService
  const [storesQueue, setStoresQueue] = useState<AdminStore[]>([]);
  const [servicesQueue, setServicesQueue] = useState<AdminService[]>([]);
  const [withdrawalsQueue, setWithdrawalsQueue] = useState<AdminWithdrawal[]>([]);
  const [productsQueue, setProductsQueue] = useState<AdminProduct[]>([]);
  const [complaintsQueue, setComplaintsQueue] = useState<AdminDispute[]>([]);

  const loadAllData = () => {
    setKycProfiles(providerVerificationService.getAllVerificationProfiles());
    setStoresQueue(adminDataService.getStores());
    setServicesQueue(adminDataService.getServices());
    setWithdrawalsQueue(adminDataService.getWithdrawals());
    setProductsQueue(adminDataService.getProducts());
    setComplaintsQueue(adminDataService.getDisputes());
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleStoreStatus = (id: string, status: AdminStore['status']) => {
    adminDataService.updateStoreStatus(id, status);
    loadAllData();
    toast({
      title: 'Store Status Updated',
      description: `Store status set to ${status}.`,
    });
  };

  const handleServiceStatus = (id: string, status: AdminService['status']) => {
    adminDataService.updateServiceStatus(id, status);
    loadAllData();
    toast({
      title: 'Service Listing Updated',
      description: `Service status set to ${status}.`,
    });
  };

  const handleWithdrawalStatus = (id: string, status: AdminWithdrawal['status']) => {
    adminDataService.updateWithdrawalStatus(id, status);
    loadAllData();
    toast({
      title: 'Withdrawal Processed',
      description: `Payout request marked as ${status}.`,
    });
  };

  const handleProductStatus = (id: string, status: AdminProduct['status']) => {
    adminDataService.updateProductStatus(id, status);
    loadAllData();
    toast({
      title: 'Product Status Updated',
      description: `Product moderation set to ${status}.`,
    });
  };

  const handleDisputeStatus = (id: string, status: AdminDispute['status']) => {
    adminDataService.updateDisputeStatus(id, status);
    loadAllData();
    toast({
      title: 'Dispute Case Updated',
      description: `Complaint status updated to ${status}.`,
    });
  };

  const handleOpenDecisionModal = (profile: ProviderVerificationProfile, type: 'APPROVE' | 'REJECT' | 'REQUEST_DOCUMENTS' | 'SUSPEND') => {
    setSelectedProfile(profile);
    setDecisionType(type);
    setRejectionReason('');
    setActionRequiredNotes('');
    setMediatorNotes('');
    setIsDecisionModalOpen(true);
  };

  const handleExecuteDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    setIsExecutingDecision(true);
    try {
      const res = providerVerificationService.adminReviewDecision({
        verificationId: selectedProfile.id,
        adminId: 'adm_1',
        adminName: 'Senior Compliance Auditor',
        decision: decisionType,
        rejectionReason,
        actionRequiredNotes,
        mediatorNotes,
      });

      if (res.success && res.profile) {
        toast({
          title: `Decision Executed: ${decisionType} ✓`,
          description: `Provider ${res.profile.providerName} status updated to ${res.profile.status}.`,
        });
        setIsDecisionModalOpen(false);
        setIsDetailDrawerOpen(false);
        loadAllData();
      }
    } finally {
      setIsExecutingDecision(false);
    }
  };

  const filteredKycProfiles = kycProfiles.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.providerName.toLowerCase().includes(q) ||
      p.legalName.toLowerCase().includes(q) ||
      p.wilaya.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-500/10 via-primary/5 to-card border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-600 text-white font-bold text-xs uppercase px-2.5 py-0.5 rounded-full">
              KYC & Compliance Desk
            </Badge>
            <span className="text-xs text-muted-foreground">• Platform Identity Verifications</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" /> Provider Verification & KYC Approval Hub
          </h2>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            Inspect national IDs, trade registers (RC), artisan cards, tax certificates, and issue verified provider badges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-background border rounded-xl shadow-sm text-right">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
              Pending KYC Dossiers
            </span>
            <span className="text-xl font-extrabold text-blue-600">
              {kycProfiles.filter((p) => p.status === 'UNDER_REVIEW' || p.status === 'DOCUMENTS_SUBMITTED').length} Dossiers
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        <Button 
          variant={activeTab === 'kyc' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setActiveTab('kyc')}
          className="gap-2 text-xs font-semibold rounded-xl"
        >
          <UserCheck className="h-4 w-4" /> Provider KYC ({kycProfiles.length})
        </Button>
        <Button 
          variant={activeTab === 'stores' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setActiveTab('stores')}
          className="gap-2 text-xs font-semibold rounded-xl"
        >
          <Store className="h-4 w-4" /> Store Approvals ({storesQueue.length})
        </Button>
        <Button 
          variant={activeTab === 'services' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setActiveTab('services')}
          className="gap-2 text-xs font-semibold rounded-xl"
        >
          <Briefcase className="h-4 w-4" /> Service Listings ({servicesQueue.length})
        </Button>
        <Button 
          variant={activeTab === 'withdrawals' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setActiveTab('withdrawals')}
          className="gap-2 text-xs font-semibold rounded-xl"
        >
          <DollarSign className="h-4 w-4" /> Payout Requests ({withdrawalsQueue.length})
        </Button>
        <Button 
          variant={activeTab === 'products' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setActiveTab('products')}
          className="gap-2 text-xs font-semibold rounded-xl"
        >
          <Package className="h-4 w-4" /> Product Moderation ({productsQueue.length})
        </Button>
        <Button 
          variant={activeTab === 'complaints' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setActiveTab('complaints')}
          className="gap-2 text-xs font-semibold rounded-xl"
        >
          <Flag className="h-4 w-4" /> User Complaints ({complaintsQueue.length})
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search provider, legal name, wilaya, or status..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9 rounded-xl"
          />
        </div>
      </div>

      {/* TAB 1: PROVIDER KYC VERIFICATIONS */}
      {activeTab === 'kyc' && (
        <Card className="border shadow-sm bg-card rounded-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold">Provider / Business</TableHead>
                <TableHead className="text-xs font-bold">Type & Wilaya</TableHead>
                <TableHead className="text-xs font-bold">Attached Docs</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-xs font-bold">Verified Badge</TableHead>
                <TableHead className="text-xs font-bold">Submitted</TableHead>
                <TableHead className="text-xs font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {filteredKycProfiles.map((p) => {
                const statusColors: Record<ProviderVerificationStatus, string> = {
                  REGISTERED: 'bg-muted text-muted-foreground',
                  PHONE_VERIFIED: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
                  PROFILE_COMPLETED: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
                  DOCUMENTS_SUBMITTED: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
                  UNDER_REVIEW: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
                  VERIFIED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
                  REJECTED: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
                  ACTION_REQUIRED: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
                  SUSPENDED: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
                };

                return (
                  <TableRow key={p.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-bold text-foreground">{p.providerName}</div>
                      <div className="text-[11px] text-muted-foreground">Legal: {p.legalName}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-foreground capitalize">{p.providerType}</span>
                      <div className="text-[11px] text-muted-foreground">{p.wilaya}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {p.documents.length} Files
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-bold text-[10px] uppercase ${statusColors[p.status]}`}>
                        {p.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {p.verifiedBadgeActive ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <BadgeCheck className="h-4 w-4" /> Active
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {p.submittedAt || p.createdAt}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs rounded-xl"
                          onClick={() => {
                            setSelectedProfile(p);
                            setIsDetailDrawerOpen(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> Inspect
                        </Button>

                        {p.status !== 'VERIFIED' && (
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
                            onClick={() => handleOpenDecisionModal(p, 'APPROVE')}
                          >
                            <BadgeCheck className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TAB 2: STORE APPROVALS */}
      {activeTab === 'stores' && (
        <Card className="border shadow-sm bg-card rounded-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold">Store Name / Category</TableHead>
                <TableHead className="text-xs font-bold">Owner & Wilaya</TableHead>
                <TableHead className="text-xs font-bold">Subscription</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-xs font-bold">Products</TableHead>
                <TableHead className="text-xs font-bold text-right">Moderation Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {storesQueue
                .filter(s => !searchQuery || s.storeName.toLowerCase().includes(searchQuery.toLowerCase()) || s.ownerName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(s => (
                  <TableRow key={s.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-bold text-foreground">{s.storeName}</div>
                      <div className="text-[11px] text-muted-foreground">{s.category}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{s.ownerName}</div>
                      <div className="text-[11px] text-muted-foreground">{s.wilaya}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {s.subscriptionPlan} ({s.subscriptionStatus})
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={s.status === 'active' ? 'default' : s.status === 'suspended' ? 'destructive' : 'secondary'}
                        className="capitalize text-[10px]"
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[11px]">
                      {s.productCount} items
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.status !== 'active' && (
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
                            onClick={() => handleStoreStatus(s.id, 'active')}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                        )}
                        {s.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-rose-600 border-rose-300 hover:bg-rose-50 rounded-xl"
                            onClick={() => handleStoreStatus(s.id, 'suspended')}
                          >
                            <Ban className="h-3.5 w-3.5 mr-1" /> Suspend
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TAB 3: SERVICE LISTINGS */}
      {activeTab === 'services' && (
        <Card className="border shadow-sm bg-card rounded-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold">Service Title & Code</TableHead>
                <TableHead className="text-xs font-bold">Provider / Category</TableHead>
                <TableHead className="text-xs font-bold">Price & Duration</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-xs font-bold text-right">Moderation Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {servicesQueue
                .filter(srv => !searchQuery || srv.title.toLowerCase().includes(searchQuery.toLowerCase()) || srv.providerName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(srv => (
                  <TableRow key={srv.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-bold text-foreground">{srv.title}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{srv.serviceCode}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{srv.providerName}</div>
                      <div className="text-[11px] text-muted-foreground">{srv.category}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-foreground">{srv.basePrice.toLocaleString()} DZD</div>
                      <div className="text-[11px] text-muted-foreground">{srv.durationMinutes} mins ({srv.pricingType})</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={srv.status === 'approved' ? 'default' : srv.status === 'rejected' ? 'destructive' : 'secondary'}
                        className="capitalize text-[10px]"
                      >
                        {srv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {srv.status !== 'approved' && (
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
                            onClick={() => handleServiceStatus(srv.id, 'approved')}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                        )}
                        {srv.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-rose-600 border-rose-300 hover:bg-rose-50 rounded-xl"
                            onClick={() => handleServiceStatus(srv.id, 'rejected')}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TAB 4: PAYOUT REQUESTS */}
      {activeTab === 'withdrawals' && (
        <Card className="border shadow-sm bg-card rounded-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold">Payout Code</TableHead>
                <TableHead className="text-xs font-bold">Requester & Type</TableHead>
                <TableHead className="text-xs font-bold">Channel & Destination</TableHead>
                <TableHead className="text-xs font-bold">Amount (DZD)</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-xs font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {withdrawalsQueue
                .filter(w => !searchQuery || w.payoutCode.toLowerCase().includes(searchQuery.toLowerCase()) || w.recipientName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(w => (
                  <TableRow key={w.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono font-bold text-foreground">
                      {w.payoutCode}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{w.recipientName}</div>
                      <div className="text-[11px] text-muted-foreground capitalize">{w.recipientType.replace(/_/g, ' ')}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold uppercase text-[11px]">{w.bankOrCCP}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{w.accountNumber || w.ripNumber}</div>
                    </TableCell>
                    <TableCell className="font-bold text-foreground">
                      {w.requestedAmount.toLocaleString()} DZD
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={w.status === 'completed' || w.status === 'approved' ? 'default' : w.status === 'rejected' ? 'destructive' : 'secondary'}
                        className="capitalize text-[10px]"
                      >
                        {w.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {w.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
                              onClick={() => handleWithdrawalStatus(w.id, 'approved')}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs text-rose-600 border-rose-300 hover:bg-rose-50 rounded-xl"
                              onClick={() => handleWithdrawalStatus(w.id, 'rejected')}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TAB 5: PRODUCT MODERATION */}
      {activeTab === 'products' && (
        <Card className="border shadow-sm bg-card rounded-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold">Product / SKU</TableHead>
                <TableHead className="text-xs font-bold">Store & Category</TableHead>
                <TableHead className="text-xs font-bold">Price & Stock</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-xs font-bold text-right">Moderation Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {productsQueue
                .filter(prd => !searchQuery || prd.name.toLowerCase().includes(searchQuery.toLowerCase()) || prd.storeName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(prd => (
                  <TableRow key={prd.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-bold text-foreground">{prd.name}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">SKU: {prd.sku}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{prd.storeName}</div>
                      <div className="text-[11px] text-muted-foreground">{prd.category}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-foreground">{prd.price.toLocaleString()} DZD</div>
                      <div className="text-[11px] text-muted-foreground">Stock: {prd.stock} units</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={prd.status === 'active' ? 'default' : prd.status === 'archived' ? 'destructive' : 'secondary'}
                        className="capitalize text-[10px]"
                      >
                        {prd.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {prd.status !== 'active' && (
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
                            onClick={() => handleProductStatus(prd.id, 'active')}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                        )}
                        {prd.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-rose-600 border-rose-300 hover:bg-rose-50 rounded-xl"
                            onClick={() => handleProductStatus(prd.id, 'archived')}
                          >
                            <Ban className="h-3.5 w-3.5 mr-1" /> Archive
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TAB 6: COMPLAINTS & DISPUTES */}
      {activeTab === 'complaints' && (
        <Card className="border shadow-sm bg-card rounded-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold">Case # & Reason</TableHead>
                <TableHead className="text-xs font-bold">Buyer / Complainant</TableHead>
                <TableHead className="text-xs font-bold">Target Entity</TableHead>
                <TableHead className="text-xs font-bold">Disputed Amount</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-xs font-bold text-right">Resolution Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {complaintsQueue
                .filter(d => !searchQuery || d.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) || d.initiatorName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(d => (
                  <TableRow key={d.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-mono font-bold text-foreground">{d.caseNumber}</div>
                      <div className="text-[11px] text-muted-foreground">{d.title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{d.initiatorName}</div>
                      <div className="text-[11px] text-muted-foreground capitalize">{d.initiatorRole.replace(/_/g, ' ')}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{d.defendantName}</div>
                      <div className="text-[11px] text-muted-foreground capitalize">{d.defendantRole.replace(/_/g, ' ')}</div>
                    </TableCell>
                    <TableCell className="font-bold text-foreground">
                      {d.disputedAmount.toLocaleString()} DZD
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={d.status === 'resolved' ? 'default' : d.status === 'under_investigation' ? 'secondary' : 'destructive'}
                        className="capitalize text-[10px]"
                      >
                        {d.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {d.status !== 'resolved' && (
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
                            onClick={() => handleDisputeStatus(d.id, 'resolved')}
                          >
                            Resolve Case
                          </Button>
                        )}
                        {d.status !== 'escalated' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-amber-600 border-amber-300 hover:bg-amber-50 rounded-xl"
                            onClick={() => handleDisputeStatus(d.id, 'escalated')}
                          >
                            Escalate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* KYC Document Detail Drawer */}
      <AdminDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedProfile ? `KYC Dossier: ${selectedProfile.providerName}` : 'Dossier Details'}
        subtitle={selectedProfile ? `Legal Name: ${selectedProfile.legalName} • ${selectedProfile.wilaya}` : ''}
        statusBadge={
          selectedProfile
            ? {
                label: selectedProfile.status.replace(/_/g, ' '),
                variant: 'outline',
              }
            : undefined
        }
      >
        {selectedProfile && (
          <div className="space-y-6 text-xs">
            
            {/* Quick Action Bar */}
            <div className="p-4 bg-muted/40 border rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <span className="font-bold text-xs uppercase tracking-wider text-foreground block">
                Compliance Review Actions
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedProfile.status !== 'VERIFIED' && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl h-8"
                    onClick={() => handleOpenDecisionModal(selectedProfile, 'APPROVE')}
                  >
                    <BadgeCheck className="h-3.5 w-3.5 mr-1" /> Approve & Issue Badge
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-amber-700 border-amber-300 hover:bg-amber-50 text-xs rounded-xl h-8"
                  onClick={() => handleOpenDecisionModal(selectedProfile, 'REQUEST_DOCUMENTS')}
                >
                  <AlertCircle className="h-3.5 w-3.5 mr-1" /> Request More Docs
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-rose-700 border-rose-300 hover:bg-rose-50 text-xs rounded-xl h-8"
                  onClick={() => handleOpenDecisionModal(selectedProfile, 'REJECT')}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Reject Application
                </Button>
                {selectedProfile.verifiedBadgeActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-600 border-rose-300 hover:bg-rose-50 text-xs rounded-xl h-8"
                    onClick={() => handleOpenDecisionModal(selectedProfile, 'SUSPEND')}
                  >
                    <Ban className="h-3.5 w-3.5 mr-1" /> Suspend Verification
                  </Button>
                )}
              </div>
            </div>

            {/* Identity & Legal Information */}
            <div className="p-4 bg-card border rounded-2xl space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-primary" /> Identity Credentials
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/20 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">National ID / Passport #</span>
                  <p className="font-mono font-semibold text-foreground">{selectedProfile.nationalIdNumber || 'N/A'}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Date of Birth</span>
                  <p className="font-semibold text-foreground">{selectedProfile.dateOfBirth || 'N/A'}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Phone Number</span>
                  <p className="font-semibold text-foreground">{selectedProfile.phoneNumber}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Email Address</span>
                  <p className="font-semibold text-foreground">{selectedProfile.email}</p>
                </div>
              </div>
            </div>

            {/* Business & Commercial Credentials */}
            <div className="p-4 bg-card border rounded-2xl space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Store className="h-4 w-4 text-primary" /> Commercial & Professional Credentials
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/20 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Trade Name</span>
                  <p className="font-semibold text-foreground">{selectedProfile.businessTradeName || 'N/A'}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Structure</span>
                  <p className="font-semibold text-foreground capitalize">{selectedProfile.businessStructure?.replace(/_/g, ' ') || 'N/A'}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Trade Register (RC) #</span>
                  <p className="font-mono font-semibold text-foreground">{selectedProfile.tradeRegistryNumber || 'N/A'}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Tax ID (NIF/NIS) #</span>
                  <p className="font-mono font-semibold text-foreground">{selectedProfile.taxIdNumber || 'N/A'}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl space-y-0.5 col-span-2">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Artisan Qualification Card #</span>
                  <p className="font-mono font-semibold text-foreground">{selectedProfile.artisanCardNumber || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Attached Verification Documents */}
            <div className="space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" /> Submitted Documents & Credentials ({selectedProfile.documents.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedProfile.documents.map((doc) => (
                  <div key={doc.id} className="p-3 border rounded-xl bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground capitalize truncate">{doc.documentCategory.replace(/_/g, ' ')}</span>
                      <Badge variant="outline" className="text-[10px]">{doc.status}</Badge>
                    </div>
                    <div className="h-28 rounded-lg bg-muted overflow-hidden relative">
                      <img src={doc.fileUrl} alt={doc.fileName} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span className="truncate">{doc.fileName}</span>
                      <Button asChild size="sm" variant="ghost" className="h-7 text-xs px-2">
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-3 w-3 mr-1" /> View Full
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Trail */}
            <div className="p-4 bg-card border rounded-2xl space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" /> Verification Audit History
              </span>
              <div className="space-y-3 border-l-2 border-primary/30 pl-4 ml-2 py-1 text-xs">
                {selectedProfile.history.map((h) => (
                  <div key={h.id} className="relative space-y-0.5">
                    <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{h.action.replace(/_/g, ' ')}</span>
                      <span className="text-muted-foreground font-mono text-[10px]">{h.createdAt}</span>
                    </div>
                    <p className="text-muted-foreground text-[11px]">{h.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AdminDetailDrawer>

      {/* Review Decision Modal */}
      <Dialog open={isDecisionModalOpen} onOpenChange={setIsDecisionModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {decisionType === 'APPROVE' && <BadgeCheck className="h-5 w-5 text-emerald-600" />}
              {decisionType === 'REJECT' && <XCircle className="h-5 w-5 text-rose-600" />}
              {decisionType === 'REQUEST_DOCUMENTS' && <AlertCircle className="h-5 w-5 text-amber-600" />}
              {decisionType === 'SUSPEND' && <Ban className="h-5 w-5 text-rose-600" />}
              <span>
                {decisionType === 'APPROVE' && 'Approve Provider Verification'}
                {decisionType === 'REJECT' && 'Reject Verification Application'}
                {decisionType === 'REQUEST_DOCUMENTS' && 'Request Additional Documentation'}
                {decisionType === 'SUSPEND' && 'Suspend Provider Verification'}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Candidate: <strong>{selectedProfile?.providerName}</strong> ({selectedProfile?.wilaya}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleExecuteDecision} className="space-y-4 py-2 text-xs">
            {decisionType === 'APPROVE' && (
              <div className="space-y-2">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                  <p className="font-bold">✓ Verified Badge Activation</p>
                  <p>Approving this dossier will activate the Official Verified Badge and mark all submitted identity credentials as authentic.</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Auditor Internal Notes (Optional)</Label>
                  <Input
                    value={mediatorNotes}
                    onChange={(e) => setMediatorNotes(e.target.value)}
                    placeholder="e.g. Validated against CNRC commercial registry database"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            )}

            {decisionType === 'REJECT' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Mandatory Rejection Reason *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why the application was rejected (e.g. expired document, mismatched legal names)..."
                  rows={3}
                  required
                />
              </div>
            )}

            {decisionType === 'REQUEST_DOCUMENTS' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Specific Documents Requested *</Label>
                <Textarea
                  value={actionRequiredNotes}
                  onChange={(e) => setActionRequiredNotes(e.target.value)}
                  placeholder="e.g. Please provide a clearer scan of the back of your National ID and a 2026 tax clearance certificate..."
                  rows={3}
                  required
                />
              </div>
            )}

            {decisionType === 'SUSPEND' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Suspension Justification *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for suspending verified badge (e.g. unresolved customer complaints, license revocation)..."
                  rows={3}
                  required
                />
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDecisionModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isExecutingDecision}
                className={
                  decisionType === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
                    : decisionType === 'REJECT' || decisionType === 'SUSPEND'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white font-semibold'
                    : 'bg-amber-600 hover:bg-amber-700 text-white font-semibold'
                }
              >
                {isExecutingDecision ? 'Processing...' : 'Confirm Decision'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
