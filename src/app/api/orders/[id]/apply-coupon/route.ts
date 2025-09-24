import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabaseAdmin';
import { logAudit } from '@/lib/api/audit';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const body = await _.json();
    const code = String(body.code ?? '').trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: 'Ingresa un código' }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabaseAdmin.from('orders').select('*').eq('id', params.id).single();
    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('active', true)
      .maybeSingle();

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

    if (order.total < coupon.min_total) {
      return NextResponse.json({ error: 'No alcanza el mínimo requerido' }, { status: 400 });
    }

    const discount = coupon.type === 'percent' ? (order.subtotal * coupon.value) / 100 : coupon.value;
    const total = Math.max(order.subtotal - discount, 0);

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ discount, total })
      .eq('id', params.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await logAudit({ actor: null, action: 'DISCOUNT', entity: 'order', entity_id: params.id, meta: { code, discount } });

    return NextResponse.json({ code, discount_cents: Math.round(discount * 100), total_cents: Math.round(total * 100) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Error inesperado' }, { status: 400 });
  }
}
