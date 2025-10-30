/*
  # Fix Security Definer Functions - Add SET search_path

  1. Security Issue
    - Functions with SECURITY DEFINER are vulnerable to search_path attacks
    - Supabase Security Audit shows "Function Search Path Mutable" warnings
    - Attackers could exploit this by manipulating the search_path

  2. Functions to Fix
    - get_user_organization_id()
    - assign_referrer_to_clients()
    - update_updated_at_column()
    - update_updated_by_column()

  3. Solution
    - Add `SET search_path = 'public', 'pg_temp'` to all SECURITY DEFINER functions
    - This ensures functions only search in public schema and temporary tables
    - Prevents privilege escalation attacks via malicious schema injection

  4. References
    - PostgreSQL Documentation: https://www.postgresql.org/docs/current/sql-createfunction.html
    - Supabase Security Best Practices
*/

-- ====================
-- FIX: get_user_organization_id
-- ====================

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
STABLE
AS $$
  SELECT organization_id
  FROM users
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ====================
-- FIX: assign_referrer_to_clients
-- ====================

CREATE OR REPLACE FUNCTION assign_referrer_to_clients(
  client_ids uuid[],
  new_referrer_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
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

-- ====================
-- FIX: update_updated_at_column
-- ====================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ====================
-- FIX: update_updated_by_column
-- ====================

CREATE OR REPLACE FUNCTION update_updated_by_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;
