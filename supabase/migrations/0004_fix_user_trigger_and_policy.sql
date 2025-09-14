-- Ensure the user creation trigger can insert into public.users under RLS
-- by using SECURITY DEFINER and adding an INSERT policy.

-- Recreate the function with SECURITY DEFINER and an explicit search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating public user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger idempotently
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add an INSERT policy so RLS allows inserting rows matching the auth user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.users
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Ensure users can SELECT their own row
CREATE POLICY "Users can select their own row"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Ensure users can UPDATE their own row
CREATE POLICY "Users can update their own row"
ON public.users
FOR UPDATE
USING (auth.uid() = id);