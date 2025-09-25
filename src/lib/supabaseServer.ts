import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase public credentials are missing');
}

const mapOptions = (name: string, value: string, options: CookieOptions = {}) => ({
  name,
  value,
  ...options,
});

export const createSupabaseServerClient = () => {
  const store = cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        store.set(mapOptions(name, value, options));
      },
      remove(name: string, options?: CookieOptions) {
        store.set(mapOptions(name, '', { ...options, maxAge: 0 }));
      },
    },
  });
};

export const supabaseServer = createSupabaseServerClient;

export type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>;

export default createSupabaseServerClient;
