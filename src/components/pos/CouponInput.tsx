'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePosStore } from '@/lib/pos/store';

interface CouponInputProps {
  orderId: string | null;
}

export function CouponInput({ orderId }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const applyDiscount = usePosStore((state) => state.applyDiscount);

  const applyCoupon = async () => {
    if (!orderId) {
      setError('Genera el pedido antes de aplicar un cupón');
      return;
    }
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/apply-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? 'No se pudo aplicar el cupón');
        return;
      }
      applyDiscount(json.discount_cents, json.code);
    } catch (err: any) {
      setError(err.message ?? 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Cupón" />
        <Button onClick={applyCoupon} disabled={loading || !code.trim()} variant="secondary">
          {loading ? 'Validando…' : 'Aplicar'}
        </Button>
      </div>
      {error && <p className="text-sm text-rose-300">{error}</p>}
    </div>
  );
}
