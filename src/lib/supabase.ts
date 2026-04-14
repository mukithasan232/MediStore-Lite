import { createClient } from '@/utils/supabase/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validation check without throwing immediately
export const isSupabaseConfigured = 
  !!(supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your_project') && 
  !supabaseUrl.includes('[YOUR_') && 
  !supabaseAnonKey.includes('your_anon_key') && 
  !supabaseAnonKey.includes('[YOUR_'));

// Export a single instance for client-side usage to avoid breakage in existing components
export const supabase = createClient();