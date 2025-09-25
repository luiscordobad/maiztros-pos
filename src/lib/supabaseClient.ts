'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseConfig } from './supabaseConfig';

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const { url, anonKey } = getSupabaseConfig();
  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}

export const supabaseBrowserClient = getSupabaseBrowserClient();
