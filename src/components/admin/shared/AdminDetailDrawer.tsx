'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  X, Calendar, Clock, User, Mail, Phone, MapPin, 
  ShieldCheck, Activity, ChevronRight, ExternalLink, CheckCircle2, 
  AlertTriangle, History, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DetailField {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
}

export interface MetricCard {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ComponentType<{ className?: string }>;
  colorClass?: string;
}

export interface ActivityItem {
  id?: string;
  timestamp: string;
  actor: string;
  action: string;
  details?: string;
}

interface AdminDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  statusBadge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
  };
  metrics?: MetricCard[];
  fields?: DetailField[];
  activityHistory?: ActivityItem[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function AdminDetailDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  statusBadge,
  metrics = [],
  fields = [],
  activityHistory = [],
  actions,
  children,
}: AdminDetailDrawerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto p-0 rounded-2xl gap-0 custom-sidebar-scrollbar">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b px-6 py-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                {title}
              </DialogTitle>
              {statusBadge && (
                <Badge
                  variant={statusBadge.variant || 'secondary'}
                  className={cn("px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider", statusBadge.className)}
                >
                  {statusBadge.label}
                </Badge>
              )}
            </div>
            {subtitle && (
              <DialogDescription className="text-xs text-muted-foreground font-mono">
                {subtitle}
              </DialogDescription>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Top Metrics Cards if any */}
          {metrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {metrics.map((m, idx) => {
                const Icon = m.icon;
                return (
                  <Card key={idx} className="bg-muted/30 border shadow-none">
                    <CardContent className="p-3.5 space-y-1">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-medium truncate">{m.label}</span>
                        {Icon && <Icon className={cn("h-4 w-4 shrink-0", m.colorClass || "text-primary")} />}
                      </div>
                      <div className="text-lg font-bold tracking-tight text-foreground truncate">
                        {m.value}
                      </div>
                      {m.subtext && (
                        <p className="text-[11px] text-muted-foreground truncate">{m.subtext}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Structured Detail Fields */}
          {fields.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" /> Record Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-muted/20 p-4 rounded-xl border">
                {fields.map((f, idx) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "space-y-1",
                        f.fullWidth && "sm:col-span-2"
                      )}
                    >
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/80" />}
                        {f.label}
                      </span>
                      <div className="text-sm font-medium text-foreground break-words">
                        {f.value ?? '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Children injection */}
          {children}

          {/* Activity / Audit History Timeline */}
          {activityHistory.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-primary" /> Activity & Audit Trail
              </h4>
              <div className="space-y-3 border-l-2 border-primary/30 pl-4 ml-2 py-1">
                {activityHistory.map((item, idx) => (
                  <div key={item.id || idx} className="relative space-y-0.5">
                    <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{item.action}</span>
                      <span className="text-muted-foreground">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      By <span className="font-medium text-foreground">{item.actor}</span>
                      {item.details ? ` — ${item.details}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Toolbar Footer */}
        {actions && (
          <div className="sticky bottom-0 z-10 bg-card border-t px-6 py-4 flex items-center justify-end gap-2.5">
            {actions}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
