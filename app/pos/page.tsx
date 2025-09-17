
'use client';
import { useState } from "react";

type Step = 0|1|2|3|4|5|6|7;
export default function POS() {
  const [step, setStep] = useState<Step>(0);
  const [order, setOrder] = useState<any>({ service: null, items: [], notes: "", totals: { subtotal: 0, tip: 0, shipping: 0, total: 0 }});

  const next = () => setStep((s)=> (s < 7 ? (s+1 as Step) : s));
  const back = () => setStep((s)=> (s > 0 ? (s-1 as Step) : s));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">POS</h1>
      <div className="card">
        <div className="flex items-center justify-between">
          <span>Paso {step+1} / 8</span>
          <div className="space-x-2">
            {step > 0 && <button className="px-3 py-1 rounded bg-white/10" onClick={back}>Regresar</button>}
            {step < 7 && <button className="px-3 py-1 rounded bg-white/10" onClick={next}>Siguiente</button>}
          </div>
        </div>
      </div>
      <div className="card">
        <p className="opacity-75">Aquí irá tu flujo táctil (consumo, base, papas/maruchan/ramen, toppings, bebida, entrega, pago y confirmación) con la lógica de <b>no duplicar</b> al regresar.</p>
      </div>
    </div>
  );
}
