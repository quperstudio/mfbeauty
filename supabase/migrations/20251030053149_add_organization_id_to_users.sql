/*
  # Add Organization ID to Users Table

  1. Changes
    - Add `organization_id` column to `users` table
    - Create initial organization for existing users
    - Create helper function to get user's organization ID
    - Update RLS policies to filter by organization

  2. Migration Steps
    - Create default organization "Mi Salón"
    - Add organization_id column (nullable first)
    - Assign all existing users to default organization
    - Make organization_id NOT NULL
    - Create helper function get_user_organization_id()

  3. Security
    - Update users RLS policies to filter by organization
*/

-- Step 1: Create default organization for existing data
INSERT INTO organizations (id, name, business_name, slug, active)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Mi Salón',
  'Mi Salón de Belleza',
  'mi-salon-default',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Add organization_id column to users (nullable first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE users ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 3: Assign all existing users to default organization
UPDATE users 
SET organization_id = 'a0000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;

-- Step 4: Make organization_id NOT NULL
ALTER TABLE users ALTER COLUMN organization_id SET NOT NULL;

-- Step 5: Create index on organization_id
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);

-- Step 6: Create helper function to get user's organization ID
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id
  FROM users
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Step 7: Drop old RLS policies on users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Administrators can create users" ON users;
DROP POLICY IF EXISTS "Administrators can update users" ON users;
DROP POLICY IF EXISTS "Administrators can delete users" ON users;

-- Step 8: Create new RLS policies with organization filtering
CREATE POLICY "Users can view users in own organization"
  ON users FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Administrators can create users in own organization"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
      AND users.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Administrators can update users in own organization"
  ON users FOR UPDATE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
      AND users.organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
      AND users.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Administrators can delete users in own organization"
  ON users FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
      AND users.organization_id = get_user_organization_id()
    )
  );
