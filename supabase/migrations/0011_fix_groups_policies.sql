-- Drop existing group policies
DROP POLICY IF EXISTS groups_select_member ON public.groups;
DROP POLICY IF EXISTS groups_update_member ON public.groups;
DROP POLICY IF EXISTS groups_delete_member ON public.groups;

-- Enable RLS on groups table
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Base policy - users can see all groups
CREATE POLICY "Users can see all groups"
    ON public.groups FOR SELECT
    TO authenticated
    USING (true);

-- Policy for creating groups
CREATE POLICY "Users can create groups"
    ON public.groups FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND created_by = auth.uid()
    );

-- Policy for updating groups
CREATE POLICY "Users can update their groups"
    ON public.groups FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR public.is_group_admin(id)
    );

-- Policy for deleting groups
CREATE POLICY "Users can delete their groups"
    ON public.groups FOR DELETE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR public.is_group_admin(id)
    );

-- Drop potentially problematic group_members policies
DROP POLICY IF EXISTS group_members_admin_update ON public.group_members;
DROP POLICY IF EXISTS group_members_admin_delete ON public.group_members;
