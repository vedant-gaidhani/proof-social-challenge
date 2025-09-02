-- Create group_members table (many-to-many relationship)
CREATE TABLE public.group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role member_role DEFAULT 'member' NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- Create group invites table
CREATE TABLE public.group_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES public.users(id) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER DEFAULT 1,
    uses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_max_uses CHECK (max_uses > 0),
    CONSTRAINT valid_uses CHECK (uses >= 0 AND uses <= max_uses)
);

-- Create indexes for better performance
CREATE INDEX group_members_user_id_idx ON public.group_members(user_id);
CREATE INDEX group_members_group_id_idx ON public.group_members(group_id);
CREATE INDEX group_invites_code_idx ON public.group_invites(invite_code);

-- Enable Row Level Security
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- Group members policies
CREATE POLICY "Users can view group members of their groups"
    ON public.group_members FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members AS gm
            WHERE gm.group_id = group_id 
            AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Group admins can manage members"
    ON public.group_members FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_members.group_id = group_id 
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'admin'
        )
    );

-- Group invites policies
CREATE POLICY "Anyone can read invites using code"
    ON public.group_invites FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Group admins can create invites"
    ON public.group_invites FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_members.group_id = group_id 
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'admin'
        )
    );
