import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabaseAdmin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('id, ticket_no, channel, status, created_at, ready_at, order_items(name, qty)')
      .neq('status', 'canceled')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);

    const orders = (data ?? []).map((order: any) => ({
      id: order.id,
      ticket_no: order.ticket_no,
      channel: order.channel,
      status: order.status,
      created_at: order.created_at,
      ready_at: order.ready_at,
      items: (order.order_items ?? []).map((item: any) => ({ name: item.name, qty: item.qty })),
    }));

    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'No se pudieron cargar las órdenes' }, { status: 400 });
  }
}
