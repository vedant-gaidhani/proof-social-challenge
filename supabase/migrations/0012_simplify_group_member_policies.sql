-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own membership" ON public.group_members;
DROP POLICY IF EXISTS "Group creators can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Members can view other group members" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Users can add themselves to groups" ON public.group_members;

-- First create a helper function to check group permissions that bypasses RLS
CREATE OR REPLACE FUNCTION public.check_group_permissions(group_id_param uuid, operation text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    user_uid uuid;
BEGIN
    -- Get the current user ID
    user_uid := auth.uid();
    
    -- If no user is logged in, return false
    IF user_uid IS NULL THEN
        RETURN false;
    END IF;

    -- For viewing: allow if user is a member or group creator
    IF operation = 'view' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = group_id_param 
            AND (
                g.created_by = user_uid
                OR EXISTS (
                    SELECT 1 FROM public.group_members gm
                    WHERE gm.group_id = group_id_param
                    AND gm.user_id = user_uid
                )
            )
        );
    END IF;

    -- For managing: allow if user is group creator or admin
    IF operation = 'manage' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = group_id_param 
            AND (
                g.created_by = user_uid
                OR EXISTS (
                    SELECT 1 FROM public.group_members gm
                    WHERE gm.group_id = group_id_param
                    AND gm.user_id = user_uid
                    AND gm.role = 'admin'
                )
            )
        );
    END IF;

    RETURN false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_group_permissions(uuid, text) TO authenticated;

-- Simple policy for users to view their own memberships
CREATE POLICY "View own memberships"
ON public.group_members
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR 
    public.check_group_permissions(group_id, 'view')
);

-- Policy for group creators and admins to manage members
CREATE POLICY "Manage group members"
ON public.group_members
FOR ALL
TO authenticated
USING (
    -- Can manage if you're the group creator or admin
    public.check_group_permissions(group_id, 'manage')
)
WITH CHECK (
    -- Additional check for insert/update operations
    user_id != (
        SELECT created_by 
        FROM public.groups 
        WHERE id = group_id
    )
    AND
    public.check_group_permissions(group_id, 'manage')
);

-- Policy for users to join groups (this will be controlled by invite system later)
CREATE POLICY "Join groups"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
);

-- Ensure RLS is enabled
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
