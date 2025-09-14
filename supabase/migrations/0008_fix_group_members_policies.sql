-- 0008_fix_group_members_policies.sql
-- Remove recursive admin policies on group_members to avoid infinite recursion

-- Drop potentially recursive policies if they exist
do $$
begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='group_members' and policyname='group_members_admin_update'
  ) then
    drop policy group_members_admin_update on public.group_members;
  end if;

  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='group_members' and policyname='group_members_admin_delete'
  ) then
    drop policy group_members_admin_delete on public.group_members;
  end if;
end $$;

-- Keep simple, safe policies: select own rows, insert self
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='group_members' and policyname='group_members_select_self'
  ) then
    create policy group_members_select_self on public.group_members for select using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='group_members' and policyname='group_members_insert_self'
  ) then
    create policy group_members_insert_self on public.group_members for insert with check (user_id = auth.uid());
  end if;
end $$;

-- Note: future admin membership management should be done via RPC with SECURITY DEFINER

