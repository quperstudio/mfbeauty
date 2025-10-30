/*
  # Update RLS Policies for Multi-Tenancy

  1. Purpose
    - Rewrite all RLS policies to filter by organization_id
    - Ensure data isolation between organizations
    - Maintain existing permission structure (admin vs employee)

  2. Tables Updated
    - clients
    - appointments
    - services
    - service_categories
    - commission_agents
    - commissions
    - cash_register_sessions
    - transaction_categories
    - transactions
    - appointment_services
    - appointment_agents
    - service_commissions

  3. Pattern
    - All SELECT policies: USING (organization_id = get_user_organization_id())
    - All INSERT policies: WITH CHECK (organization_id = get_user_organization_id())
    - All UPDATE policies: USING + WITH CHECK both filter by organization
    - All DELETE policies: USING (organization_id = get_user_organization_id())
*/

-- ====================
-- CLIENTS TABLE
-- ====================

DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
DROP POLICY IF EXISTS "Administrators can delete clients" ON clients;

CREATE POLICY "Users can view clients in own organization"
  ON clients FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create clients in own organization"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update clients in own organization"
  ON clients FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Administrators can delete clients in own organization"
  ON clients FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );

-- ====================
-- APPOINTMENTS TABLE
-- ====================

DROP POLICY IF EXISTS "Authenticated users can view appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can create appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can update appointments" ON appointments;
DROP POLICY IF EXISTS "Administrators can delete appointments" ON appointments;

CREATE POLICY "Users can view appointments in own organization"
  ON appointments FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create appointments in own organization"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update appointments in own organization"
  ON appointments FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Administrators can delete appointments in own organization"
  ON appointments FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );

-- ====================
-- SERVICE_CATEGORIES TABLE
-- ====================

DROP POLICY IF EXISTS "Authenticated users can view categories" ON service_categories;
DROP POLICY IF EXISTS "Authenticated users can create categories" ON service_categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON service_categories;
DROP POLICY IF EXISTS "Administrators can delete categories" ON service_categories;

CREATE POLICY "Users can view categories in own organization"
  ON service_categories FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create categories in own organization"
  ON service_categories FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update categories in own organization"
  ON service_categories FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Administrators can delete categories in own organization"
  ON service_categories FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );

-- ====================
-- SERVICES TABLE
-- ====================

DROP POLICY IF EXISTS "Authenticated users can view services" ON services;
DROP POLICY IF EXISTS "Authenticated users can create services" ON services;
DROP POLICY IF EXISTS "Authenticated users can update services" ON services;
DROP POLICY IF EXISTS "Administrators can delete services" ON services;

CREATE POLICY "Users can view services in own organization"
  ON services FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create services in own organization"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update services in own organization"
  ON services FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Administrators can delete services in own organization"
  ON services FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );

-- ====================
-- COMMISSION_AGENTS TABLE
-- ====================

DROP POLICY IF EXISTS "Authenticated users can view agents" ON commission_agents;
DROP POLICY IF EXISTS "Authenticated users can create agents" ON commission_agents;
DROP POLICY IF EXISTS "Authenticated users can update agents" ON commission_agents;
DROP POLICY IF EXISTS "Administrators can delete agents" ON commission_agents;

CREATE POLICY "Users can view agents in own organization"
  ON commission_agents FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create agents in own organization"
  ON commission_agents FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update agents in own organization"
  ON commission_agents FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Administrators can delete agents in own organization"
  ON commission_agents FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );

-- ====================
-- COMMISSIONS TABLE
-- ====================

DROP POLICY IF EXISTS "Authenticated users can view commissions" ON commissions;
DROP POLICY IF EXISTS "Authenticated users can create commissions" ON commissions;
DROP POLICY IF EXISTS "Authenticated users can update commissions" ON commissions;
DROP POLICY IF EXISTS "Administrators can delete commissions" ON commissions;

CREATE POLICY "Users can view commissions in own organization"
  ON commissions FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create commissions in own organization"
  ON commissions FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update commissions in own organization"
  ON commissions FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Administrators can delete commissions in own organization"
  ON commissions FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );

-- ====================
-- CASH_REGISTER_SESSIONS TABLE
-- ====================

DROP POLICY IF EXISTS "Authenticated users can view cash register sessions" ON cash_register_sessions;
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON cash_register_sessions;
DROP POLICY IF EXISTS "Authenticated users can update sessions" ON cash_register_sessions;
DROP POLICY IF EXISTS "Administrators can delete sessions" ON cash_register_sessions;

CREATE POLICY "Users can view sessions in own organization"
  ON cash_register_sessions FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create sessions in own organization"
  ON cash_register_sessions FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update sessions in own organization"
  ON cash_register_sessions FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Administrators can delete sessions in own organization"
  ON cash_register_sessions FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );

-- ====================
-- TRANSACTION_CATEGORIES TABLE
-- ====================

DROP POLICY IF EXISTS "Authenticated users can view categories" ON transaction_categories;
DROP POLICY IF EXISTS "Authenticated users can create categories" ON transaction_categories;
DROP POLICY IF EXISTS "Authenticated users can update non-system categories" ON transaction_categories;
DROP POLICY IF EXISTS "Administrators can delete non-system categories" ON transaction_categories;

CREATE POLICY "Users can view transaction categories in own organization"
  ON transaction_categories FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create transaction categories in own organization"
  ON transaction_categories FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update non-system categories in own organization"
  ON transaction_categories FOR UPDATE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    is_system = false
  )
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    is_system = false
  );

CREATE POLICY "Administrators can delete non-system categories in own organization"
  ON transaction_categories FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    is_system = false AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );

-- ====================
-- TRANSACTIONS TABLE
-- ====================

DROP POLICY IF EXISTS "Authenticated users can view transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can update transactions" ON transactions;
DROP POLICY IF EXISTS "Administrators can delete transactions" ON transactions;

CREATE POLICY "Users can view transactions in own organization"
  ON transactions FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create transactions in own organization"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update transactions in own organization"
  ON transactions FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Administrators can delete transactions in own organization"
  ON transactions FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );

-- ====================
-- JUNCTION TABLES (inherit organization filtering via foreign keys)
-- ====================

-- These tables don't need organization_id because they inherit filtering
-- through their foreign key relationships to parent tables
-- For example: appointment_services links to appointments which has organization_id

-- But we still update policies to be explicit about organization boundaries

DROP POLICY IF EXISTS "Authenticated users can view appointment services" ON appointment_services;
DROP POLICY IF EXISTS "Authenticated users can manage appointment services" ON appointment_services;
DROP POLICY IF EXISTS "Authenticated users can delete appointment services" ON appointment_services;

CREATE POLICY "Users can view appointment services in own organization"
  ON appointment_services FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_services.appointment_id
      AND appointments.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can create appointment services in own organization"
  ON appointment_services FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_services.appointment_id
      AND appointments.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete appointment services in own organization"
  ON appointment_services FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_services.appointment_id
      AND appointments.organization_id = get_user_organization_id()
    )
  );

-- appointment_agents

DROP POLICY IF EXISTS "Authenticated users can view appointment agents" ON appointment_agents;
DROP POLICY IF EXISTS "Authenticated users can manage appointment agents" ON appointment_agents;
DROP POLICY IF EXISTS "Authenticated users can delete appointment agents" ON appointment_agents;

CREATE POLICY "Users can view appointment agents in own organization"
  ON appointment_agents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_agents.appointment_id
      AND appointments.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can create appointment agents in own organization"
  ON appointment_agents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_agents.appointment_id
      AND appointments.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete appointment agents in own organization"
  ON appointment_agents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_agents.appointment_id
      AND appointments.organization_id = get_user_organization_id()
    )
  );

-- service_commissions

DROP POLICY IF EXISTS "Authenticated users can view service commissions" ON service_commissions;
DROP POLICY IF EXISTS "Authenticated users can create service commissions" ON service_commissions;
DROP POLICY IF EXISTS "Authenticated users can update service commissions" ON service_commissions;
DROP POLICY IF EXISTS "Authenticated users can delete service commissions" ON service_commissions;

CREATE POLICY "Users can view service commissions in own organization"
  ON service_commissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = service_commissions.service_id
      AND services.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can create service commissions in own organization"
  ON service_commissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = service_commissions.service_id
      AND services.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update service commissions in own organization"
  ON service_commissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = service_commissions.service_id
      AND services.organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = service_commissions.service_id
      AND services.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete service commissions in own organization"
  ON service_commissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = service_commissions.service_id
      AND services.organization_id = get_user_organization_id()
    )
  );
