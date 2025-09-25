import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabaseAdmin';
import { logAudit } from '@/lib/api/audit';

type ApplyCouponPayload = {
  code?: unknown;
};

type CouponRow = {
  code: string;
  type: 'amount' | 'percent';
  value: number | string;
  min_total: number | string;
  starts_at: string | null;
  ends_at: string | null;
};

type OrderFinancials = {
  subtotal: number | string;
  total: number | string;
};

type RouteParams = { params: Promise<{ id?: string } | undefined> };

export async function POST(request: Request, context: RouteParams) {
  try {
    const params = await context.params;
    const orderId = params?.id;
    if (!orderId) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const body = (await request.json()) as ApplyCouponPayload;
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    if (!code) {
      return NextResponse.json({ error: 'Ingresa un código' }, { status: 400 });
    }

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('subtotal, total')
      .eq('id', orderId)
      .maybeSingle();
    const order = orderData as OrderFinancials | null;
    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const { data: couponData, error } = await supabaseAdmin
      .from('coupons')
      .select('code, type, value, min_total, starts_at, ends_at')
      .eq('code', code)
      .eq('active', true)
      .maybeSingle();

    const coupon = couponData as CouponRow | null;

    if (error || !coupon) {
      return NextResponse.json({ error: 'Cupón inválido' }, { status: 400 });
    }

    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return NextResponse.json({ error: 'Cupón aún no disponible' }, { status: 400 });
    }
    if (coupon.ends_at && new Date(coupon.ends_at) < now) {
      return NextResponse.json({ error: 'Cupón expirado' }, { status: 400 });
    }

    const subtotal = Number(order.subtotal ?? 0);
    const totalBefore = Number(order.total ?? 0);
    const couponValue = Number(coupon.value ?? 0);
    const minTotal = Number(coupon.min_total ?? 0);

    if (!Number.isFinite(subtotal) || !Number.isFinite(totalBefore)) {
      return NextResponse.json({ error: 'Totales inválidos' }, { status: 400 });
    }

    if (totalBefore < minTotal) {
      return NextResponse.json({ error: 'No alcanza el mínimo requerido' }, { status: 400 });
    }

    if (!Number.isFinite(couponValue)) {
      return NextResponse.json({ error: 'Cupón inválido' }, { status: 400 });
    }

    const discount = coupon.type === 'percent' ? (subtotal * couponValue) / 100 : couponValue;
    const total = Math.max(subtotal - discount, 0);

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ discount, total })
      .eq('id', orderId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await logAudit({ actor: null, action: 'DISCOUNT', entity: 'order', entity_id: orderId, meta: { code, discount } });

    return NextResponse.json({ code, discount_cents: Math.round(discount * 100), total_cents: Math.round(total * 100) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
