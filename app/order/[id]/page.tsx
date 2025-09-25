'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import type { OrderRecord } from '@/types/order';

const moneyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

function OrderTrackingInner() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const formattedTotal = useMemo(() => {
    const total = order?.total_cents ?? 0;
    return moneyFormatter.format(total / 100);
  }, [order?.total_cents]);

  useEffect(() => {
    if (!id) {
      setErr('Pedido inválido');
      setOrder(null);
      return;
    }

    let active = true;

    const load = async () => {
      try {
        const response = await fetch(`/api/orders/${id}`, { cache: 'no-store' });
        const json: { order?: OrderRecord; error?: string } = await response.json();
        if (!response.ok) {
          throw new Error(json.error || 'No encontrada');
        }
        if (active) {
          setOrder(json.order ?? null);
          setErr(null);
        }
      } catch (error) {
        if (active) {
          const message = error instanceof Error ? error.message : 'Error al cargar la orden';
          setErr(message);
        }
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [id]);

  if (err) return <div className='card'>Error: {err}</div>;
  if (!order) return <div className='card'>Cargando pedido…</div>;

  return (
    <div className='space-y-3'>
      <h1 className='text-2xl font-semibold'>Pedido #{order.id}</h1>
      <div className='card'>
        <p>
          <b>Estado:</b> {order.status}
        </p>
        <p>
          <b>Pago:</b> {order.payment_status}
        </p>
        <p>
          <b>Total:</b> {formattedTotal}
        </p>
        <p>
          <b>Notas:</b> {order.notes || '-'}
        </p>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className='card'>Cargando…</div>}>
      <OrderTrackingInner />
    </Suspense>
  );
}
