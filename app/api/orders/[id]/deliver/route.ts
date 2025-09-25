import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error('Supabase admin credentials are not configured.');
  }
  return createClient(url, serviceRole);
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = {
  params?: {
    id?: string;
  };
};

export async function POST(_req: NextRequest, context: RouteContext) {
  try {
    const id = context.params?.id;
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'id inválido' }, { status: 400 });
    }

    const supa = supabaseAdmin();
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
