import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabaseAdmin';
import { logAudit } from '@/lib/api/audit';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('id', params.id);
    if (error) throw new Error(error.message);

    await logAudit({ actor: null, action: 'STATUS_CHANGE', entity: 'order', entity_id: params.id, meta: { status: 'delivered' } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'No se pudo actualizar' }, { status: 400 });
  }
}
