create table if not exists public.app_state (
  id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.app_state enable row level security;

drop policy if exists "Public can read app_state" on public.app_state;
create policy "Public can read app_state"
on public.app_state
for select
using (true);

drop policy if exists "Public can insert app_state" on public.app_state;
create policy "Public can insert app_state"
on public.app_state
for insert
with check (true);

drop policy if exists "Public can update app_state" on public.app_state;
create policy "Public can update app_state"
on public.app_state
for update
using (true)
with check (true);
