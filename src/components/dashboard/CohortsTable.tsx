import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CohortRow } from '@/lib/dashboard/types';

interface CohortsTableProps {
  rows: CohortRow[];
}

export function CohortsTable({ rows }: CohortsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cohortes semanales</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Semana</TableHead>
              <TableHead className="text-right">Nuevos</TableHead>
              <TableHead className="text-right">Recurrentes</TableHead>
              <TableHead className="text-right">% Recompra</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const total = row.newCustomers + row.returningCustomers;
              const recurrence = total ? (row.returningCustomers / total) * 100 : 0;
              return (
                <TableRow key={row.week}>
                  <TableCell>{row.week}</TableCell>
                  <TableCell className="text-right">{row.newCustomers}</TableCell>
                  <TableCell className="text-right">{row.returningCustomers}</TableCell>
                  <TableCell className="text-right">{recurrence.toFixed(1)}%</TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-sm text-slate-400">
                  Sin datos en el rango seleccionado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
