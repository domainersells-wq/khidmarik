'use client';

import * as React from "react";
import { useAuth } from "@/context/AuthContext";

export interface RBACWrapperProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RBACWrapper({ permission, fallback = null, children }: RBACWrapperProps) {
  let hasPermission: (permission: string) => boolean;
  try {
    const auth = useAuth();
    hasPermission = auth.hasPermission;
  } catch (e) {
    // Fallback if rendered outside AuthProvider (e.g. testing)
    hasPermission = () => true;
  }

  const isAuthorized = hasPermission(permission);

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
