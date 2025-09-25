import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  const supa = createClient();
  const payload = await req.json().catch(() => ({}));
  const type = payload?.type || payload?.action;

  if (type === 'payment' && payload?.data?.id) {
    const paymentId = payload.data.id;
    const pRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN!}` },
    });
    if (!pRes.ok) return NextResponse.json({ ok: true });
    const p = await pRes.json();

    let order_id: string | null = p?.metadata?.order_id ?? null;
    if (!order_id) {
      const prefId = p?.order?.id;
      if (prefId) {
        const { data: sess } = await supa
          .from('payment_sessions')
          .select('order_id')
          .eq('preference_id', prefId)
          .maybeSingle();
        order_id = sess?.order_id ?? null;
      }
    }

    if (order_id) {
      const status = p.status;
      await supa.from('payment_sessions').update({ status }).eq('order_id', order_id);
      if (status === 'approved') {
        await supa.from('payments').insert({
          order_id,
          provider: 'mp',
          amount: p.transaction_amount,
          status: 'approved',
          ext_ref: String(paymentId),
        });
        await supa
          .from('orders')
          .update({ paid_at: new Date().toISOString() })
          .eq('id', order_id);
      }
    }
  }
  return NextResponse.json({ ok: true });
}
