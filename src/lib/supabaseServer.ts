import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseConfig } from './supabaseConfig';
import { mexicoCityNowISO } from './timeMx';

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const { url, anonKey } = getSupabaseConfig();

  return createServerClient(url, anonKey, {
    cookies: {
      async get(name: string) {
        return (await cookies()).get(name)?.value;
      },
      async set() {
        // noop for RSC/edge usage. Implement when mutating auth state serverside.
      },
      async remove() {
        // noop
      },
    },
  });
}

export function createSupabaseServiceRoleClient(): SupabaseClient {
  const { url, serviceRoleKey } = getSupabaseConfig();
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(url, serviceRoleKey, {
    global: {
      headers: {
        'x-mx-timestamp': mexicoCityNowISO(),
      },
    },
  });
}
