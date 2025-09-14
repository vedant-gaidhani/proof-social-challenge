  -- 0006_group_members.sql
  -- Create group_members join table and augment RLS for membership

  create table if not exists public.group_members (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.groups(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,
    role text not null default 'member' check (role in ('admin','member')),
    created_at timestamptz not null default now(),
    unique (group_id, user_id)
  );

  alter table public.group_members enable row level security;

  -- Membership-based policies
  -- Members can read groups they belong to
  drop policy if exists groups_select_member on public.groups;
  create policy groups_select_member on public.groups
    for select using (
      exists (
        select 1 from public.group_members gm
        where gm.group_id = id and gm.user_id = auth.uid()
      )
      or created_by = auth.uid()
    );

  -- Allow members with admin role or creator to update/delete
  drop policy if exists groups_update_member on public.groups;
  create policy groups_update_member on public.groups
    for update using (
      created_by = auth.uid() or exists (
        select 1 from public.group_members gm
        where gm.group_id = id and gm.user_id = auth.uid() and gm.role = 'admin'
      )
    );

  drop policy if exists groups_delete_member on public.groups;
  create policy groups_delete_member on public.groups
    for delete using (
      created_by = auth.uid() or exists (
        select 1 from public.group_members gm
        where gm.group_id = id and gm.user_id = auth.uid() and gm.role = 'admin'
      )
    );

  -- group_members policies
  create policy group_members_select_self on public.group_members
    for select using (user_id = auth.uid());

  -- Allow users to join groups themselves
  create policy group_members_insert_self on public.group_members
    for insert with check (user_id = auth.uid());

  -- Allow admins/creators to manage membership
  create policy group_members_admin_update on public.group_members
    for update using (
      exists (
        select 1 from public.groups g
        join public.group_members gm on gm.group_id = g.id and gm.user_id = auth.uid() and gm.role = 'admin'
        where g.id = group_id
      ) or exists (
        select 1 from public.groups g where g.id = group_id and g.created_by = auth.uid()
      )
    );

  create policy group_members_admin_delete on public.group_members
    for delete using (
      exists (
        select 1 from public.groups g
        join public.group_members gm on gm.group_id = g.id and gm.user_id = auth.uid() and gm.role = 'admin'
        where g.id = group_id
      ) or exists (
        select 1 from public.groups g where g.id = group_id and g.created_by = auth.uid()
      )
    );

  -- Extend challenges policies to group membership
  drop policy if exists challenges_select_member on public.challenges;
  create policy challenges_select_member on public.challenges
    for select using (
      exists (
        select 1 from public.group_members gm
        where gm.group_id = group_id and gm.user_id = auth.uid()
      )
      or creator_id = auth.uid()
    );

  drop policy if exists challenges_insert_member on public.challenges;
  create policy challenges_insert_member on public.challenges
    for insert with check (
      creator_id = auth.uid() and exists (
        select 1 from public.group_members gm
        where gm.group_id = group_id and gm.user_id = auth.uid()
      )
    );

  drop policy if exists challenges_update_member on public.challenges;
  create policy challenges_update_member on public.challenges
    for update using (
      creator_id = auth.uid() or exists (
        select 1 from public.group_members gm
        where gm.group_id = group_id and gm.user_id = auth.uid() and gm.role = 'admin'
      )
    );

  drop policy if exists challenges_delete_member on public.challenges;
  create policy challenges_delete_member on public.challenges
    for delete using (
      creator_id = auth.uid() or exists (
        select 1 from public.group_members gm
        where gm.group_id = group_id and gm.user_id = auth.uid() and gm.role = 'admin'
      )
    );

