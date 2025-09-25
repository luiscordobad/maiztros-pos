import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ORDER_STATES = [
  { label: "En cola", value: "queued" },
  { label: "Preparando", value: "in_kitchen" },
  { label: "Listo", value: "ready" },
  { label: "Entregado", value: "delivered" },
];

export default function KdsPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">KDS</p>
        <h1 className="text-4xl font-semibold">Gestión de cocina</h1>
        <p className="max-w-2xl text-muted-foreground">
          Organiza las órdenes por estado y sincroniza la producción en tiempo real. Esta pantalla sirve como base para conectar
          tu lógica con Supabase o cualquier otra API.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ORDER_STATES.map((state) => (
          <Card key={state.value} className="bg-card/80">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{state.label}</CardTitle>
              <Badge variant="outline" className="text-accent">
                {state.value}
              </Badge>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Conecta aquí los pedidos que correspondan a este estado y define acciones rápidas para moverlos.
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
