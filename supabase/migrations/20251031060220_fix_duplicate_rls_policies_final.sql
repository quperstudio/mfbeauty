/*
  # Fix Duplicate and Conflicting RLS Policies - FINAL FIX
  
  ## Problem Identified
  The database currently has DUPLICATE policies that conflict with each other:
  
  ### SELECT Policies (2 active - CONFLICT!)
  1. "Users can view all clients" - USING (true) ← ALLOWS ALL, including deleted
  2. "Users can view clients in own organization" - USING (org_id AND deleted_at IS NULL) ← Correct but ignored
  
  ### UPDATE Policies (2 active - CONFLICT!)
  1. "All authenticated users can update any client" - USING (true) ← Too permissive
  2. "Users can update clients in own organization" - USING (org_id) ← Correct but ignored
  
  ## Why This Causes Problems
  - PostgreSQL RLS uses OR logic: if ANY policy allows access, the action is permitted
  - The permissive policies override the restrictive ones
  - Result: Deleted clients remain visible, soft delete works but UI doesn't update
  
  ## Solution
  1. DROP all old/duplicate policies completely
  2. CREATE single, correct policy for each operation
  3. Ensure SELECT filters by deleted_at IS NULL
  4. Ensure UPDATE allows soft delete operations
  5. Keep DELETE restricted to administrators only
  
  ## Security Maintained
  - Organization isolation preserved
  - Soft delete filtering enforced
  - Administrator-only hard permissions kept
  - Audit trail via triggers unaffected
*/

-- ============================================================================
-- STEP 1: Clean slate - Remove ALL existing policies
-- ============================================================================

-- Remove all SELECT policies (including duplicates)
DROP POLICY IF EXISTS "Users can view all clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;
DROP POLICY IF EXISTS "Users can view clients in own organization" ON clients;

-- Remove all INSERT policies
DROP POLICY IF EXISTS "Users can create clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON clients;
DROP POLICY IF EXISTS "Users can create clients in own organization" ON clients;

-- Remove all UPDATE policies (including duplicates)
DROP POLICY IF EXISTS "Users can update clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
DROP POLICY IF EXISTS "All authenticated users can update any client" ON clients;
DROP POLICY IF EXISTS "Users can update own clients or admins can update any" ON clients;
DROP POLICY IF EXISTS "Users can update clients in own organization" ON clients;

-- Remove all DELETE policies
DROP POLICY IF EXISTS "Administrators can delete clients" ON clients;
DROP POLICY IF EXISTS "Only administrators can delete clients" ON clients;
DROP POLICY IF EXISTS "Administrators can delete clients in own organization" ON clients;

-- ============================================================================
-- STEP 2: Create single, definitive policy for each operation
-- ============================================================================

-- SELECT: View only active (non-deleted) clients in own organization
CREATE POLICY "clients_select_active_in_organization"
  ON clients FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id() 
    AND deleted_at IS NULL
  );

-- INSERT: Create clients in own organization
CREATE POLICY "clients_insert_in_organization"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

-- UPDATE: Modify clients in own organization (including soft delete)
-- USING: Can only update records in your organization
-- WITH CHECK: Simplified to allow soft delete operations
CREATE POLICY "clients_update_in_organization"
  ON clients FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (
    -- Allow the update if organization hasn't changed
    -- This permits soft delete (setting deleted_at) without complex validation
    organization_id = get_user_organization_id()
  );

-- DELETE: Only administrators can hard delete (not used in soft delete system)
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
    )
  );

-- ============================================================================
-- STEP 3: Add helpful comments for future reference
-- ============================================================================

COMMENT ON POLICY "clients_select_active_in_organization" ON clients IS 
  'Users can only view active (non-deleted) clients in their organization. The deleted_at IS NULL filter ensures soft-deleted records are hidden from normal queries.';

COMMENT ON POLICY "clients_insert_in_organization" ON clients IS 
  'Users can create new clients within their organization. The organization_id is typically set automatically via DEFAULT get_user_organization_id().';

COMMENT ON POLICY "clients_update_in_organization" ON clients IS 
  'Users can update any client in their organization, including performing soft deletes (setting deleted_at timestamp). The simplified WITH CHECK allows soft delete operations without complex validation.';

COMMENT ON POLICY "clients_delete_administrators_only" ON clients IS 
  'Only administrators can perform hard DELETE operations. Note: Normal deletion uses soft delete (UPDATE deleted_at), not DELETE.';
