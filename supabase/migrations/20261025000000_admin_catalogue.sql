-- The catalogue moves into the database so the admin dashboard can edit it.
--
-- Images are stored as full records ({id, src, w, h, blur}) so the site
-- never has to look anything up: a photo that shipped with the site
-- (/media/shoots/0119.webp) and one uploaded from the dashboard
-- (https://…supabase.co/storage/v1/object/public/media/uploads/…) are
-- the same shape.

alter table public.products
  add column if not exists idx          text,
  add column if not exists tagline      text not null default '',
  add column if not exists body         text not null default '',
  add column if not exists garment_name text not null default 'white',
  add column if not exists garment_hex  text not null default '#f4f3ef' check (garment_hex ~ '^#[0-9a-fA-F]{6}$'),
  add column if not exists ground       text not null default 'light' check (ground in ('dark', 'light', 'red')),
  add column if not exists spec         text[] not null default '{}',
  add column if not exists photos       jsonb not null default '[]' check (jsonb_typeof(photos) = 'array'),
  add column if not exists chapter_id   text,
  add column if not exists art_front    jsonb,
  add column if not exists art_back     jsonb,
  add column if not exists sku_prefix   text,
  add column if not exists updated_at   timestamptz not null default now();

-- Keep the text sane: the dashboard validates too, but the database is the last word.
alter table public.products
  add constraint products_name_len    check (char_length(name) between 1 and 40),
  add constraint products_tagline_len check (char_length(tagline) <= 120),
  add constraint products_body_len    check (char_length(body) <= 1200);

-- Who may use the dashboard. Accounts themselves live in Supabase Auth
-- (Authentication → Users); this list is what turns an account into an admin.
create table if not exists public.admins (
  email      text primary key check (email = lower(email)),
  added_at   timestamptz not null default now()
);
alter table public.admins enable row level security;   -- no policies: server only

-- Uploaded photos and artwork. Public to read (they're on the website
-- anyway); only the server can create upload URLs, so only admins upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
