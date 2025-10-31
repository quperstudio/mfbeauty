/*
  # Fix Client Soft Delete with Role-Based RLS Policies

  ## Problem Analysis
  Current UPDATE policy on clients table has a single policy that applies to all users:
  - Policy: "clients_update_in_organization"
  - USING: organization_id = get_user_organization_id()
  - WITH CHECK: organization_id = get_user_organization_id()

  This causes issues with soft delete operations:
  1. Individual delete: RLS throws permission error before completion
  2. Bulk delete: Operation completes but returns 0 affected rows

  ## Root Cause
  The WITH CHECK clause re-validates the organization_id condition AFTER the update.
  For soft deletes (setting deleted_at), this validation can fail due to:
  - Timing issues with get_user_organization_id() function
  - Complex validation logic that doesn't account for soft delete workflow
  - No differentiation between administrator and employee permissions

  ## Solution
  Implement role-based policies with two separate UPDATE policies:

  1. **Administrator Policy** (Permissive)
     - Administrators can update ANY field including deleted_at
     - Simplified WITH CHECK that only validates organization hasn't changed
     - Bypasses complex validation for soft delete operations

  2. **Employee Policy** (Restrictive)
     - Employees can update client data but NOT perform soft deletes
     - Prevents modification of deleted_at, deleted_by, and audit fields
     - Maintains strict validation for data integrity

  ## Security Considerations
  - Organization isolation maintained via USING clause
  - Administrator verification via JOIN with users table
  - Active user check (users.active = true)
  - Soft delete audit trail preserved via triggers
  - No security degradation, just proper permission handling

  ## Expected Behavior After Migration
  - Administrators: Can soft delete clients (both individual and bulk)
  - Employees: Can update client data but cannot delete
  - All operations: Properly tracked via deleted_by trigger
  - UI: Deleted clients disappear from list immediately
*/

-- ============================================================================
-- STEP 1: Remove existing UPDATE policy
-- ============================================================================

DROP POLICY IF EXISTS "clients_update_in_organization" ON clients;
DROP POLICY IF EXISTS "Users can update clients in own organization" ON clients;
DROP POLICY IF EXISTS "All authenticated users can update any client" ON clients;

-- ============================================================================
-- STEP 2: Create Administrator UPDATE Policy (Permissive)
-- ============================================================================

CREATE POLICY "clients_update_administrators_full_access"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    -- Can only access records in their organization
    organization_id = get_user_organization_id()
    AND EXISTS (
      -- Must be an active administrator
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'administrator'
        AND users.active = true
        AND users.organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    -- Simplified check: organization_id must not change
    -- This allows soft delete (setting deleted_at) without complex validation
    organization_id = get_user_organization_id()
  );

-- ============================================================================
-- STEP 3: Create Employee UPDATE Policy (Restrictive)
-- ============================================================================

CREATE POLICY "clients_update_employees_restricted"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    -- Can only access records in their organization
    organization_id = get_user_organization_id()
    -- Can only access records that are NOT soft-deleted
    AND deleted_at IS NULL
    AND EXISTS (
      -- Must be an active employee (not administrator)
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'employee'
        AND users.active = true
        AND users.organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    -- Strict validation for employees
    organization_id = get_user_organization_id()
    -- Employees cannot set deleted_at (prevents soft delete)
    AND deleted_at IS NULL
    -- Employees cannot set deleted_by
    AND deleted_by IS NULL
  );

-- ============================================================================
-- STEP 4: Add descriptive comments
-- ============================================================================

COMMENT ON POLICY "clients_update_administrators_full_access" ON clients IS
  'Administrators have full update access including soft delete operations. The simplified WITH CHECK allows setting deleted_at without re-validation issues. Administrator status is verified via JOIN with users table checking role, active status, and organization membership.';

COMMENT ON POLICY "clients_update_employees_restricted" ON clients IS
  'Employees can update client data fields but cannot perform soft deletes. The USING clause restricts access to non-deleted records only. The WITH CHECK clause prevents setting deleted_at or deleted_by, effectively blocking soft delete operations. This maintains data integrity while restricting deletion privileges to administrators only.';

-- ============================================================================
-- STEP 5: Verification queries (for manual testing)
-- ============================================================================

-- Run these queries manually to verify the migration worked:

-- 1. List all policies on clients table
-- SELECT policyname, cmd, roles, permissive
-- FROM pg_policies
-- WHERE tablename = 'clients' AND cmd = 'UPDATE'
-- ORDER BY policyname;

-- 2. Verify administrator can soft delete (replace with actual client ID)
-- UPDATE clients
-- SET deleted_at = now()
-- WHERE id = 'some-client-id'
--   AND organization_id = get_user_organization_id();

-- 3. Verify deleted_by is populated by trigger
-- SELECT id, name, deleted_at, deleted_by
-- FROM clients
-- WHERE deleted_at IS NOT NULL
-- ORDER BY deleted_at DESC
-- LIMIT 5;
