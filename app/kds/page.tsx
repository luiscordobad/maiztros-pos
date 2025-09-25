'use client';
import { useEffect, useState } from 'react';

type Status = 'queued'|'in_kitchen'|'ready'|'delivered';
type PaymentStatus = 'pending' | 'paid' | 'failed';

interface KdsOrder {
  id: string;
  status: Status;
  payment_status: PaymentStatus;
  customer_name: string | null;
  total_cents: number | null;
  created_at: string;
}

export default function KDS() {
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const r = await fetch('/api/orders/kds', { cache: 'no-store' });
      const j: { orders?: KdsOrder[]; error?: string } = await r.json();
      if (!r.ok) throw new Error(j.error || 'Error KDS');
      setOrders(j.orders ?? []);
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

  async function move(id: string, next: Status) {
    const r = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next })
    });
    if (r.ok) load();
  }

  const columns: {key: Status; title: string}[] = [
    {key:'queued', title:'En cola'},
    {key:'in_kitchen', title:'Preparando'},
    {key:'ready', title:'Listo'},
    {key:'delivered', title:'Entregado'},
  ];

  function actions(col: Status, id: string) {
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
        {columns.map(col => (
          <div key={col.key} className="card">
            <h2 className="font-medium mb-2">{col.title}</h2>
            <div className="space-y-2">
              {orders.filter(o => o.status===col.key).map(o=>(
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
              {orders.filter(o => o.status===col.key).length===0 && (
                <div className="text-sm opacity-70">Sin órdenes</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
