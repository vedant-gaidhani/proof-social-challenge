-- 0005_groups_challenges.sql
-- Create groups and challenges tables matching app types, with RLS

create extension if not exists pgcrypto;

-- Groups table
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.users(id) on delete cascade,
  invite_code text not null unique,
  description text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Challenges table
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  description text,
  deadline timestamptz,
  status text not null default 'active' check (status in ('active','completed','expired')),
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS Enable
alter table public.groups enable row level security;
alter table public.challenges enable row level security;

-- Basic policies (member-based policies extended in group_members migration)
-- Groups: allow creator full access
create policy groups_select_creator on public.groups
  for select using (created_by = auth.uid());
create policy groups_insert_creator on public.groups
  for insert with check (created_by = auth.uid());
create policy groups_update_creator on public.groups
  for update using (created_by = auth.uid());
create policy groups_delete_creator on public.groups
  for delete using (created_by = auth.uid());

-- Challenges: allow creator full access
create policy challenges_select_creator on public.challenges
  for select using (creator_id = auth.uid());
create policy challenges_insert_creator on public.challenges
  for insert with check (creator_id = auth.uid());
create policy challenges_update_creator on public.challenges
  for update using (creator_id = auth.uid());
create policy challenges_delete_creator on public.challenges
  for delete using (creator_id = auth.uid());

-- Trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_groups_updated_at on public.groups;
create trigger set_groups_updated_at
before update on public.groups
for each row execute procedure public.set_updated_at();

drop trigger if exists set_challenges_updated_at on public.challenges;
create trigger set_challenges_updated_at
before update on public.challenges
for each row execute procedure public.set_updated_at();

