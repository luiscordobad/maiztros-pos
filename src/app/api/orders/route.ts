import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabaseAdmin';
import { logAudit } from '@/lib/api/audit';
import type { Database, Json } from '@/types/supabase';

type OrderChannel = Database['public']['Enums']['order_channel'];

interface OrderItemPayload {
  sku: string;
  name: string;
  qty: number;
  unit_price: number;
  modifiers?: unknown[];
}

interface OrderPayload {
  channel: OrderChannel;
  customer?: {
    phone?: string;
    name?: string;
  };
  notes?: string;
  items: OrderItemPayload[];
  subtotal: number;
  discount: number;
  total: number;
}

const allowedChannels: OrderChannel[] = ['counter', 'whatsapp', 'rappi', 'other'];

type OrderItemInsert = Omit<Database['public']['Tables']['order_items']['Insert'], 'order_id'>;

const toJson = (value: unknown): Json => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => toJson(entry));
  }
  if (typeof value === 'object') {
    const result: Record<string, Json | undefined> = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = toJson(entry);
    }
    return result;
  }
  throw new Error('Modificadores inválidos');
};

const parseItems = (items: OrderItemPayload[]): OrderItemInsert[] => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Debes agregar artículos al pedido');
  }
  return items.map((item) => {
    if (!item.sku || !item.name) throw new Error('Artículo inválido');
    const qty = Number(item.qty ?? 1);
    if (!Number.isFinite(qty) || qty <= 0) throw new Error('Cantidad inválida');
    const price = Number(item.unit_price ?? 0);
    if (!Number.isFinite(price) || price < 0) throw new Error('Precio inválido');
    return {
      sku: item.sku,
      name: item.name,
      qty,
      unit_price: price,
      modifiers: toJson(item.modifiers ?? []),
    };
  });
};

async function upsertCustomer(customer?: OrderPayload['customer']) {
  if (!customer?.phone) return customer?.name ? { id: null, name: customer.name } : null;
  const { data, error } = await supabaseAdmin
    .from('customers')
    .upsert({ phone: customer.phone, name: customer.name ?? null }, { onConflict: 'phone', ignoreDuplicates: false })
    .select('id, name')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function POST(request: Request) {
  try {
    const idempotencyKey = request.headers.get('idempotency-key');
    const body = (await request.json()) as OrderPayload;
    if (!allowedChannels.includes(body.channel)) {
      return NextResponse.json({ error: 'Canal inválido' }, { status: 400 });
    }
    const items = parseItems(body.items);

    if (typeof body.subtotal !== 'number' || typeof body.total !== 'number') {
      return NextResponse.json({ error: 'Totales inválidos' }, { status: 400 });
    }

    if (idempotencyKey) {
      const existing = await supabaseAdmin.from('orders').select('id').eq('idempotency_key', idempotencyKey).maybeSingle();
      if (existing.data) {
        return NextResponse.json({ id: existing.data.id, duplicated: true });
      }
    }

    const customer = await upsertCustomer(body.customer);

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .insert({
        idempotency_key: idempotencyKey,
        channel: body.channel,
        customer_id: customer?.id ?? null,
        subtotal: body.subtotal,
        discount: body.discount,
        total: body.total,
        status: 'pending',
        notes: body.notes ?? null,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const orderId = order.id;

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(items.map((item) => ({ ...item, order_id: orderId })));

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    if (customer?.id) {
      const points = Math.floor(body.total / 50);
      if (points > 0) {
        await supabaseAdmin.from('loyalty_points').insert({
          customer_id: customer.id,
          points,
          reason: 'ORDER',
          order_id: orderId,
        });
      }
    }

    await logAudit({ actor: null, action: 'CREATE_ORDER', entity: 'order', entity_id: orderId, meta: { channel: body.channel } });

    return NextResponse.json({ id: orderId });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
