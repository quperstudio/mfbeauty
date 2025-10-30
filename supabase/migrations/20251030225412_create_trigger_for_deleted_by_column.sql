/*
  # Create Trigger to Automatically Populate deleted_by

  1. Problem
    - deleted_by column remains NULL when soft deleting records
    - The existing update_updated_by_column trigger runs on ALL updates
    - We need a specific trigger that only sets deleted_by when deleted_at is marked

  2. Solution
    - Create new function update_deleted_by_column()
    - Function checks if deleted_at is changing from NULL to NOT NULL
    - Only then sets deleted_by = auth.uid()
    - Apply trigger to all tables with soft delete

  3. Tables with Soft Delete
    - clients
    - appointments
    - services
    - service_categories
    - commission_agents
    - commissions
    - cash_register_sessions
    - transaction_categories

  4. Trigger Execution
    - Executes BEFORE UPDATE
    - Only when deleted_at changes from NULL to a timestamp
    - Sets deleted_by to current authenticated user
*/

-- ====================
-- CREATE FUNCTION: update_deleted_by_column
-- ====================

CREATE OR REPLACE FUNCTION update_deleted_by_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  -- Only set deleted_by if deleted_at is being marked (NULL -> NOT NULL)
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    NEW.deleted_by = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$;

-- ====================
-- CLIENTS TABLE TRIGGER
-- ====================

DROP TRIGGER IF EXISTS trigger_clients_deleted_by ON clients;
CREATE TRIGGER trigger_clients_deleted_by
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_deleted_by_column();

-- ====================
-- APPOINTMENTS TABLE TRIGGER
-- ====================

DROP TRIGGER IF EXISTS trigger_appointments_deleted_by ON appointments;
CREATE TRIGGER trigger_appointments_deleted_by
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_deleted_by_column();

-- ====================
-- SERVICES TABLE TRIGGER
-- ====================

DROP TRIGGER IF EXISTS trigger_services_deleted_by ON services;
CREATE TRIGGER trigger_services_deleted_by
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_deleted_by_column();

-- ====================
-- SERVICE_CATEGORIES TABLE TRIGGER
-- ====================

DROP TRIGGER IF EXISTS trigger_service_categories_deleted_by ON service_categories;
CREATE TRIGGER trigger_service_categories_deleted_by
  BEFORE UPDATE ON service_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_deleted_by_column();

-- ====================
-- COMMISSION_AGENTS TABLE TRIGGER
-- ====================

DROP TRIGGER IF EXISTS trigger_commission_agents_deleted_by ON commission_agents;
CREATE TRIGGER trigger_commission_agents_deleted_by
  BEFORE UPDATE ON commission_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_deleted_by_column();

-- ====================
-- COMMISSIONS TABLE TRIGGER
-- ====================

DROP TRIGGER IF EXISTS trigger_commissions_deleted_by ON commissions;
CREATE TRIGGER trigger_commissions_deleted_by
  BEFORE UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_deleted_by_column();

-- ====================
-- CASH_REGISTER_SESSIONS TABLE TRIGGER
-- ====================

DROP TRIGGER IF EXISTS trigger_cash_register_sessions_deleted_by ON cash_register_sessions;
CREATE TRIGGER trigger_cash_register_sessions_deleted_by
  BEFORE UPDATE ON cash_register_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_deleted_by_column();

-- ====================
-- TRANSACTION_CATEGORIES TABLE TRIGGER
-- ====================

DROP TRIGGER IF EXISTS trigger_transaction_categories_deleted_by ON transaction_categories;
CREATE TRIGGER trigger_transaction_categories_deleted_by
  BEFORE UPDATE ON transaction_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_deleted_by_column();
