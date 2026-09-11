'use client';

import React, { useState, useMemo } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import {
  Search, ArrowUpDown, ArrowUp, ArrowDown, Download, Filter, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, 
  CheckSquare, Trash2, CheckCircle2, ShieldAlert, SlidersHorizontal, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T | string;
  id?: string;
  sortable?: boolean;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

export interface BulkAction<T> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  action: (selectedItems: T[]) => void;
}

interface AdminDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T | string)[];
  filterOptions?: FilterOption[];
  bulkActions?: BulkAction<T>[];
  onRowClick?: (item: T) => void;
  exportFileName?: string;
  title?: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
  isLoading?: boolean;
  onRefresh?: () => void;
  getItemId?: (item: T) => string;
}

export function AdminDataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = 'Search records...',
  searchKeys = [],
  filterOptions = [],
  bulkActions = [],
  onRowClick,
  exportFileName = 'export-data',
  title,
  subtitle,
  actionButton,
  isLoading = false,
  onRefresh,
  getItemId = (item: T) => item.id || item.code || JSON.stringify(item),
}: AdminDataTableProps<T>) {
  const { toast } = useToast();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Helper to extract nested value
  const getValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  // Filtered & Searched Data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Search Query
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        let matches = false;
        if (searchKeys.length > 0) {
          matches = searchKeys.some((k) => {
            const val = getValue(item, k as string);
            return val != null && String(val).toLowerCase().includes(query);
          });
        } else {
          // Check all string/number fields
          matches = Object.values(item).some(
            (val) => val != null && String(val).toLowerCase().includes(query)
          );
        }
        if (!matches) return false;
      }

      // 2. Active Dropdown Filters
      for (const [filterKey, filterValue] of Object.entries(activeFilters)) {
        if (filterValue && filterValue !== 'all') {
          const itemVal = getValue(item, filterKey);
          if (String(itemVal) !== filterValue) {
            return false;
          }
        }
      }

      return true;
    });
  }, [data, searchTerm, searchKeys, activeFilters]);

  // Sorted Data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = getValue(a, sortColumn);
      const bVal = getValue(b, sortColumn);

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Date comparison
      const aDate = Date.parse(String(aVal));
      const bDate = Date.parse(String(bVal));
      if (!isNaN(aDate) && !isNaN(bDate) && String(aVal).includes('-')) {
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }

      // String comparison
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortDirection === 'asc'
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginated Data
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Handle Sort Toggle
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Bulk Selection Handlers
  const isAllPageSelected =
    paginatedData.length > 0 &&
    paginatedData.every((item) => selectedIds.has(getItemId(item)));

  const toggleSelectAll = () => {
    const newSelected = new Set(selectedIds);
    if (isAllPageSelected) {
      paginatedData.forEach((item) => newSelected.delete(getItemId(item)));
    } else {
      paginatedData.forEach((item) => newSelected.add(getItemId(item)));
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // CSV Export
  const handleExportCSV = () => {
    if (sortedData.length === 0) {
      toast({ title: 'No Data to Export', description: 'There are no records matching your criteria.', variant: 'destructive' });
      return;
    }

    const exportCols = columns.filter((c) => c.accessorKey);
    const headers = exportCols.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');

    const rows = sortedData.map((item) => {
      return exportCols
        .map((c) => {
          const raw = getValue(item, c.accessorKey as string);
          if (raw == null) return '""';
          if (typeof raw === 'object') return `"${JSON.stringify(raw).replace(/"/g, '""')}"`;
          return `"${String(raw).replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${exportFileName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Completed',
      description: `Successfully exported ${sortedData.length} records to CSV.`,
    });
  };

  const activeFilterCount = Object.values(activeFilters).filter((v) => v && v !== 'all').length;

  return (
    <div className="space-y-4">
      {/* Top Header if title is provided */}
      {(title || subtitle || actionButton) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div>
            {title && <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} className="h-9">
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            {actionButton}
          </div>
        </div>
      )}

      {/* Toolbar: Search, Filters & Bulk Action Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 pr-8 h-10 bg-card"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Selects / Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {filterOptions.map((filter) => (
            <Select
              key={filter.key}
              value={activeFilters[filter.key] || 'all'}
              onValueChange={(val) => {
                setActiveFilters((prev) => ({ ...prev, [filter.key]: val }));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-10 min-w-[140px] bg-card text-xs">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveFilters({});
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="h-10 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Action Banner when items are selected */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-xl transition-all animate-in fade-in">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-primary text-primary-foreground font-mono">
              {selectedIds.size}
            </Badge>
            <span className="text-sm font-medium text-foreground">
              {selectedIds.size === 1 ? 'item selected' : 'items selected'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {bulkActions.map((action, idx) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={idx}
                  size="sm"
                  variant={action.variant || 'outline'}
                  onClick={() => {
                    const selectedObjects = data.filter((item) =>
                      selectedIds.has(getItemId(item))
                    );
                    action.action(selectedObjects);
                  }}
                  className="h-8 text-xs font-medium"
                >
                  {ActionIcon && <ActionIcon className="h-3.5 w-3.5 mr-1.5" />}
                  {action.label}
                </Button>
              );
            })}
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSelection}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-sidebar-scrollbar">
          <Table>
            <TableHeader className="bg-muted/50 border-b">
              <TableRow className="hover:bg-transparent">
                {bulkActions.length > 0 && (
                  <TableHead className="w-12 px-4 text-center">
                    <Checkbox
                      checked={isAllPageSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all on current page"
                    />
                  </TableHead>
                )}
                {columns.map((col, idx) => {
                  const isSorted = col.accessorKey && sortColumn === col.accessorKey;
                  return (
                    <TableHead
                      key={col.id || (col.accessorKey as string) || idx}
                      className={cn(
                        "py-3.5 font-semibold text-xs text-muted-foreground uppercase tracking-wider",
                        col.sortable !== false && col.accessorKey && "cursor-pointer select-none hover:text-foreground",
                        col.className
                      )}
                      onClick={() => {
                        if (col.sortable !== false && col.accessorKey) {
                          handleSort(col.accessorKey as string);
                        }
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {col.sortable !== false && col.accessorKey && (
                          <span className="inline-flex">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5 text-primary" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100 transition-opacity" />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)}
                    className="h-44 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Search className="h-8 w-8 opacity-40" />
                      <p className="font-medium">No records found matching your filters</p>
                      <p className="text-xs text-muted-foreground">
                        Try adjusting your search keywords or clearing some filters.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, rowIdx) => {
                  const itemId = getItemId(item);
                  const isSelected = selectedIds.has(itemId);
                  return (
                    <TableRow
                      key={itemId || rowIdx}
                      data-state={isSelected ? 'selected' : undefined}
                      className={cn(
                        "transition-colors hover:bg-muted/40",
                        onRowClick && "cursor-pointer",
                        isSelected && "bg-primary/5"
                      )}
                      onClick={() => onRowClick && onRowClick(item)}
                    >
                      {bulkActions.length > 0 && (
                        <TableCell
                          className="w-12 px-4 text-center"
                          onClick={(e) => toggleSelectItem(itemId, e)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectItem(itemId)}
                            aria-label={`Select row ${itemId}`}
                          />
                        </TableCell>
                      )}
                      {columns.map((col, colIdx) => (
                        <TableCell
                          key={col.id || (col.accessorKey as string) || colIdx}
                          className={cn("py-3 font-sans text-sm", col.className)}
                        >
                          {col.cell
                            ? col.cell(item)
                            : col.accessorKey
                            ? String(getValue(item, col.accessorKey as string) ?? '—')
                            : null}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Table Footer: Stats & Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-card text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              Showing{' '}
              <strong className="text-foreground">
                {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-foreground">
                {Math.min(currentPage * pageSize, sortedData.length)}
              </strong>{' '}
              of <strong className="text-foreground">{sortedData.length}</strong> entries
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              <span>Per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-[70px] text-xs bg-muted/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 py-1 text-xs font-medium text-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
