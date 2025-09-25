import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import type { OrderStatus } from '@/types/order';

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error('Supabase admin credentials are not configured.');
  }
  return createClient(url, serviceRole);
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_STATUS: ReadonlyArray<OrderStatus> = ['queued', 'in_kitchen', 'ready', 'delivered'];

type RouteContext = {
  params?: {
    id?: string;
  };
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const id = context.params?.id;
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'id inválido' }, { status: 400 });
    }

    const body = await req.json().catch(() => null) as { status?: string } | null;
    const status = body?.status as OrderStatus | undefined;
    if (!status || !ALLOWED_STATUS.includes(status)) {
      return NextResponse.json({ error: 'status inválido' }, { status: 400 });
    }

    const requiredApiKey = process.env.ORDER_STATUS_API_KEY;
    if (requiredApiKey && req.headers.get('x-api-key') !== requiredApiKey) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supa = supabaseAdmin();
    const { error } = await supa
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('id')
      .single();

    if (error) {
      const statusCode = error.code === 'PGRST116' || /Results contain 0 rows/i.test(error.message)
        ? 404
        : 500;
      return NextResponse.json({ error: error.message }, { status: statusCode });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
