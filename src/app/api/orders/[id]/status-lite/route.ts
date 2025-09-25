import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { OrderStatus } from '@/types/order';
import type { Database } from '@/types/supabase';

type SupabaseAdminClient = SupabaseClient<Database>;

type OrderStatusLiteRow = {
  status: OrderStatus;
  paid_at: string | null;
};

function supabaseAdmin(): SupabaseAdminClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error('Supabase admin credentials are not configured.');
  }
  return createClient<Database>(url, serviceRole, {
    auth: { persistSession: false },
  });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type MaybePromise<T> = T | Promise<T>;

type RouteParams = { id: string };

type RouteContext = {
  params: MaybePromise<RouteParams>;
};

const isPromise = <T>(value: MaybePromise<T>): value is Promise<T> =>
  typeof (value as PromiseLike<T>).then === 'function';

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const params = isPromise(context.params)
      ? await context.params
      : context.params;
    const id = params?.id;
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'id inválido' }, { status: 400 });
    }

    const supa = supabaseAdmin();
    const { data, error } = await supa
      .from('orders')
      .select('status, paid_at')
      .eq('id', id)
      .maybeSingle<OrderStatusLiteRow>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ status: data.status, paid_at: data.paid_at });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
