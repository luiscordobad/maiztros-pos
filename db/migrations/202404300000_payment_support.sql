alter table public.orders add column if not exists paid_at timestamptz;

create table if not exists public.payment_sessions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  provider text not null default 'mp',
  preference_id text,
  init_point text,
  status text default 'pending',
  created_at timestamptz default now()
);
create index if not exists idx_payment_sessions_order on public.payment_sessions(order_id);

create table if not exists public.order_requests (
  id bigserial primary key,
  idempotency_key text unique not null,
  order_id uuid references public.orders(id),
  created_at timestamptz default now()
);
