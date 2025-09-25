'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ReturnContent() {
  const sp = useSearchParams();
  const status = sp.get('status');   // success | pending | failure
  const orderId = sp.get('orderId');

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Pago {status}</h1>
      <p>Orden: {orderId}</p>
      <p>
        Si el pago fue aprobado, tu pedido aparecerá como <b>pagado</b> en unos segundos.
        (También lo confirmamos por webhook aunque cierres esta página.)
      </p>
    </div>
  );
}

export default function ReturnPage() {
  return (
    <Suspense fallback={<div className="card">Procesando pago…</div>}>
      <ReturnContent />
    </Suspense>
  );
}
