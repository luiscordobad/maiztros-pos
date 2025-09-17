import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/orders/:id  -> devuelve la orden (para tracking)
export async function GET(_req: Request, ctx: any) {
  try {
    const { id } = ctx.params as { id: string };
    const supa = supabaseAdmin();
    const { data, error } = await supa
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ order: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 });
  }
}
