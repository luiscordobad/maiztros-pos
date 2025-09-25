import { addDays, startOfDay } from 'date-fns';
import { DashboardClient } from './DashboardClient';
import { fetchCohorts, fetchHeatmap, fetchKpis, fetchOrdersTable, fetchSalesByHour, fetchTopProducts } from '@/lib/dashboard/queries';
import type { DashboardFilters, OrderChannel } from '@/lib/dashboard/types';

const defaultChannels: OrderChannel[] = ['counter', 'whatsapp', 'rappi', 'other'];

const todayRange = () => {
  const now = new Date();
  const start = startOfDay(now);
  const end = addDays(start, 1);
  return { from: start.toISOString(), to: end.toISOString() };
};

export default async function DashboardPage() {
  const range = todayRange();
  const filters: DashboardFilters = { range, channels: defaultChannels, status: null };
  let initial = null;
  try {
    const [kpis, sales, topProducts, orders, cohorts, heatmap] = await Promise.all([
      fetchKpis(filters),
      fetchSalesByHour(filters),
      fetchTopProducts(filters),
      fetchOrdersTable(filters),
      fetchCohorts(filters),
      fetchHeatmap(filters),
    ]);
    initial = { kpis, sales, topProducts, orders, cohorts, heatmap };
  } catch (error) {
    console.error('Error cargando dashboard inicial', error);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Dashboard operativo</h1>
        <p className="mt-2 text-sm text-slate-400">Monitorea ventas, pedidos y desempeño de los canales.</p>
      </div>
      <DashboardClient initial={initial} />
    </div>
  );
}
