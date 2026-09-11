'use client';

import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserX, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { messagingService } from '@/services/messagingService';

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  isCurrentlyBlocked: boolean;
  onBlockToggled: (newBlockedState: boolean) => void;
}

export function BlockUserModal({
  isOpen,
  onClose,
  targetUserId,
  targetUserName,
  isCurrentlyBlocked,
  onBlockToggled
}: BlockUserModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { translate } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (!user?.id) return;

    setIsProcessing(true);
    try {
      if (isCurrentlyBlocked) {
        const res = await messagingService.unblockUser(user.id, targetUserId);
        if (res.success) {
          toast({
            title: translate('userUnblocked', 'User Unblocked'),
            description: translate('userUnblockedDesc', `You have unblocked ${targetUserName}. You can now exchange messages.`)
          });
          onBlockToggled(false);
          onClose();
        }
      } else {
        const res = await messagingService.blockUser(user.id, targetUserId);
        if (res.success) {
          toast({
            title: translate('userBlocked', 'User Blocked'),
            description: translate('userBlockedDesc', `${targetUserName} will no longer be able to send you messages.`)
          });
          onBlockToggled(true);
          onClose();
        }
      }
    } catch (err) {
      toast({ title: 'Operation failed', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="rounded-2xl max-w-sm p-6 font-sans">
        <AlertDialogHeader className="text-left rtl:text-right space-y-2">
          <div className={`p-2.5 rounded-2xl w-fit ${isCurrentlyBlocked ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
            <UserX className="h-6 w-6" />
          </div>
          <AlertDialogTitle className="text-base font-bold text-slate-800 dark:text-slate-200">
            {isCurrentlyBlocked
              ? `${translate('unblock', 'Unblock')} ${targetUserName}?`
              : `${translate('block', 'Block')} ${targetUserName}?`}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {isCurrentlyBlocked
              ? translate('unblockDesc', 'Unblocking will allow this user to message you and view your active conversations.')
              : translate('blockDesc', 'Blocking will prevent this user from messaging you. Existing chat messages will remain archived.')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-0 mt-3">
          <AlertDialogCancel onClick={onClose} className="rounded-xl text-xs">
            {translate('cancel', 'Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`rounded-xl text-xs text-white ${
              isCurrentlyBlocked
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {isProcessing
              ? translate('processing', 'Processing...')
              : isCurrentlyBlocked
              ? translate('confirmUnblock', 'Unblock User')
              : translate('confirmBlock', 'Block User')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
