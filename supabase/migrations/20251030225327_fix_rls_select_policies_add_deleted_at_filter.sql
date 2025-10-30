/*
  # Fix RLS SELECT Policies to Filter Soft Deleted Records

  1. Problem
    - The multi-tenancy migration (20251030053338) overwrote the soft delete filters
    - SELECT policies are missing the `deleted_at IS NULL` condition
    - This causes deleted clients to remain visible in the UI

  2. Solution
    - Add `AND deleted_at IS NULL` to all SELECT policies
    - Applies to all tables with soft delete: clients, appointments, services,
      service_categories, commission_agents, commissions, cash_register_sessions,
      transaction_categories

  3. Impact
    - Deleted records will be automatically filtered from all SELECT queries
    - Users will not see soft-deleted records in the UI
    - Historical data remains intact for reports that explicitly query deleted records
*/

-- ====================
-- CLIENTS TABLE
-- ====================

DROP POLICY IF EXISTS "Users can view clients in own organization" ON clients;
CREATE POLICY "Users can view clients in own organization"
  ON clients FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    deleted_at IS NULL
  );

-- ====================
-- APPOINTMENTS TABLE
-- ====================

DROP POLICY IF EXISTS "Users can view appointments in own organization" ON appointments;
CREATE POLICY "Users can view appointments in own organization"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    deleted_at IS NULL
  );

-- ====================
-- SERVICES TABLE
-- ====================

DROP POLICY IF EXISTS "Users can view services in own organization" ON services;
CREATE POLICY "Users can view services in own organization"
  ON services FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    deleted_at IS NULL
  );

-- ====================
-- SERVICE_CATEGORIES TABLE
-- ====================

DROP POLICY IF EXISTS "Users can view categories in own organization" ON service_categories;
CREATE POLICY "Users can view categories in own organization"
  ON service_categories FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    deleted_at IS NULL
  );

-- ====================
-- COMMISSION_AGENTS TABLE
-- ====================

DROP POLICY IF EXISTS "Users can view agents in own organization" ON commission_agents;
CREATE POLICY "Users can view agents in own organization"
  ON commission_agents FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    deleted_at IS NULL
  );

-- ====================
-- COMMISSIONS TABLE
-- ====================

DROP POLICY IF EXISTS "Users can view commissions in own organization" ON commissions;
CREATE POLICY "Users can view commissions in own organization"
  ON commissions FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    deleted_at IS NULL
  );

-- ====================
-- CASH_REGISTER_SESSIONS TABLE
-- ====================

DROP POLICY IF EXISTS "Users can view sessions in own organization" ON cash_register_sessions;
CREATE POLICY "Users can view sessions in own organization"
  ON cash_register_sessions FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    deleted_at IS NULL
  );

-- ====================
-- TRANSACTION_CATEGORIES TABLE
-- ====================

DROP POLICY IF EXISTS "Users can view transaction categories in own organization" ON transaction_categories;
CREATE POLICY "Users can view transaction categories in own organization"
  ON transaction_categories FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    deleted_at IS NULL
  );
