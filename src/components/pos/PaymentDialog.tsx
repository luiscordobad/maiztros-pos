'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PaymentDialogProps {
  orderId: string;
  total: number;
  onPaid: () => void;
}

export function PaymentDialog({ orderId, total, onPaid }: PaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<'cash' | 'card' | 'mp'>('cash');
  const [cash, setCash] = useState(total.toFixed(2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amount = parseFloat(cash || '0');

  const submitPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      if (method === 'cash' && amount < total) {
        setError('Efectivo insuficiente');
        setLoading(false);
        return;
      }
      const response = await fetch(`/api/payments/${method === 'mp' ? 'mp/create' : 'create'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount: total, cashReceived: amount, provider: method }),
      });
      const json = (await response.json()) as Partial<{ error?: string; qr_url?: string }>;
      if (!response.ok) {
        setError(json.error ?? 'No se pudo registrar el pago');
        return;
      }
      if (method === 'mp') {
        if (json.qr_url) {
          window.open(json.qr_url, '_blank');
        }
        setOpen(false);
        return;
      }
      onPaid();
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)} className="w-full" size="lg">
        Cobrar
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-xl">
            <h2 className="text-xl font-semibold">Registrar pago</h2>
            <p className="mt-2 text-sm text-slate-400">Total: ${total.toFixed(2)}</p>
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                {(['cash', 'card', 'mp'] as const).map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={method === option ? 'default' : 'ghost'}
                    onClick={() => setMethod(option)}
                  >
                    {option === 'cash' && 'Efectivo'}
                    {option === 'card' && 'Tarjeta'}
                    {option === 'mp' && 'Mercado Pago'}
                  </Button>
                ))}
              </div>
              {method === 'cash' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-200">Efectivo recibido</label>
                  <Input value={cash} onChange={(event) => setCash(event.target.value)} type="number" min="0" step="0.01" />
                </div>
              )}
              {error && <p className="text-sm text-rose-400">{error}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={submitPayment} disabled={loading}>
                {loading ? 'Procesando…' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
