/*
  # Add Soft Delete and Audit Columns

  1. Purpose
    - Add soft delete support to critical tables (except transactions)
    - Add audit trail columns for tracking changes
    - Enable data recovery and change tracking

  2. Tables Modified (with soft delete)
    - clients
    - appointments
    - services
    - service_categories
    - commission_agents
    - commissions
    - cash_register_sessions

  3. New Columns
    - deleted_at (timestamptz, nullable) - Timestamp when record was soft deleted
    - deleted_by (uuid, nullable) - User who deleted the record
    - updated_at (timestamptz, NOT NULL) - Timestamp of last update
    - updated_by (uuid, nullable) - User who last updated the record

  4. Indexes
    - Composite indexes on (organization_id, deleted_at) for performance
*/

-- ====================
-- CLIENTS TABLE
-- ====================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'deleted_at') THEN
    ALTER TABLE clients ADD COLUMN deleted_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'deleted_by') THEN
    ALTER TABLE clients ADD COLUMN deleted_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'updated_at') THEN
    ALTER TABLE clients ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'updated_by') THEN
    ALTER TABLE clients ADD COLUMN updated_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON clients(organization_id, deleted_at);

-- ====================
-- APPOINTMENTS TABLE
-- ====================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'deleted_at') THEN
    ALTER TABLE appointments ADD COLUMN deleted_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'deleted_by') THEN
    ALTER TABLE appointments ADD COLUMN deleted_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'updated_at') THEN
    ALTER TABLE appointments ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'updated_by') THEN
    ALTER TABLE appointments ADD COLUMN updated_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_appointments_deleted_at ON appointments(organization_id, deleted_at);

-- ====================
-- SERVICES TABLE
-- ====================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'deleted_at') THEN
    ALTER TABLE services ADD COLUMN deleted_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'deleted_by') THEN
    ALTER TABLE services ADD COLUMN deleted_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'updated_at') THEN
    ALTER TABLE services ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'updated_by') THEN
    ALTER TABLE services ADD COLUMN updated_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_services_deleted_at ON services(organization_id, deleted_at);

-- ====================
-- SERVICE_CATEGORIES TABLE
-- ====================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_categories' AND column_name = 'deleted_at') THEN
    ALTER TABLE service_categories ADD COLUMN deleted_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_categories' AND column_name = 'deleted_by') THEN
    ALTER TABLE service_categories ADD COLUMN deleted_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_categories' AND column_name = 'updated_at') THEN
    ALTER TABLE service_categories ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_categories' AND column_name = 'updated_by') THEN
    ALTER TABLE service_categories ADD COLUMN updated_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_categories_deleted_at ON service_categories(organization_id, deleted_at);

-- ====================
-- COMMISSION_AGENTS TABLE
-- ====================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commission_agents' AND column_name = 'deleted_at') THEN
    ALTER TABLE commission_agents ADD COLUMN deleted_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commission_agents' AND column_name = 'deleted_by') THEN
    ALTER TABLE commission_agents ADD COLUMN deleted_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commission_agents' AND column_name = 'updated_at') THEN
    ALTER TABLE commission_agents ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commission_agents' AND column_name = 'updated_by') THEN
    ALTER TABLE commission_agents ADD COLUMN updated_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_commission_agents_deleted_at ON commission_agents(organization_id, deleted_at);

-- ====================
-- COMMISSIONS TABLE
-- ====================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commissions' AND column_name = 'deleted_at') THEN
    ALTER TABLE commissions ADD COLUMN deleted_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commissions' AND column_name = 'deleted_by') THEN
    ALTER TABLE commissions ADD COLUMN deleted_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commissions' AND column_name = 'updated_at') THEN
    ALTER TABLE commissions ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commissions' AND column_name = 'updated_by') THEN
    ALTER TABLE commissions ADD COLUMN updated_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_commissions_deleted_at ON commissions(organization_id, deleted_at);

-- ====================
-- CASH_REGISTER_SESSIONS TABLE
-- ====================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_register_sessions' AND column_name = 'deleted_at') THEN
    ALTER TABLE cash_register_sessions ADD COLUMN deleted_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_register_sessions' AND column_name = 'deleted_by') THEN
    ALTER TABLE cash_register_sessions ADD COLUMN deleted_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_register_sessions' AND column_name = 'updated_at') THEN
    ALTER TABLE cash_register_sessions ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_register_sessions' AND column_name = 'updated_by') THEN
    ALTER TABLE cash_register_sessions ADD COLUMN updated_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cash_register_sessions_deleted_at ON cash_register_sessions(organization_id, deleted_at);

-- ====================
-- TRANSACTION_CATEGORIES TABLE (Soft delete but no updated_at/by as it's mostly static)
-- ====================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_categories' AND column_name = 'deleted_at') THEN
    ALTER TABLE transaction_categories ADD COLUMN deleted_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_categories' AND column_name = 'deleted_by') THEN
    ALTER TABLE transaction_categories ADD COLUMN deleted_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_categories' AND column_name = 'updated_at') THEN
    ALTER TABLE transaction_categories ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_categories' AND column_name = 'updated_by') THEN
    ALTER TABLE transaction_categories ADD COLUMN updated_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transaction_categories_deleted_at ON transaction_categories(organization_id, deleted_at);
