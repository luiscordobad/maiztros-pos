import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const paymentId = String(body.data?.id ?? '');
    const status = String(body.type ?? 'payment.updated').includes('success') ? 'approved' : 'failed';

    if (!paymentId) return NextResponse.json({});

    const { data } = await supabaseAdmin
      .from('payments')
      .update({ status })
      .eq('ext_ref', paymentId)
      .select('order_id')
      .maybeSingle();

    if (data?.order_id && status === 'approved') {
      await supabaseAdmin
        .from('orders')
        .update({ payment_method: 'mp', status: 'ready', ready_at: new Date().toISOString() })
        .eq('id', data.order_id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'webhook error' }, { status: 400 });
  }
}
