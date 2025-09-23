import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import type { Money, OrderItem, OrderPayload, Totals } from '@/types/order';

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error('Supabase admin credentials are not configured.');
  }
  return createClient(url, serviceRole);
}

const ALLOWED_SERVICES: ReadonlyArray<OrderPayload['service']> = ['dine_in', 'pickup', 'delivery'];
const ALLOWED_DELIVERY_ZONES: ReadonlyArray<NonNullable<OrderPayload['deliveryZone']>> = ['zibata', 'fuera'];
const ALLOWED_SLOTS: ReadonlyArray<OrderItem['slot']> = ['base', 'papas_o_sopa', 'toppings', 'drink'];

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
    if (typeof deliveryZoneValue !== 'string' || !ALLOWED_DELIVERY_ZONES.includes(deliveryZoneValue as NonNullable<OrderPayload['deliveryZone']>)) {
      return { error: 'Zona de entrega requerida' };
    }
  }

  const notesValue = raw.notes;
  const payload: OrderPayload = {
    customer,
    service: service as OrderPayload['service'],
    totals: rawTotals,
    items,
    ...(service === 'delivery' && typeof deliveryZoneValue === 'string' && ALLOWED_DELIVERY_ZONES.includes(deliveryZoneValue as NonNullable<OrderPayload['deliveryZone']>)
      ? { deliveryZone: deliveryZoneValue as NonNullable<OrderPayload['deliveryZone']> }
      : {}),
    ...(typeof notesValue === 'string' && notesValue.trim() ? { notes: notesValue.trim() } : {}),
  };

  return { data: payload };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = parseOrderPayload(body);
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error ?? 'Datos inválidos' }, { status: 400 });
    }

    const { customer, service, deliveryZone, notes, totals } = parsed.data;

    const supa = supabaseAdmin();
    const { data, error } = await supa
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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 });
  }
}
