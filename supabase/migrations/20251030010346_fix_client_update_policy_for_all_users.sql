/*
  # Fix Client UPDATE Policy - Allow All Authenticated Users

  1. Changes
    - Drop existing restrictive UPDATE policy
    - Create new policy allowing ANY authenticated user to update ANY client
    - This aligns with single-tenant business model where:
      * Administrator (business owner) can edit all clients
      * Employee (receptionist) can edit all clients
      * Only DELETE is restricted to administrators

  2. Security Rationale
    - Single business with shared client database
    - Both admin and employee need full edit access
    - Audit trail maintained via created_by_user_id
    - DELETE protection ensures only owner can remove data

  3. Important Notes
    - created_by_user_id is for audit purposes only, not access control
    - All authenticated users of the business can view and edit all clients
    - This policy will need modification if converting to multi-tenant SaaS
*/

-- Drop the existing restrictive UPDATE policy
DROP POLICY IF EXISTS "Users can update own clients or admins can update any" ON clients;

-- Create new simplified UPDATE policy for single-tenant use
CREATE POLICY "All authenticated users can update any client"
  ON clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
