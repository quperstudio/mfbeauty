/*
  # Update RLS Policy for First Administrator Creation

  1. Purpose
    - Allow creation of the first administrator when no users exist
    - Maintain security for subsequent user creation (requires existing admin)
    - Fix "chicken and egg" problem with initial setup

  2. Changes
    - Drop existing "Administrators can create users" policy
    - Create new policy that allows:
      a) Creation when no users exist (first admin)
      b) Creation by existing administrators (subsequent users)

  3. Security
    - Maintains restriction that only administrators can create users
    - Special exception only applies when users table is empty
    - All other policies remain unchanged
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Administrators can create users" ON users;

-- Create updated policy that allows first administrator creation
CREATE POLICY "Administrators can create users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if no users exist (first administrator)
    (SELECT COUNT(*) FROM users) = 0
    OR
    -- Allow if current user is an active administrator
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );