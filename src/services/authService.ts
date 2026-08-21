import { supabase } from '@/lib/supabase';
import type { UserProfileData, UserRole } from '@/types';

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  wallet_balance: number;
  loyalty_points: number;
  is_verified: boolean;
  member_since: string;
}

export const authService = {
  /**
   * Get the currently logged-in user and their database profile
   */
  async getCurrentUser(): Promise<{ user: any; profile: Profile | null } | null> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return { user, profile: null };
    }

    return { user, profile };
  },

  /**
   * Update the user profile info
   */
  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Trigger password reset
   */
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) throw new Error(error.message);
  },

  /**
   * Perform Google login redirect
   */
  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw new Error(error.message);
  },

  /**
   * Perform phone OTP request
   */
  async sendPhoneOTP(phone: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });
    if (error) throw new Error(error.message);
  },

  /**
   * Verify phone OTP
   */
  async verifyPhoneOTP(phone: string, token: string): Promise<void> {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    if (error) throw new Error(error.message);
  }
};
