
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const MODULES = [
  {
    href: "/kiosk",
    title: "Kiosk",
    description: "Diseña flujos auto-servicio y experiencias de venta asistida.",
  },
  {
    href: "/kds",
    title: "KDS",
    description: "Coordina la producción de cocina y sincroniza los estados de orden.",
  },
  {
    href: "/admin/dashboard",
    title: "Admin Dashboard",
    description: "Visualiza métricas operativas y decisiones clave en un solo lugar.",
  },
];

export default function Home() {
  return (
    <section className="space-y-10">
      <header className="space-y-3">
        <Badge className="uppercase tracking-[0.3em]">Maiztros</Badge>
        <h1 className="text-4xl font-semibold text-[color:var(--brand-brown)]">Suite POS lista para crecer</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Este proyecto base reúne los cimientos visuales y técnicos para construir tu ecosistema POS, KDS y kioscos sobre
          Next.js, Supabase y Tailwind.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {MODULES.map((module) => (
          <Card key={module.href} className="flex flex-col justify-between bg-card/80">
            <CardHeader>
              <CardTitle>{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Personaliza los componentes, conecta tu backend y lanza rápido nuevas experiencias para tus equipos y clientes.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="btn-primary w-full">
                <Link href={module.href}>Entrar</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
