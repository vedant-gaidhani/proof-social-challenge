-- 0009_is_member_fn_and_policy_fix.sql
-- Provide SECURITY DEFINER helper to avoid RLS recursion, and rewrite policies to use it.

-- Helper function: check if current auth user is a member of a group, bypassing RLS on group_members
create or replace function public.is_group_member(gid uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  uid uuid;
begin
  -- Ensure we have an authenticated user
  uid := auth.uid();
  if uid is null then
    return false;
  end if;
  return exists (
    select 1 from public.group_members gm
    where gm.group_id = gid and gm.user_id = uid
  );
end;
$$;

-- Only authenticated role should be able to call this
grant execute on function public.is_group_member(uuid) to authenticated;

-- Recreate groups policies to use the helper
do $$ begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='groups' and policyname='groups_select_member') then
    drop policy groups_select_member on public.groups;
  end if;
end $$;

create policy groups_select_member on public.groups
  for select using (
    created_by = auth.uid() or public.is_group_member(id)
  );

do $$ begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='groups' and policyname='groups_update_member') then
    drop policy groups_update_member on public.groups;
  end if;
end $$;

create policy groups_update_member on public.groups
  for update using (
    created_by = auth.uid() or (
      -- allow admins later via separate mechanism; for now treat members as non-updaters
      false
    )
  );

do $$ begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='groups' and policyname='groups_delete_member') then
    drop policy groups_delete_member on public.groups;
  end if;
end $$;

create policy groups_delete_member on public.groups
  for delete using (
    created_by = auth.uid()
  );

-- Recreate challenges policies using the helper to avoid referencing group_members directly
do $$ begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='challenges' and policyname='challenges_select_member') then
    drop policy challenges_select_member on public.challenges;
  end if;
end $$;

create policy challenges_select_member on public.challenges
  for select using (
    creator_id = auth.uid() or public.is_group_member(group_id)
  );

do $$ begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='challenges' and policyname='challenges_insert_member') then
    drop policy challenges_insert_member on public.challenges;
  end if;
end $$;

create policy challenges_insert_member on public.challenges
  for insert with check (
    creator_id = auth.uid() and public.is_group_member(group_id)
  );

do $$ begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='challenges' and policyname='challenges_update_member') then
    drop policy challenges_update_member on public.challenges;
  end if;
end $$;

create policy challenges_update_member on public.challenges
  for update using (
    creator_id = auth.uid() or public.is_group_member(group_id)
  );

do $$ begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='challenges' and policyname='challenges_delete_member') then
    drop policy challenges_delete_member on public.challenges;
  end if;
end $$;

create policy challenges_delete_member on public.challenges
  for delete using (
    creator_id = auth.uid() or public.is_group_member(group_id)
  );

