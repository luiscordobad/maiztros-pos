import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente admin (Service Role) — sólo server
function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/orders
// Body:
// {
//   customer: { name: string, email?: string },
//   service: 'dine_in' | 'pickup' | 'delivery',
//   deliveryZone?: 'zibata' | 'fuera' | null,
//   notes?: string,
//   totals: { subtotal: number, shipping: number, tip: number, total: number }, // en MXN
//   items?: Array<{ slot: string, name: string, price: number }>
// }
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { customer, service, deliveryZone, notes, totals } = body ?? {};
    if (!customer?.name || !service || !totals?.total)
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });

    const toCents = (v: number) => Math.round(Number(v || 0) * 100);

    const supa = supabaseAdmin();
    const { data, error } = await supa
      .from('orders')
      .insert({
        customer_name: customer.name,
        customer_email: customer.email ?? null,
        service,
        delivery_zone: deliveryZone ?? null,
        notes: notes ?? null,
        subtotal_cents: toCents(totals.subtotal),
        shipping_cents: toCents(totals.shipping),
        tip_cents: toCents(totals.tip),
        total_cents: toCents(totals.total),
        payment_status: 'pending',
        status: 'queued', // en cola para KDS
      })
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ id: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 });
  }
}
