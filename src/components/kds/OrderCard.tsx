'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { KdsOrder } from '@/lib/kds/types';

const SLA_THRESHOLDS = {
  ok: 6 * 60 * 1000,
  warning: 10 * 60 * 1000,
};

interface OrderCardProps {
  order: KdsOrder;
  onAdvance: (orderId: string, next: KdsOrder['status']) => void;
}

const nextStatus: Record<KdsOrder['status'], KdsOrder['status'] | null> = {
  pending: 'in_progress',
  in_progress: 'ready',
  ready: null,
};

export function OrderCard({ order, onAdvance }: OrderCardProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = useMemo(() => {
    const start = new Date(order.created_at).getTime();
    const end = order.ready_at ? new Date(order.ready_at).getTime() : now;
    return Math.max(end - start, 0);
  }, [now, order.created_at, order.ready_at]);

  const statusColor = useMemo(() => {
    if (elapsed <= SLA_THRESHOLDS.ok) return 'bg-emerald-500/30';
    if (elapsed <= SLA_THRESHOLDS.warning) return 'bg-amber-500/30';
    return 'bg-rose-500/30';
  }, [elapsed]);

  const formatElapsed = () => {
    const seconds = Math.round(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const next = nextStatus[order.status];

  return (
    <div className={`rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg ${statusColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Ticket #{order.ticket_no ?? order.id.slice(0, 6)}</h3>
          <p className="text-sm text-slate-300">Canal: {order.channel}</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium">{formatElapsed()}</span>
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {order.items.map((item, index) => (
          <li key={index}>
            <span className="font-medium">{item.qty}×</span> {item.name}
          </li>
        ))}
      </ul>
      {next && (
        <Button className="mt-4 w-full" onClick={() => onAdvance(order.id, next)}>
          Marcar como {next === 'in_progress' ? 'En preparación' : 'Listo'}
        </Button>
      )}
    </div>
  );
}
