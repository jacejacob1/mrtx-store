-- MRTX store core: catalogue, stock, orders, payments.
--
-- Rules this schema enforces:
--   * The database is the source of truth for price and stock. The
--     browser sends slugs, sizes and quantities, never amounts.
--   * Stock is decremented the moment an order is placed (a hold). A
--     prepaid order that isn't paid within 15 minutes expires and the
--     stock comes back. COD orders hold stock until confirmed or cancelled.
--   * All money is integer paise.
--   * Tables are locked to the server (service role). The public may read
--     the catalogue and stock counts, nothing else.
--
-- The August tables (orders, order_items, stock) are renamed to legacy_*,
-- not dropped — nothing is deleted without Jace's say-so.

-- ── keep the old tables out of the way ──────────────────────────────────
do $$
declare r record;
begin
  if to_regclass('public.order_items') is not null then alter table public.order_items rename to legacy_order_items; end if;
  if to_regclass('public.orders') is not null then alter table public.orders rename to legacy_orders; end if;
  if to_regclass('public.stock') is not null then alter table public.stock rename to legacy_stock; end if;
  if to_regtype('public.order_status') is not null then alter type public.order_status rename to legacy_order_status; end if;
  -- Their indexes keep their old names (orders_status_idx…) and would
  -- collide with the new tables', so prefix those too.
  for r in select indexname from pg_indexes
            where schemaname = 'public'
              and tablename in ('legacy_orders', 'legacy_order_items', 'legacy_stock')
              and indexname not like 'legacy\_%' loop
    execute format('alter index public.%I rename to %I', r.indexname, 'legacy_' || r.indexname);
  end loop;
end $$;
drop function if exists public.reserve_stock cascade;

-- ── catalogue ───────────────────────────────────────────────────────────
create table public.products (
  slug        text primary key,
  name        text not null,
  price_paise integer not null check (price_paise > 0),
  mrp_paise   integer check (mrp_paise is null or mrp_paise >= price_paise),
  active      boolean not null default true,
  sort        integer not null default 0
);

create table public.variants (
  sku          text primary key,                          -- MRTX-RMB-L
  product_slug text not null references public.products(slug) on update cascade,
  size         text not null check (size in ('S','M','L','XL','XXL')),
  stock        integer not null default 0 check (stock >= 0),
  unique (product_slug, size)
);

-- ── orders ──────────────────────────────────────────────────────────────
create type public.order_status as enum (
  'pending_payment',   -- prepaid, waiting for Razorpay
  'cod_pending',       -- COD, waiting for our confirmation call
  'confirmed',         -- paid, or COD confirmed: ready to pack
  'shipped',
  'delivered',
  'cancelled',
  'expired',           -- prepaid never paid; stock released
  'refund_requested',
  'refunded'
);

create type public.payment_method as enum ('online', 'cod');

create sequence public.order_number_seq start 1001;

create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  number              text not null unique default ('MRTX-' || nextval('public.order_number_seq')),
  status              public.order_status not null,
  method              public.payment_method not null,

  email               text not null,
  phone               text not null check (phone ~ '^[6-9][0-9]{9}$'),
  name                text not null,
  address1            text not null,
  address2            text,
  city                text not null,
  state               text not null,
  pincode             text not null check (pincode ~ '^[1-9][0-9]{5}$'),

  subtotal_paise      integer not null,
  shipping_paise      integer not null,
  cod_fee_paise       integer not null default 0,
  total_paise         integer not null,

  razorpay_order_id   text unique,
  razorpay_payment_id text unique,
  shiprocket_order_id text,
  awb                 text,

  created_at          timestamptz not null default now(),
  expires_at          timestamptz,                         -- prepaid holds only
  paid_at             timestamptz,
  shipped_at          timestamptz,
  delivered_at        timestamptz,
  cancelled_at        timestamptz,
  refunded_at         timestamptz,
  note                text
);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_phone_idx on public.orders (phone);

create table public.order_items (
  order_id     uuid not null references public.orders(id) on delete cascade,
  sku          text not null references public.variants(sku),
  product_slug text not null,
  name         text not null,       -- frozen at purchase time
  size         text not null,
  unit_paise   integer not null,    -- frozen at purchase time
  qty          integer not null check (qty between 1 and 10),
  primary key (order_id, sku)
);

-- Every Razorpay webhook, stored once. The id is Razorpay's event id, so
-- a retried webhook hits the primary key and is ignored.
create table public.payment_events (
  id          text primary key,
  type        text not null,
  order_id    uuid references public.orders(id),
  payload     jsonb not null,
  received_at timestamptz not null default now()
);

-- ── pricing rules (mirrored in src/lib/catalogue.ts for display only) ──
create or replace function public.shipping_for(subtotal integer)
returns integer language sql immutable as $$
  select case when subtotal >= 100000 then 0 else 9000 end   -- free at ₹1,000, else ₹90
$$;

create or replace function public.cod_fee()
returns integer language sql immutable as $$ select 0 $$;   -- ₹0 until decided

-- ── place an order: price it, hold the stock, all in one transaction ───
-- p_items: [{"slug":"remember","size":"L","qty":1}, ...]
create or replace function public.place_order(p_customer jsonb, p_items jsonb, p_method public.payment_method)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  o        public.orders;
  it       jsonb;
  v        public.variants;
  p        public.products;
  subtotal integer := 0;
  n        integer := 0;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_BAG';
  end if;

  -- Lock every variant first, in a fixed order, so two checkouts racing
  -- for the last L can't deadlock or both win.
  perform 1
     from public.variants lk
     join jsonb_to_recordset(p_items) as x(slug text, size text) on lk.product_slug = x.slug and lk.size = x.size
    order by lk.sku
      for update of lk;

  insert into public.orders (status, method, email, phone, name, address1, address2, city, state, pincode,
                             subtotal_paise, shipping_paise, cod_fee_paise, total_paise, expires_at)
  values (case when p_method = 'cod' then 'cod_pending'::order_status else 'pending_payment'::order_status end,
          p_method,
          lower(trim(p_customer->>'email')), trim(p_customer->>'phone'), trim(p_customer->>'name'),
          trim(p_customer->>'address1'), nullif(trim(p_customer->>'address2'), ''),
          trim(p_customer->>'city'), trim(p_customer->>'state'), trim(p_customer->>'pincode'),
          0, 0, 0, 0,
          case when p_method = 'online' then now() + interval '15 minutes' end)
  returning * into o;

  for it in select * from jsonb_array_elements(p_items) loop
    select * into v from public.variants
     where product_slug = it->>'slug' and size = it->>'size'
     for update;
    if not found then raise exception 'UNKNOWN_ITEM:%:%', it->>'slug', it->>'size'; end if;

    select * into p from public.products where slug = v.product_slug and active;
    if not found then raise exception 'NOT_FOR_SALE:%', v.product_slug; end if;

    n := (it->>'qty')::integer;
    if n is null or n < 1 or n > 10 then raise exception 'BAD_QTY:%', v.sku; end if;
    if v.stock < n then raise exception 'OUT_OF_STOCK:%:%', v.sku, v.stock; end if;

    update public.variants set stock = stock - n where sku = v.sku;
    insert into public.order_items (order_id, sku, product_slug, name, size, unit_paise, qty)
    values (o.id, v.sku, p.slug, p.name, v.size, p.price_paise, n);
    subtotal := subtotal + p.price_paise * n;
  end loop;

  update public.orders set
    subtotal_paise = subtotal,
    shipping_paise = public.shipping_for(subtotal),
    cod_fee_paise  = case when p_method = 'cod' then public.cod_fee() else 0 end,
    total_paise    = subtotal + public.shipping_for(subtotal)
                     + case when p_method = 'cod' then public.cod_fee() else 0 end
  where id = o.id
  returning * into o;

  return o;
end $$;

-- ── give stock back ─────────────────────────────────────────────────────
create or replace function public.restock(p_order uuid)
returns void language sql security definer set search_path = public as $$
  update public.variants v set stock = v.stock + i.qty
    from public.order_items i where i.order_id = p_order and i.sku = v.sku;
$$;

-- Cancel an order that hasn't shipped. Idempotent.
create or replace function public.cancel_order(p_order uuid, p_status public.order_status default 'cancelled')
returns public.orders language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order for update;
  if o.status in ('pending_payment', 'cod_pending', 'confirmed') then
    perform public.restock(p_order);
    update public.orders set status = p_status, cancelled_at = now() where id = p_order returning * into o;
  end if;
  return o;
end $$;

-- Mark a prepaid order paid. Idempotent: a second call changes nothing.
-- If the hold already expired but the money arrived anyway, the stock is
-- taken again if it's still there; otherwise the order is flagged for a
-- refund rather than silently overselling.
create or replace function public.mark_paid(p_order uuid, p_payment_id text)
returns public.orders language plpgsql security definer set search_path = public as $$
declare o public.orders; short integer;
begin
  select * into o from public.orders where id = p_order for update;
  if o.status = 'pending_payment' then
    update public.orders set status = 'confirmed', paid_at = now(), razorpay_payment_id = p_payment_id
     where id = p_order returning * into o;
  elsif o.status = 'expired' then
    select count(*) into short from public.order_items i join public.variants v on v.sku = i.sku
     where i.order_id = p_order and v.stock < i.qty;
    if short = 0 then
      update public.variants v set stock = v.stock - i.qty
        from public.order_items i where i.order_id = p_order and i.sku = v.sku;
      update public.orders set status = 'confirmed', paid_at = now(), razorpay_payment_id = p_payment_id
       where id = p_order returning * into o;
    else
      update public.orders set status = 'refund_requested', paid_at = now(), razorpay_payment_id = p_payment_id,
             note = 'Paid after hold expired and stock ran out — refund'
       where id = p_order returning * into o;
    end if;
  end if;
  return o;
end $$;

-- Release prepaid holds older than 15 minutes. Run every few minutes.
create or replace function public.release_expired()
returns integer language plpgsql security definer set search_path = public as $$
declare r record; n integer := 0;
begin
  for r in select id from public.orders
            where status = 'pending_payment' and expires_at < now()
            for update skip locked loop
    perform public.cancel_order(r.id, 'expired');
    n := n + 1;
  end loop;
  return n;
end $$;

-- ── security: server-only, except the public catalogue ────────────────
alter table public.products       enable row level security;
alter table public.variants       enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.payment_events enable row level security;

create policy "catalogue is public" on public.products for select to anon, authenticated using (active);
create policy "stock is public"     on public.variants for select to anon, authenticated using (true);
-- orders, order_items, payment_events: no policies → only the service role.

revoke execute on function public.place_order(jsonb, jsonb, public.payment_method) from public, anon, authenticated;
revoke execute on function public.mark_paid(uuid, text)                           from public, anon, authenticated;
revoke execute on function public.cancel_order(uuid, public.order_status)         from public, anon, authenticated;
revoke execute on function public.restock(uuid)                                   from public, anon, authenticated;
revoke execute on function public.release_expired()                               from public, anon, authenticated;
