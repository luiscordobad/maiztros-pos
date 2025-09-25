import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-accent">Panel Administrativo</p>
        <h1 className="text-3xl font-semibold text-[color:var(--brand-brown)]">Dashboard</h1>
        <p className="max-w-2xl text-muted-foreground">
          Visualiza indicadores clave de los módulos POS, KDS y Kiosk. Este tablero es un punto de partida para integrar tus
          métricas de negocio.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Ventas del día",
            description: "Integra tus totales diarios desde Supabase u otra fuente de datos.",
          },
          {
            title: "Órdenes en cocina",
            description: "Monitorea el estado de la preparación en tiempo real.",
          },
          {
            title: "Kioscos activos",
            description: "Conoce qué kioscos están atendiendo y su desempeño.",
          },
        ].map((item) => (
          <Card key={item.title} className="bg-card/80">
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[color:var(--brand-orange)]">—</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
