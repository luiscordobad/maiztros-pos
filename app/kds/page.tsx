'use client';
import { useEffect, useMemo, useState } from 'react';

import type { KdsOrderRecord, OrderStatus, PaymentStatus } from '@/types/order';

const STATUS_COLUMNS: ReadonlyArray<{ key: OrderStatus; title: string }> = [
  { key: 'queued', title: 'En cola' },
  { key: 'in_kitchen', title: 'Preparando' },
  { key: 'ready', title: 'Listo' },
  { key: 'delivered', title: 'Entregado' },
];

const isOrderStatus = (value: unknown): value is OrderStatus =>
  value === 'queued' || value === 'in_kitchen' || value === 'ready' || value === 'delivered';

const isPaymentStatus = (value: unknown): value is PaymentStatus =>
  value === 'pending' || value === 'paid' || value === 'failed';

const isKdsOrderRecord = (value: unknown): value is KdsOrderRecord => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    isOrderStatus(record.status) &&
    isPaymentStatus(record.payment_status) &&
    typeof record.total_cents === 'number' &&
    (record.notes === null || typeof record.notes === 'string') &&
    (record.customer_name === null || typeof record.customer_name === 'string') &&
    typeof record.created_at === 'string'
  );
};

export default function KDS() {
  const [orders, setOrders] = useState<KdsOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const r = await fetch('/api/orders/kds', { cache: 'no-store' });
      const j = (await r.json()) as { orders?: unknown; error?: string };
      if (!r.ok) throw new Error(j.error || 'Error KDS');
      const parsed = Array.isArray(j.orders) ? j.orders.filter(isKdsOrderRecord) : [];
      setOrders(parsed);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // refresca cada 5s
    return () => clearInterval(t);
  }, []);

  async function move(id: string, next: OrderStatus) {
    const r = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next })
    });
    if (r.ok) load();
  }

  const ordersByStatus = useMemo(() => {
    return STATUS_COLUMNS.reduce<Record<OrderStatus, KdsOrderRecord[]>>((acc, column) => {
      acc[column.key] = orders.filter((order) => order.status === column.key);
      return acc;
    }, {
      queued: [],
      in_kitchen: [],
      ready: [],
      delivered: [],
    });
  }, [orders]);

  function actions(col: OrderStatus, id: string) {
    if (col==='queued')
      return <button className="px-2 py-1 border border-white/20 rounded" onClick={()=>move(id,'in_kitchen')}>→ Preparando</button>;
    if (col==='in_kitchen')
      return <button className="px-2 py-1 border border-white/20 rounded" onClick={()=>move(id,'ready')}>→ Listo</button>;
    if (col==='ready')
      return <button className="px-2 py-1 border border-white/20 rounded" onClick={()=>move(id,'delivered')}>→ Entregado</button>;
    return null;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">KDS — Cocina</h1>
      {loading && <div className="card">Cargando…</div>}

      <div className="grid gap-3 md:grid-cols-4">
        {STATUS_COLUMNS.map(col => (
          <div key={col.key} className="card">
            <h2 className="font-medium mb-2">{col.title}</h2>
            <div className="space-y-2">
              {ordersByStatus[col.key].map(o=>(
                <div key={o.id} className="border border-white/20 rounded p-2">
                  <div className="flex items-center justify-between">
                    <b>#{o.id.slice(0,8)}</b>
                    <span className="opacity-70 text-xs">{new Date(o.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-sm mt-1">
                    Cliente: {o.customer_name || '-'}
                  </div>
                  <div className="text-sm opacity-80">
                    Pago: {o.payment_status}
                  </div>
                  <div className="text-sm">Total: ${(o.total_cents ?? 0)/100}</div>
                  <div className="flex gap-2 mt-2">
                    {actions(col.key, o.id)}
                  </div>
                </div>
              ))}
              {ordersByStatus[col.key].length===0 && (
                <div className="text-sm opacity-70">Sin órdenes</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
