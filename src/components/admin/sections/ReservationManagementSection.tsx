'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, Calendar, Clock, DollarSign, Users, CheckCircle2, 
  XCircle, Eye, Phone, Mail, MapPin, KeyRound, ShieldAlert, Ban
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminDataService, AdminBooking } from '@/services/adminDataService';
import { AdminDataTable, ColumnDef, FilterOption, BulkAction } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';
import { AdminConfirmModal } from '@/components/admin/shared/AdminConfirmModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ReservationManagementSection() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
    variant: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: () => {},
    variant: 'warning',
  });

  const loadData = () => {
    setBookings(adminDataService.getBookings());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = (bookingId: string, newStatus: AdminBooking['status']) => {
    adminDataService.updateBookingStatus(bookingId, newStatus);
    loadData();
    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking({ ...selectedBooking, status: newStatus });
    }
    toast({
      title: 'Booking Status Updated',
      description: `Reservation status changed to ${newStatus}.`,
    });
  };

  const handleRegenerateOtp = (bookingId: string) => {
    const list = adminDataService.getBookings();
    const target = list.find((b) => b.id === bookingId);
    if (!target) return;
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    target.otpCode = newOtp;
    adminDataService.saveBookings(list);
    adminDataService.recordAudit('Super Admin', 'UPDATE', 'Booking', bookingId, `Regenerated OTP security code to ${newOtp}`);
    loadData();
    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking({ ...target });
    }
    toast({
      title: 'OTP Code Regenerated',
      description: `New Proof-of-Service verification OTP: ${newOtp}`,
    });
  };

  const filterOptions: FilterOption[] = [
    {
      key: 'type',
      label: 'Type',
      options: [
        { label: 'Banquet Hall', value: 'banquet_hall' },
        { label: 'Craftsman', value: 'craftsman' },
        { label: 'Service Point', value: 'service' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Disputed', value: 'disputed' },
      ],
    },
  ];

  const bulkActions: BulkAction<AdminBooking>[] = [
    {
      label: 'Confirm Selected',
      icon: CheckCircle2,
      variant: 'default',
      action: (selected) => {
        selected.forEach((b) => adminDataService.updateBookingStatus(b.id, 'confirmed'));
        loadData();
        toast({ title: 'Batch Confirmation', description: `${selected.length} bookings confirmed.` });
      },
    },
    {
      label: 'Cancel Selected',
      icon: Ban,
      variant: 'destructive',
      action: (selected) => {
        setConfirmState({
          isOpen: true,
          title: `Cancel ${selected.length} Bookings`,
          description: `Are you sure you want to cancel ${selected.length} reservations?`,
          variant: 'danger',
          action: () => {
            selected.forEach((b) => adminDataService.updateBookingStatus(b.id, 'cancelled'));
            loadData();
            setConfirmState((prev) => ({ ...prev, isOpen: false }));
            toast({ title: 'Batch Cancellation', description: `${selected.length} bookings cancelled.` });
          },
        });
      },
    },
  ];

  const columns: ColumnDef<AdminBooking>[] = [
    {
      header: 'Booking Code & Type',
      accessorKey: 'bookingCode',
      cell: (b) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground font-mono">{b.bookingCode}</div>
          <Badge variant="outline" className="text-[10px] uppercase font-semibold">
            {b.type.replace('_', ' ')}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessorKey: 'customerName',
      cell: (b) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-medium text-foreground">{b.customerName}</div>
          <div className="text-muted-foreground font-mono">{b.customerPhone}</div>
        </div>
      ),
    },
    {
      header: 'Provider / Venue',
      accessorKey: 'providerOrVenueName',
      cell: (b) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-medium text-foreground">{b.providerOrVenueName}</div>
          <div className="text-muted-foreground">{b.wilaya}</div>
        </div>
      ),
    },
    {
      header: 'Date & Time Slot',
      accessorKey: 'scheduledDate',
      cell: (b) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-medium text-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            {b.scheduledDate}
          </div>
          <div className="text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {b.timeSlot}
          </div>
        </div>
      ),
    },
    {
      header: 'Total / Deposit',
      accessorKey: 'totalPrice',
      cell: (b) => (
        <div className="text-xs">
          <span className="font-bold text-foreground">{b.totalPrice.toLocaleString()} DA</span>
          <span className="text-muted-foreground block">
            Deposit: {b.depositPaid.toLocaleString()} DA
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (b) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          confirmed: 'default',
          completed: 'default',
          in_progress: 'secondary',
          pending: 'secondary',
          cancelled: 'destructive',
          disputed: 'destructive',
        };
        return (
          <Badge variant={variants[b.status] || 'outline'} className="capitalize text-xs">
            {b.status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      cell: (b) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => {
              setSelectedBooking(b);
              setIsDetailOpen(true);
            }}
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> View
          </Button>
        </div>
      ),
    },
  ];

  const total = bookings.length;
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const totalVolume = bookings.reduce((acc, b) => acc + b.totalPrice, 0);
  const pending = bookings.filter((b) => b.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center tracking-tight">
          <Building className="mr-3 h-8 w-8 text-primary" /> Bookings & Reservations
        </h1>
        <p className="text-muted-foreground text-sm">
          Oversee banquet hall venues, service appointments, craftsmen dispatch schedules, and proof-of-service OTP verification.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Halls & Service appointments</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{confirmed}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready on calendar</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Pending Action</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting provider acceptance</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalVolume.toLocaleString()} DA</div>
            <p className="text-xs text-muted-foreground mt-1">Gross booking volume</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <AdminDataTable
        data={bookings}
        columns={columns}
        searchPlaceholder="Search booking by code, customer, provider/hall, wilaya..."
        searchKeys={['bookingCode', 'customerName', 'customerPhone', 'providerOrVenueName', 'wilaya', 'category']}
        filterOptions={filterOptions}
        bulkActions={bulkActions}
        exportFileName="khidmatik_bookings"
        onRowClick={(b) => {
          setSelectedBooking(b);
          setIsDetailOpen(true);
        }}
        onRefresh={loadData}
      />

      {/* Detail Drawer */}
      {selectedBooking && (
        <AdminDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Booking ${selectedBooking.bookingCode}`}
          subtitle={`Date: ${selectedBooking.scheduledDate} (${selectedBooking.timeSlot})`}
          statusBadge={{
            label: selectedBooking.status.replace('_', ' '),
            variant: selectedBooking.status === 'confirmed' || selectedBooking.status === 'completed' ? 'default' : 'secondary',
          }}
          metrics={[
            { label: 'Total Price', value: `${selectedBooking.totalPrice.toLocaleString()} DA`, icon: DollarSign },
            { label: 'Deposit Paid', value: `${selectedBooking.depositPaid.toLocaleString()} DA`, icon: DollarSign },
            { label: 'Type', value: selectedBooking.type.toUpperCase(), icon: Building },
            { label: 'Service OTP', value: selectedBooking.otpCode || 'N/A', icon: KeyRound },
          ]}
          fields={[
            { label: 'Customer Name', value: selectedBooking.customerName, icon: Users },
            { label: 'Phone Number', value: selectedBooking.customerPhone, icon: Phone },
            { label: 'Email Address', value: selectedBooking.customerEmail, icon: Mail },
            { label: 'Venue / Provider', value: selectedBooking.providerOrVenueName },
            { label: 'Category', value: selectedBooking.category },
            { label: 'Location / Wilaya', value: `${selectedBooking.address}, ${selectedBooking.wilaya}`, fullWidth: true, icon: MapPin },
            { label: 'Guests / Units', value: selectedBooking.guestsOrUnits ? `${selectedBooking.guestsOrUnits} guests` : 'Standard service unit' },
            { label: 'Proof of Service OTP', value: selectedBooking.otpCode || 'None' },
          ]}
          activityHistory={[
            {
              timestamp: `${selectedBooking.createdAt} 15:30`,
              actor: selectedBooking.customerName,
              action: 'Booking Created',
              details: `Initial deposit of ${selectedBooking.depositPaid} DA recorded.`,
            },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRegenerateOtp(selectedBooking.id)}
              >
                <KeyRound className="h-4 w-4 mr-1.5" /> Regenerate OTP
              </Button>
              <Select
                value={selectedBooking.status}
                onValueChange={(val: any) => handleStatusChange(selectedBooking.id, val)}
              >
                <SelectTrigger className="h-9 w-[150px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      )}

      {/* Confirm Modal */}
      <AdminConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.action}
        title={confirmState.title}
        description={confirmState.description}
        variant={confirmState.variant}
      />
    </div>
  );
}
