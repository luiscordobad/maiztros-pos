# Maiztros Platform

POS, Dashboard y KDS construidos con Next.js (App Router), TypeScript y Supabase.

## Requisitos

- Node 18+
- Supabase proyecto con la migración incluida en `supabase/migrations/20240401000000_core.sql`.
- Variables de entorno en `.env.local`:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
  NEXT_PUBLIC_SUPABASE_ANON_KEY="public-anon-key"
  SUPABASE_SERVICE_ROLE_KEY="service-role-key"
  FEATURE_LOYALTY=true
  FEATURE_COUPONS=true
  FEATURE_QR_MP=true
  ```

## Scripts

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
```

> Si utilizas npm o yarn ajusta los comandos según tu gestor.

## Estructura

- `src/app/(admin)/dashboard`: Dashboard con KPIs, filtros, exportaciones y cohortes.
- `src/app/(pos)/pos`: Punto de venta con favoritos, búsqueda, cupones y flujo de pago (efectivo/tarjeta/QR mock Mercado Pago).
- `src/app/(kds)/kds`: Kitchen Display System con SLA, filtro de canales y cambio de estados auditado.
- `src/app/api/**`: Handlers para órdenes, pagos, cupones y endpoints del dashboard.
- `src/components/**`: Componentes compartidos basados en shadcn/ui.
- `supabase/migrations`: Esquema y funciones necesarias.
- `supabase/functions/daily-close`: Edge Function para el cierre diario automático (ejecutar 23:59 MX).

## Cierre diario automático

1. Despliega la función `daily-close` en Supabase (`supabase functions deploy daily-close --no-verify-jwt`).
2. Crea un cron job (Scheduled Trigger) en Supabase o Vercel apuntando a la URL de la función a las 23:59 hora de Ciudad de México.
3. La función genera un resumen en `audit_logs` (acción `DAILY_CLOSE`) y entrega un mensaje listo para WhatsApp.

## QA

- Ejecuta `pnpm lint` antes de subir cambios.
- Lighthouse objetivo: ≥85 en `/dashboard`, `/pos` y `/kds`.
- Flujos críticos cubiertos: crear pedido con cupón, cobrar, visualizar en dashboard, actualizar en KDS y generar cierre.

