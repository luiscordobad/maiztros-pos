import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MP_API = 'https://api.mercadopago.com';

// Supabase admin (service role) solo en servidor
function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// MP manda distinto formato según configuración: topic/type + id / data.id.
// Soportamos ambos.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const topic = searchParams.get('topic') || searchParams.get('type'); // payment
  const id = searchParams.get('id') || searchParams.get('data.id');

  if (!secret || secret !== process.env.MP_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  if (!topic || !id) {
    return NextResponse.json({ ok: false, error: 'missing params' }, { status: 400 });
  }

  try {
    if (topic !== 'payment') {
      // Ignora otros tópicos
      return NextResponse.json({ ok: true });
    }

    // Consulta el pago
    const payRes = await fetch(`${MP_API}/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    if (!payRes.ok) {
      const t = await payRes.text();
      return NextResponse.json({ ok: false, error: t }, { status: 502 });
    }
    const payment = await payRes.json();

    // Solo si está aprobado
    if (payment.status === 'approved') {
      const externalRef = payment.external_reference as string | null; // aquí viene tu orderId
      if (externalRef) {
        const supa = supabaseAdmin();
        // Marca la orden como pagada
        const { error } = await supa
          .from('orders')
          .update({ payment_status: 'paid' })
          .eq('id', externalRef)         // <- tu orderId debe ser el id UUID de orders
          .limit(1);

        if (error) {
          // Loguea el error pero responde 200 para que MP no reintente infinito
          console.error('Supabase update error:', error);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('MP webhook error:', error);
    // Aun así responde 200 para evitar tormenta de reintentos si es un bug temporal
    return NextResponse.json({ ok: true });
  }
}
