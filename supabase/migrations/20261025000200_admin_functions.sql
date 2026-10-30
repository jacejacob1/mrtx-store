-- Functions behind the admin dashboard. Server-only (revoked from the
-- public roles); the app calls them after requireAdmin() has passed.

-- Stock edits apply the *difference* the admin made, not an absolute
-- number. If an order sells a tee while the admin has the editor open,
-- their save doesn't silently undo that sale.
create or replace function public.admin_adjust_stock(p_slug text, p_size text, p_from integer, p_to integer)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if p_to < 0 or p_to > 99999 then raise exception 'BAD_STOCK'; end if;
  update public.variants set stock = greatest(0, stock + (p_to - p_from))
   where product_slug = p_slug and size = p_size
   returning stock into n;
  if not found then raise exception 'UNKNOWN_VARIANT:%:%', p_slug, p_size; end if;
  return n;
end $$;

-- Order status changes, with only the transitions that make sense.
--   confirm  cod_pending                              → confirmed
--   ship     confirmed                                → shipped   (AWB optional)
--   deliver  shipped                                  → delivered
--   cancel   pending_payment | cod_pending | COD confirmed → cancelled, stock returned
--   refund   confirmed | shipped | delivered | refund_requested → refunded
--            (stock returned only if p_restock and the order had taken stock)
-- The Razorpay refund itself happens in the app *before* calling 'refund'.
create or replace function public.admin_order_action(p_order uuid, p_action text, p_awb text default null, p_restock boolean default true)
returns public.orders language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'NO_ORDER'; end if;

  if p_action = 'confirm' and o.status = 'cod_pending' then
    update public.orders set status = 'confirmed' where id = p_order returning * into o;

  elsif p_action = 'ship' and o.status = 'confirmed' then
    update public.orders set status = 'shipped', shipped_at = now(), awb = nullif(trim(p_awb), '')
     where id = p_order returning * into o;

  elsif p_action = 'deliver' and o.status = 'shipped' then
    update public.orders set status = 'delivered', delivered_at = now() where id = p_order returning * into o;

  elsif p_action = 'cancel' and (o.status in ('pending_payment', 'cod_pending')
                                 or (o.status = 'confirmed' and o.method = 'cod')) then
    perform public.restock(p_order);
    update public.orders set status = 'cancelled', cancelled_at = now() where id = p_order returning * into o;

  elsif p_action = 'refund' and o.status in ('confirmed', 'shipped', 'delivered', 'refund_requested') then
    if p_restock and o.status <> 'refund_requested' then
      perform public.restock(p_order);
    end if;
    update public.orders set status = 'refunded', refunded_at = now() where id = p_order returning * into o;

  else
    raise exception 'BAD_TRANSITION:%:%', o.status, p_action;
  end if;
  return o;
end $$;

-- Numbers for the dashboard's front page.
create or replace function public.admin_overview()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'to_confirm', (select count(*) from orders where status = 'cod_pending'),
    'to_ship',    (select count(*) from orders where status = 'confirmed'),
    'to_refund',  (select count(*) from orders where status = 'refund_requested'),
    'today_orders', (select count(*) from orders
                      where created_at >= date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'
                        and status not in ('expired', 'pending_payment', 'cancelled')),
    'today_sales',  (select coalesce(sum(total_paise), 0) from orders
                      where created_at >= date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'
                        and status not in ('expired', 'pending_payment', 'cancelled', 'refunded')),
    'low_stock', (select coalesce(jsonb_agg(jsonb_build_object('sku', v.sku, 'name', p.name, 'size', v.size, 'stock', v.stock)
                                            order by v.stock, v.sku), '[]')
                    from variants v join products p on p.slug = v.product_slug
                   where v.stock <= 3)
  )
$$;

revoke execute on function public.admin_adjust_stock(text, text, integer, integer)      from public, anon, authenticated;
revoke execute on function public.admin_order_action(uuid, text, text, boolean)          from public, anon, authenticated;
revoke execute on function public.admin_overview()                                      from public, anon, authenticated;
