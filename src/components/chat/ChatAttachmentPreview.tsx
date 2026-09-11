'use client';

import React, { useState } from 'react';
import { MessageAttachment } from '@/types/messaging';
import { FileText, Download, Eye, ExternalLink, Image as ImageIcon, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ChatAttachmentPreviewProps {
  attachments: MessageAttachment[];
  isOutgoing?: boolean;
}

export function ChatAttachmentPreview({ attachments, isOutgoing }: ChatAttachmentPreviewProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2 mt-1.5 w-full">
      {attachments.map((att, idx) => {
        if (att.fileType === 'image') {
          return (
            <div key={att.id || idx} className="relative group overflow-hidden rounded-xl border border-slate-200/50 dark:border-slate-800/50 max-w-[280px]">
              <img
                src={att.url}
                alt={att.name || 'Image attachment'}
                className="w-full max-h-[220px] object-cover cursor-pointer rounded-xl transition-transform duration-200 group-hover:scale-[1.02]"
                onClick={() => setLightboxImage(att.url)}
              />
              <div 
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                onClick={() => setLightboxImage(att.url)}
              >
                <span className="text-white text-xs font-semibold flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-xs">
                  <Eye className="h-3.5 w-3.5" /> View
                </span>
              </div>
            </div>
          );
        }

        // Generic File Card
        return (
          <div
            key={att.id || idx}
            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all max-w-[320px] ${
              isOutgoing
                ? 'bg-white/15 border-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className={`p-2 rounded-lg ${isOutgoing ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 text-left rtl:text-right">
              <p className="text-xs font-semibold truncate leading-tight">{att.name}</p>
              <p className={`text-[10px] ${isOutgoing ? 'text-white/80' : 'text-muted-foreground'}`}>
                {formatFileSize(att.size)}
              </p>
            </div>
            <a
              href={att.url}
              download={att.name}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-1.5 rounded-lg transition-colors ${
                isOutgoing
                  ? 'hover:bg-white/20 text-white'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Download className="h-4 w-4" />
            </a>
          </div>
        );
      })}

      {/* Image Lightbox Modal */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/90 border-none shadow-2xl rounded-2xl flex items-center justify-center">
          <DialogHeader className="sr-only">
            <DialogTitle>Attachment Preview</DialogTitle>
            <DialogDescription>Enlarged view of message image attachment</DialogDescription>
          </DialogHeader>
          {lightboxImage && (
            <div className="relative max-h-[85vh] overflow-hidden flex items-center justify-center p-2">
              <img
                src={lightboxImage}
                alt="Enlarged attachment"
                className="max-h-[80vh] w-auto object-contain rounded-xl"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLightboxImage(null)}
                className="absolute top-2 right-2 text-white hover:bg-white/20 rounded-full h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
