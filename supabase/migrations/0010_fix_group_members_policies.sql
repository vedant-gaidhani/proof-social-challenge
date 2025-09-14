-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view group members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;

-- Base member policy - users can always see groups they're in
CREATE POLICY "Users can view own membership"
    ON public.group_members FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Group creator policy - group creators can manage all members
CREATE POLICY "Group creators can manage members"
    ON public.group_members FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.groups 
            WHERE groups.id = group_id 
            AND groups.created_by = auth.uid()
        )
    );

-- Members can see other members in their groups
CREATE POLICY "Members can view other group members"
    ON public.group_members FOR SELECT
    TO authenticated
    USING (
        -- Can see if you're a member (already covered by base policy)
        user_id = auth.uid()
        OR
        -- Or if you're looking at members of a group you're in
        EXISTS (
            SELECT 1 FROM public.groups
            WHERE groups.id = group_id
            AND (
                groups.created_by = auth.uid()
                OR public.is_group_member(group_id)
            )
        )
    );

-- Admin operations policy - group admins can manage members with role check
CREATE OR REPLACE FUNCTION public.is_group_admin(gid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  uid uuid;
BEGIN
  -- Ensure we have an authenticated user
  uid := auth.uid();
  if uid is null then
    return false;
  end if;
  return exists (
    select 1 from public.group_members gm
    where gm.group_id = gid 
    and gm.user_id = uid
    and gm.role = 'admin'
  );
END;
$$;

-- Only authenticated role should be able to call this
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid) TO authenticated;

CREATE POLICY "Group admins can manage members"
    ON public.group_members FOR ALL
    TO authenticated
    USING (
        -- Check if the user is an admin of the group using the helper function
        public.is_group_admin(group_id)
        -- But don't allow admins to remove the group creator's membership
        AND NOT EXISTS (
            SELECT 1 FROM public.groups
            WHERE groups.id = group_id
            AND groups.created_by = user_id
        )
    );

-- Enable RLS on group_members table
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Policy for self-joining groups (through invites, to be implemented)
CREATE POLICY "Users can add themselves to groups"
    ON public.group_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
    );
