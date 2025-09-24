// Crea una "preferencia" de Mercado Pago y devuelve el link (init_point)
// POST body: { orderId: string, title?: string, totalMXN: number, payer?: { name?: string, email?: string } }

import { NextResponse } from 'next/server';

const MP_API = 'https://api.mercadopago.com';

export async function POST(req: Request) {
  try {
    const { orderId, title = 'Pedido Maiztros', totalMXN, payer } = await req.json();

    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Falta MP_ACCESS_TOKEN' }, { status: 500 });
    }
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      return NextResponse.json({ error: 'Falta NEXT_PUBLIC_BASE_URL' }, { status: 500 });
    }

    const notification_url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/mp/webhook?secret=${encodeURIComponent(process.env.MP_WEBHOOK_SECRET!)}`
    const back_urls = {
      success: `${process.env.NEXT_PUBLIC_BASE_URL}/order/return?status=success&orderId=${orderId}`,
      pending: `${process.env.NEXT_PUBLIC_BASE_URL}/order/return?status=pending&orderId=${orderId}`,
      failure: `${process.env.NEXT_PUBLIC_BASE_URL}/order/return?status=failure&orderId=${orderId}`,
    };

    const prefBody = {
      items: [
        {
          title,
          quantity: 1,
          currency_id: 'MXN',
          unit_price: Number(totalMXN),
        },
      ],
      payer: payer ? {
        name: payer.name,
        email: payer.email,
      } : undefined,
      external_reference: orderId,           // <- para identificar tu orden luego
      back_urls,
      auto_return: 'approved',               // si aprueba regresa a success
      notification_url,                      // <- webhook
      statement_descriptor: 'MAIZTROS',
    };

    const res = await fetch(`${MP_API}/checkout/preferences`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prefBody),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: 500 });
    }

    const data = await res.json();

    // Links posibles: init_point (prod) y sandbox_init_point (sandbox)
    const url = data.init_point || data.sandbox_init_point;
    return NextResponse.json({ preferenceId: data.id, url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
