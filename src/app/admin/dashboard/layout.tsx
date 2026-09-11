
'use client';

import { AdminDashboardSidebar } from '@/components/admin/AdminDashboardSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PanelLeft } from 'lucide-react';
import { useState } from 'react';
import { RouteGuard } from '@/components/common/RouteGuard';
import { cn } from '@/lib/utils';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <RouteGuard requiredPermission="view_admin_dashboard">
      <div className="flex min-h-screen bg-muted/40">
        <div className="hidden md:block">
          <AdminDashboardSidebar 
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          />
        </div>
        <div className={cn(
          "flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out",
          isCollapsed 
            ? "ltr:md:ml-[80px] rtl:md:mr-[80px]" 
            : "ltr:md:ml-[300px] rtl:md:mr-[300px]"
        )}>
          {/* Universal Sticky Admin Header with live Top-up alerts and Notification bell */}
          <AdminHeader onMobileMenuToggle={() => setIsSidebarOpen(true)} />

          {/* Mobile Navigation Drawer Sheet */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="sm:max-w-xs p-0 border-r border-border">
              <AdminDashboardSidebar onLinkClick={() => setIsSidebarOpen(false)} />
            </SheetContent>
          </Sheet>

          <main className="flex-1 p-4 sm:px-6 sm:py-4 md:gap-8">{children}</main>
        </div>
      </div>
    </RouteGuard>
  );
}
