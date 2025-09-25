import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabaseAdmin';
import { logAudit } from '@/lib/api/audit';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_: Request, context: RouteParams) {
  try {
    const params = (await context.params) ?? {};
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) throw new Error(error.message);

    await logAudit({ actor: null, action: 'STATUS_CHANGE', entity: 'order', entity_id: orderId, meta: { status: 'delivered' } });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
