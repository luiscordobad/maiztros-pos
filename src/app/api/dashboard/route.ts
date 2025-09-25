import { NextResponse } from 'next/server';
import {
  fetchCohorts,
  fetchHeatmap,
  fetchKpis,
  fetchOrdersTable,
  fetchSalesByHour,
  fetchTopProducts,
} from '@/lib/dashboard/queries';
import type { DashboardFilters } from '@/lib/dashboard/types';

type RawDashboardFilters = {
  range?: {
    from?: unknown;
    to?: unknown;
  };
  channels?: unknown;
  status?: unknown;
};

const validateFilters = (body: unknown): DashboardFilters => {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Rango inválido');
  }
  const { range, channels, status } = body as RawDashboardFilters;
  if (!range?.from || !range?.to) {
    throw new Error('Rango inválido');
  }
  const parsedChannels = Array.isArray(channels) ? channels.filter((channel): channel is string => typeof channel === 'string') : [];
  const parsedStatus = typeof status === 'string' && status ? status : null;
  return {
    range: { from: String(range.from), to: String(range.to) },
    channels: parsedChannels,
    status: parsedStatus,
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
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
  } catch (error: unknown) {
    console.error('dashboard route error', error);
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
