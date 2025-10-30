/*
  # Update RLS Policies to Exclude Soft Deleted Records

  1. Purpose
    - Modify all SELECT policies to filter out soft deleted records
    - Records with deleted_at IS NOT NULL are hidden from normal queries
    - Only affects SELECT policies (UPDATE/DELETE can still access soft deleted)

  2. Tables Modified
    - clients
    - appointments
    - services
    - service_categories
    - commission_agents
    - commissions
    - cash_register_sessions
    - transaction_categories

  3. Pattern
    - Add condition: AND deleted_at IS NULL
    - Maintains existing organization filtering
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
