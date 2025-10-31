/*
  # Recreate Client RLS Policies - Simplified Without Role Restrictions

  ## Context
  The previous migration dropped get_user_organization_id() with CASCADE,
  which removed all RLS policies that depended on it. This migration
  recreates them with a simplified approach.

  ## Changes
  1. SELECT: View only active (non-deleted) clients in own organization
  2. INSERT: Create clients in own organization
  3. UPDATE: Modify clients in own organization (including soft delete)
     - NO role restriction - all authenticated users can soft delete
  4. DELETE: Hard delete restricted to administrators (not used in practice)

  ## Security Model
  - Multi-tenancy: All policies enforce organization_id isolation
  - Soft Delete: All users can soft delete (set deleted_at)
  - Hard Delete: Reserved for administrators only (emergency use)
  - Audit Trail: Triggers automatically set deleted_by and updated_by

  ## Design Philosophy
  This simplified approach:
  - Trusts all authenticated users within an organization
  - Relies on multi-tenancy for primary security
  - Makes soft delete accessible to everyone (it's recoverable)
  - Keeps hard delete restricted (it's permanent)
  - Can be easily modified in future if role-based restrictions are needed
*/

-- ============================================================================
-- STEP 1: Ensure no conflicting policies exist
-- ============================================================================

DROP POLICY IF EXISTS "clients_select_active_in_organization" ON clients;
DROP POLICY IF EXISTS "clients_insert_in_organization" ON clients;
DROP POLICY IF EXISTS "clients_update_in_organization" ON clients;
DROP POLICY IF EXISTS "clients_delete_administrators_only" ON clients;

-- Drop any old policies that might still exist
DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
DROP POLICY IF EXISTS "Administrators can delete clients" ON clients;
DROP POLICY IF EXISTS "Users can view all clients" ON clients;
DROP POLICY IF EXISTS "All authenticated users can update any client" ON clients;
DROP POLICY IF EXISTS "clients_update_administrators_full_access" ON clients;
DROP POLICY IF EXISTS "clients_update_employees_restricted" ON clients;

-- ============================================================================
-- STEP 2: Create SELECT policy - View active clients only
-- ============================================================================

CREATE POLICY "clients_select_active_in_organization"
  ON clients FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND deleted_at IS NULL
  );

COMMENT ON POLICY "clients_select_active_in_organization" ON clients IS
  'Users can view only active (non-deleted) clients within their organization. The deleted_at IS NULL filter ensures soft-deleted records are automatically hidden from queries.';

-- ============================================================================
-- STEP 3: Create INSERT policy - Create clients in own organization
-- ============================================================================

CREATE POLICY "clients_insert_in_organization"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

COMMENT ON POLICY "clients_insert_in_organization" ON clients IS
  'Users can create new clients within their organization. The organization_id is typically set automatically via DEFAULT get_user_organization_id().';

-- ============================================================================
-- STEP 4: Create UPDATE policy - No role restrictions for soft delete
-- ============================================================================

CREATE POLICY "clients_update_in_organization"
  ON clients FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

COMMENT ON POLICY "clients_update_in_organization" ON clients IS
  'All authenticated users in an organization can update client records, including performing soft deletes (setting deleted_at). No role restrictions - trusts all users within the organization. The simplified WITH CHECK allows soft delete operations without complex validation.';

-- ============================================================================
-- STEP 5: Create DELETE policy - Hard delete for administrators only
-- ============================================================================

CREATE POLICY "clients_delete_administrators_only"
  ON clients FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
      AND users.organization_id = get_user_organization_id()
    )
  );

COMMENT ON POLICY "clients_delete_administrators_only" ON clients IS
  'Only administrators can perform hard DELETE operations. This is for emergency use only - normal deletion uses soft delete (UPDATE deleted_at). This policy maintains a safety net for permanent data removal.';

-- ============================================================================
-- STEP 6: Verification queries (for manual testing after migration)
-- ============================================================================

-- List all policies on clients table:
-- SELECT
--   policyname,
--   cmd,
--   permissive,
--   roles
-- FROM pg_policies
-- WHERE tablename = 'clients'
-- ORDER BY cmd, policyname;

-- Expected output: 4 policies (SELECT, INSERT, UPDATE, DELETE)
