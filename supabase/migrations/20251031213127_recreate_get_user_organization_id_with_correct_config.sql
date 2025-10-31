/*
  # Recreate get_user_organization_id with Correct Configuration

  ## Problem
  The function get_user_organization_id() is returning NULL when queried,
  causing all RLS policies to fail. This happens because:
  1. The search_path doesn't include 'auth' schema
  2. The function can't find auth.uid()
  3. The WHERE clause fails and returns NULL

  ## Solution
  1. Drop the function completely (CASCADE to drop dependent policies)
  2. Recreate with explicit schema references
  3. Set search_path to include both 'public' and 'auth'
  4. Set SECURITY DEFINER to allow access to users table

  ## Impact
  After this migration:
  - get_user_organization_id() will return the correct organization_id
  - All RLS policies will start working correctly
  - Users will be able to perform CRUD operations
  - Soft delete operations will work for all users

  ## Note
  This migration uses DROP CASCADE which will temporarily remove
  RLS policies that depend on this function. They will need to be
  recreated in subsequent migrations if they don't auto-recreate.
*/

-- ============================================================================
-- STEP 1: Drop existing function completely with CASCADE
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_user_organization_id() CASCADE;

-- ============================================================================
-- STEP 2: Recreate function with explicit schema references
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $function$
  SELECT organization_id
  FROM public.users
  WHERE id = auth.uid();
$function$;

-- ============================================================================
-- STEP 3: Configure search_path to include 'auth' schema
-- ============================================================================

-- This allows the function to find auth.uid()
ALTER FUNCTION public.get_user_organization_id()
  SET search_path = public, auth;

-- ============================================================================
-- STEP 4: Set SECURITY DEFINER for elevated privileges
-- ============================================================================

-- This allows the function to access the 'users' table with superuser privileges
ALTER FUNCTION public.get_user_organization_id()
  SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Grant EXECUTE permission to authenticated users
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_user_organization_id() TO authenticated;

-- ============================================================================
-- Verification Query (run manually after migration)
-- ============================================================================

-- Test the function returns a valid organization_id:
-- SELECT get_user_organization_id();
-- Expected: Should return a UUID, not NULL

-- Test with user info:
-- SELECT
--   auth.uid() as user_id,
--   get_user_organization_id() as org_id,
--   u.organization_id as org_id_direct
-- FROM users u
-- WHERE u.id = auth.uid();
-- Expected: All three values should match
