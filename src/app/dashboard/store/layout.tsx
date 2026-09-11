'use client';

import { DashboardSidebar } from '@/components/dashboard/store/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { RouteGuard } from '@/components/common/RouteGuard';
import { useLanguage } from '@/context/LanguageContext';

export default function StoreDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <RouteGuard requiredPermission="view_store_dashboard">
      <div className="flex min-h-screen bg-muted/40">
        <div className="hidden md:block">
          <DashboardSidebar 
            isCollapsed={isCollapsed} 
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)} 
          />
        </div>
        <div className={cn(
          "flex flex-col flex-1 transition-all duration-300 ease-in-out min-w-0",
          isCollapsed 
            ? "ltr:md:ml-[80px] rtl:md:mr-[80px]" 
            : "ltr:md:ml-[300px] rtl:md:mr-[300px]"
        )}>
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4 md:hidden">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side={isAr ? 'right' : 'left'} className="w-[280px] sm:w-[320px] p-0">
                <DashboardSidebar 
                  onLinkClick={() => setIsSidebarOpen(false)} 
                  className="relative inset-auto w-full h-full border-none shadow-none"
                />
              </SheetContent>
            </Sheet>
            <span className="text-sm font-semibold text-muted-foreground">{isAr ? 'لوحة التحكم' : 'Store Dashboard'}</span>
          </header>
          <main className="flex-1 p-3 sm:p-6 md:gap-8 overflow-x-hidden min-w-0">{children}</main>
        </div>
      </div>
    </RouteGuard>
  );
}
