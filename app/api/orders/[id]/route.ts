import { NextRequest, NextResponse } from 'next/server';

import type { OrderRecord } from '@/types/order';
import { createSupabaseServiceRoleClient } from '@/lib/supabaseServer';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'id inválido' }, { status: 400 });
    }

    const supa = createSupabaseServiceRoleClient();
    const { data, error } = await supa
      .from('orders')
      .select('id,status,payment_status,total_cents,notes')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ order: data as OrderRecord });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
