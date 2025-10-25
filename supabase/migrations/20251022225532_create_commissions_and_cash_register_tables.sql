/*
  # Tablas de Comisiones y Caja Registradora

  1. Nuevas Tablas
    - `commissions`
      - `id` (uuid, primary key) - ID único de la comisión
      - `agent_id` (uuid) - ID del agente
      - `appointment_id` (uuid) - ID de la cita
      - `service_id` (uuid) - ID del servicio
      - `amount` (decimal) - Monto de la comisión
      - `commission_rate` (decimal) - Tasa aplicada (porcentaje o monto fijo)
      - `commission_type` (text) - Tipo: 'percentage' o 'fixed'
      - `status` (text) - Estado: 'pending' o 'paid'
      - `generated_date` (date) - Fecha de generación
      - `paid_date` (date, nullable) - Fecha de pago
      - `payment_method` (text, nullable) - Método de pago
      - `payment_reference` (text, nullable) - Referencia del pago
      - `payment_notes` (text, nullable) - Notas del pago
      - `created_at` (timestamptz) - Fecha de creación

    - `cash_register_sessions`
      - `id` (uuid, primary key) - ID único de la sesión
      - `opened_by_user_id` (uuid) - Usuario que abrió la caja
      - `closed_by_user_id` (uuid, nullable) - Usuario que cerró la caja
      - `opening_amount` (decimal) - Monto inicial
      - `closing_amount` (decimal, nullable) - Monto final contado
      - `expected_amount` (decimal, nullable) - Monto esperado
      - `difference` (decimal, nullable) - Diferencia (closing - expected)
      - `opening_notes` (text, nullable) - Notas de apertura
      - `closing_notes` (text, nullable) - Notas de cierre
      - `opened_at` (timestamptz) - Fecha y hora de apertura
      - `closed_at` (timestamptz, nullable) - Fecha y hora de cierre
      - `status` (text) - Estado: 'open' o 'closed'

  2. Seguridad
    - Enable RLS on both tables
    - Authenticated users can view and manage
    - Only administrators can delete

  3. Índices
    - Index on agent_id, status for commissions
    - Index on status, opened_at for cash register sessions
*/

-- Crear tabla de comisiones
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES commission_agents(id) ON DELETE CASCADE NOT NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  amount decimal NOT NULL CHECK (amount >= 0),
  commission_rate decimal NOT NULL,
  commission_type text NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  generated_date date NOT NULL,
  paid_date date,
  payment_method text CHECK (payment_method IN ('cash', 'card', 'transfer')),
  payment_reference text,
  payment_notes text,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de sesiones de caja registradora
CREATE TABLE IF NOT EXISTS cash_register_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  closed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  opening_amount decimal DEFAULT 0 CHECK (opening_amount >= 0),
  closing_amount decimal CHECK (closing_amount >= 0),
  expected_amount decimal,
  difference decimal,
  opening_notes text,
  closing_notes text,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed'))
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_commissions_agent ON commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_appointment ON commissions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_cash_register_status ON cash_register_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cash_register_opened_at ON cash_register_sessions(opened_at);

-- Habilitar RLS en commissions
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Policies para commissions
CREATE POLICY "Authenticated users can view commissions"
  ON commissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create commissions"
  ON commissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update commissions"
  ON commissions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Administrators can delete commissions"
  ON commissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );

-- Habilitar RLS en cash_register_sessions
ALTER TABLE cash_register_sessions ENABLE ROW LEVEL SECURITY;

-- Policies para cash_register_sessions
CREATE POLICY "Authenticated users can view cash register sessions"
  ON cash_register_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create sessions"
  ON cash_register_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sessions"
  ON cash_register_sessions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Administrators can delete sessions"
  ON cash_register_sessions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );