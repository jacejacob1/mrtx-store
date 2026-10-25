-- Drop 001 — five tees, festive offer ₹699 (MRP ₹1,299).
-- STOCK COUNTS ARE PLACEHOLDERS copied from src/lib/catalogue.ts.
-- Replace with the real counted numbers before launch:
--   update public.variants set stock = <n> where sku = 'MRTX-RMB-L';

insert into public.products (slug, name, price_paise, mrp_paise, sort) values
  ('remember',    'REMEMBER',    69900, 129900, 1),
  ('breathe',     'BREATHE',     69900, 129900, 2),
  ('fly-high',    'FLY HIGH',    69900, 129900, 3),
  ('solitude',    'SOLITUDE',    69900, 129900, 4),
  ('be-yourself', 'BE YOURSELF', 69900, 129900, 5)
on conflict (slug) do update
  set name = excluded.name, price_paise = excluded.price_paise, mrp_paise = excluded.mrp_paise, sort = excluded.sort;

insert into public.variants (sku, product_slug, size, stock) values
  ('MRTX-RMB-S','remember','S', 8), ('MRTX-RMB-M','remember','M',18), ('MRTX-RMB-L','remember','L',22), ('MRTX-RMB-XL','remember','XL',14), ('MRTX-RMB-XXL','remember','XXL',6),
  ('MRTX-BRT-S','breathe','S', 6),  ('MRTX-BRT-M','breathe','M',16),  ('MRTX-BRT-L','breathe','L',20),  ('MRTX-BRT-XL','breathe','XL',12),  ('MRTX-BRT-XXL','breathe','XXL',5),
  ('MRTX-FLY-S','fly-high','S', 7), ('MRTX-FLY-M','fly-high','M',17), ('MRTX-FLY-L','fly-high','L',21), ('MRTX-FLY-XL','fly-high','XL',13), ('MRTX-FLY-XXL','fly-high','XXL',5),
  ('MRTX-SOL-S','solitude','S', 6), ('MRTX-SOL-M','solitude','M',15), ('MRTX-SOL-L','solitude','L',19), ('MRTX-SOL-XL','solitude','XL',12), ('MRTX-SOL-XXL','solitude','XXL',4),
  ('MRTX-BYS-S','be-yourself','S', 6), ('MRTX-BYS-M','be-yourself','M',15), ('MRTX-BYS-L','be-yourself','L',18), ('MRTX-BYS-XL','be-yourself','XL',12), ('MRTX-BYS-XXL','be-yourself','XXL',4)
on conflict (sku) do nothing;   -- never overwrite real stock on a re-run
