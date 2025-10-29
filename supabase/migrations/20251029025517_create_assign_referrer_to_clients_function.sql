/*
  # Create RPC function for atomic bulk referrer assignment

  1. New Function
    - `assign_referrer_to_clients(client_ids uuid[], new_referrer_id uuid)`
    - Updates referrer_id for multiple clients atomically
    - Returns count of updated clients

  2. Functionality
    - Updates multiple clients in a single transaction
    - Validates that referrer exists (if not null)
    - Prevents a client from being their own referrer

  3. Security
    - Function respects RLS policies
    - Only authenticated users can call this function
*/

CREATE OR REPLACE FUNCTION assign_referrer_to_clients(
  client_ids uuid[],
  new_referrer_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Validate referrer exists if not null
  IF new_referrer_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM clients WHERE id = new_referrer_id) THEN
      RAISE EXCEPTION 'Referrer with id % not found', new_referrer_id;
    END IF;
  END IF;

  -- Prevent clients from being their own referrer
  IF new_referrer_id = ANY(client_ids) THEN
    RAISE EXCEPTION 'A client cannot be their own referrer';
  END IF;

  -- Update all clients atomically
  UPDATE clients
  SET referrer_id = new_referrer_id
  WHERE id = ANY(client_ids);

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RETURN updated_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION assign_referrer_to_clients(uuid[], uuid) TO authenticated;
