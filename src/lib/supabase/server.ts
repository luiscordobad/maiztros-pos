import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Next 15: cookies() es async → usa await
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Implementa get/set/remove para evitar warnings en runtime
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // no-op en build; si necesitas setear cookies en runtime, implementa aquí
        },
        remove() {
          // no-op
        },
      },
    }
  );
}
