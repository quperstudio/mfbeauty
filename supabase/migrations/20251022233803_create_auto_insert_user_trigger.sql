/*
  # Auto-Insert User Trigger

  1. Purpose
    - Automatically create a record in the public.users table when a new user signs up via auth.users
    - Ensures consistency between auth.users and public.users tables
    - Prevents authentication issues caused by missing user records

  2. Changes
    - Create trigger function that inserts into users table
    - Trigger executes AFTER INSERT on auth.users
    - Uses SECURITY DEFINER to bypass RLS policies
    - Sets default role to 'administrator' for first user, 'employee' for subsequent users

  3. Security
    - Function runs with elevated privileges to bypass RLS
    - Only executes on INSERT operations
    - Safely handles conflicts with ON CONFLICT DO NOTHING
*/

-- Create function to auto-insert user into public.users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_count integer;
  default_role text;
BEGIN
  -- Count existing users to determine if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  -- First user becomes administrator, subsequent users become employees
  IF user_count = 0 THEN
    default_role := 'administrator';
  ELSE
    default_role := 'employee';
  END IF;

  -- Insert new user into public.users table
  INSERT INTO public.users (id, email, full_name, role, active, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    default_role,
    true,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();