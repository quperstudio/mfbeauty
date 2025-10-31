/*
  # Fix Authentication System - Complete Repair
  
  ## Problem Diagnosis
  - 2 users in auth.users but only 1 in public.users (1 orphaned user)
  - No RLS policies on users table (removed by CASCADE)
  - Trigger exists but may have failed due to RLS blocking
  - User "quperstudio@gmail.com" created recently but is orphaned
  
  ## Solution Steps
  1. Fix get_user_organization_id() function with correct search_path
  2. Fix handle_new_user() trigger function with correct configuration
  3. Recreate RLS policies on users table
  4. Sync orphaned users from auth.users to public.users
  
  ## Impact
  - All users will be able to login successfully
  - New user registrations will work automatically
  - RLS policies will protect data correctly
  - Multi-tenancy will work as designed
*/

-- ============================================================================
-- STEP 1: Fix get_user_organization_id() function
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_user_organization_id() CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT organization_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_organization_id() TO authenticated;

COMMENT ON FUNCTION public.get_user_organization_id() IS 
  'Returns the organization_id of the currently authenticated user. Uses SECURITY DEFINER to bypass RLS.';

-- ============================================================================
-- STEP 2: Fix handle_new_user() trigger function
-- ============================================================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_count integer;
  default_role text;
  new_org_id uuid;
  org_name text;
  org_slug text;
  email_prefix text;
BEGIN
  -- Count existing users in public.users to determine role
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  -- First user becomes administrator, subsequent users become employees
  IF user_count = 0 THEN
    default_role := 'administrator';
  ELSE
    default_role := 'employee';
  END IF;

  -- Extract business name from metadata or use default
  org_name := COALESCE(
    NEW.raw_user_meta_data->>'business_name',
    'Mi Negocio'
  );

  -- Generate unique slug from email
  email_prefix := split_part(NEW.email, '@', 1);
  org_slug := lower(regexp_replace(email_prefix, '[^a-zA-Z0-9]', '-', 'g'));
  
  -- Ensure slug is unique by appending random suffix if needed
  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) LOOP
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
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth.users insert
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Automatically creates organization and user record when a new user signs up via Supabase Auth. Uses SECURITY DEFINER to bypass RLS.';

-- Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 3: Recreate RLS policies on users table
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view users in their own organization
CREATE POLICY "Users can view users in own organization"
  ON public.users FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

-- Policy: Administrators can create users in their organization
CREATE POLICY "Administrators can create users in own organization"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
      AND users.organization_id = get_user_organization_id()
    )
  );

-- Policy: Administrators can update users in their organization
CREATE POLICY "Administrators can update users in own organization"
  ON public.users FOR UPDATE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
      AND users.organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
      AND users.organization_id = get_user_organization_id()
    )
  );

-- Policy: Administrators can delete users in their organization
CREATE POLICY "Administrators can delete users in own organization"
  ON public.users FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
      AND users.organization_id = get_user_organization_id()
    )
  );

-- ============================================================================
-- STEP 4: Sync orphaned users from auth.users to public.users
-- ============================================================================

DO $$
DECLARE
  orphan_record RECORD;
  new_org_id uuid;
  org_name text;
  org_slug text;
  email_prefix text;
  user_count integer;
  default_role text;
  synced_count integer := 0;
BEGIN
  -- Loop through all orphaned users
  FOR orphan_record IN 
    SELECT 
      au.id,
      au.email,
      au.created_at,
      au.raw_user_meta_data->>'full_name' AS full_name,
      au.raw_user_meta_data->>'business_name' AS business_name
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    -- Count existing users to determine role
    SELECT COUNT(*) INTO user_count FROM public.users;
    
    IF user_count = 0 THEN
      default_role := 'administrator';
    ELSE
      default_role := 'employee';
    END IF;

    -- Extract or generate organization name
    org_name := COALESCE(orphan_record.business_name, 'Mi Negocio');

    -- Generate unique slug from email
    email_prefix := split_part(orphan_record.email, '@', 1);
    org_slug := lower(regexp_replace(email_prefix, '[^a-zA-Z0-9]', '-', 'g'));
    
    -- Ensure slug is unique
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) LOOP
      org_slug := org_slug || '-' || floor(random() * 10000)::text;
    END LOOP;

    -- Create organization
    INSERT INTO public.organizations (name, business_name, slug, active, created_at)
    VALUES (
      org_name,
      org_name,
      org_slug,
      true,
      orphan_record.created_at
    )
    RETURNING id INTO new_org_id;

    -- Create user
    INSERT INTO public.users (id, email, full_name, role, active, organization_id, created_at)
    VALUES (
      orphan_record.id,
      orphan_record.email,
      COALESCE(orphan_record.full_name, 'Usuario'),
      default_role,
      true,
      new_org_id,
      orphan_record.created_at
    );

    synced_count := synced_count + 1;
    
    RAISE NOTICE 'Synced user: % (%) with organization: %', 
      orphan_record.email, orphan_record.id, org_name;
  END LOOP;

  RAISE NOTICE 'Total users synced: %', synced_count;
END $$;
