/*
  # Add UNIQUE constraint to clients.phone

  1. Changes
    - Add UNIQUE constraint to clients.phone column
    - This prevents duplicate phone numbers at database level
    - Eliminates race conditions in client validation

  2. Security
    - No changes to RLS policies
    - Constraint is enforced at database level

  3. Notes
    - This migration will fail if duplicate phones already exist
    - Clean up duplicates manually before running if needed
*/

-- Add UNIQUE constraint to phone column
ALTER TABLE clients 
ADD CONSTRAINT clients_phone_unique UNIQUE (phone);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
