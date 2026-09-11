'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, CheckCircle, Trash2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export function AdminConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
}: AdminConfirmModalProps) {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />;
      case 'info':
      default:
        return <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px] p-6 rounded-2xl">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "p-3 rounded-full shrink-0 flex items-center justify-center",
              variant === 'danger' && "bg-red-100 dark:bg-red-950/50",
              variant === 'warning' && "bg-amber-100 dark:bg-amber-950/50",
              variant === 'success' && "bg-emerald-100 dark:bg-emerald-950/50",
              variant === 'info' && "bg-blue-100 dark:bg-blue-950/50"
            )}
          >
            {getIcon()}
          </div>
          <div className="space-y-1.5 flex-1">
            <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </div>

        <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="h-10 px-4 rounded-xl"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={getConfirmButtonVariant()}
            onClick={() => {
              onConfirm();
            }}
            disabled={isLoading}
            className={cn(
              "h-10 px-5 rounded-xl font-medium",
              variant === 'warning' && "bg-amber-600 hover:bg-amber-700 text-white"
            )}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
