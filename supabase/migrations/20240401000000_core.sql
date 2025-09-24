create extension if not exists pgcrypto;

create type order_channel as enum ('counter','whatsapp','rappi','other');
create type order_status as enum ('pending','in_progress','ready','delivered','canceled');

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  phone text unique,
  name text,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  ticket_no bigserial,
  idempotency_key text unique,
  customer_id uuid references public.customers(id),
  channel order_channel not null default 'counter',
  status order_status not null default 'pending',
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  payment_method text,
  notes text,
  prepared_at timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  sku text not null,
  name text not null,
  qty int not null default 1,
  unit_price numeric(10,2) not null default 0,
  modifiers jsonb default '[]'::jsonb
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  provider text,
  amount numeric(10,2) not null,
  status text,
  ext_ref text,
  created_at timestamptz default now()
);

create table if not exists public.kds_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  from_status order_status,
  to_status order_status not null,
  changed_by uuid,
  changed_at timestamptz default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null,
  value numeric(10,2) not null,
  min_total numeric(10,2) default 0,
  active boolean default true,
  starts_at timestamptz,
  ends_at timestamptz
);

create table if not exists public.loyalty_points (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id),
  points int not null default 0,
  reason text,
  order_id uuid references public.orders(id),
  created_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_orders_created_at on public.orders(created_at);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_channel on public.orders(channel);
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_payments_order_id on public.payments(order_id);
create index if not exists idx_loyalty_customer on public.loyalty_points(customer_id);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
for each row execute function set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

create policy orders_admin_all on public.orders
  for all using ((auth.jwt() ->> 'role') = 'admin')
  with check ((auth.jwt() ->> 'role') in ('admin','cashier'));

create policy orders_cashier_insert on public.orders
  for insert with check ((auth.jwt() ->> 'role') in ('admin','cashier'));

create policy orders_cashier_update on public.orders
  for update using ((auth.jwt() ->> 'role') in ('admin','cashier') and (created_by is null or created_by = auth.uid()))
  with check ((auth.jwt() ->> 'role') in ('admin','cashier'));

create policy orders_kitchen_read on public.orders
  for select using ((auth.jwt() ->> 'role') in ('admin','cashier','kitchen'));

create policy orders_kitchen_update on public.orders
  for update using ((auth.jwt() ->> 'role') = 'kitchen')
  with check ((auth.jwt() ->> 'role') in ('admin','cashier','kitchen'));

create policy items_access on public.order_items
  for all using ((auth.jwt() ->> 'role') in ('admin','cashier','kitchen'))
  with check ((auth.jwt() ->> 'role') in ('admin','cashier'));

create policy payments_read on public.payments
  for select using ((auth.jwt() ->> 'role') in ('admin','cashier'));

create policy payments_write on public.payments
  for all using ((auth.jwt() ->> 'role') in ('admin','cashier'))
  with check ((auth.jwt() ->> 'role') in ('admin','cashier'));

create policy audit_insert on public.audit_logs
  for insert with check (true);

create policy audit_select_admin on public.audit_logs
  for select using ((auth.jwt() ->> 'role') = 'admin');

create or replace function dashboard_sales_by_hour(
  from_ts timestamptz,
  to_ts timestamptz,
  channels order_channel[],
  status_filter order_status default null
) returns table(bucket timestamptz, sales numeric, orders bigint)
language sql as $$
  select
    date_trunc('hour', created_at) as bucket,
    sum(total) as sales,
    count(*) as orders
  from public.orders
  where created_at between from_ts and to_ts
    and channel = any(coalesce(channels, array['counter','whatsapp','rappi','other']::order_channel[]))
    and status != 'canceled'
    and (status_filter is null or status = status_filter)
  group by 1
  order by 1;
$$;

create or replace function dashboard_top_products(
  from_ts timestamptz,
  to_ts timestamptz,
  channels order_channel[],
  status_filter order_status default null
) returns table(sku text, name text, units numeric, revenue numeric)
language sql as $$
  select
    oi.sku,
    oi.name,
    sum(oi.qty) as units,
    sum(oi.qty * oi.unit_price) as revenue
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.created_at between from_ts and to_ts
    and o.status != 'canceled'
    and (status_filter is null or o.status = status_filter)
    and o.channel = any(coalesce(channels, array['counter','whatsapp','rappi','other']::order_channel[]))
  group by 1,2
  order by revenue desc
  limit 5;
$$;

create or replace function dashboard_kpis(
  from_ts timestamptz,
  to_ts timestamptz,
  channels order_channel[],
  status_filter order_status default null
) returns json
language plpgsql as $$
declare
  result json;
  total_sales numeric := 0;
  total_orders integer := 0;
  delivery_orders integer := 0;
begin
  select coalesce(sum(total),0), count(*), count(*) filter (where channel != 'counter')
  into total_sales, total_orders, delivery_orders
  from public.orders
  where created_at between from_ts and to_ts
    and status != 'canceled'
    and channel = any(coalesce(channels, array['counter','whatsapp','rappi','other']::order_channel[]))
    and (status_filter is null or status = status_filter);

  result := json_build_object(
    'sales', total_sales,
    'tickets', total_orders,
    'average_ticket', case when total_orders > 0 then total_sales / total_orders else 0 end,
    'delivery_share', case when total_orders > 0 then delivery_orders::numeric / total_orders else 0 end
  );
  return result;
end;
$$;

create or replace function dashboard_orders_table(
  from_ts timestamptz,
  to_ts timestamptz,
  channels order_channel[],
  status_filter order_status default null
) returns table(
  id uuid,
  created_at timestamptz,
  ticket_no bigint,
  channel order_channel,
  status order_status,
  total numeric,
  payment_method text
) language sql as $$
  select id, created_at, ticket_no, channel, status, total, payment_method
  from public.orders
  where created_at between from_ts and to_ts
    and status != 'canceled'
    and channel = any(coalesce(channels, array['counter','whatsapp','rappi','other']::order_channel[]))
    and (status_filter is null or status = status_filter)
  order by created_at desc
  limit 200;
$$;

create or replace function dashboard_weekly_cohorts(
  from_ts timestamptz,
  to_ts timestamptz,
  channels order_channel[],
  status_filter order_status default null
) returns table(
  week text,
  new_customers bigint,
  returning_customers bigint
) language sql as $$
  with base as (
    select
      date_trunc('week', created_at) as week_start,
      customer_id,
      min(created_at) over (partition by customer_id) as first_order,
      created_at
    from public.orders
    where created_at between from_ts and to_ts
      and status != 'canceled'
      and channel = any(coalesce(channels, array['counter','whatsapp','rappi','other']::order_channel[]))
      and (status_filter is null or status = status_filter)
      and customer_id is not null
  )
  select
    to_char(week_start, 'IYYY-IW') as week,
    count(*) filter (where first_order between from_ts and to_ts and created_at = first_order) as new_customers,
    count(*) filter (where created_at > first_order) as returning_customers
  from base
  group by 1
  order by 1;
$$;
