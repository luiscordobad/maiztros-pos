import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Money, OrderItem, OrderPayload, Totals } from '@/types/order';
import type {
  AuditResponsePayload,
  Database,
} from '@/types/supabase';

type AuditLogRow = Database['public']['Tables']['audit_logs']['Row'];

type MaybeSingle<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

type SupabaseAdminClient = SupabaseClient<Database>;

function supabaseAdmin(): SupabaseAdminClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error('Supabase admin credentials are not configured.');
  }
  return createClient<Database>(url, serviceRole, {
    auth: { persistSession: false },
  });
}

const ALLOWED_SERVICES: ReadonlyArray<OrderPayload['service']> = ['dine_in', 'pickup', 'delivery'];
const ALLOWED_DELIVERY_ZONES: ReadonlyArray<NonNullable<OrderPayload['deliveryZone']>> = ['zibata', 'fuera'];
const ALLOWED_SLOTS: ReadonlyArray<OrderItem['slot']> = ['base', 'papas_o_sopa', 'toppings', 'drink'];

const IDEMPOTENCY_HEADER = 'x-idempotency-key';
const CREATE_ORDER_EVENT = 'CREATE_ORDER';

const isMoney = (value: unknown): value is Money => {
  if (!value || typeof value !== 'object') return false;
  const cents = (value as Money).cents;
  return typeof cents === 'number' && Number.isInteger(cents) && cents >= 0;
};

const parseTotals = (value: unknown): Totals | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<Totals>;
  if (!isMoney(raw.subtotal) || !isMoney(raw.shipping) || !isMoney(raw.tip)) {
    return null;
  }
  const subtotal = raw.subtotal;
  const shipping = raw.shipping;
  const tip = raw.tip;
  const computedTotal = subtotal.cents + shipping.cents + tip.cents;
  const providedTotal = raw.total && isMoney(raw.total) ? raw.total.cents : computedTotal;
  if (providedTotal !== computedTotal) {
    return {
      subtotal,
      shipping,
      tip,
      total: { cents: computedTotal },
    };
  }
  return {
    subtotal,
    shipping,
    tip,
    total: { cents: providedTotal },
  };
};

const parseItems = (value: unknown): OrderItem[] | null => {
  if (!Array.isArray(value)) return null;
  const items: OrderItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const { slot, name, price } = raw as Partial<OrderItem> & Record<string, unknown>;
    if (!ALLOWED_SLOTS.includes(slot as OrderItem['slot'])) continue;
    if (typeof name !== 'string' || !name.trim()) continue;
    if (!isMoney(price)) continue;
    items.push({ slot: slot as OrderItem['slot'], name: name.trim(), price });
  }
  return items;
};

const parseOrderPayload = (body: unknown): { data?: OrderPayload; error?: string } => {
  if (!body || typeof body !== 'object') {
    return { error: 'Cuerpo inválido' };
  }

  const raw = body as Record<string, unknown>;
  const rawCustomer = raw.customer;
  if (!rawCustomer || typeof rawCustomer !== 'object') {
    return { error: 'Cliente inválido' };
  }
  const customerName = (rawCustomer as Record<string, unknown>).name;
  if (typeof customerName !== 'string' || !customerName.trim()) {
    return { error: 'Nombre del cliente requerido' };
  }
  const emailValue = (rawCustomer as Record<string, unknown>).email;
  const customer: OrderPayload['customer'] = {
    name: customerName.trim(),
    ...(typeof emailValue === 'string' && emailValue.trim() ? { email: emailValue.trim() } : {}),
  };

  const service = raw.service;
  if (typeof service !== 'string' || !ALLOWED_SERVICES.includes(service as OrderPayload['service'])) {
    return { error: 'Servicio inválido' };
  }

  const rawTotals = parseTotals(raw.totals);
  if (!rawTotals) {
    return { error: 'Totales inválidos' };
  }

  const items = parseItems(raw.items);
  if (!items || items.length === 0) {
    return { error: 'Debe incluir al menos un artículo' };
  }

  const deliveryZoneValue = raw.deliveryZone;
  if (service === 'delivery') {
    if (
      typeof deliveryZoneValue !== 'string' ||
      !ALLOWED_DELIVERY_ZONES.includes(deliveryZoneValue as NonNullable<OrderPayload['deliveryZone']>)
    ) {
      return { error: 'Zona de entrega requerida' };
    }
  }

  const notesValue = raw.notes;
  const payload: OrderPayload = {
    customer,
    service: service as OrderPayload['service'],
    totals: rawTotals,
    items,
    ...(service === 'delivery' &&
    typeof deliveryZoneValue === 'string' &&
    ALLOWED_DELIVERY_ZONES.includes(deliveryZoneValue as NonNullable<OrderPayload['deliveryZone']>)
      ? { deliveryZone: deliveryZoneValue as NonNullable<OrderPayload['deliveryZone']> }
      : {}),
    ...(typeof notesValue === 'string' && notesValue.trim() ? { notes: notesValue.trim() } : {}),
  };

  return { data: payload };
};

function normalizeIdempotencyKey(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 200) {
    return trimmed.slice(0, 200);
  }
  return trimmed;
}

function existingResponseFromLog(log: AuditLogRow): AuditResponsePayload | null {
  const response = log.payload?.response;
  if (response && response.ok && typeof response.order_id === 'string') {
    return response;
  }
  if (log.order_id) {
    return { ok: true, order_id: log.order_id };
  }
  return null;
}

async function fetchExistingLog(
  supa: SupabaseAdminClient,
  key: string
): Promise<AuditLogRow | null> {
  const { data, error } = (await supa
    .from('audit_logs')
    .select('id, order_id, payload')
    .eq('type', CREATE_ORDER_EVENT)
    .eq('idempotency_key', key)
    .maybeSingle()) as MaybeSingle<AuditLogRow>;

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function POST(req: NextRequest) {
  const supa = supabaseAdmin();
  let auditId: string | null = null;
  let orderId: string | null = null;
  try {
    const rawKey = req.headers.get(IDEMPOTENCY_HEADER);
    const idempotencyKey = normalizeIdempotencyKey(rawKey);
    if (!idempotencyKey) {
      return NextResponse.json({ error: 'Falta encabezado de idempotencia' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = parseOrderPayload(body);
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error ?? 'Datos inválidos' }, { status: 400 });
    }

    // Verifica si ya existe una respuesta previa para la misma key
    const existingLog = await fetchExistingLog(supa, idempotencyKey);
    if (existingLog) {
      const existingResponse = existingResponseFromLog(existingLog);
      if (existingResponse) {
        return NextResponse.json(existingResponse);
      }
      return NextResponse.json({ error: 'Orden en proceso' }, { status: 409 });
    }

    // Reserva la key en audit_logs para prevenir carreras
    const auditInsert = await supa
      .from('audit_logs')
      .insert({
        type: CREATE_ORDER_EVENT,
        idempotency_key: idempotencyKey,
        payload: { request: parsed.data },
      })
      .select('id')
      .single();

    if (auditInsert.error) {
      if (auditInsert.error.code === '23505') {
        // Ya existe -> regresa lo almacenado o indica que sigue en proceso
        const retryLog = await fetchExistingLog(supa, idempotencyKey);
        if (retryLog) {
          const retryResponse = existingResponseFromLog(retryLog);
          if (retryResponse) {
            return NextResponse.json(retryResponse);
          }
        }
        return NextResponse.json({ error: 'Orden en proceso' }, { status: 409 });
      }
      throw new Error(auditInsert.error.message);
    }

    const auditData = auditInsert.data;
    if (!auditData?.id) {
      throw new Error('No se pudo crear el registro de auditoría');
    }
    auditId = auditData.id;

    const { customer, service, deliveryZone, notes, totals, items } = parsed.data;

    const orderInsert = await supa
      .from('orders')
      .insert({
        customer_name: customer.name,
        customer_email: customer.email ?? null,
        service,
        delivery_zone: deliveryZone ?? null,
        notes: notes ?? null,
        subtotal_cents: totals.subtotal.cents,
        shipping_cents: totals.shipping.cents,
        tip_cents: totals.tip.cents,
        total_cents: totals.total.cents,
        payment_status: 'pending',
        status: 'queued',
      })
      .select('id')
      .single();

    if (orderInsert.error) {
      throw new Error(orderInsert.error.message);
    }

    const orderData = orderInsert.data;
    if (!orderData?.id) {
      throw new Error('No se pudo obtener el ID de la orden');
    }
    orderId = orderData.id;

    const itemsPayload = items.map((item) => ({
      order_id: orderId,
      slot: item.slot,
      name: item.name,
      price_cents: item.price.cents,
    }));

    if (itemsPayload.length > 0) {
      const itemsInsert = await supa.from('order_items').insert(itemsPayload);
      if (itemsInsert.error) {
        await supa.from('orders').delete().eq('id', orderId).limit(1);
        orderId = null;
        throw new Error(itemsInsert.error.message);
      }
    }

    const responsePayload: AuditResponsePayload = { ok: true, order_id: orderId };

    const auditUpdate = await supa
      .from('audit_logs')
      .update({
        order_id: orderId,
        payload: {
          request: parsed.data,
          response: responsePayload,
        },
      })
      .eq('id', auditId);

    if (auditUpdate.error) {
      throw new Error(auditUpdate.error.message);
    }

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'error';
    if (orderId) {
      try {
        await supa.from('order_items').delete().eq('order_id', orderId);
      } catch (cleanupError) {
        console.error('No se pudieron limpiar los items fallidos', cleanupError);
      }
      try {
        await supa.from('orders').delete().eq('id', orderId).limit(1);
      } catch (cleanupError) {
        console.error('No se pudo limpiar la orden fallida', cleanupError);
      }
    }
    if (auditId) {
      try {
        await supa.from('audit_logs').delete().eq('id', auditId).limit(1);
      } catch (cleanupError) {
        console.error('No se pudo limpiar audit_log fallido', cleanupError);
      }
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
