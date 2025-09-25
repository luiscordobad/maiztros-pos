import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { KpiSummary } from '@/lib/dashboard/types';

const currency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat('es-MX', {
  style: 'percent',
  maximumFractionDigits: 1,
});

interface KpiCardsProps {
  metrics: KpiSummary | null;
  loading?: boolean;
}

const fallback: KpiSummary = {
  salesToday: 0,
  ticketsToday: 0,
  averageTicket: 0,
  deliveryShare: 0,
};

export function KpiCards({ metrics, loading = false }: KpiCardsProps) {
  const data = metrics ?? fallback;
  const items = [
    {
      title: 'Ventas Hoy',
      description: 'Total capturado en el rango seleccionado',
      value: currency.format(data.salesToday),
    },
    {
      title: 'Tickets Hoy',
      description: 'Cantidad de pedidos cerrados',
      value: data.ticketsToday.toLocaleString('es-MX'),
    },
    {
      title: 'Ticket Promedio',
      description: 'Promedio por pedido',
      value: currency.format(data.averageTicket),
    },
    {
      title: '% Delivery',
      description: 'Participación de canales de entrega',
      value: percent.format(data.deliveryShare),
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title} className={loading ? 'animate-pulse' : undefined}>
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
