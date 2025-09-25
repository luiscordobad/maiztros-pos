import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabaseAdmin';

type MpPaymentPayload = {
  orderId?: unknown;
  amount?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MpPaymentPayload;
    const orderId = typeof body.orderId === 'string' ? body.orderId : '';
    const amount = Number(body.amount ?? 0);
    if (!orderId) return NextResponse.json({ error: 'Pedido requerido' }, { status: 400 });
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('payments').insert({
      order_id: orderId,
      provider: 'mp',
      amount,
      status: 'pending',
      ext_ref: orderId,
    });
    if (error) throw new Error(error.message);

    const mockQr = `https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=${orderId}`;

    return NextResponse.json({ qr_url: mockQr });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'No se pudo crear la preferencia';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
