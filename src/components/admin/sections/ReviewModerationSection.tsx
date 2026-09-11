'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, MessageSquare, CheckCircle2, XCircle, Eye, 
  Flag, Trash2, ThumbsUp, ThumbsDown, ShieldAlert, Store, Wrench, Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminDataService, AdminReview } from '@/services/adminDataService';
import { AdminDataTable, ColumnDef, FilterOption, BulkAction } from '@/components/admin/shared/AdminDataTable';
import { AdminDetailDrawer } from '@/components/admin/shared/AdminDetailDrawer';
import { AdminConfirmModal } from '@/components/admin/shared/AdminConfirmModal';

export function ReviewModerationSection() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
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
    setReviews(adminDataService.getReviews());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = (reviewId: string, status: AdminReview['status']) => {
    adminDataService.updateReviewStatus(reviewId, status);
    loadData();
    if (selectedReview && selectedReview.id === reviewId) {
      setSelectedReview({ ...selectedReview, status });
    }
    toast({
      title: 'Review Moderated',
      description: `Review status changed to ${status}.`,
    });
  };

  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Approved', value: 'approved' },
        { label: 'Pending', value: 'pending' },
        { label: 'Flagged / Spam', value: 'flagged' },
        { label: 'Hidden', value: 'hidden' },
      ],
    },
    {
      key: 'targetType',
      label: 'Target Type',
      options: [
        { label: 'Store', value: 'store' },
        { label: 'Product', value: 'product' },
        { label: 'Service', value: 'service' },
      ],
    },
    {
      key: 'rating',
      label: 'Rating',
      options: [
        { label: '5 Stars', value: '5' },
        { label: '4 Stars', value: '4' },
        { label: '3 Stars', value: '3' },
        { label: '2 Stars', value: '2' },
        { label: '1 Star', value: '1' },
      ],
    },
  ];

  const bulkActions: BulkAction<AdminReview>[] = [
    {
      label: 'Approve Selected',
      icon: CheckCircle2,
      variant: 'default',
      action: (selected) => {
        selected.forEach((r) => adminDataService.updateReviewStatus(r.id, 'approved'));
        loadData();
        toast({ title: 'Batch Moderation', description: `${selected.length} reviews approved.` });
      },
    },
    {
      label: 'Quarantine Spam',
      icon: Trash2,
      variant: 'destructive',
      action: (selected) => {
        setConfirmState({
          isOpen: true,
          title: `Quarantine ${selected.length} Reviews`,
          description: `Are you sure you want to hide and delete ${selected.length} flagged comments?`,
          variant: 'danger',
          action: () => {
            selected.forEach((r) => adminDataService.updateReviewStatus(r.id, 'hidden'));
            loadData();
            setConfirmState((prev) => ({ ...prev, isOpen: false }));
            toast({ title: 'Batch Quarantined', description: `${selected.length} reviews hidden.` });
          },
        });
      },
    },
  ];

  const columns: ColumnDef<AdminReview>[] = [
    {
      header: 'Review Target',
      accessorKey: 'targetName',
      cell: (r) => {
        const icons: Record<string, any> = {
          store: Store,
          product: Package,
          service: Wrench,
        };
        const Icon = icons[r.targetType] || MessageSquare;
        return (
          <div className="space-y-0.5">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {r.targetName}
            </div>
            <Badge variant="outline" className="text-[10px] uppercase font-normal">
              {r.targetType}
            </Badge>
          </div>
        );
      },
    },
    {
      header: 'Author & Rating',
      accessorKey: 'authorName',
      cell: (r) => (
        <div className="space-y-1 text-xs">
          <div className="font-medium text-foreground">{r.authorName}</div>
          <div className="flex items-center gap-0.5 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      ),
    },
    {
      header: 'Comment Snippet',
      accessorKey: 'comment',
      cell: (r) => (
        <div className="text-xs text-foreground max-w-[300px] truncate" title={r.comment}>
          {r.comment}
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (r) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          approved: 'default',
          pending: 'secondary',
          flagged: 'destructive',
          hidden: 'outline',
          deleted: 'destructive',
        };
        return (
          <Badge variant={variants[r.status] || 'outline'} className="capitalize text-xs">
            {r.status}
          </Badge>
        );
      },
    },
    {
      header: 'Date',
      accessorKey: 'createdAt',
      cell: (r) => <span className="text-xs text-muted-foreground">{r.createdAt}</span>,
    },
    {
      header: 'Actions',
      cell: (r) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => {
              setSelectedReview(r);
              setIsDetailOpen(true);
            }}
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> View
          </Button>
          {r.status !== 'approved' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={() => handleStatusChange(r.id, 'approved')}
              title="Approve Review"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const total = reviews.length;
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const flaggedCount = reviews.filter((r) => r.status === 'flagged').length;
  const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center tracking-tight">
          <Star className="mr-3 h-8 w-8 text-primary" /> Reviews & Ratings Moderation
        </h1>
        <p className="text-muted-foreground text-sm">
          Moderate user reviews, ratings, flagged spam comments, and customer feedback across all stores and craftsmen.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Platform feedbacks</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500 flex items-center gap-1">
              <Star className="h-5 w-5 fill-amber-500" /> {avgRating}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Overall platform satisfaction</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Approved Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Publicly displayed</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Flagged / Spam</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{flaggedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires quarantine</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <AdminDataTable
        data={reviews}
        columns={columns}
        searchPlaceholder="Search review by author, target name, comment..."
        searchKeys={['targetName', 'authorName', 'authorEmail', 'comment']}
        filterOptions={filterOptions}
        bulkActions={bulkActions}
        exportFileName="khidmatik_reviews"
        onRowClick={(r) => {
          setSelectedReview(r);
          setIsDetailOpen(true);
        }}
        onRefresh={loadData}
      />

      {/* Detail Drawer */}
      {selectedReview && (
        <AdminDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Review on ${selectedReview.targetName}`}
          subtitle={`By: ${selectedReview.authorName} (${selectedReview.authorEmail})`}
          statusBadge={{
            label: selectedReview.status,
            variant: selectedReview.status === 'approved' ? 'default' : 'destructive',
          }}
          metrics={[
            { label: 'Rating', value: `${selectedReview.rating} / 5 Stars`, icon: Star },
            { label: 'Target Type', value: selectedReview.targetType.toUpperCase(), icon: MessageSquare },
            { label: 'Sentiment', value: selectedReview.sentiment.toUpperCase(), icon: ThumbsUp },
            { label: 'Status', value: selectedReview.status.toUpperCase(), icon: ShieldAlert },
          ]}
          fields={[
            { label: 'Reviewed Entity', value: selectedReview.targetName },
            { label: 'Review Author', value: `${selectedReview.authorName} (${selectedReview.authorEmail})` },
            { label: 'Date Posted', value: selectedReview.createdAt },
            { label: 'Flag Reason (if any)', value: selectedReview.flagReason || 'None' },
            { label: 'Full Review Comment', value: selectedReview.comment, fullWidth: true },
          ]}
          actions={
            <div className="flex items-center gap-2">
              {selectedReview.status === 'approved' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleStatusChange(selectedReview.id, 'hidden')}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" /> Hide / Quarantine
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleStatusChange(selectedReview.id, 'approved')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve Comment
                </Button>
              )}
            </div>
          }
        />
      )}

      {/* Confirmation Modal */}
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
