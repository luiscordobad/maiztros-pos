import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabaseAdmin';
import { logAudit } from '@/lib/api/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = String(body.orderId ?? '');
    const amount = Number(body.amount ?? 0);
    const provider = String(body.provider ?? 'cash');
    const cashReceived = Number(body.cashReceived ?? 0);

    if (!orderId) {
      return NextResponse.json({ error: 'Pedido requerido' }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('payments').insert({
      order_id: orderId,
      provider,
      amount,
      status: 'approved',
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from('orders')
      .update({ payment_method: provider, status: 'ready', ready_at: new Date().toISOString() })
      .eq('id', orderId);

    await logAudit({ actor: null, action: 'PAYMENT_CAPTURED', entity: 'payment', entity_id: orderId, meta: { provider, amount, cashReceived } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'No se pudo registrar el pago' }, { status: 400 });
  }
}
