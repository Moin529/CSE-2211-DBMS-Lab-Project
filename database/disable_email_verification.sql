-- Disable Email Verification and Allow Any Email Signups
-- Run this in your Supabase SQL Editor

-- 1. Disable email confirmations in auth settings
-- Go to Supabase Dashboard → Authentication → Settings
-- Turn OFF "Enable email confirmations"

-- 2. Update RLS policies to allow any user to insert into users table
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Allow users to update their own profile without email verification
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 4. Create a function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Update auth settings to allow any email domain
-- This is done in the Supabase Dashboard, not via SQL
-- Go to: Authentication → Settings → Email Templates
-- Set "Confirm signup" to disabled or customize as needed

-- Instructions for Supabase Dashboard:
-- 1. Go to Authentication → Settings
-- 2. Turn OFF "Enable email confirmations"
-- 3. Turn OFF "Enable email change confirmations" 
-- 4. Save changes 