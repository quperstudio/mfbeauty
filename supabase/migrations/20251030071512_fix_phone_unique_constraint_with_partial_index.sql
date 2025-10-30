/*
  # Fix Phone Unique Constraint with Partial Index

  1. Purpose
    - Replace the global UNIQUE constraint on clients.phone with a partial unique index
    - Allow phone number reuse after a client is soft-deleted (deleted_at IS NOT NULL)
    - Maintain phone uniqueness only among active clients within an organization
    - Prevent duplicate phone numbers from blocking new client creation

  2. Changes
    - Drop existing clients_phone_unique constraint
    - Create partial unique index on (organization_id, phone) WHERE deleted_at IS NULL
    - This ensures phone uniqueness only for active (non-deleted) clients
    - Archived clients with deleted_at set can have their phone numbers reused

  3. Business Logic
    - When a client is soft-deleted, their phone becomes available for new clients
    - Multiple archived clients can share the same phone number
    - Only one active client per organization can have a specific phone number
    - Supports data privacy and phone number recycling

  4. Technical Notes
    - Partial indexes are more efficient than full table unique constraints
    - The WHERE clause makes the constraint conditional
    - Query performance remains optimal with the composite index
*/

-- Drop the existing global unique constraint on phone
ALTER TABLE clients
DROP CONSTRAINT IF EXISTS clients_phone_unique;

-- Create a partial unique index that only enforces uniqueness on active clients
-- This allows soft-deleted clients' phone numbers to be reused
CREATE UNIQUE INDEX IF NOT EXISTS clients_phone_active_unique
ON clients(organization_id, phone)
WHERE deleted_at IS NULL;

-- Add a comment explaining the partial index strategy
COMMENT ON INDEX clients_phone_active_unique IS
'Partial unique index ensuring phone number uniqueness only among active (non-deleted) clients within each organization. Archived clients (deleted_at IS NOT NULL) are excluded from this constraint, allowing phone number reuse.';
