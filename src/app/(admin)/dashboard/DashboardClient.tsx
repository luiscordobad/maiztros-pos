'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { DateRangePicker, type DateRangeValue } from '@/components/common/DateRangePicker';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { SalesByHourChart } from '@/components/dashboard/Charts/SalesByHour';
import { TopProductsChart } from '@/components/dashboard/Charts/TopProducts';
import { OrdersTable } from '@/components/dashboard/OrdersTable';
import { CohortsTable } from '@/components/dashboard/CohortsTable';
import { HeatmapTable } from '@/components/dashboard/HeatmapTable';
import type {
  CohortRow,
  DashboardFilters,
  HeatmapRow,
  KpiSummary,
  OrderTableRow,
  SalesByHourPoint,
  TopProductRow,
} from '@/lib/dashboard/types';

const channelsOptions = [
  { value: 'counter', label: 'Mostrador' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'rappi', label: 'Rappi' },
  { value: 'other', label: 'Otro' },
];

const statusOptions = [
  { value: '', label: 'Todos excepto cancelados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'ready', label: 'Listo' },
  { value: 'delivered', label: 'Entregado' },
];

interface DashboardPayload {
  kpis: KpiSummary;
  sales: SalesByHourPoint[];
  topProducts: TopProductRow[];
  orders: OrderTableRow[];
  cohorts: CohortRow[];
  heatmap: HeatmapRow[];
}

const todayRange = (): DateRangeValue => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return { from: start.toISOString(), to: end.toISOString() };
};

export function DashboardClient({ initial }: { initial: DashboardPayload | null }) {
  const [range, setRange] = useState<DateRangeValue>(() => todayRange());
  const [channels, setChannels] = useState<string[]>(channelsOptions.map((c) => c.value));
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardPayload | null>(initial);

  const filters: DashboardFilters = useMemo(
    () => ({ range, channels, status: status || null }),
    [channels, range, status]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });
      if (!response.ok) {
        throw new Error('No se pudo actualizar el dashboard');
      }
      const json = (await response.json()) as DashboardPayload;
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (initial) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrders = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data.orders;
    const query = search.toLowerCase();
    return data.orders.filter((order) => {
      return (
        order.channel.toLowerCase().includes(query) ||
        order.status.toLowerCase().includes(query) ||
        (order.ticketNo ? String(order.ticketNo).includes(query) : false)
      );
    });
  }, [data, search]);

  const toggleChannel = (value: string) => {
    setChannels((prev) => (prev.includes(value) ? prev.filter((ch) => ch !== value) : [...prev, value]));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DateRangePicker value={range} onChange={setRange} />
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Estado</Label>
              <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Canales</Label>
              <div className="flex flex-wrap gap-2">
                {channelsOptions.map((channel) => {
                  const active = channels.includes(channel.value);
                  return (
                    <Button
                      key={channel.value}
                      type="button"
                      variant={active ? 'default' : 'ghost'}
                      onClick={() => toggleChannel(channel.value)}
                      size="sm"
                    >
                      {channel.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Canales activos:</span>
              {channels.map((channel) => (
                <Badge key={channel}>{channel}</Badge>
              ))}
            </div>
            <Button onClick={fetchData} disabled={loading}>
              {loading ? 'Actualizando…' : 'Aplicar filtros'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <KpiCards metrics={data?.kpis ?? null} loading={loading} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Ventas por hora</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesByHourChart series={data?.sales ?? []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top productos</CardTitle>
          </CardHeader>
          <CardContent>
            <TopProductsChart rows={data?.topProducts ?? []} />
          </CardContent>
        </Card>
        <HeatmapTable rows={data?.heatmap ?? []} />
      </div>

      <CohortsTable rows={data?.cohorts ?? []} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Pedidos filtrados</CardTitle>
          <Input
            placeholder="Buscar por ticket, canal o estado"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <OrdersTable rows={filteredOrders} />
        </CardContent>
      </Card>
    </div>
  );
}
