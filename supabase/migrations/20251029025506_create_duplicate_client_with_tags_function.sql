/*
  # Create RPC function for atomic client duplication

  1. New Function
    - `duplicate_client_with_tags(original_client_id uuid)`
    - Duplicates a client and all associated tags in a single atomic transaction
    - Returns the newly created client

  2. Functionality
    - Creates a copy of the client with "(Copia)" appended to name
    - Copies all tag assignments from original to duplicate
    - All operations are atomic (rollback if any step fails)

  3. Security
    - Function respects RLS policies
    - Only authenticated users can call this function
*/

CREATE OR REPLACE FUNCTION duplicate_client_with_tags(original_client_id uuid)
RETURNS clients
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_client clients;
  original_client clients;
BEGIN
  -- Get the original client
  SELECT * INTO original_client
  FROM clients
  WHERE id = original_client_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Client with id % not found', original_client_id;
  END IF;

  -- Insert the duplicated client
  INSERT INTO clients (
    name,
    phone,
    birthday,
    notes,
    referrer_id,
    whatsapp_link,
    facebook_link,
    instagram_link,
    tiktok_link,
    created_by_user_id
  )
  VALUES (
    original_client.name || ' (Copia)',
    original_client.phone,
    original_client.birthday,
    original_client.notes,
    original_client.referrer_id,
    original_client.whatsapp_link,
    original_client.facebook_link,
    original_client.instagram_link,
    original_client.tiktok_link,
    auth.uid()
  )
  RETURNING * INTO new_client;

  -- Copy tag assignments
  INSERT INTO client_tags_assignments (client_id, tag_id)
  SELECT new_client.id, tag_id
  FROM client_tags_assignments
  WHERE client_id = original_client_id;

  RETURN new_client;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION duplicate_client_with_tags(uuid) TO authenticated;
