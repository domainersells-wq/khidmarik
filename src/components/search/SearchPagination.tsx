'use client';

import React from 'react';
import { ChevronRight, ChevronLeft, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function SearchPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: SearchPaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/40">
      {/* Range indicator */}
      <span className="text-xs text-muted-foreground font-medium order-2 sm:order-1">
        عرض <strong className="text-foreground">{startItem} - {endItem}</strong> من أصل <strong className="text-foreground">{totalItems}</strong> نتيجة
      </span>

      {/* Pagination buttons */}
      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        {/* Next / Previous depending on RTL */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 w-8 p-0 rounded-xl"
          title="الصفحة السابقة"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((p, idx) => {
          if (p === 'ellipsis') {
            return (
              <span key={`el-${idx}`} className="px-1 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            );
          }

          const isActive = p === currentPage;
          return (
            <Button
              key={p}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(p)}
              className={cn(
                "h-8 w-8 p-0 rounded-xl text-xs font-bold transition-all",
                isActive ? "shadow-sm shadow-primary/30" : "hover:border-primary/60"
              )}
            >
              {p}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 p-0 rounded-xl"
          title="الصفحة التالية"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
