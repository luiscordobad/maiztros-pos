import { NextRequest, NextResponse } from 'next/server';

import type { OrderStatus } from '@/types/order';

import { createClient } from '@/lib/supabaseServer';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_STATUS: ReadonlyArray<OrderStatus> = ['queued', 'in_kitchen', 'ready', 'delivered'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    const { id } = await params;
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

    const supa = createClient();
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 });
  }
}
