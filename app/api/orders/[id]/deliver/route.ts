import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabaseServer';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'id inválido' }, { status: 400 });
    }

    const supa = createClient();
    const { data: order, error } = await supa
      .from('orders')
      .select('id,paid_at,service,payment_method')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const isPaid = Boolean(order.paid_at);
    const canCashOut = order.payment_method === 'cod' && order.service === 'dine_in';

    if (!isPaid && !canCashOut) {
      return NextResponse.json({ error: 'Pago requerido antes de entregar' }, { status: 400 });
    }

    const { error: updateError } = await supa
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 });
  }
}
