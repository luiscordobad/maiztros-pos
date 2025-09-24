'use client';

import { useMemo } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { OrderTableRow } from '@/lib/dashboard/types';

const currency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
});

interface OrdersTableProps {
  rows: OrderTableRow[];
}

export function OrdersTable({ rows }: OrdersTableProps) {
  const csvData = useMemo(() => {
    if (!rows.length) return '';
    const mapped = rows.map((row) => ({
      fecha: new Date(row.createdAt).toISOString(),
      ticket_no: row.ticketNo ?? '',
      canal: row.channel,
      status: row.status,
      total: row.total,
      metodo_pago: row.paymentMethod ?? '',
    }));
    return Papa.unparse(mapped, { delimiter: ',' });
  }, [rows]);

  const download = () => {
    if (!csvData) return;
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `maiztros-orders-${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pedidos</CardTitle>
        <Button onClick={download} variant="secondary" disabled={!rows.length}>
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Ticket</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Método pago</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{new Date(row.createdAt).toLocaleString('es-MX')}</TableCell>
                <TableCell>{row.ticketNo ?? '-'}</TableCell>
                <TableCell className="capitalize">{row.channel}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell className="text-right">{currency.format(row.total)}</TableCell>
                <TableCell>{row.paymentMethod ?? '—'}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm text-slate-400">
                  No hay pedidos en el rango seleccionado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
