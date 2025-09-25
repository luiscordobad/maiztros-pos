import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { HeatmapRow } from '@/lib/dashboard/types';

const formatter = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });

interface HeatmapTableProps {
  rows: HeatmapRow[];
}

const colorScale = (value: number) => {
  if (value === 0) return 'bg-slate-900';
  if (value < 3) return 'bg-emerald-600/30';
  if (value < 6) return 'bg-amber-500/30';
  return 'bg-rose-500/30';
};

export function HeatmapTable({ rows }: HeatmapTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Horas pico</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead className="text-right">Pedidos</TableHead>
              <TableHead className="text-right">Ventas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.hour}>
                <TableCell>{row.hour}:00</TableCell>
                <TableCell className={`text-right ${colorScale(row.totalOrders)}`}>
                  {formatter.format(row.totalOrders)}
                </TableCell>
                <TableCell className="text-right">${formatter.format(row.totalSales)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
