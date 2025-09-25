'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Favorites } from '@/components/pos/Favorites';
import { SearchBar } from '@/components/pos/SearchBar';
import { CouponInput } from '@/components/pos/CouponInput';
import { PaymentDialog } from '@/components/pos/PaymentDialog';
import { usePosStore } from '@/lib/pos/store';
import type { PosProduct } from '@/lib/pos/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const catalog: PosProduct[] = [
  { sku: 'esquite_chico', name: 'Esquite chico', price: 4500, category: 'Clásicos' },
  { sku: 'esquite_mediano', name: 'Esquite mediano', price: 5500, category: 'Clásicos' },
  { sku: 'esquite_grande', name: 'Esquite grande', price: 6500, category: 'Clásicos' },
  { sku: 'esquite_elote', name: 'Elote en vaso', price: 6000, category: 'Clásicos' },
  { sku: 'esquite_dorado', name: 'Esquite dorado', price: 7000, category: 'Especiales' },
  { sku: 'agua_horchata', name: 'Agua de horchata', price: 3500, category: 'Bebidas' },
  { sku: 'agua_jamaica', name: 'Agua de jamaica', price: 3500, category: 'Bebidas' },
  { sku: 'agua_limon', name: 'Agua de limón', price: 3500, category: 'Bebidas' },
];

export function PosClient() {
  const { items, subtotal, discount, total, removeItem, updateQuantity, reset } = usePosStore();
  const [notes, setNotes] = useState('');
  const [channel, setChannel] = useState<'counter' | 'whatsapp' | 'rappi' | 'other'>('counter');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasItems = items.length > 0;

  const submitOrder = async () => {
    if (!hasItems) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': orderId ?? crypto.randomUUID(),
        },
        body: JSON.stringify({
          channel,
          customer: {
            phone: customerPhone || undefined,
            name: customerName || undefined,
          },
          notes: notes || undefined,
          items: items.map((item) => ({
            sku: item.sku,
            name: item.name,
            qty: item.quantity,
            unit_price: item.price / 100,
            modifiers: item.modifiers,
          })),
          subtotal: subtotal / 100,
          discount: discount / 100,
          total: total / 100,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? 'No se pudo crear el pedido');
      }
      setOrderId(json.id);
    } catch (error) {
      console.error(error);
      alert('Error creando pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalFormatted = useMemo(() => (total / 100).toFixed(2), [total]);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Favoritos</CardTitle>
          </CardHeader>
          <CardContent>
            <Favorites products={catalog} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buscar</CardTitle>
          </CardHeader>
          <CardContent>
            <SearchBar catalog={catalog} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <label className="text-xs font-medium uppercase text-slate-400">Canal</label>
            <div className="flex flex-wrap gap-2">
              {(['counter', 'whatsapp', 'rappi', 'other'] as const).map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={channel === option ? 'default' : 'ghost'}
                  onClick={() => setChannel(option)}
                  size="sm"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <Input
              placeholder="Teléfono"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
            />
            <Input placeholder="Nombre" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
          </div>

          <Textarea placeholder="Notas" value={notes} onChange={(event) => setNotes(event.target.value)} />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-slate-400">{item.sku}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        -
                      </Button>
                      <span>{item.quantity}</span>
                      <Button size="sm" variant="ghost" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        +
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">${((item.price * item.quantity) / 100).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => removeItem(item.id)}>
                      Quitar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-slate-400">
                    Agrega productos para comenzar
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>${(subtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Descuento</span>
              <span>-${(discount / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>${totalFormatted}</span>
            </div>
          </div>

          <CouponInput orderId={orderId} />

          <div className="flex gap-3">
            <Button className="flex-1" variant="secondary" onClick={submitOrder} disabled={!hasItems || isSubmitting}>
              {orderId ? 'Actualizar pedido' : 'Generar pedido'}
            </Button>
            {orderId && (
              <PaymentDialog
                orderId={orderId}
                total={total / 100}
                onPaid={() => {
                  alert('Pago registrado');
                  reset();
                  setOrderId(null);
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
