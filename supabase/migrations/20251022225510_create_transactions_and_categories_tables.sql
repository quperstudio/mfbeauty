/*
  # Tablas de Transacciones y Categorías

  1. Nuevas Tablas
    - `transaction_categories`
      - `id` (uuid, primary key) - ID único de la categoría
      - `name` (text) - Nombre de la categoría
      - `type` (text) - Tipo: 'income' o 'expense'
      - `is_system` (boolean) - Si es categoría del sistema (no editable)
      - `created_at` (timestamptz) - Fecha de creación

    - `transactions`
      - `id` (uuid, primary key) - ID único de la transacción
      - `type` (text) - Tipo: 'income' o 'expense'
      - `category_id` (uuid) - ID de la categoría
      - `payment_method` (text) - Método: cash, card, transfer
      - `gross_amount` (decimal) - Monto bruto
      - `card_commission` (decimal) - Comisión de tarjeta si aplica
      - `net_amount` (decimal) - Monto neto (gross - commission)
      - `description` (text) - Descripción de la transacción
      - `transaction_date` (date) - Fecha de la transacción
      - `transaction_time` (time) - Hora de la transacción
      - `client_id` (uuid, nullable) - Cliente asociado si aplica
      - `appointment_id` (uuid, nullable) - Cita asociada si aplica
      - `created_by_user_id` (uuid) - Usuario que creó la transacción
      - `created_at` (timestamptz) - Fecha de creación

  2. Seguridad
    - Enable RLS on both tables
    - Authenticated users can view and create transactions
    - Only administrators can delete transactions

  3. Índices
    - Index on transaction_date, type, payment_method for filtering
*/

-- Crear tabla de categorías de transacciones
CREATE TABLE IF NOT EXISTS transaction_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de transacciones
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category_id uuid REFERENCES transaction_categories(id) ON DELETE SET NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer')),
  gross_amount decimal NOT NULL CHECK (gross_amount > 0),
  card_commission decimal DEFAULT 0,
  net_amount decimal NOT NULL,
  description text NOT NULL,
  transaction_date date NOT NULL,
  transaction_time time NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_client ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_appointment ON transactions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

-- Habilitar RLS en transaction_categories
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;

-- Policies para transaction_categories
CREATE POLICY "Authenticated users can view categories"
  ON transaction_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create categories"
  ON transaction_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update non-system categories"
  ON transaction_categories FOR UPDATE
  TO authenticated
  USING (is_system = false)
  WITH CHECK (is_system = false);

CREATE POLICY "Administrators can delete non-system categories"
  ON transaction_categories FOR DELETE
  TO authenticated
  USING (
    is_system = false AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );

-- Habilitar RLS en transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies para transactions
CREATE POLICY "Authenticated users can view transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Administrators can delete transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );

-- Insertar categorías del sistema
INSERT INTO transaction_categories (name, type, is_system) VALUES
  ('Venta de Servicio', 'income', true),
  ('Pago de Comisión', 'expense', true),
  ('Apertura de Caja', 'income', true),
  ('Retiro de Caja', 'expense', true)
ON CONFLICT DO NOTHING;