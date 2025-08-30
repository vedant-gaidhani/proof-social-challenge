-- Create custom types
CREATE TYPE public.challenge_status AS ENUM ('active', 'completed', 'expired');

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    full_name TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create groups table
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES public.users(id) NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create challenges table
CREATE TABLE public.challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES public.users(id) NOT NULL,
    group_id UUID REFERENCES public.groups(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    deadline TIMESTAMP WITH TIME ZONE,
    category TEXT,
    status challenge_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX users_username_idx ON public.users(username);
CREATE INDEX users_email_idx ON public.users(email);
CREATE INDEX groups_invite_code_idx ON public.groups(invite_code);
CREATE INDEX challenges_group_id_idx ON public.challenges(group_id);
CREATE INDEX challenges_creator_id_idx ON public.challenges(creator_id);
CREATE INDEX challenges_status_idx ON public.challenges(status);

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read all user profiles
CREATE POLICY "Users can read all profiles"
    ON public.users FOR SELECT
    TO authenticated
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Groups are readable by members
CREATE POLICY "Groups are readable by all users"
    ON public.groups FOR SELECT
    TO authenticated
    USING (true);

-- Group creators can update their groups
CREATE POLICY "Creators can update groups"
    ON public.groups FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

-- Challenges are readable by group members
CREATE POLICY "Challenges are readable by all users"
    ON public.challenges FOR SELECT
    TO authenticated
    USING (true);

-- Challenge creators can update their challenges
CREATE POLICY "Creators can update challenges"
    ON public.challenges FOR UPDATE
    TO authenticated
    USING (auth.uid() = creator_id);

-- Set up updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_groups_updated_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_challenges_updated_at
    BEFORE UPDATE ON public.challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
