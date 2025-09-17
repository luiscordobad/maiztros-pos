import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// PATCH /api/orders/:id/status
// Body: { status: 'queued'|'in_kitchen'|'ready'|'delivered' }
export async function PATCH(req: Request, ctx: any) {
  try {
    const { id } = ctx.params as { id: string };
    const { status } = await req.json();
    if (!status) {
      return NextResponse.json({ error: 'status requerido' }, { status: 400 });
    }

    const supa = supabaseAdmin();
    const { error } = await supa
      .from('orders')
      .update({ status })
      .eq('id', id)
      .limit(1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 });
  }
}
