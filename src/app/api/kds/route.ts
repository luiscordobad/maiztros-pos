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

    type OrderItemRow = { name: string; qty: number };
    type OrderRow = {
      id: string;
      ticket_no: number | null;
      channel: string;
      status: string;
      created_at: string;
      ready_at: string | null;
      order_items: OrderItemRow[] | null;
    };

    const rows = Array.isArray(data) ? (data as OrderRow[]) : [];
    const orders = rows.map((order) => ({
      id: order.id,
      ticket_no: order.ticket_no,
      channel: order.channel,
      status: order.status,
      created_at: order.created_at,
      ready_at: order.ready_at,
      items: Array.isArray(order.order_items)
        ? order.order_items.map((item) => ({ name: item.name, qty: item.qty }))
        : [],
    }));

    return NextResponse.json({ orders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'No se pudieron cargar las órdenes';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
