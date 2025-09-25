import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

const tz = 'America/Mexico_City';

serve(async () => {
  const now = new Date();
  const start = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  const { data: orders } = await supabase
    .from('orders')
    .select('channel, payment_method, total, subtotal, status')
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
    .neq('status', 'canceled');

  const tickets = orders?.length ?? 0;
  const totalSales = orders?.reduce((sum, order) => sum + Number(order.total ?? 0), 0) ?? 0;
  const avg = tickets ? totalSales / tickets : 0;
  const deliveryCount = orders?.filter((o) => o.channel !== 'counter').length ?? 0;
  const deliveryShare = tickets ? deliveryCount / tickets : 0;

  const channelBreakdown = orders?.reduce<Record<string, number>>((acc, order) => {
    acc[order.channel] = (acc[order.channel] ?? 0) + 1;
    return acc;
  }, {}) ?? {};

  const paymentBreakdown = orders?.reduce<Record<string, number>>((acc, order) => {
    const key = order.payment_method ?? 'unknown';
    acc[key] = (acc[key] ?? 0) + Number(order.total ?? 0);
    return acc;
  }, {}) ?? {};

  const { data: top } = await supabase.rpc('dashboard_top_products', {
    from_ts: start.toISOString(),
    to_ts: end.toISOString(),
    channels: ['counter', 'whatsapp', 'rappi', 'other'],
    status_filter: null,
  });

  const summary = {
    branch: 'Principal',
    reportDate: start.toISOString(),
    totals: {
      sales: totalSales,
      tickets,
      averageTicket: avg,
      deliveryShare,
    },
    paymentBreakdown,
    channelBreakdown,
    topProducts: top ?? [],
  };

  await supabase.from('audit_logs').insert({
    action: 'DAILY_CLOSE',
    entity: 'order',
    meta: summary,
  });

  const message = `Cierre ${start.toLocaleDateString('es-MX')}\n` +
    `Ventas: $${totalSales.toFixed(2)}\n` +
    `Tickets: ${tickets}\n` +
    `Ticket promedio: $${avg.toFixed(2)}\n` +
    `Delivery: ${(deliveryShare * 100).toFixed(1)}%`;

  return new Response(JSON.stringify({ ok: true, message, summary }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
