/*
  # Update Auto-Insert User Trigger to Create Organization

  1. Purpose
    - Enhance existing user creation trigger to automatically create organization
    - Generate unique slug from email for new organizations
    - Assign user to their newly created organization
    - Maintain backward compatibility with existing data

  2. Changes
    - Modify handle_new_user() function to create organization
    - Extract organization name from user metadata (business_name)
    - Generate slug from email if business_name not provided
    - Link user to newly created organization

  3. Security
    - Function runs with elevated privileges to bypass RLS
    - Safely handles organization creation
*/

-- Drop existing function to recreate with new logic
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create enhanced function to auto-insert user AND create organization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_count integer;
  default_role text;
  new_org_id uuid;
  org_name text;
  org_slug text;
  email_prefix text;
BEGIN
  -- Count existing users to determine if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  -- First user becomes administrator, subsequent users become employees
  IF user_count = 0 THEN
    default_role := 'administrator';
  ELSE
    default_role := 'employee';
  END IF;

  -- Extract business name from metadata or generate from email
  org_name := COALESCE(
    NEW.raw_user_meta_data->>'business_name',
    'Mi Negocio'
  );

  -- Generate unique slug from email
  email_prefix := split_part(NEW.email, '@', 1);
  org_slug := lower(regexp_replace(email_prefix, '[^a-zA-Z0-9]', '-', 'g'));
  
  -- Ensure slug is unique by appending random suffix if needed
  WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = org_slug) LOOP
    org_slug := org_slug || '-' || floor(random() * 10000)::text;
  END LOOP;

  -- Create new organization for this user
  INSERT INTO public.organizations (name, business_name, slug, active, created_at)
  VALUES (
    org_name,
    org_name,
    org_slug,
    true,
    NOW()
  )
  RETURNING id INTO new_org_id;

  -- Insert new user into public.users table with organization_id
  INSERT INTO public.users (id, email, full_name, role, active, organization_id, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    default_role,
    true,
    new_org_id,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recreate trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
