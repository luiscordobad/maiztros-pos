import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { getErrorMessage } from '@/lib/utils';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/orders/kds -> órdenes de HOY con status != delivered (ordenadas por hora)
export async function GET() {
  try {
    const supa = supabaseAdmin();

    // Si tu columna de fecha es created_at (timestamp with time zone):
    // Trae las de "hoy" en tu zona. Para simpleza, traemos últimas 200 y filtramos por status.
    const { data, error } = await supa
      .from('orders')
      .select('*')
      .neq('status', 'delivered')
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ orders: data });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, 'error') }, { status: 500 });
  }
}
