import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey && typeof window === 'undefined') {
  console.warn(
    'SUPABASE_SERVICE_ROLE_KEY is not defined in server environment. ' +
    'Server-side administrative database actions may fall back to standard anon key.'
  );
}

/**
 * Server-only Supabase client with elevated administrative access.
 * NEVER import or invoke this file from client-side components!
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
