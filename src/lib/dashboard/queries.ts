import { formatISO, parseISO } from 'date-fns';
import { createServerSupabaseClient } from '@/lib/supabaseClient';
import type {
  CohortRow,
  DashboardFilters,
  HeatmapRow,
  KpiSummary,
  OrderTableRow,
  SalesByHourPoint,
  TopProductRow,
} from './types';

const defaultChannels = ['counter', 'whatsapp', 'rappi', 'other'];

const normalizeChannels = (channels: string[]) => (channels.length ? channels : defaultChannels);

const rangePayload = (range: { from: string; to: string }) => ({
  from_ts: formatISO(parseISO(range.from)),
  to_ts: formatISO(parseISO(range.to)),
});

export async function fetchSalesByHour(filters: DashboardFilters): Promise<SalesByHourPoint[]> {
  const client = await createServerSupabaseClient();
  const { data, error } = await client.rpc('dashboard_sales_by_hour', {
    ...rangePayload(filters.range),
    channels: normalizeChannels(filters.channels),
    status_filter: filters.status,
  });
  if (error) {
    console.error('dashboard_sales_by_hour', error.message);
    throw new Error('No se pudieron obtener las ventas por hora');
  }
  return (data ?? []).map((row: any) => ({
    bucket: row.bucket,
    sales: Number(row.sales ?? 0),
    orders: Number(row.orders ?? 0),
  }));
}

export async function fetchTopProducts(filters: DashboardFilters): Promise<TopProductRow[]> {
  const client = await createServerSupabaseClient();
  const { data, error } = await client.rpc('dashboard_top_products', {
    ...rangePayload(filters.range),
    channels: normalizeChannels(filters.channels),
    status_filter: filters.status,
  });
  if (error) {
    console.error('dashboard_top_products', error.message);
    throw new Error('No se pudieron obtener los top productos');
  }
  return (data ?? []).map((row: any) => ({
    sku: row.sku,
    name: row.name,
    units: Number(row.units ?? 0),
    revenue: Number(row.revenue ?? 0),
  }));
}

export async function fetchKpis(filters: DashboardFilters): Promise<KpiSummary> {
  const client = await createServerSupabaseClient();
  const { data, error } = await client.rpc('dashboard_kpis', {
    ...rangePayload(filters.range),
    channels: normalizeChannels(filters.channels),
    status_filter: filters.status,
  });
  if (error) {
    console.error('dashboard_kpis', error.message);
    throw new Error('No se pudieron obtener los KPIs');
  }
  const payload = (data ?? {}) as any;
  return {
    salesToday: Number(payload.sales ?? 0),
    ticketsToday: Number(payload.tickets ?? 0),
    averageTicket: Number(payload.average_ticket ?? 0),
    deliveryShare: Number(payload.delivery_share ?? 0),
  };
}

export async function fetchOrdersTable(filters: DashboardFilters): Promise<OrderTableRow[]> {
  const client = await createServerSupabaseClient();
  const { data, error } = await client.rpc('dashboard_orders_table', {
    ...rangePayload(filters.range),
    channels: normalizeChannels(filters.channels),
    status_filter: filters.status,
  });
  if (error) {
    console.error('dashboard_orders_table', error.message);
    throw new Error('No se pudo obtener la tabla de pedidos');
  }
  return (data ?? []).map((row: any) => ({
    id: row.id,
    createdAt: row.created_at,
    ticketNo: row.ticket_no,
    channel: row.channel,
    status: row.status,
    total: Number(row.total ?? 0),
    paymentMethod: row.payment_method,
  }));
}

export async function fetchCohorts(filters: DashboardFilters): Promise<CohortRow[]> {
  const client = await createServerSupabaseClient();
  const { data, error } = await client.rpc('dashboard_weekly_cohorts', {
    ...rangePayload(filters.range),
    channels: normalizeChannels(filters.channels),
    status_filter: filters.status,
  });
  if (error) {
    console.error('dashboard_weekly_cohorts', error.message);
    throw new Error('No se pudieron obtener las cohortes');
  }
  return (data ?? []).map((row: any) => ({
    week: row.week,
    newCustomers: Number(row.new_customers ?? 0),
    returningCustomers: Number(row.returning_customers ?? 0),
  }));
}

export async function fetchHeatmap(filters: DashboardFilters, seriesOverride?: SalesByHourPoint[]): Promise<HeatmapRow[]> {
  const series = seriesOverride ?? (await fetchSalesByHour(filters));
  const buckets = new Map<number, { totalOrders: number; totalSales: number }>();
  series.forEach((point) => {
    const date = new Date(point.bucket);
    const hour = date.getUTCHours();
    const entry = buckets.get(hour) ?? { totalOrders: 0, totalSales: 0 };
    entry.totalOrders += point.orders;
    entry.totalSales += point.sales;
    buckets.set(hour, entry);
  });
  return Array.from({ length: 24 }, (_, hour) => {
    const entry = buckets.get(hour) ?? { totalOrders: 0, totalSales: 0 };
    return { hour, ...entry };
  });
}
