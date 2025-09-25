import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabaseAdmin';
import { logAudit } from '@/lib/api/audit';

const allowedStatus = ['pending', 'in_progress', 'ready', 'delivered'] as const;
type OrderStatus = (typeof allowedStatus)[number];

const isOrderStatus = (value: unknown): value is OrderStatus =>
  typeof value === 'string' && allowedStatus.includes(value as OrderStatus);

type UpdateStatusPayload = {
  status?: unknown;
};

type RouteParams = {
  params?: { id: string } | Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteParams) {
  try {
    const rawParams = context?.params;
    const resolvedParams = rawParams instanceof Promise ? await rawParams : rawParams;
    const orderId = resolvedParams?.id;
    if (!orderId) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const body = (await request.json()) as UpdateStatusPayload;
    if (!isOrderStatus(body.status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const status = body.status;

    const timestamps: Record<string, string | null> = {};
    if (status === 'in_progress') timestamps.prepared_at = new Date().toISOString();
    if (status === 'ready') timestamps.ready_at = new Date().toISOString();
    if (status === 'delivered') timestamps.delivered_at = new Date().toISOString();

    const { data: prev, error: prevError } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single<{ status: OrderStatus }>();

    if (prevError || !prev) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status, ...timestamps })
      .eq('id', orderId);

    if (error) throw new Error(error.message);

    await supabaseAdmin.from('kds_status_history').insert({
      order_id: orderId,
      from_status: prev.status,
      to_status: status,
    });

    await logAudit({ actor: null, action: 'STATUS_CHANGE', entity: 'order', entity_id: orderId, meta: { from: prev.status, to: status } });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar el estado';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
