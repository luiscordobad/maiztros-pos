'use client';
import { useEffect, useState } from 'react';

export default function OrderTracking({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`/api/orders/${params.id}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'No encontrada');
        if (mounted) setOrder(j.order);
      } catch (e: any) {
        setErr(e.message);
      }
    })();
    return () => { mounted = false; }
  }, [params.id]);

  if (err) return <div className="card">Error: {err}</div>;
  if (!order) return <div className="card">Cargando pedido…</div>;

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Pedido #{order.id}</h1>
      <div className="card">
        <p><b>Estado:</b> {order.status}</p>
        <p><b>Pago:</b> {order.payment_status}</p>
        <p><b>Total:</b> ${(order.total_cents ?? 0)/100}</p>
        <p><b>Notas:</b> {order.notes || '-'}</p>
      </div>
    </div>
  );
}
