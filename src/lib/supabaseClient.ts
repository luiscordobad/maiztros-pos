import { cookies } from 'next/headers';
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials are not configured.');
}

export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {
        // No-op en SSR; Next maneja la serialización en server actions o route handlers
      },
      remove() {
        // No-op
      },
    },
  });
};

export const createBrowserSupabaseClient = () => createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
