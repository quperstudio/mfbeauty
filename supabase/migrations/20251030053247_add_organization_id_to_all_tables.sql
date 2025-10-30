/*
  # Add Organization ID to All Operational Tables

  1. Tables Modified
    - clients
    - appointments
    - services
    - service_categories
    - commission_agents
    - commissions
    - cash_register_sessions
    - transaction_categories
    - transactions

  2. Migration Steps
    - Add organization_id column (nullable first)
    - Assign default organization to existing records
    - Make organization_id NOT NULL
    - Set DEFAULT to get_user_organization_id()
    - Create indexes for performance

  3. Security
    - Foreign key constraints to organizations table
    - Indexes for query optimization
*/

-- Step 1: Add organization_id to clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

UPDATE clients SET organization_id = 'a0000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
ALTER TABLE clients ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE clients ALTER COLUMN organization_id SET DEFAULT get_user_organization_id();
CREATE INDEX IF NOT EXISTS idx_clients_organization ON clients(organization_id);

-- Step 2: Add organization_id to appointments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

UPDATE appointments SET organization_id = 'a0000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
ALTER TABLE appointments ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE appointments ALTER COLUMN organization_id SET DEFAULT get_user_organization_id();
CREATE INDEX IF NOT EXISTS idx_appointments_organization ON appointments(organization_id);

-- Step 3: Add organization_id to service_categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_categories' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE service_categories ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

UPDATE service_categories SET organization_id = 'a0000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
ALTER TABLE service_categories ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE service_categories ALTER COLUMN organization_id SET DEFAULT get_user_organization_id();
CREATE INDEX IF NOT EXISTS idx_service_categories_organization ON service_categories(organization_id);

-- Step 4: Add organization_id to services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE services ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

UPDATE services SET organization_id = 'a0000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
ALTER TABLE services ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE services ALTER COLUMN organization_id SET DEFAULT get_user_organization_id();
CREATE INDEX IF NOT EXISTS idx_services_organization ON services(organization_id);

-- Step 5: Add organization_id to commission_agents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commission_agents' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE commission_agents ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

UPDATE commission_agents SET organization_id = 'a0000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
ALTER TABLE commission_agents ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE commission_agents ALTER COLUMN organization_id SET DEFAULT get_user_organization_id();
CREATE INDEX IF NOT EXISTS idx_commission_agents_organization ON commission_agents(organization_id);

-- Step 6: Add organization_id to commissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commissions' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE commissions ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

UPDATE commissions SET organization_id = 'a0000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
ALTER TABLE commissions ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE commissions ALTER COLUMN organization_id SET DEFAULT get_user_organization_id();
CREATE INDEX IF NOT EXISTS idx_commissions_organization ON commissions(organization_id);

-- Step 7: Add organization_id to cash_register_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cash_register_sessions' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE cash_register_sessions ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

UPDATE cash_register_sessions SET organization_id = 'a0000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
ALTER TABLE cash_register_sessions ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE cash_register_sessions ALTER COLUMN organization_id SET DEFAULT get_user_organization_id();
CREATE INDEX IF NOT EXISTS idx_cash_register_sessions_organization ON cash_register_sessions(organization_id);

-- Step 8: Add organization_id to transaction_categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transaction_categories' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE transaction_categories ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

UPDATE transaction_categories SET organization_id = 'a0000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
ALTER TABLE transaction_categories ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE transaction_categories ALTER COLUMN organization_id SET DEFAULT get_user_organization_id();
CREATE INDEX IF NOT EXISTS idx_transaction_categories_organization ON transaction_categories(organization_id);

-- Step 9: Add organization_id to transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

UPDATE transactions SET organization_id = 'a0000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
ALTER TABLE transactions ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN organization_id SET DEFAULT get_user_organization_id();
CREATE INDEX IF NOT EXISTS idx_transactions_organization ON transactions(organization_id);
