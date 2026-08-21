'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export type UserRole = 
  | 'super_admin'
  | 'store_owner'
  | 'service_provider'
  | 'seller'
  | 'supplier'
  | 'employee'
  | 'accountant'
  | 'branch_manager'
  | 'support_agent'
  | 'delivery_rider'
  | 'marketing_manager'
  | 'franchisee'
  | 'customer'; // Added customer

export interface UserSession {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  isStoreOwner?: boolean;
  storeId?: string;
  isFreelancer?: boolean;
  memberSince?: string;
  walletBalance?: number;
}

interface AuthContextType {
  user: UserSession | null;
  role: UserRole | null;
  permissions: string[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const RolePermissions: Record<UserRole, string[]> = {
  super_admin: ['manage_all'],
  store_owner: [
    'view_store_dashboard',
    'create_order', 'edit_order', 'delete_order',
    'manage_products', 'manage_inventory',
    'manage_settings', 'view_store_reports'
  ],
  service_provider: [
    'view_services_dashboard',
    'manage_appointments', 'manage_services',
    'manage_settings'
  ],
  seller: [
    'view_store_dashboard',
    'create_order', 'edit_order',
    'manage_products'
  ],
  supplier: [
    'view_store_dashboard',
    'manage_inventory'
  ],
  employee: [
    'view_store_dashboard'
  ],
  accountant: [
    'view_store_dashboard',
    'manage_reports'
  ],
  branch_manager: [
    'view_store_dashboard',
    'manage_products', 'manage_inventory', 'manage_settings'
  ],
  support_agent: [
    'view_store_dashboard',
    'view_services_dashboard'
  ],
  delivery_rider: [
    'view_store_dashboard'
  ],
  marketing_manager: [
    'view_store_dashboard',
    'manage_reports'
  ],
  franchisee: [
    'view_store_dashboard',
    'manage_settings'
  ],
  customer: [
    'create_order'
  ]
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  // Helper to load profile from DB
  const loadProfile = async (uid: string, email: string): Promise<UserSession | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (error) {
        console.error('Error loading user profile:', error.message);
        return null;
      }

      if (!profile) {
        // Fallback: create standard profile if DB trigger did not fire
        const fallbackRole = (email === 'admin@khidmatik.dz' || email === 'domainersells@gmail.com') ? 'super_admin' : 'customer';
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
          return {
            id: newProfile.id,
            name: newProfile.name,
            email: newProfile.email,
            avatarUrl: newProfile.avatar_url || '',
            role: newProfile.role as UserRole,
            memberSince: newProfile.member_since,
            walletBalance: parseFloat(newProfile.wallet_balance || 0),
          };
        }
        return null;
      }

      // Check if user has a store
      let storeId: string | undefined;
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', uid)
        .maybeSingle();
      if (store) storeId = store.id;

      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`,
        role: profile.role as UserRole,
        isStoreOwner: profile.role === 'store_owner',
        storeId,
        isFreelancer: profile.role === 'service_provider',
        memberSince: profile.member_since,
        walletBalance: parseFloat(profile.wallet_balance || 0)
      };
    } catch (e) {
      console.error('Failed profile fetch exception:', e);
      return null;
    }
  };

  // Subscribe to Auth State Changes
  useEffect(() => {
    let authListener: any;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await loadProfile(session.user.id, session.user.email || '');
        setUser(profile);
      } else {
        setUser(null);
      }
      setIsLoading(false);

      // Set up onAuthStateChange callback
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          setIsLoading(true);
          if (currentSession?.user) {
            const profile = await loadProfile(currentSession.user.id, currentSession.user.email || '');
            setUser(profile);
          } else {
            setUser(null);
          }
          setIsLoading(false);
        }
      );
      authListener = subscription;
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
        if (profile.role === 'super_admin') {
          router.push('/admin/dashboard');
        } else if (profile.role === 'store_owner') {
          router.push('/dashboard/store');
        } else if (profile.role === 'service_provider') {
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

  const permissions = user ? RolePermissions[user.role] || [] : [];

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin' || permissions.includes('manage_all')) return true;
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role || null, permissions, isLoading, login, signUp, logout, hasPermission }}>
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
