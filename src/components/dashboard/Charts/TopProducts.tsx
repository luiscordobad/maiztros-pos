'use client';

import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, CartesianGrid } from 'recharts';
import type { TopProductRow } from '@/lib/dashboard/types';

const currency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

interface TopProductsChartProps {
  rows: TopProductRow[];
}

export function TopProductsChart({ rows }: TopProductsChartProps) {
  const data = rows.map((row) => ({
    sku: row.sku,
    name: row.name,
    unidades: row.units,
    revenue: row.revenue,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis type="number" tickFormatter={(value) => currency.format(value)} stroke="rgba(255,255,255,0.7)" />
          <YAxis dataKey="name" type="category" width={160} stroke="rgba(255,255,255,0.7)" />
          <Tooltip
            formatter={(value: number, key) => {
              if (key === 'unidades') return [value, 'Unidades'];
              return [currency.format(value), 'Ventas'];
            }}
            contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <Bar dataKey="revenue" name="Ventas" fill="#facc15" radius={[0, 8, 8, 0]} />
          <Bar dataKey="unidades" name="Unidades" fill="#38bdf8" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
