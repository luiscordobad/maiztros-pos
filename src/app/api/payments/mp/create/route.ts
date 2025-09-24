import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = String(body.orderId ?? '');
    const amount = Number(body.amount ?? 0);
    if (!orderId) return NextResponse.json({ error: 'Pedido requerido' }, { status: 400 });

    await supabaseAdmin.from('payments').insert({
      order_id: orderId,
      provider: 'mp',
      amount,
      status: 'pending',
      ext_ref: orderId,
    });

    const mockQr = `https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=${orderId}`;

    return NextResponse.json({ qr_url: mockQr });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'No se pudo crear la preferencia' }, { status: 400 });
  }
}
