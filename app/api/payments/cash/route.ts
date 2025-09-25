import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  const { order_id, amount } = await req.json();
  const supa = createClient();
  await supa.from('payments').insert({ order_id, provider: 'cash', amount, status: 'approved' });
  await supa
    .from('orders')
    .update({ paid_at: new Date().toISOString() })
    .eq('id', order_id);
  return NextResponse.json({ ok: true });
}
