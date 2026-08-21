'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { Truck, Search, Calendar, Plus, MoreHorizontal, User, FileText, CheckCircle2, XCircle, AlertCircle, RefreshCw, Layers } from 'lucide-react';

interface Carrier {
  id: string;
  name: string;
  nameAr?: string;
  logoText: string;
  color: string;
}

interface Shipment {
  id: string;
  expectedArrival: string;
  status: 'Pending' | 'Draft' | 'Arrived' | 'Canceled' | 'Delay';
  orderId: string;
  eventStep: 1 | 2 | 3 | 4; // 1: Label Created, 2: Handed to Courier, 3: Out for Delivery, 4: Delivered
  carrierId: string;
}

interface ConnectedCarrierCreds {
  apiKey: string;
  accountId: string;
  webhookSecret: string;
}

const ALGERIAN_CARRIERS: Carrier[] = [
  { id: 'yalidine', name: 'Yalidine Express', logoText: 'YE', color: 'bg-red-600' },
  { id: 'zr', name: 'ZR Express', logoText: 'ZR', color: 'bg-blue-600' },
  { id: 'maystro', name: 'Maystro Delivery', logoText: 'MD', color: 'bg-orange-500' },
  { id: 'procolis', name: 'Procolis', logoText: 'PC', color: 'bg-green-600' },
  { id: 'ecotrack', name: 'Ecotrack', logoText: 'ET', color: 'bg-emerald-600' },
  { id: 'anderson', name: 'Anderson Delivery', logoText: 'AD', color: 'bg-indigo-600' },
  { id: 'noest', name: 'NOEST Express', logoText: 'NX', color: 'bg-sky-600' },
  { id: 'world', name: 'World Express', logoText: 'WE', color: 'bg-teal-600' },
  { id: 'easy_speed', name: 'Easy & Speed', logoText: 'ES', color: 'bg-yellow-600' },
  { id: 'guepex', name: 'Guepex Express', logoText: 'GE', color: 'bg-rose-600' },
  { id: 'msm', name: 'MSM Express', logoText: 'MS', color: 'bg-violet-600' },
  { id: 'wecan', name: 'WECAN Services', logoText: 'WC', color: 'bg-purple-600' },
  { id: 'rj360', name: 'RJ 360 Express', logoText: 'RJ', color: 'bg-cyan-600' },
  { id: 'kazi', name: 'Kazi Tour Express', logoText: 'KT', color: 'bg-amber-600' },
  { id: 'cirta', name: 'Cirta Express', logoText: 'CE', color: 'bg-lime-600' },
  { id: 'colivraison', name: 'Colivraison Express', logoText: 'CX', color: 'bg-fuchsia-600' },
  { id: 'packers', name: 'Packers DZ', logoText: 'PK', color: 'bg-slate-700' },
  { id: 'ems', name: 'EMS Champion Post', logoText: 'EM', color: 'bg-red-700' },
  { id: 'algerie_poste', name: 'Algérie Poste (البريد الجزائري)', logoText: 'AP', color: 'bg-amber-500' },
  { id: 'flash', name: 'Flash Express DZ', logoText: 'FE', color: 'bg-red-500' },
  { id: 'rapid_poste', name: 'Rapid Poste', logoText: 'RP', color: 'bg-blue-500' },
  { id: 'express_dz', name: 'Express DZ', logoText: 'EX', color: 'bg-indigo-500' },
  { id: 'rahwan', name: 'Rahwan Express', logoText: 'RE', color: 'bg-amber-700' },
  { id: 'amirane', name: 'Amirane Express', logoText: 'AE', color: 'bg-emerald-700' },
  { id: 'aranex', name: 'Aranex Express', logoText: 'AR', color: 'bg-teal-700' },
  { id: 'fast_delivery', name: 'Fast Delivery DZ', logoText: 'FD', color: 'bg-orange-600' },
  { id: 'nord_express', name: 'Nord Express', logoText: 'NE', color: 'bg-sky-700' },
  { id: 'speed_courier', name: 'Speed Courier DZ', logoText: 'SC', color: 'bg-cyan-700' },
  { id: 'top_livraison', name: 'Top Livraison', logoText: 'TL', color: 'bg-rose-700' },
  { id: 'smart_delivery', name: 'Smart Delivery DZ', logoText: 'SD', color: 'bg-green-700' },
  { id: 'eco_livraison', name: 'Eco Livraison', logoText: 'EL', color: 'bg-green-800' },
  { id: 'atlas_express', name: 'Atlas Express', logoText: 'AT', color: 'bg-red-800' },
  { id: 'trust_delivery', name: 'Trust Delivery', logoText: 'TD', color: 'bg-blue-800' },
  { id: 'one_delivery', name: 'One Delivery', logoText: 'OD', color: 'bg-violet-800' },
  { id: 'click_delivery', name: 'Click Delivery', logoText: 'CD', color: 'bg-pink-600' },
  { id: 'easy_delivery', name: 'Easy Delivery', logoText: 'ED', color: 'bg-indigo-800' },
  { id: 'box_delivery', name: 'Box Delivery', logoText: 'BD', color: 'bg-amber-900' },
  { id: 'first_express', name: 'First Express', logoText: 'FX', color: 'bg-slate-800' },
  { id: 'fast_box', name: 'Fast Box Delivery', logoText: 'FB', color: 'bg-lime-700' },
  { id: 'colis_express', name: 'Colis Express DZ', logoText: 'CE', color: 'bg-neutral-700' },
];

export function ShipmentsSection() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'arrived' | 'canceled'>('all');
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');

  // Carrier & Shipments lists
  const [connectedCarriers, setConnectedCarriers] = useState<Record<string, ConnectedCarrierCreds>>({});
  const [shipments, setShipments] = useState<Shipment[]>([
    { id: 'SHP-8801', expectedArrival: '2026-07-24', status: 'Pending', orderId: 'ORD-52108', eventStep: 2, carrierId: 'yalidine' },
    { id: 'SHP-8800', expectedArrival: '2026-07-24', status: 'Draft', orderId: 'ORD-52103', eventStep: 1, carrierId: 'zr' },
    { id: 'SHP-8799', expectedArrival: '2026-07-23', status: 'Arrived', orderId: 'ORD-52097', eventStep: 4, carrierId: 'maystro' },
    { id: 'SHP-8798', expectedArrival: '2026-07-23', status: 'Canceled', orderId: 'ORD-52091', eventStep: 1, carrierId: 'procolis' },
    { id: 'SHP-8797', expectedArrival: '2026-07-22', status: 'Pending', orderId: 'ORD-52088', eventStep: 2, carrierId: 'yalidine' },
    { id: 'SHP-8796', expectedArrival: '2026-07-22', status: 'Pending', orderId: 'ORD-52084', eventStep: 3, carrierId: 'algerie_poste' },
  ]);

  // Dialog configurations
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isLabelOpen, setIsLabelOpen] = useState(false);

  // Focus states
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // Form states
  const [newOrderId, setNewOrderId] = useState('ORD-52210');
  const [newCarrierId, setNewCarrierId] = useState('yalidine');
  const [newArrivalDate, setNewArrivalDate] = useState('2026-07-30');

  const [apiKey, setApiKey] = useState('');
  const [accountId, setAccountId] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  // Translations helper
  const t = (key: string, def: string) => {
    const dict: Record<string, Record<string, string>> = {
      ar: {
        title: 'الشحنات والتوصيل',
        desc: 'متابعة مسار الشحنات، عمليات التسليم، وربط شركات التوصيل الجزائرية.',
        allShipments: 'كل الشحنات',
        pending: 'قيد التوصيل',
        arrived: 'تم التسليم',
        canceled: 'ملغاة',
        addShipment: 'إضافة شحنة جديدة',
        searchPlh: 'البحث برقم الشحنة أو الطلب...',
        allTime: 'كل الأوقات',
        carrierTab: 'شركات الشحن وربط الحسابات',
        connected: 'متصل',
        connectBtn: 'ربط الحساب / API',
        editCreds: 'تعديل البيانات',
        disconnect: 'قطع الاتصال',
        shipId: 'رقم الشحنة',
        expArrival: 'الوصول المتوقع',
        status: 'الحالة',
        order: 'الطلب مرتبط',
        progress: 'خط سير الشحنة',
        carrier: 'الشركة الناقلة',
        actions: 'إجراءات',
        viewDetails: 'تفاصيل الشحنة',
        notifyCust: 'إرسال تنبيه للزبون',
        updateStatus: 'تحديث حالة الشحنة',
        printLabel: 'طباعة ملصق الشحن',
        connectTitle: 'ربط حساب شركة الشحن',
        apiKey: 'مفتاح الـ API (API Key)',
        accId: 'معرف الحساب المهني (Account ID)',
        webhook: 'سر الويب هوك (Webhook Secret - اختياري)',
        save: 'حفظ وتأكيد الربط',
        close: 'إغلاق',
        labelCreated: 'تم إنشاء الملصق',
        handedCourier: 'سلمت للناقل',
        outDelivery: 'خارج للتوصيل',
        delivered: 'تم التوصيل',
        addTitle: 'إنشاء شحنة جديدة',
        selectCarrier: 'اختر شركة الشحن الجزائرية',
        selectOrder: 'معرف الطلب المرتبط',
        arrivalDate: 'تاريخ التسليم المتوقع',
        create: 'تأكيد الشحن'
      },
      fr: {
        title: 'Expéditions & Livraisons',
        desc: 'Suivez le statut de vos colis et gérez vos intégrations logistiques algériennes.',
        allShipments: 'Toutes',
        pending: 'En cours',
        arrived: 'Livrées',
        canceled: 'Annulées',
        addShipment: 'Nouvelle Expédition',
        searchPlh: 'Rechercher par ID ou commande...',
        allTime: 'Toutes périodes',
        carrierTab: 'Intégration Transporteurs',
        connected: 'Connecté',
        connectBtn: 'Connecter l\'API',
        editCreds: 'Modifier',
        disconnect: 'Déconnecter',
        shipId: 'ID Expédition',
        expArrival: 'Date d\'arrivée',
        status: 'Statut',
        order: 'Commande',
        progress: 'Étape de livraison',
        carrier: 'Transporteur',
        actions: 'Actions',
        viewDetails: 'Détails de livraison',
        notifyCust: 'Avertir le client',
        updateStatus: 'Mettre à jour l\'état',
        printLabel: 'Imprimer le bordereau',
        connectTitle: 'Connecter l\'API Transporteur',
        apiKey: 'Clé API (API Key)',
        accId: 'Identifiant du compte',
        webhook: 'Secret Webhook (Optionnel)',
        save: 'Enregistrer & Activer',
        close: 'Fermer',
        labelCreated: 'Étiquette créée',
        handedCourier: 'Remis au coursier',
        outDelivery: 'En livraison',
        delivered: 'Livré',
        addTitle: 'Créer une expédition',
        selectCarrier: 'Choisir le transporteur algérien',
        selectOrder: 'ID de Commande associé',
        arrivalDate: 'Date estimée d\'arrivée',
        create: 'Créer l\'expédition'
      },
      en: {
        title: 'Shipments & Logistics',
        desc: 'Track carrier progress, delivery confirmations, and configure Algerian logistics APIs.',
        allShipments: 'All Shipments',
        pending: 'Pending',
        arrived: 'Arrived',
        canceled: 'Canceled',
        addShipment: 'Add Shipment',
        searchPlh: 'Search shipments or orders...',
        allTime: 'All time',
        carrierTab: 'Carriers & APIs',
        connected: 'Connected',
        connectBtn: 'Connect API',
        editCreds: 'Edit API Key',
        disconnect: 'Disconnect',
        shipId: 'Shipment ID',
        expArrival: 'Expected Arrival',
        status: 'Status',
        order: 'Order ID',
        progress: 'Shipment Event',
        carrier: 'Carrier',
        actions: 'Actions',
        viewDetails: 'View Shipment',
        notifyCust: 'Notify Customer',
        updateStatus: 'Update Status',
        printLabel: 'Print Label',
        connectTitle: 'Connect Carrier API Account',
        apiKey: 'API Key',
        accId: 'Courier Account ID',
        webhook: 'Webhook Secret (Optional)',
        save: 'Save & Sync Account',
        close: 'Close',
        labelCreated: 'Label Created',
        handedCourier: 'With Courier',
        outDelivery: 'Out for Delivery',
        delivered: 'Delivered',
        addTitle: 'Create New Shipment',
        selectCarrier: 'Select Algerian Carrier',
        selectOrder: 'Associated Order ID',
        arrivalDate: 'Expected Arrival Date',
        create: 'Confirm Shipment'
      }
    };
    return dict[language]?.[key] || dict['en']?.[key] || def;
  };

  // Load configuration from localstorage
  useEffect(() => {
    const savedCarriers = localStorage.getItem('khidmatik_connected_carriers');
    if (savedCarriers) {
      try { setConnectedCarriers(JSON.parse(savedCarriers)); } catch (e) {}
    }
    const savedShipments = localStorage.getItem('khidmatik_shipments_list');
    if (savedShipments) {
      try { setShipments(JSON.parse(savedShipments)); } catch (e) {}
    }
  }, []);

  const saveCarriersState = (newState: Record<string, ConnectedCarrierCreds>) => {
    setConnectedCarriers(newState);
    localStorage.setItem('khidmatik_connected_carriers', JSON.stringify(newState));
  };

  const saveShipmentsState = (newState: Shipment[]) => {
    setShipments(newState);
    localStorage.setItem('khidmatik_shipments_list', JSON.stringify(newState));
  };

  const handleOpenConnect = (carrier: Carrier) => {
    setSelectedCarrier(carrier);
    const existing = connectedCarriers[carrier.id];
    setApiKey(existing?.apiKey || '');
    setAccountId(existing?.accountId || '');
    setWebhookSecret(existing?.webhookSecret || '');
    setIsConnectOpen(true);
  };

  const handleSaveConnect = () => {
    if (!selectedCarrier) return;
    if (!apiKey.trim() || !accountId.trim()) {
      toast({ title: 'Validation Error', description: 'API Key and Account ID are required.', variant: 'destructive' });
      return;
    }
    const updated = {
      ...connectedCarriers,
      [selectedCarrier.id]: { apiKey, accountId, webhookSecret }
    };
    saveCarriersState(updated);
    setIsConnectOpen(false);
    toast({
      title: `${selectedCarrier.name} Connected`,
      description: 'API credentials saved and verified. Shipping operations are now integrated.'
    });
  };

  const handleDisconnect = (carrierId: string, name: string) => {
    const updated = { ...connectedCarriers };
    delete updated[carrierId];
    saveCarriersState(updated);
    toast({
      title: `${name} Disconnected`,
      description: 'Credentials removed from the platform store configuration.',
      variant: 'destructive'
    });
  };

  const handleCreateShipment = () => {
    if (!newOrderId.trim() || !newArrivalDate) return;
    const newShp: Shipment = {
      id: `SHP-${Math.floor(1000 + Math.random() * 9000)}`,
      expectedArrival: newArrivalDate,
      status: 'Pending',
      orderId: newOrderId,
      eventStep: 1,
      carrierId: newCarrierId
    };
    const updated = [newShp, ...shipments];
    saveShipmentsState(updated);
    setIsAddOpen(false);
    toast({
      title: 'Shipment Registered',
      description: `Shipment label generated via ${ALGERIAN_CARRIERS.find(c => c.id === newCarrierId)?.name}.`
    });
  };

  const handleNotifyCustomer = (shp: Shipment) => {
    toast({
      title: 'Customer Notified',
      description: `Dispatched tracking updates for ${shp.id} via Email and SMS.`
    });
  };

  const handleUpdateStatus = (shp: Shipment) => {
    const nextStep = shp.eventStep < 4 ? (shp.eventStep + 1) as 1|2|3|4 : 1;
    let nextStatus = shp.status;
    if (nextStep === 4) nextStatus = 'Arrived';
    else if (nextStep === 1) nextStatus = 'Pending';
    
    const updated = shipments.map(s => s.id === shp.id ? { ...s, eventStep: nextStep, status: nextStatus } : s);
    saveShipmentsState(updated);
    toast({
      title: 'Status Updated',
      description: `Shipment ${shp.id} is now on step: ${nextStep}`
    });
  };

  const handleOpenPrint = (shp: Shipment) => {
    setSelectedShipment(shp);
    setIsLabelOpen(true);
  };

  const handlePrintAction = () => {
    window.print();
  };

  const getStatusBadge = (statusVal: string) => {
    switch (statusVal) {
      case 'Arrived': return <Badge className="bg-green-500 text-white hover:bg-green-600">{t('arrived', 'Arrived')}</Badge>;
      case 'Pending': return <Badge className="bg-blue-500 text-white hover:bg-blue-600">{t('pending', 'Pending')}</Badge>;
      case 'Canceled': return <Badge className="bg-red-500 text-white hover:bg-red-600">{t('canceled', 'Canceled')}</Badge>;
      case 'Delay': return <Badge className="bg-amber-500 text-white hover:bg-amber-600">Delay</Badge>;
      default: return <Badge className="bg-slate-400 text-white">Draft</Badge>;
    }
  };

  // Filtered lists
  const filteredShipments = shipments.filter(s => {
    const carrier = ALGERIAN_CARRIERS.find(c => c.id === s.carrierId);
    const matchesSearch = 
      s.id.toLowerCase().includes(search.toLowerCase()) || 
      s.orderId.toLowerCase().includes(search.toLowerCase()) ||
      (carrier?.name.toLowerCase().includes(search.toLowerCase()) || false);
    
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'pending' && s.status === 'Pending') ||
      (activeTab === 'arrived' && s.status === 'Arrived') ||
      (activeTab === 'canceled' && s.status === 'Canceled');

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Truck className="h-8 w-8 text-primary" /> {t('title', 'Shipments & Logistics')}
          </h1>
          <p className="text-muted-foreground">{t('desc', 'Track logistics.')}</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-primary text-white font-semibold">
          <Plus className="h-4.5 w-4.5 mr-1.5" /> {t('addShipment', 'Add Shipment')}
        </Button>
      </header>

      {/* Tabs */}
      <div className="flex border-b text-sm font-semibold select-none">
        <button onClick={() => setActiveTab('all')} className={`px-4 py-2.5 border-b-2 transition-all ${activeTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{t('allShipments', 'All Shipments')}</button>
        <button onClick={() => setActiveTab('pending')} className={`px-4 py-2.5 border-b-2 transition-all ${activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{t('pending', 'Pending')}</button>
        <button onClick={() => setActiveTab('arrived')} className={`px-4 py-2.5 border-b-2 transition-all ${activeTab === 'arrived' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{t('arrived', 'Arrived')}</button>
        <button onClick={() => setActiveTab('canceled')} className={`px-4 py-2.5 border-b-2 transition-all ${activeTab === 'canceled' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{t('canceled', 'Canceled')}</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipments List Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <CardTitle className="text-base font-bold">List of Operations</CardTitle>
                <CardDescription>Overview of active logistics dispatch streams.</CardDescription>
              </div>
              <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('searchPlh', 'Search...')} className="bg-white text-xs" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('shipId', 'Shipment ID')}</TableHead>
                    <TableHead>{t('expArrival', 'Expected Arrival')}</TableHead>
                    <TableHead>{t('status', 'Status')}</TableHead>
                    <TableHead>{t('order', 'Order')}</TableHead>
                    <TableHead>{t('progress', 'Event Line')}</TableHead>
                    <TableHead>{t('carrier', 'Carrier')}</TableHead>
                    <TableHead className="text-right">{t('actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map(shp => {
                    const carrier = ALGERIAN_CARRIERS.find(c => c.id === shp.carrierId);
                    return (
                      <TableRow key={shp.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-semibold text-xs font-mono">{shp.id}</TableCell>
                        <TableCell className="text-xs">{shp.expectedArrival}</TableCell>
                        <TableCell className="text-xs">{getStatusBadge(shp.status)}</TableCell>
                        <TableCell className="font-semibold text-xs font-mono">{shp.orderId}</TableCell>
                        
                        {/* Event Tracker Horizontal Dots */}
                        <TableCell>
                          <div className="flex items-center space-x-1.5 rtl:space-x-reverse select-none">
                            {[1, 2, 3, 4].map(step => (
                              <div key={step} className="flex items-center">
                                <span className={`h-2.5 w-2.5 rounded-full ${step <= shp.eventStep ? 'bg-primary' : 'bg-slate-200'}`} />
                                {step < 4 && <span className={`w-3.5 h-[1.5px] ${step < shp.eventStep ? 'bg-primary' : 'bg-slate-200'}`} />}
                              </div>
                            ))}
                          </div>
                        </TableCell>

                        <TableCell className="text-xs font-semibold text-slate-700">
                          <span className={`inline-flex items-center gap-1.5`}>
                            <span className={`h-2 w-2 rounded-full ${carrier?.color || 'bg-slate-400'}`} />
                            {carrier?.name || 'Unknown'}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border text-slate-800 text-xs">
                              <DropdownMenuItem className="cursor-pointer hover:bg-slate-50" onClick={() => { setSelectedShipment(shp); setIsViewOpen(true); }}><FileText className="h-3.5 w-3.5 mr-2" /> {t('viewDetails', 'Details')}</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer hover:bg-slate-50" onClick={() => handleNotifyCustomer(shp)}><User className="h-3.5 w-3.5 mr-2" /> {t('notifyCust', 'Notify Client')}</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer hover:bg-slate-50" onClick={() => handleUpdateStatus(shp)}><RefreshCw className="h-3.5 w-3.5 mr-2" /> {t('updateStatus', 'Update State')}</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer hover:bg-slate-50 text-primary font-semibold" onClick={() => handleOpenPrint(shp)}><Truck className="h-3.5 w-3.5 mr-2" /> {t('printLabel', 'Print Label')}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredShipments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No shipments matching criteria found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Carriers API Connections Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5 text-primary"/> {t('carrierTab', 'Algerian Carriers APIs')}</CardTitle>
              <CardDescription>Setup and link account keys for Algerian logistics providers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {ALGERIAN_CARRIERS.map(carrier => {
                const isConnected = !!connectedCarriers[carrier.id];
                return (
                  <div key={carrier.id} className="p-3 border rounded-lg flex items-center justify-between gap-3 text-xs bg-white">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-8 w-8 rounded-lg ${carrier.color} text-white font-bold flex items-center justify-center shrink-0`}>
                        {carrier.logoText}
                      </span>
                      <div>
                        <span className="font-bold block text-slate-800">{carrier.name}</span>
                        {isConnected ? (
                          <span className="text-[10px] text-green-600 font-semibold flex items-center gap-1 mt-0.5"><CheckCircle2 className="h-3 w-3 text-green-600" /> {t('connected', 'Connected')}</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Ready for API linkage</span>
                        )}
                      </div>
                    </div>
                    {isConnected ? (
                      <div className="flex flex-col gap-1 items-end">
                        <Button size="sm" variant="ghost" className="text-primary font-semibold text-[10px] h-auto p-1" onClick={() => handleOpenConnect(carrier)}>{t('editCreds', 'Edit')}</Button>
                        <Button size="sm" variant="ghost" className="text-red-500 text-[10px] h-auto p-1" onClick={() => handleDisconnect(carrier.id, carrier.name)}>{t('disconnect', 'Disconnect')}</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleOpenConnect(carrier)} className="text-[10px] h-auto py-1 px-2">{t('connectBtn', 'Connect')}</Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Shipment Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md bg-white border text-slate-800 p-6">
          <DialogHeader>
            <DialogTitle>{t('addTitle', 'Create New Shipment')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div>
              <Label htmlFor="order-select">{t('selectOrder', 'Associated Order')}</Label>
              <Input id="order-select" value={newOrderId} onChange={(e) => setNewOrderId(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="carrier-select">{t('selectCarrier', 'Algerian Carrier')}</Label>
              <Select value={newCarrierId} onValueChange={setNewCarrierId}>
                <SelectTrigger className="w-full mt-1 bg-white">
                  <SelectValue placeholder="Choose Carrier" />
                </SelectTrigger>
                <SelectContent className="bg-white border text-slate-800">
                  {ALGERIAN_CARRIERS.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} {!!connectedCarriers[c.id] && ' (API Connected)'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-select">{t('arrivalDate', 'Expected Arrival')}</Label>
              <Input id="date-select" type="date" value={newArrivalDate} onChange={(e) => setNewArrivalDate(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>{t('close', 'Close')}</Button>
            <Button onClick={handleCreateShipment} className="bg-primary text-white">{t('create', 'Confirm Shipment')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connect API Credentials Dialog */}
      <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
        <DialogContent className="sm:max-w-md bg-white border text-slate-800 p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" /> {t('connectTitle', 'Connect Carrier API')}
            </DialogTitle>
            <DialogDescription>Setup credentials for {selectedCarrier?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div>
              <Label htmlFor="api-key">{t('apiKey', 'API Key')}</Label>
              <Input id="api-key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="e.g. yalid_sec_99182a3" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="acc-id">{t('accId', 'Courier Account ID')}</Label>
              <Input id="acc-id" value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="e.g. ACC-4912" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="web-sec">{t('webhook', 'Webhook Secret')}</Label>
              <Input id="web-sec" type="password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} placeholder="e.g. whsec_7781" className="mt-1" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsConnectOpen(false)}>{t('close', 'Close')}</Button>
            <Button onClick={handleSaveConnect} className="bg-primary text-white">{t('save', 'Confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Shipment Logs Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-md bg-white border text-slate-800 p-6">
          <DialogHeader>
            <DialogTitle>{t('viewDetails', 'Shipment Logs')}</DialogTitle>
            <DialogDescription>Tracking timeline history for {selectedShipment?.id}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 my-2 text-xs">
            <div className="p-3 border rounded bg-slate-50 space-y-1">
              <span className="font-semibold block text-slate-600">Shipment ID:</span>
              <span className="font-mono text-sm font-bold text-slate-800">{selectedShipment?.id}</span>
            </div>
            <div className="p-3 border rounded bg-slate-50 space-y-1">
              <span className="font-semibold block text-slate-600">Associated Order:</span>
              <span className="font-mono text-sm font-bold text-slate-800">{selectedShipment?.orderId}</span>
            </div>
            <div className="p-3 border rounded bg-slate-50 space-y-1">
              <span className="font-semibold block text-slate-600">Expected Arrival:</span>
              <span className="text-sm font-bold text-slate-800">{selectedShipment?.expectedArrival}</span>
            </div>
            <div className="p-3 border rounded bg-slate-50 space-y-1">
              <span className="font-semibold block text-slate-600">Carrier:</span>
              <span className="text-sm font-bold text-slate-800">{ALGERIAN_CARRIERS.find(c => c.id === selectedShipment?.carrierId)?.name}</span>
            </div>

            <Separator />
            <h4 className="font-bold text-slate-700 text-xs">Tracking Log Steps</h4>
            <div className="space-y-2 font-mono text-[10px]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <div>
                  <span className="font-bold block">Label Created & Dispatched</span>
                  <span className="text-slate-500">2026-07-05 10:20:00 DZ_LOCAL</span>
                </div>
              </div>
              {selectedShipment && selectedShipment.eventStep >= 2 && (
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Received by courier hub (Algiers Hub)</span>
                    <span className="text-slate-500">2026-07-05 14:30:00 DZ_LOCAL</span>
                  </div>
                </div>
              )}
              {selectedShipment && selectedShipment.eventStep >= 3 && (
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Out for delivery - Courier dispatch</span>
                    <span className="text-slate-500">2026-07-05 16:00:00 DZ_LOCAL</span>
                  </div>
                </div>
              )}
              {selectedShipment && selectedShipment.eventStep >= 4 && (
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Delivered successfully</span>
                    <span className="text-slate-500">2026-07-05 16:54:00 DZ_LOCAL</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>{t('close', 'Close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Shipping Label Dialog */}
      <Dialog open={isLabelOpen} onOpenChange={setIsLabelOpen}>
        <DialogContent className="sm:max-w-lg bg-white border text-slate-800 p-6">
          <DialogHeader>
            <DialogTitle>Shipping Label Preview</DialogTitle>
            <DialogDescription>Print dispatch ticket for logistics.</DialogDescription>
          </DialogHeader>
          
          {/* Label Body printable */}
          <div className="p-6 border-2 border-slate-900 rounded bg-white font-mono text-xs space-y-4 my-2" id="printable-shipping-label">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
              <div>
                <h2 className="text-lg font-bold">KHIDMATIK STORE DZ</h2>
                <span>Algiers, Algeria</span>
              </div>
              <div className="text-right">
                <span className="font-bold block text-sm">{ALGERIAN_CARRIERS.find(c => c.id === selectedShipment?.carrierId)?.name.toUpperCase()}</span>
                <span className="text-[10px]">API INTEGRATION WAYBILL</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-900">
              <div>
                <span className="font-bold block text-[10px] text-slate-600">SHIP TO:</span>
                <span className="font-bold block text-sm">Amine Khelifa</span>
                <p className="text-[10px] text-slate-500 mt-1">12 Rue Didouche Mourad<br />Alger, 16000<br />Algeria</p>
                <span className="font-bold block text-[10px] text-slate-600 mt-2">TEL: +213 555 12 34 56</span>
              </div>
              <div className="border-l border-slate-900 pl-4">
                <span className="font-bold block text-[10px] text-slate-600">SHIPMENT DETAILS:</span>
                <span className="font-bold block">SHIPMENT: {selectedShipment?.id}</span>
                <span className="font-bold block">ORDER: {selectedShipment?.orderId}</span>
                <span className="font-bold block mt-1">WEIGHT: 1.5 KG</span>
                <span className="font-bold block">PAYMENT: COD (الدفع عند الاستلام)</span>
              </div>
            </div>

            {/* Simulating Barcode */}
            <div className="flex flex-col items-center justify-center py-4 space-y-1">
              <div className="h-10 bg-slate-900 w-full max-w-xs flex items-center justify-center text-white text-[8px] font-bold select-none border-l-4 border-r-4 border-white">
                |||||| | ||| |||| | ||||| ||| | ||| |||| || |
              </div>
              <span className="text-[10px] font-bold text-center tracking-widest">{selectedShipment?.id}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsLabelOpen(false)}>{t('close', 'Close')}</Button>
            <Button onClick={handlePrintAction} className="bg-primary text-white font-semibold"><Truck className="h-4 w-4 mr-1.5" /> Print Label</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
