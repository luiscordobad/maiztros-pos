'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

function OrderTrackingInner() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [order, setOrder] = useState<any>(null);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`/api/orders/${id}`, { cache: 'no-store' });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'No encontrada');
        if (mounted) setOrder(j.order);
      } catch (e: any) {
        if (mounted) setErr(e.message);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  if (err) return <div className="card">Error: {err}</div>;
  if (!order) return <div className="card">Cargando pedido…</div>;

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Pedido #{order.id}</h1>
      <div className="card">
        <p><b>Estado:</b> {order.status}</p>
        <p><b>Pago:</b> {order.payment_status}</p>
        <p><b>Total:</b> ${(order.total_cents ?? 0) / 100}</p>
        <p><b>Notas:</b> {order.notes || '-'}</p>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="card">Cargando…</div>}>
      <OrderTrackingInner />
    </Suspense>
  );
}
