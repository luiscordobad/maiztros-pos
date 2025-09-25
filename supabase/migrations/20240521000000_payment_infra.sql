create extension if not exists "pgcrypto";

begin;
  alter table if exists public.orders
    add column if not exists paid_at timestamptz;

  create table if not exists public.payment_sessions (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders(id) on delete cascade,
    provider text not null,
    provider_session_id text,
    status text not null default 'pending',
    amount_cents integer not null check (amount_cents >= 0),
    currency text not null default 'MXN',
    error_code text,
    error_message text,
    created_at timestamptz not null default timezone('America/Mexico_City', now()),
    updated_at timestamptz not null default timezone('America/Mexico_City', now())
  );

  create index if not exists payment_sessions_order_id_idx on public.payment_sessions(order_id);
  create index if not exists payment_sessions_provider_idx on public.payment_sessions(provider);
  create index if not exists payment_sessions_status_idx on public.payment_sessions(status);

  create table if not exists public.order_requests (
    id uuid primary key default gen_random_uuid(),
    idempotency_key text not null,
    order_id uuid references public.orders(id) on delete set null,
    request_hash text not null,
    payload jsonb,
    created_at timestamptz not null default timezone('America/Mexico_City', now()),
    last_used_at timestamptz not null default timezone('America/Mexico_City', now())
  );

  create unique index if not exists order_requests_idempotency_key_key on public.order_requests(idempotency_key);
  create index if not exists order_requests_order_id_idx on public.order_requests(order_id);
  create index if not exists order_requests_last_used_at_idx on public.order_requests(last_used_at);
commit;
