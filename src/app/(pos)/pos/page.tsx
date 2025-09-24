import { PosClient } from './PosClient';

export default function PosPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Punto de venta</h1>
        <p className="text-sm text-slate-400">Agrega productos rápidamente, aplica cupones y cobra en segundos.</p>
      </div>
      <PosClient />
    </div>
  );
}
