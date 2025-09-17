
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Maiztros POS</h1>
      <p>Starter listo para Vercel + Supabase. Selecciona un módulo:</p>
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/pos" className="card">POS</Link>
        <Link href="/kds" className="card">KDS</Link>
        <Link href="/dashboard" className="card">Dashboard</Link>
      </div>
    </div>
  );
}
