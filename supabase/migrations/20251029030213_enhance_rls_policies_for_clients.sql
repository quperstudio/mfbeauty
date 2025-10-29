/*
  # Enhance RLS policies for clients table

  1. Changes
    - Add policy for administrators to delete clients
    - Add policy to restrict client updates to own data or administrators
    - Improve existing policies for better security

  2. Security
    - Only administrators can delete clients
    - Users can only update clients they created (unless administrator)
    - All authenticated users can view clients
    - All authenticated users can create clients
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all clients" ON clients;
DROP POLICY IF EXISTS "Users can create clients" ON clients;
DROP POLICY IF EXISTS "Users can update clients" ON clients;
DROP POLICY IF EXISTS "Administrators can delete clients" ON clients;

-- Policy: All authenticated users can view clients
CREATE POLICY "Users can view all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

-- Policy: All authenticated users can create clients
CREATE POLICY "Users can create clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can update clients they created, administrators can update any
CREATE POLICY "Users can update own clients or admins can update any"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    created_by_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
    )
  )
  WITH CHECK (
    created_by_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
    )
  );

-- Policy: Only administrators can delete clients
CREATE POLICY "Only administrators can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
    )
  );
