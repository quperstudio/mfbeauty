/*
  # Create Audit Triggers for Automatic Timestamp and User Tracking

  1. Purpose
    - Automatically update updated_at timestamp on record changes
    - Automatically populate updated_by with current user ID
    - Reduce frontend complexity by handling audit fields in database

  2. Trigger Functions
    - update_updated_at_column() - Sets updated_at = NOW() on UPDATE
    - update_updated_by_column() - Sets updated_by = auth.uid() on UPDATE

  3. Tables with Triggers
    - clients
    - appointments
    - services
    - service_categories
    - commission_agents
    - commissions
    - cash_register_sessions
    - transaction_categories
    - transactions (updated_at only, amounts are immutable)

  4. Behavior
    - Triggers execute BEFORE UPDATE
    - Only affect updated_at and updated_by columns
    - Do not prevent or modify other column updates
*/

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function to automatically update updated_by with current user
CREATE OR REPLACE FUNCTION update_updated_by_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

-- ====================
-- CLIENTS TABLE TRIGGERS
-- ====================

DROP TRIGGER IF EXISTS trigger_clients_updated_at ON clients;
CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_clients_updated_by ON clients;
CREATE TRIGGER trigger_clients_updated_by
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_by_column();

-- ====================
-- APPOINTMENTS TABLE TRIGGERS
-- ====================

DROP TRIGGER IF EXISTS trigger_appointments_updated_at ON appointments;
CREATE TRIGGER trigger_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_appointments_updated_by ON appointments;
CREATE TRIGGER trigger_appointments_updated_by
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_by_column();

-- ====================
-- SERVICES TABLE TRIGGERS
-- ====================

DROP TRIGGER IF EXISTS trigger_services_updated_at ON services;
CREATE TRIGGER trigger_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_services_updated_by ON services;
CREATE TRIGGER trigger_services_updated_by
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_by_column();

-- ====================
-- SERVICE_CATEGORIES TABLE TRIGGERS
-- ====================

DROP TRIGGER IF EXISTS trigger_service_categories_updated_at ON service_categories;
CREATE TRIGGER trigger_service_categories_updated_at
  BEFORE UPDATE ON service_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_service_categories_updated_by ON service_categories;
CREATE TRIGGER trigger_service_categories_updated_by
  BEFORE UPDATE ON service_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_by_column();

-- ====================
-- COMMISSION_AGENTS TABLE TRIGGERS
-- ====================

DROP TRIGGER IF EXISTS trigger_commission_agents_updated_at ON commission_agents;
CREATE TRIGGER trigger_commission_agents_updated_at
  BEFORE UPDATE ON commission_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_commission_agents_updated_by ON commission_agents;
CREATE TRIGGER trigger_commission_agents_updated_by
  BEFORE UPDATE ON commission_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_by_column();

-- ====================
-- COMMISSIONS TABLE TRIGGERS
-- ====================

DROP TRIGGER IF EXISTS trigger_commissions_updated_at ON commissions;
CREATE TRIGGER trigger_commissions_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_commissions_updated_by ON commissions;
CREATE TRIGGER trigger_commissions_updated_by
  BEFORE UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_by_column();

-- ====================
-- CASH_REGISTER_SESSIONS TABLE TRIGGERS
-- ====================

DROP TRIGGER IF EXISTS trigger_cash_register_sessions_updated_at ON cash_register_sessions;
CREATE TRIGGER trigger_cash_register_sessions_updated_at
  BEFORE UPDATE ON cash_register_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_cash_register_sessions_updated_by ON cash_register_sessions;
CREATE TRIGGER trigger_cash_register_sessions_updated_by
  BEFORE UPDATE ON cash_register_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_by_column();

-- ====================
-- TRANSACTION_CATEGORIES TABLE TRIGGERS
-- ====================

DROP TRIGGER IF EXISTS trigger_transaction_categories_updated_at ON transaction_categories;
CREATE TRIGGER trigger_transaction_categories_updated_at
  BEFORE UPDATE ON transaction_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_transaction_categories_updated_by ON transaction_categories;
CREATE TRIGGER trigger_transaction_categories_updated_by
  BEFORE UPDATE ON transaction_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_by_column();

-- ====================
-- TRANSACTIONS TABLE TRIGGERS (updated_at only, for minor corrections)
-- ====================

DROP TRIGGER IF EXISTS trigger_transactions_updated_at ON transactions;
CREATE TRIGGER trigger_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_transactions_updated_by ON transactions;
CREATE TRIGGER trigger_transactions_updated_by
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_by_column();
