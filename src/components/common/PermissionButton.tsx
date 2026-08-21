'use client';

import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Lock, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PermissionButtonProps extends ButtonProps {
  permission?: string;
  isLoadingState?: boolean;
  isPendingState?: boolean;
  unauthorizedMessage?: string;
  forceUnauthorized?: boolean;
}

const PermissionButton = React.forwardRef<HTMLButtonElement, PermissionButtonProps>(
  ({ 
    className, 
    permission, 
    isLoadingState = false, 
    isPendingState = false, 
    unauthorizedMessage, 
    forceUnauthorized = false,
    disabled, 
    children, 
    onClick,
    ...props 
  }, ref) => {
    // If auth context is not yet loaded, we default to superadmin (which is allowed)
    let hasPermission: (permission: string) => boolean;
    try {
      const auth = useAuth();
      hasPermission = auth.hasPermission;
    } catch (e) {
      // Fallback if rendered outside AuthProvider (e.g. testing)
      hasPermission = () => true;
    }
    
    // Check if authorized
    const isAuthorized = forceUnauthorized ? false : (permission ? hasPermission(permission) : true);

    // Build the message for unauthorized state
    const authTooltipText = unauthorizedMessage || (permission ? `Permission required: ${permission}` : "You are not authorized to perform this action.");

    if (isLoadingState) {
      return (
        <Button
          ref={ref}
          disabled
          className={cn(
            "opacity-100 disabled:opacity-100 bg-slate-100/40 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-muted-foreground/80 dark:text-muted-foreground/60 cursor-not-allowed",
            className
          )}
          {...props}
        >
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
          {children}
        </Button>
      );
    }

    if (isPendingState) {
      return (
        <Button
          ref={ref}
          disabled
          className={cn(
            "opacity-100 disabled:opacity-100 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 cursor-not-allowed font-semibold",
            className
          )}
          {...props}
        >
          <Clock className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-500" />
          {children}
        </Button>
      );
    }

    if (!isAuthorized) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full cursor-not-allowed">
              <Button
                ref={ref}
                type="button"
                disabled
                className={cn(
                  "pointer-events-none w-full opacity-100 disabled:opacity-100 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold",
                  className
                )}
                {...props}
              >
                <Lock className="mr-2.5 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                {children}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-950 text-white border-none py-1.5 px-3 shadow-md font-sans rounded-md text-xs">
            {authTooltipText}
          </TooltipContent>
        </Tooltip>
      );
    }

    // Enabled & standard disabled state
    return (
      <Button
        ref={ref}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          disabled && "opacity-100 disabled:opacity-100 bg-slate-100/40 dark:bg-slate-900/30 disabled:bg-slate-100/40 dark:disabled:bg-slate-900/30 text-muted-foreground/80 dark:text-muted-foreground/60 border border-slate-200 dark:border-slate-800",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

PermissionButton.displayName = "PermissionButton";

export { PermissionButton };
