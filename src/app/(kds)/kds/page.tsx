import { KdsClient } from './KdsClient';

export default function KdsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Kitchen Display</h1>
        <p className="text-sm text-slate-400">Actualiza el estado de cada pedido y monitorea el SLA en tiempo real.</p>
      </div>
      <KdsClient />
    </div>
  );
}
