import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabaseAdmin';

type WebhookPayload = {
  type?: unknown;
  data?: {
    id?: unknown;
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WebhookPayload;
    const paymentId = typeof body.data?.id === 'string' ? body.data.id : '';
    const type = typeof body.type === 'string' ? body.type : 'payment.updated';
    const status = type.includes('success') ? 'approved' : 'failed';

    if (!paymentId) return NextResponse.json({});

    const { data, error } = await supabaseAdmin
      .from('payments')
      .update({ status })
      .eq('ext_ref', paymentId)
      .select('order_id')
      .maybeSingle<{ order_id: string }>();

    if (error) throw new Error(error.message);

    if (data?.order_id && status === 'approved') {
      const { error: orderUpdateError } = await supabaseAdmin
        .from('orders')
        .update({ payment_method: 'mp', status: 'ready', ready_at: new Date().toISOString() })
        .eq('id', data.order_id);
      if (orderUpdateError) throw new Error(orderUpdateError.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('mp webhook', error);
    return NextResponse.json({ error: 'webhook error' }, { status: 400 });
  }
}
