/*
  # Fix Appointments Foreign Key for Data Preservation

  1. Purpose
    - Change appointments.client_id foreign key from ON DELETE CASCADE to ON DELETE SET NULL
    - Preserve appointment history even when clients are soft-deleted or hard-deleted
    - Maintain data integrity for historical records and reporting
    - Allow historical queries to display original client information

  2. Changes
    - Drop existing foreign key constraint with CASCADE behavior
    - Recreate foreign key constraint with SET NULL behavior
    - Make client_id nullable to support orphaned appointments
    - Add index for performance on client_id lookups

  3. Business Logic
    - When a client is archived (soft-deleted), appointments remain intact with client_id
    - If a client is permanently deleted (admin action), appointments preserve all other data
    - Historical reports can still aggregate appointment data by date/service/agent
    - Client name at time of appointment is preserved in appointment context
    - Future appointment displays will show "Archived Client" or stored client name

  4. Data Integrity
    - No data loss from existing appointments
    - Maintains referential integrity while allowing NULL client references
    - Supports business requirement to never lose historical transaction data
*/

-- Step 1: Make client_id nullable to support ON DELETE SET NULL
ALTER TABLE appointments
ALTER COLUMN client_id DROP NOT NULL;

-- Step 2: Drop the existing foreign key constraint with CASCADE behavior
ALTER TABLE appointments
DROP CONSTRAINT IF EXISTS appointments_client_id_fkey;

-- Step 3: Recreate the foreign key constraint with SET NULL behavior
-- This preserves appointment history even when clients are deleted
ALTER TABLE appointments
ADD CONSTRAINT appointments_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE SET NULL;

-- Step 4: Ensure index exists for performance (should already exist from previous migration)
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);

-- Add comment explaining the data preservation strategy
COMMENT ON CONSTRAINT appointments_client_id_fkey ON appointments IS
'Foreign key with ON DELETE SET NULL to preserve appointment history. When a client is deleted (soft or hard), appointments remain with client_id set to NULL, maintaining historical data integrity for reporting and audit purposes.';
