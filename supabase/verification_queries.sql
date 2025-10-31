/*
  # Verification Queries for Client Soft Delete Fix

  Use these queries to verify the migration was successful and to diagnose any issues.
  Run these queries in the Supabase SQL Editor.
*/

-- ============================================================================
-- SECTION 1: Verify RLS Policies
-- ============================================================================

-- Query 1.1: List all UPDATE policies on clients table
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual AS using_clause,
  with_check AS with_check_clause
FROM pg_policies
WHERE tablename = 'clients'
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- Expected result: Two policies
-- 1. clients_update_administrators_full_access
-- 2. clients_update_employees_restricted

-- Query 1.2: List ALL policies on clients table (overview)
SELECT
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'clients'
ORDER BY cmd, policyname;

-- ============================================================================
-- SECTION 2: Verify Triggers and Functions
-- ============================================================================

-- Query 2.1: Verify deleted_by trigger exists and is active
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'clients'
  AND trigger_name = 'trigger_clients_deleted_by'
ORDER BY trigger_name;

-- Expected result: One row showing BEFORE UPDATE trigger

-- Query 2.2: Verify update_deleted_by_column function exists
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'update_deleted_by_column'
  AND routine_schema = 'public';

-- Expected result: One row showing FUNCTION with DEFINER security

-- Query 2.3: Verify get_user_organization_id function exists
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'get_user_organization_id'
  AND routine_schema = 'public';

-- ============================================================================
-- SECTION 3: Verify User Data
-- ============================================================================

-- Query 3.1: Check your user account details
-- IMPORTANT: Replace the email with your actual email
SELECT
  id,
  email,
  full_name,
  role,
  active,
  organization_id,
  created_at
FROM users
WHERE email = 'makeupmariselafelix@gmail.com';

-- Expected result:
-- - role = 'administrator'
-- - active = true
-- - organization_id = 'a0000000-0000-0000-0000-000000000001'

-- Query 3.2: Check if get_user_organization_id works
-- NOTE: This must be run while authenticated as your user in the app
SELECT get_user_organization_id() AS my_organization_id;

-- Expected result: 'a0000000-0000-0000-0000-000000000001'

-- ============================================================================
-- SECTION 4: Verify Client Data
-- ============================================================================

-- Query 4.1: List active clients in your organization
SELECT
  id,
  name,
  phone,
  email,
  organization_id,
  deleted_at,
  created_at
FROM clients
WHERE organization_id = 'a0000000-0000-0000-0000-000000000001'
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Query 4.2: List soft-deleted clients (if any)
SELECT
  id,
  name,
  phone,
  organization_id,
  deleted_at,
  deleted_by,
  created_at
FROM clients
WHERE organization_id = 'a0000000-0000-0000-0000-000000000001'
  AND deleted_at IS NOT NULL
ORDER BY deleted_at DESC
LIMIT 10;

-- Query 4.3: Count active vs deleted clients
SELECT
  COUNT(*) FILTER (WHERE deleted_at IS NULL) AS active_clients,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS deleted_clients,
  COUNT(*) AS total_clients
FROM clients
WHERE organization_id = 'a0000000-0000-0000-0000-000000000001';

-- ============================================================================
-- SECTION 5: Test Soft Delete (Manual Test)
-- ============================================================================

-- Query 5.1: Test soft delete on a single client
-- IMPORTANT: Replace 'CLIENT_ID_HERE' with an actual client ID from Query 4.1
-- NOTE: This must be run while authenticated as an administrator

-- Step 1: Find a test client
SELECT id, name, deleted_at
FROM clients
WHERE organization_id = 'a0000000-0000-0000-0000-000000000001'
  AND deleted_at IS NULL
LIMIT 1;

-- Step 2: Soft delete the client (replace CLIENT_ID_HERE)
-- UPDATE clients
-- SET deleted_at = now()
-- WHERE id = 'CLIENT_ID_HERE'
--   AND organization_id = get_user_organization_id();

-- Step 3: Verify deleted_at and deleted_by were set
-- SELECT id, name, deleted_at, deleted_by
-- FROM clients
-- WHERE id = 'CLIENT_ID_HERE';

-- Step 4: Verify the client is no longer visible in normal queries
-- SELECT id, name
-- FROM clients
-- WHERE id = 'CLIENT_ID_HERE'
--   AND deleted_at IS NULL;
-- Expected: No results (client is soft-deleted)

-- ============================================================================
-- SECTION 6: Troubleshooting Queries
-- ============================================================================

-- Query 6.1: Check if there are any duplicate or conflicting policies
SELECT
  tablename,
  cmd,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE tablename = 'clients'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1;

-- Expected result: UPDATE should have 2 policies (admin + employee)
-- If you see more than 2 for UPDATE, there might be duplicate policies

-- Query 6.2: Check RLS is enabled on clients table
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'clients'
  AND schemaname = 'public';

-- Expected result: rls_enabled = true

-- Query 6.3: View the actual SQL of the policies (detailed)
SELECT
  policyname,
  cmd,
  pg_get_expr(qual, 'clients'::regclass) AS using_expression,
  pg_get_expr(with_check, 'clients'::regclass) AS with_check_expression
FROM pg_policy
WHERE polrelid = 'clients'::regclass
  AND polcmd = 'w' -- 'w' means UPDATE in pg_policy
ORDER BY policyname;

-- ============================================================================
-- SECTION 7: Post-Test Cleanup (Optional)
-- ============================================================================

-- Query 7.1: Restore a soft-deleted client (for testing)
-- IMPORTANT: Replace 'CLIENT_ID_HERE' with the ID of a soft-deleted client
-- UPDATE clients
-- SET deleted_at = NULL, deleted_by = NULL
-- WHERE id = 'CLIENT_ID_HERE'
--   AND organization_id = get_user_organization_id();

-- ============================================================================
-- NOTES
-- ============================================================================

/*
  Common Issues and Solutions:

  1. "0 rows affected" on bulk delete:
     - Check Query 3.1 to verify user is administrator
     - Check Query 3.2 to verify get_user_organization_id() returns correct ID
     - Check Query 1.1 to verify both policies exist

  2. "Permission denied" error:
     - User might not be administrator
     - User might be inactive (active = false)
     - Organization ID mismatch

  3. deleted_by is NULL after soft delete:
     - Check Query 2.1 to verify trigger exists
     - Check Query 2.2 to verify function exists
     - Trigger might not be firing due to SECURITY DEFINER issues

  4. Soft-deleted clients still visible:
     - Check frontend query includes WHERE deleted_at IS NULL
     - Check Query 1.1 to verify SELECT policy filters deleted_at
     - Clear browser cache and reload
*/
