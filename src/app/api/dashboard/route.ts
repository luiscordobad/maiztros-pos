import { NextResponse } from 'next/server';
import { fetchCohorts, fetchHeatmap, fetchKpis, fetchOrdersTable, fetchSalesByHour, fetchTopProducts } from '@/lib/dashboard/queries';
import type { DashboardFilters } from '@/lib/dashboard/types';

const validateFilters = (body: any): DashboardFilters => {
  const range = body?.range;
  if (!range?.from || !range?.to) {
    throw new Error('Rango inválido');
  }
  const channels = Array.isArray(body.channels) ? (body.channels as string[]) : [];
  const status = typeof body.status === 'string' && body.status ? body.status : null;
  return {
    range: { from: String(range.from), to: String(range.to) },
    channels,
    status,
  };
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const filters = validateFilters(body);

    const [kpis, sales, topProducts, orders, cohorts] = await Promise.all([
      fetchKpis(filters),
      fetchSalesByHour(filters),
      fetchTopProducts(filters),
      fetchOrdersTable(filters),
      fetchCohorts(filters),
    ]);

    const heatmap = await fetchHeatmap(filters, sales);

    return NextResponse.json({ kpis, sales, topProducts, orders, cohorts, heatmap });
  } catch (error: any) {
    console.error('dashboard route error', error);
    return NextResponse.json({ error: error?.message ?? 'Error inesperado' }, { status: 400 });
  }
}
