import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export interface ShortenedUrl {
  id: string;
  user_id: string;
  original_url: string;
  short_code: string;
  clicks: number;
  created_at: string;
  updated_at: string;
}
