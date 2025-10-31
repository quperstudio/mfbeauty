/*
  # Fix get_user_organization_id Search Path

  1. Problem
    The function `get_user_organization_id()` was returning NULL because
    its `search_path` was configured only as 'public', 'pg_temp'.
    This allowed it to find the 'users' table but NOT the 'auth.uid()' function.
    Without 'auth.uid()', the query `WHERE id = auth.uid()` failed and returned NULL.

  2. Impact
    - RLS policies using get_user_organization_id() always evaluated to FALSE
    - Users (even administrators) couldn't perform operations on clients
    - Soft delete operations failed with "permission denied" errors
    - Bulk operations showed "0 rows affected"

  3. Solution
    Update the `search_path` to include both:
    - 'public' (for the 'users' table)
    - 'auth' (for the 'uid()' function)

    This ensures RLS can correctly identify the authenticated user's organization.

  4. Verification
    After this migration:
    - get_user_organization_id() will return the correct organization_id
    - RLS policies will match correctly
    - Delete operations will work for administrators
    - All CRUD operations will respect multi-tenant isolation

  5. Note
    This fix supersedes the previous migration:
    20251030225350_fix_security_definer_functions_search_path.sql
    which had an incorrect search_path configuration.
*/

-- Fix the search_path to include 'auth' schema
ALTER FUNCTION public.get_user_organization_id()
  SET search_path = public, auth;

-- The function definition remains the same:
-- It queries the users table to find the organization_id
-- for the currently authenticated user (auth.uid())
