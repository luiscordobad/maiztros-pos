'use client';

import { ResponsiveContainer, LineChart, Line, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import type { SalesByHourPoint } from '@/lib/dashboard/types';
import { format } from 'date-fns-tz';
import { MX_TIMEZONE } from '@/lib/utils';

interface SalesByHourProps {
  series: SalesByHourPoint[];
  comparison?: SalesByHourPoint[];
}

const currency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

export function SalesByHourChart({ series, comparison = [] }: SalesByHourProps) {
  const dataset = series.map((point) => {
    const bucket = new Date(point.bucket);
    const label = format(bucket, 'HH:mm', { timeZone: MX_TIMEZONE });
    const compare = comparison.find((c) => c.bucket === point.bucket);
    return {
      label,
      ventas: point.sales,
      pedidos: point.orders,
      comparativo: compare?.sales ?? null,
    };
  });

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={dataset}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="label" stroke="rgba(255,255,255,0.7)" />
          <YAxis yAxisId="left" stroke="rgba(255,255,255,0.7)" tickFormatter={(value) => currency.format(value)} />
          <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.7)" />
          <Tooltip
            formatter={(value: number, key) => {
              if (key === 'pedidos') return [value, 'Pedidos'];
              return [currency.format(value), 'Ventas'];
            }}
            contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <Legend />
          <Line type="monotone" dataKey="ventas" name="Ventas" stroke="#fbbf24" strokeWidth={2} dot={false} yAxisId="left" />
          <Line type="monotone" dataKey="pedidos" name="Pedidos" stroke="#38bdf8" strokeWidth={2} dot={false} yAxisId="right" />
          <Line
            type="monotone"
            dataKey="comparativo"
            name="Comparativo"
            stroke="#818cf8"
            strokeDasharray="4 4"
            dot={false}
            yAxisId="left"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
