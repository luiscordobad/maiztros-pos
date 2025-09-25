import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function KioskPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Kiosk</p>
        <h1 className="text-4xl font-semibold">Menú auto-servicio</h1>
        <p className="max-w-2xl text-muted-foreground">
          Diseña aquí la experiencia interactiva para tus comensales. Usa este espacio como punto de partida para categorías,
          promociones y upsells.
        </p>
      </header>

      <Tabs defaultValue="maiz" className="w-full">
        <TabsList>
          <TabsTrigger value="maiz">Maíz</TabsTrigger>
          <TabsTrigger value="bebidas">Bebidas</TabsTrigger>
          <TabsTrigger value="postres">Postres</TabsTrigger>
        </TabsList>
        {[
          { value: "maiz", label: "Especialidades con maíz" },
          { value: "bebidas", label: "Refrescos y bebidas artesanales" },
          { value: "postres", label: "Dulces para cerrar" },
        ].map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={`${tab.value}-${index}`}>
                  <CardHeader>
                    <CardTitle>Producto {index + 1}</CardTitle>
                    <CardDescription>{tab.label}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Describe aquí ingredientes, precio y combinaciones sugeridas.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Agregar</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
