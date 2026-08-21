'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { Users, Search, Plus, MoreHorizontal, UserX, UserCheck, MessageSquare, Eye, Edit3, Calendar } from 'lucide-react';

interface ClientMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  bookingsCount: number;
  clientType: 'one-time' | 'subscribed' | 'corporate';
  status: 'active' | 'blocked';
  joinedDate: string;
}

export function ClientsManagementSection() {
  const { toast } = useToast();
  const { language } = useLanguage();

  const t = (key: string, def: string) => {
    const dict: Record<string, Record<string, string>> = {
      ar: {
        title: 'إدارة العملاء والمشتركين',
        desc: 'متابعة العملاء الذين حجزوا خدماتك، وإدارة الاشتراكات وإرسال الرسائل والتنبيهات إليهم.',
        totalClients: 'إجمالي العملاء',
        activeBookings: 'الحجوزات النشطة',
        subscribers: 'المشتركين الفاعلين',
        blockedClients: 'العملاء المحظورين',
        addClient: 'إضافة عميل / مشترك جديد',
        searchPlh: 'البحث باسم العميل أو البريد أو الهاتف...',
        typeFilter: 'تصفية حسب نوع العميل',
        statusFilter: 'تصفية حسب الحالة',
        nameCol: 'العميل',
        emailCol: 'البريد الإلكتروني',
        phoneCol: 'الهاتف',
        bookingsCol: 'عدد الحجوزات',
        typeCol: 'نوع العضوية',
        statusCol: 'الحالة',
        actionsCol: 'إجراءات',
        viewHistory: 'سجل الحجوزات',
        sendMsg: 'إرسال رسالة مباشرة',
        blockClient: 'حظر العميل',
        unblockClient: 'إلغاء حظر العميل',
        editDetails: 'تعديل البيانات',
        active: 'نشط',
        blocked: 'محظور',
        onetime: 'حجز فردي',
        subscribed: 'مشترك شهري',
        corporate: 'حساب شركات',
        save: 'حفظ وتأكيد',
        close: 'إغلاق',
        addTitle: 'إضافة عميل أو مشترك جديد',
        addDesc: 'تسجيل عميل جديد يدوياً لمتابعة حجوزاته واشتراكاته في لوحة تحكمك.',
      },
      fr: {
        title: 'Gestion des Clients & Membres',
        desc: 'Suivez les clients qui ont réservé vos services, gérez les abonnés et envoyez-leur des alertes.',
        totalClients: 'Total Clients',
        activeBookings: 'Réservations Actives',
        subscribers: 'Abonnés Mensuels',
        blockedClients: 'Clients Bloqués',
        addClient: 'Ajouter Client / Abonné',
        searchPlh: 'Rechercher par nom, email, tél...',
        typeFilter: 'Filtrer par type de client',
        statusFilter: 'Filtrer par statut',
        nameCol: 'Nom Client',
        emailCol: 'Email',
        phoneCol: 'Téléphone',
        bookingsCol: 'Réservations',
        typeCol: 'Type de Membre',
        statusCol: 'Statut',
        actionsCol: 'Actions',
        viewHistory: 'Historique des réservations',
        sendMsg: 'Envoyer un message',
        blockClient: 'Bloquer le client',
        unblockClient: 'Débloquer le client',
        editDetails: 'Modifier les détails',
        active: 'Actif',
        blocked: 'Bloqué',
        onetime: 'Ponctuel',
        subscribed: 'Abonné',
        corporate: 'Entreprise',
        save: 'Enregistrer',
        close: 'Fermer',
        addTitle: 'Ajouter un Client ou Abonné',
        addDesc: 'Enregistrez manuellement un client pour suivre ses réservations.'
      },
      en: {
        title: 'Clients & Subscribers Management',
        desc: 'Track clients who booked your services, manage memberships, and send direct alerts/messages.',
        totalClients: 'Total Clients',
        activeBookings: 'Active Bookings',
        subscribers: 'Active Subscribers',
        blockedClients: 'Blocked Clients',
        addClient: 'Add Client / Subscriber',
        searchPlh: 'Search by client name, email, phone...',
        typeFilter: 'Filter by Client Type',
        statusFilter: 'Filter by Status',
        nameCol: 'Client Name',
        emailCol: 'Email Address',
        phoneCol: 'Phone Number',
        bookingsCol: 'Total Bookings',
        typeCol: 'Membership Type',
        statusCol: 'Status',
        actionsCol: 'Actions',
        viewHistory: 'Booking History',
        sendMsg: 'Send Direct Message',
        blockClient: 'Block Client',
        unblockClient: 'Unblock Client',
        editDetails: 'Edit Details',
        active: 'Active',
        blocked: 'Blocked',
        onetime: 'One-time',
        subscribed: 'Subscribed Member',
        corporate: 'Corporate',
        save: 'Save & Confirm',
        close: 'Close',
        addTitle: 'Add New Client / Subscriber',
        addDesc: 'Manually register a client to manage their bookings and monthly memberships.'
      }
    };
    return dict[language]?.[key] || dict['en']?.[key] || def;
  };

  const initialClients: ClientMember[] = [
    { id: 'cl_1', name: 'Farid Belkacem', email: 'farid.belkacem@gmail.com', phone: '+213 550 44 88 12', bookingsCount: 15, clientType: 'subscribed', status: 'active', joinedDate: '2026-01-15' },
    { id: 'cl_2', name: 'Nassima Brahimi', email: 'nassima_br@yahoo.fr', phone: '+213 662 10 99 54', bookingsCount: 3, clientType: 'one-time', status: 'active', joinedDate: '2026-05-10' },
    { id: 'cl_3', name: 'SPA Algerie Telecom', email: 'procurement@algerietelecom.dz', phone: '+213 21 70 00 00', bookingsCount: 22, clientType: 'corporate', status: 'active', joinedDate: '2025-08-20' },
    { id: 'cl_4', name: 'Karim Ould', email: 'karim_ould@outlook.com', phone: '+213 770 12 34 56', bookingsCount: 8, clientType: 'subscribed', status: 'blocked', joinedDate: '2025-11-01' },
    { id: 'cl_5', name: 'Yasmine Meziani', email: 'yasmine.m@hotmail.com', phone: '+213 540 88 99 22', bookingsCount: 1, clientType: 'one-time', status: 'active', joinedDate: '2026-07-01' },
  ];

  const [clients, setClients] = useState<ClientMember[]>(initialClients);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dialog configurations
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Focus items
  const [activeClient, setActiveClient] = useState<ClientMember | null>(null);

  // Form inputs
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientType, setClientType] = useState<'one-time' | 'subscribed' | 'corporate'>('one-time');

  useEffect(() => {
    const saved = localStorage.getItem('khidmatik_provider_clients');
    if (saved) {
      try { setClients(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveClients = (newClients: ClientMember[]) => {
    setClients(newClients);
    localStorage.setItem('khidmatik_provider_clients', JSON.stringify(newClients));
  };

  const handleAddClient = () => {
    if (!clientName.trim() || !clientEmail.trim() || !clientPhone.trim()) {
      toast({ title: 'Validation Error', description: 'Please fill in all details.', variant: 'destructive' });
      return;
    }
    const newCl: ClientMember = {
      id: 'cl_' + Date.now(),
      name: clientName,
      email: clientEmail,
      phone: clientPhone,
      clientType: clientType,
      bookingsCount: 0,
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0]
    };
    saveClients([newCl, ...clients]);
    setIsAddOpen(false);
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    toast({ title: 'Client Profile Created', description: `Registered ${clientName} successfully.` });
  };

  const handleToggleBlock = (clientId: string, currentStatus: string) => {
    const newStatus: any = currentStatus === 'blocked' ? 'active' : 'blocked';
    const updated = clients.map(c => c.id === clientId ? { ...c, status: newStatus } : c);
    saveClients(updated);
    toast({
      title: 'Status Updated',
      description: `Client status changed to: ${newStatus.toUpperCase()}`,
      variant: newStatus === 'blocked' ? 'destructive' : 'default'
    });
  };

  const handleSaveEdit = () => {
    if (!activeClient) return;
    const updated = clients.map(c => c.id === activeClient.id ? activeClient : c);
    saveClients(updated);
    setIsEditOpen(false);
    toast({ title: 'Client Saved', description: 'Client details successfully updated.' });
  };

  const getStatusBadge = (statusVal: string) => {
    switch (statusVal) {
      case 'active': return <Badge className="bg-green-500 text-white hover:bg-green-600">{t('active', 'Active')}</Badge>;
      case 'blocked': return <Badge className="bg-red-500 text-white hover:bg-red-600">{t('blocked', 'Blocked')}</Badge>;
      default: return <Badge className="bg-slate-400 text-white">{statusVal}</Badge>;
    }
  };

  const getTypeBadge = (typeVal: string) => {
    switch (typeVal) {
      case 'subscribed': return <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border border-indigo-200">{t('subscribed', 'Subscribed')}</Badge>;
      case 'corporate': return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border border-amber-200">{t('corporate', 'Corporate')}</Badge>;
      default: return <Badge variant="outline" className="text-slate-600">{t('onetime', 'One-time')}</Badge>;
    }
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    
    const matchesType = typeFilter === 'all' || c.clientType === typeFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" /> {t('title', 'Clients & Subscribers')}
          </h1>
          <p className="text-muted-foreground">{t('desc', 'Manage your clients.')}</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-primary text-white font-semibold">
          <Plus className="h-4.5 w-4.5 mr-1.5" /> {t('addClient', 'Add Client')}
        </Button>
      </header>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">{t('totalClients', 'Total Clients')}</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">{t('activeBookings', 'Active Bookings')}</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">{t('subscribers', 'Active Subscribers')}</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.filter(c => c.clientType === 'subscribed').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">{t('blockedClients', 'Blocked')}</CardTitle>
            <UserX className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.filter(c => c.status === 'blocked').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main List Card */}
      <Card>
        <CardHeader className="pb-3 flex flex-col md:flex-row justify-between md:items-center gap-3">
          <div>
            <CardTitle className="text-base font-bold">Clients Directory</CardTitle>
            <CardDescription>Track member loyalty, block bad listings consumers, and check booking statistics.</CardDescription>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative w-60">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('searchPlh', 'Search...')} className="pl-8 bg-white text-xs" />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 bg-white">
                <SelectValue placeholder={t('typeFilter', 'Type')} />
              </SelectTrigger>
              <SelectContent className="bg-white border text-slate-800">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="one-time">{t('onetime', 'One-time')}</SelectItem>
                <SelectItem value="subscribed">{t('subscribed', 'Subscribed')}</SelectItem>
                <SelectItem value="corporate">{t('corporate', 'Corporate')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-white">
                <SelectValue placeholder={t('statusFilter', 'Status')} />
              </SelectTrigger>
              <SelectContent className="bg-white border text-slate-800">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">{t('active', 'Active')}</SelectItem>
                <SelectItem value="blocked">{t('blocked', 'Blocked')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('nameCol', 'Client')}</TableHead>
                <TableHead>{t('emailCol', 'Email')}</TableHead>
                <TableHead>{t('phoneCol', 'Phone')}</TableHead>
                <TableHead>{t('bookingsCol', 'Bookings')}</TableHead>
                <TableHead>{t('typeCol', 'Membership')}</TableHead>
                <TableHead>{t('statusCol', 'Status')}</TableHead>
                <TableHead className="text-right">{t('actionsCol', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-semibold text-xs text-slate-800">{client.name}</TableCell>
                  <TableCell className="text-xs">{client.email}</TableCell>
                  <TableCell className="text-xs font-mono">{client.phone}</TableCell>
                  <TableCell className="text-xs text-center font-bold text-slate-700">{client.bookingsCount}</TableCell>
                  <TableCell className="text-xs">{getTypeBadge(client.clientType)}</TableCell>
                  <TableCell className="text-xs">{getStatusBadge(client.status)}</TableCell>
                  
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border text-slate-800 text-xs">
                        <DropdownMenuItem className="cursor-pointer hover:bg-slate-50" onClick={() => toast({ title: 'Viewing History' })}><Eye className="h-3.5 w-3.5 mr-2" /> {t('viewHistory', 'History')}</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer hover:bg-slate-50" onClick={() => toast({ title: 'Alert Dispatched' })}><MessageSquare className="h-3.5 w-3.5 mr-2" /> {t('sendMsg', 'Notify')}</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer hover:bg-slate-50" onClick={() => { setActiveClient(client); setIsEditOpen(true); }}><Edit3 className="h-3.5 w-3.5 mr-2" /> {t('editDetails', 'Edit')}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer hover:bg-slate-50 text-red-600 font-semibold" onClick={() => handleToggleBlock(client.id, client.status)}>
                          {client.status === 'blocked' ? <UserCheck className="h-3.5 w-3.5 mr-2" /> : <UserX className="h-3.5 w-3.5 mr-2" />}
                          {client.status === 'blocked' ? t('unblockClient', 'Unblock') : t('blockClient', 'Block')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No clients matching filters found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Client Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md bg-white border text-slate-800 p-6">
          <DialogHeader>
            <DialogTitle>{t('addTitle', 'Add Client')}</DialogTitle>
            <DialogDescription>{t('addDesc', 'Register new client.')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div>
              <Label htmlFor="add-cl-name">{t('nameCol', 'Client Name')}</Label>
              <Input id="add-cl-name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="add-cl-email">{t('emailCol', 'Email')}</Label>
              <Input id="add-cl-email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="add-cl-phone">{t('phoneCol', 'Phone')}</Label>
              <Input id="add-cl-phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="add-cl-type">{t('typeCol', 'Membership')}</Label>
              <Select value={clientType} onValueChange={(val: any) => setClientType(val)}>
                <SelectTrigger className="w-full mt-1 bg-white">
                  <SelectValue placeholder="Membership Type" />
                </SelectTrigger>
                <SelectContent className="bg-white border text-slate-800">
                  <SelectItem value="one-time">{t('onetime', 'One-time')}</SelectItem>
                  <SelectItem value="subscribed">{t('subscribed', 'Subscribed Member')}</SelectItem>
                  <SelectItem value="corporate">{t('corporate', 'Corporate')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>{t('close', 'Close')}</Button>
            <Button onClick={handleAddClient} className="bg-primary text-white">{t('save', 'Confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md bg-white border text-slate-800 p-6">
          <DialogHeader>
            <DialogTitle>{t('editDetails', 'Edit Details')}</DialogTitle>
          </DialogHeader>
          {activeClient && (
            <div className="space-y-4 my-2">
              <div>
                <Label htmlFor="edit-cl-name">{t('nameCol', 'Client Name')}</Label>
                <Input id="edit-cl-name" value={activeClient.name} onChange={(e) => setActiveClient({ ...activeClient, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-cl-email">{t('emailCol', 'Email')}</Label>
                <Input id="edit-cl-email" value={activeClient.email} onChange={(e) => setActiveClient({ ...activeClient, email: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-cl-phone">{t('phoneCol', 'Phone')}</Label>
                <Input id="edit-cl-phone" value={activeClient.phone} onChange={(e) => setActiveClient({ ...activeClient, phone: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-cl-type">{t('typeCol', 'Membership')}</Label>
                <Select value={activeClient.clientType} onValueChange={(val: any) => setActiveClient({ ...activeClient, clientType: val })}>
                  <SelectTrigger className="w-full mt-1 bg-white">
                    <SelectValue placeholder="Membership Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border text-slate-800">
                    <SelectItem value="one-time">{t('onetime', 'One-time')}</SelectItem>
                    <SelectItem value="subscribed">{t('subscribed', 'Subscribed Member')}</SelectItem>
                    <SelectItem value="corporate">{t('corporate', 'Corporate')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>{t('close', 'Close')}</Button>
            <Button onClick={handleSaveEdit} className="bg-primary text-white">{t('save', 'Confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
