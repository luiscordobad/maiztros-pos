export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

let cachedConfig: SupabaseConfig | null = null;

export function getSupabaseConfig(): SupabaseConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  cachedConfig = { url, anonKey, serviceRoleKey };
  return cachedConfig;
}
