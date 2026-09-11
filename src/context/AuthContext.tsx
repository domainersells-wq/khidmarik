'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { AppRole, AppPermission, UserRole, normalizeRole, ROLE_PERMISSIONS_MAP } from '@/types/rbac';
import { hasPermission as rbacHasPermission, hasRole as rbacHasRole, hasAnyPermission as rbacHasAnyPermission, hasAnyRole as rbacHasAnyRole, hasAllPermissions as rbacHasAllPermissions, getPermissionsForRoles } from '@/lib/auth/rbac';

export type { UserRole, AppRole, AppPermission };

export interface UserSession {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  roles?: AppRole[];
  isStoreOwner?: boolean;
  storeId?: string;
  isFreelancer?: boolean;
  memberSince?: string;
  walletBalance?: number;
}

interface AuthContextType {
  user: UserSession | null;
  role: UserRole | null;
  roles: AppRole[];
  permissions: AppPermission[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: AppPermission | string) => boolean;
  hasAnyPermission: (permissions: (AppPermission | string)[]) => boolean;
  hasAllPermissions: (permissions: (AppPermission | string)[]) => boolean;
  hasRole: (role: AppRole | string) => boolean;
  hasAnyRole: (roles: (AppRole | string)[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  // Helper to load profile and roles from DB
  const loadProfile = async (uid: string, email: string): Promise<UserSession | null> => {
    const userEmail = email.toLowerCase().trim();
    const isAdminEmail = (
      userEmail === 'admin@khidmatik.dz' || 
      userEmail === 'domainersells@gmail.com' ||
      (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ADMIN_EMAILS && process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()).includes(userEmail))
    );
    const fallbackRole = isAdminEmail ? 'super_admin' : 'customer';
    const norm = normalizeRole(fallbackRole);
    const defaultFallbackSession: UserSession = {
      id: uid,
      name: email ? email.split('@')[0] : 'User',
      email: email || '',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${email || uid}`,
      role: fallbackRole as UserRole,
      roles: [norm],
      memberSince: new Date().toISOString(),
      walletBalance: 0,
    };

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (error) {
        console.warn('Could not load profile from database (offline/network):', error.message);
        return defaultFallbackSession;
      }

      if (!profile) {
        try {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: uid,
              name: email.split('@')[0],
              email: email,
              role: fallbackRole,
              avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`
            })
            .select()
            .single();

          if (newProfile) {
            const newNorm = normalizeRole(newProfile.role);
            return {
              id: newProfile.id,
              name: newProfile.name,
              email: newProfile.email,
              avatarUrl: newProfile.avatar_url || '',
              role: newProfile.role as UserRole,
              roles: [newNorm],
              memberSince: newProfile.member_since,
              walletBalance: parseFloat(newProfile.wallet_balance || 0),
            };
          }
        } catch {
          // Fallback to local session if DB insert fails
        }
        return defaultFallbackSession;
      }

      // Check if user has a store
      let storeId: string | undefined;
      try {
        const { data: store } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', uid)
          .maybeSingle();
        if (store) storeId = store.id;
      } catch {
        // Optional store lookup
      }

      // Extract user roles
      const userEmail = (email || '').toLowerCase().trim();
      const isAdminEmail = (
        userEmail === 'admin@khidmatik.dz' || 
        userEmail === 'domainersells@gmail.com' ||
        (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ADMIN_EMAILS && process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()).includes(userEmail))
      );
      const isDbSuper = profile.role === 'super_admin' || profile.role === 'SUPER_ADMIN';
      const effectiveRole = (isAdminEmail || isDbSuper) ? 'super_admin' : profile.role;
      const primaryNorm = normalizeRole(effectiveRole);
      const userRoles: AppRole[] = [primaryNorm];
      if ((isAdminEmail || isDbSuper) && !userRoles.includes('SUPER_ADMIN')) {
        userRoles.push('SUPER_ADMIN');
      }

      // Query multi-roles table if present
      try {
        const { data: multiRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', uid);

        if (multiRoles && Array.isArray(multiRoles)) {
          for (const mr of multiRoles) {
            const rNorm = normalizeRole(mr.role);
            if (!userRoles.includes(rNorm)) {
              userRoles.push(rNorm);
            }
          }
        }
      } catch {
        // user_roles table optional fallback
      }

      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`,
        role: profile.role as UserRole,
        roles: userRoles,
        isStoreOwner: profile.role === 'store_owner' || userRoles.includes('STORE_OWNER'),
        storeId,
        isFreelancer: profile.role === 'service_provider' || userRoles.includes('SERVICE_PROVIDER'),
        memberSince: profile.member_since,
        walletBalance: parseFloat(profile.wallet_balance || 0)
      };
    } catch (e: any) {
      console.warn('Network exception while loading user profile, using fallback session:', e?.message || e);
      return defaultFallbackSession;
    }
  };

  // Subscribe to Auth State Changes
  useEffect(() => {
    let authListener: any;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await loadProfile(session.user.id, session.user.email || '');
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('Could not initialize Supabase session:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }

      // Set up onAuthStateChange callback
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            setIsLoading(true);
            try {
              if (currentSession?.user) {
                const profile = await loadProfile(currentSession.user.id, currentSession.user.email || '');
                setUser(profile);
              } else {
                setUser(null);
              }
            } catch {
              setUser(null);
            } finally {
              setIsLoading(false);
            }
          }
        );
        authListener = subscription;
      } catch (err) {
        console.warn('Could not subscribe to Supabase auth state:', err);
      }
    };

    initAuth();

    return () => {
      if (authListener) authListener.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });

    if (error) {
      setIsLoading(false);
      toast({
        title: 'Authentication Failed',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }

    if (data.user) {
      const profile = await loadProfile(data.user.id, data.user.email || '');
      if (profile) {
        setUser(profile);
        toast({
          title: 'Authentication Successful',
          description: `Welcome back, ${profile.name}!`,
        });

        // Role-based routing
        const isSuper = profile.roles?.includes('SUPER_ADMIN') || profile.role === 'super_admin';
        const isStore = profile.roles?.includes('STORE_OWNER') || profile.role === 'store_owner';
        const isProvider = profile.roles?.includes('SERVICE_PROVIDER') || profile.role === 'service_provider';

        if (isSuper) {
          router.push('/admin/dashboard');
        } else if (isStore) {
          router.push('/dashboard/store');
        } else if (isProvider) {
          router.push('/dashboard/professional-services');
        } else {
          router.push('/');
        }
        setIsLoading(false);
        return true;
      }
    }

    setIsLoading(false);
    return false;
  };

  const signUp = async (email: string, pass: string, name?: string): Promise<boolean> => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: {
          name: name || email.split('@')[0],
        }
      }
    });

    if (error) {
      setIsLoading(false);
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }

    if (data.user) {
      if (data.session) {
        const profile = await loadProfile(data.user.id, data.user.email || '');
        if (profile) {
          setUser(profile);
        }
        toast({
          title: 'Registration Successful',
          description: 'Your account has been created successfully!',
        });
        router.push('/');
      } else {
        toast({
          title: 'Verification Email Sent',
          description: 'Please check your email to confirm your account.',
        });
      }
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsLoading(false);
    toast({
      title: 'Session Terminated',
      description: 'You have been logged out of your account.',
    });
    router.push('/');
  };

  const roles = useMemo<AppRole[]>(() => {
    if (!user) return [];
    if (user.roles && user.roles.length > 0) return user.roles;
    return [normalizeRole(user.role)];
  }, [user]);

  const permissions = useMemo<AppPermission[]>(() => {
    if (!user) return [];
    return getPermissionsForRoles(roles);
  }, [user, roles]);

  const hasPermission = (permission: AppPermission | string): boolean => {
    return rbacHasPermission(user, permission as AppPermission);
  };

  const hasAnyPermission = (perms: (AppPermission | string)[]): boolean => {
    return rbacHasAnyPermission(user, perms as AppPermission[]);
  };

  const hasAllPermissions = (perms: (AppPermission | string)[]): boolean => {
    return rbacHasAllPermissions(user, perms as AppPermission[]);
  };

  const hasRole = (role: AppRole | string): boolean => {
    return rbacHasRole(user, role);
  };

  const hasAnyRole = (checkRoles: (AppRole | string)[]): boolean => {
    return rbacHasAnyRole(user, checkRoles);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role || null,
      roles,
      permissions,
      isLoading,
      login,
      signUp,
      logout,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      hasAnyRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
