'use client';

import { useEffect, useState } from 'react';
import { ChannelFilters } from '@/components/kds/ChannelFilters';
import { OrderCard } from '@/components/kds/OrderCard';
import type { KdsOrder } from '@/lib/kds/types';
import { Button } from '@/components/ui/button';

const playNotification = () => {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
  } catch (error) {
    console.warn('audio error', error);
  }
};

type ViewMode = 'all' | 'pending' | 'in_progress';

export function KdsClient() {
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('all');

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/kds', { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Error KDS');
      setOrders((prev) => {
        if (prev.length && json.orders.length > prev.length) {
          playNotification();
        }
        return json.orders;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = orders.filter((order) => {
    if (channel && order.channel !== channel) return false;
    if (view === 'pending') return order.status === 'pending';
    if (view === 'in_progress') return order.status === 'in_progress';
    return order.status !== 'ready';
  });

  const advance = async (orderId: string, next: KdsOrder['status']) => {
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    if (response.ok) {
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ChannelFilters selected={channel} onChange={setChannel} />
        <div className="flex gap-2">
          <Button variant={view === 'all' ? 'default' : 'ghost'} onClick={() => setView('all')}>
            Todos
          </Button>
          <Button variant={view === 'pending' ? 'default' : 'ghost'} onClick={() => setView('pending')}>
            Pendientes
          </Button>
          <Button variant={view === 'in_progress' ? 'default' : 'ghost'} onClick={() => setView('in_progress')}>
            En preparación
          </Button>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-400">Actualizando…</p>}

      <div className="grid gap-4 md:grid-cols-3">
        {filtered.map((order) => (
          <OrderCard key={order.id} order={order} onAdvance={advance} />
        ))}
        {filtered.length === 0 && <p className="text-sm text-slate-400">Sin pedidos pendientes</p>}
      </div>
    </div>
  );
}
