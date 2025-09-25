import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  const { order_id } = await req.json();
  const supa = createClient();

  const { data: order, error: e1 } = await supa
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .maybeSingle();

  if (e1 || !order) {
    return NextResponse.json({ ok: false, error: 'ORDER_NOT_FOUND' }, { status: 404 });
  }

  const { data: items, error: e2 } = await supa
    .from('order_items')
    .select('*')
    .eq('order_id', order_id);

  if (e2) {
    return NextResponse.json({ ok: false, error: 'ITEMS_NOT_FOUND' }, { status: 400 });
  }

  const mpItems = items.map((it: any) => ({
    title: it.name,
    quantity: it.qty,
    currency_id: 'MXN',
    unit_price: Number(it.unit_price),
  }));

  const body = {
    items: mpItems.length
      ? mpItems
      : [
          {
            title: `Orden Maiztros ${order.ticket_no || ''}`,
            quantity: 1,
            currency_id: 'MXN',
            unit_price: Number(order.total),
          },
        ],
    statement_descriptor: 'MAIZTROS',
    back_urls: {
      success: `${process.env.NEXT_PUBLIC_BASE_URL}/kiosk/success?order=${order_id}`,
      failure: `${process.env.NEXT_PUBLIC_BASE_URL}/kiosk/failure?order=${order_id}`,
      pending: `${process.env.NEXT_PUBLIC_BASE_URL}/kiosk/pending?order=${order_id}`,
    },
    auto_return: 'approved',
    notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/mp/webhook`,
    metadata: { order_id },
  };

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    return NextResponse.json({ ok: false, error: 'MP_PREF_ERR', details: t }, { status: 400 });
  }

  const pref = await res.json();
  await supa.from('payment_sessions').insert({
    order_id,
    provider: 'mp',
    preference_id: pref.id,
    init_point: pref.init_point,
    status: 'pending',
  });

  return NextResponse.json({ ok: true, preference_id: pref.id, init_point: pref.init_point });
}
