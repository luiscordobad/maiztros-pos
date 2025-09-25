import Link from 'next/link';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/pos', label: 'POS' },
  { href: '/kds', label: 'KDS' },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold mb-6">Maiztros Platform</h1>
      <p className="text-slate-300 mb-8 max-w-2xl">
        Accede al panel administrativo, terminal punto de venta y sistema de cocina para operar tu sucursal.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center font-medium transition hover:border-white/40 hover:bg-white/10"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
