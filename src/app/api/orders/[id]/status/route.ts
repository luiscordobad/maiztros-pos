import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabaseAdmin';
import { logAudit } from '@/lib/api/audit';

const allowedStatus = ['pending', 'in_progress', 'ready', 'delivered'];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const status = String(body.status ?? '');
    if (!allowedStatus.includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const timestamps: Record<string, string | null> = {};
    if (status === 'in_progress') timestamps.prepared_at = new Date().toISOString();
    if (status === 'ready') timestamps.ready_at = new Date().toISOString();
    if (status === 'delivered') timestamps.delivered_at = new Date().toISOString();

    const { data: prev, error: prevError } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', params.id)
      .single();

    if (prevError || !prev) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status, ...timestamps })
      .eq('id', params.id);

    if (error) throw new Error(error.message);

    await supabaseAdmin.from('kds_status_history').insert({
      order_id: params.id,
      from_status: prev.status,
      to_status: status,
    });

    await logAudit({ actor: null, action: 'STATUS_CHANGE', entity: 'order', entity_id: params.id, meta: { from: prev.status, to: status } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'No se pudo actualizar el estado' }, { status: 400 });
  }
}
