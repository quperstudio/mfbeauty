/*
  # Add DEFAULT auth.uid() to created_by_user_id Column

  1. Changes
    - Add DEFAULT auth.uid() to created_by_user_id column in clients table
    - Update existing NULL values with the first administrator user
    - Ensures audit trail is always maintained automatically

  2. Benefits
    - Frontend no longer needs to manually set created_by_user_id
    - Impossible to create clients without audit information
    - Eliminates potential bugs from missing user assignment
    - Database enforces data integrity automatically

  3. Data Migration
    - Finds first administrator user in database
    - Assigns as created_by_user_id for any existing NULL records
    - Preserves existing non-NULL values (doesn't overwrite)

  4. Important Notes
    - DEFAULT only applies to NEW inserts after this migration
    - Existing records are updated in this migration
    - Frontend code should REMOVE created_by_user_id from schemas
*/

-- Step 1: Add DEFAULT auth.uid() to the column
-- This ensures all NEW clients get created_by_user_id automatically
ALTER TABLE clients
  ALTER COLUMN created_by_user_id
  SET DEFAULT auth.uid();

-- Step 2: Update existing NULL records with first administrator
-- This ensures historical data has audit trail
DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- Find the first administrator user
  SELECT id INTO v_admin_id
  FROM users
  WHERE role = 'administrator' AND active = true
  ORDER BY created_at ASC
  LIMIT 1;

  -- Only update if we found an admin and there are NULL records
  IF v_admin_id IS NOT NULL THEN
    UPDATE clients
    SET created_by_user_id = v_admin_id
    WHERE created_by_user_id IS NULL;

    RAISE NOTICE 'Updated % clients with created_by_user_id = %',
      (SELECT COUNT(*) FROM clients WHERE created_by_user_id = v_admin_id),
      v_admin_id;
  ELSE
    RAISE NOTICE 'No administrator found. NULL records remain unchanged.';
  END IF;
END $$;
