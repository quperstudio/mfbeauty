/*
  # Tablas de Citas y Relaciones

  1. Nuevas Tablas
    - `appointments`
      - `id` (uuid, primary key) - ID único de la cita
      - `client_id` (uuid) - ID del cliente
      - `appointment_date` (date) - Fecha de la cita
      - `appointment_time` (time) - Hora de la cita
      - `status` (text) - Estado: pending, confirmed, completed, canceled
      - `total_price` (decimal) - Precio total de todos los servicios
      - `deposit` (decimal) - Depósito pagado
      - `balance_pending` (decimal) - Balance pendiente
      - `notes` (text, nullable) - Notas de la cita
      - `created_by_user_id` (uuid) - Usuario que creó la cita
      - `created_at` (timestamptz) - Fecha de creación

    - `appointment_services` (Junction table)
      - `id` (uuid, primary key) - ID único
      - `appointment_id` (uuid) - ID de la cita
      - `service_id` (uuid) - ID del servicio
      - `price_at_booking` (decimal) - Precio al momento de la reserva
      - `created_at` (timestamptz) - Fecha de creación

    - `appointment_agents` (Junction table)
      - `id` (uuid, primary key) - ID único
      - `appointment_id` (uuid) - ID de la cita
      - `agent_id` (uuid) - ID del agente
      - `created_at` (timestamptz) - Fecha de creación

  2. Seguridad
    - Enable RLS on all tables
    - Authenticated users can view and manage appointments
    - Only administrators can delete appointments

  3. Índices
    - Index on client_id, appointment_date, status for filtering
    - Index on junction table foreign keys
*/

-- Crear tabla de citas
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'canceled')),
  total_price decimal DEFAULT 0,
  deposit decimal DEFAULT 0,
  balance_pending decimal DEFAULT 0,
  notes text,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de servicios por cita (junction)
CREATE TABLE IF NOT EXISTS appointment_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  price_at_booking decimal NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de agentes por cita (junction)
CREATE TABLE IF NOT EXISTS appointment_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES commission_agents(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(appointment_id, agent_id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment ON appointment_services(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_services_service ON appointment_services(service_id);
CREATE INDEX IF NOT EXISTS idx_appointment_agents_appointment ON appointment_agents(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_agents_agent ON appointment_agents(agent_id);

-- Habilitar RLS en appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policies para appointments
CREATE POLICY "Authenticated users can view appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Administrators can delete appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );

-- Habilitar RLS en appointment_services
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

-- Policies para appointment_services
CREATE POLICY "Authenticated users can view appointment services"
  ON appointment_services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage appointment services"
  ON appointment_services FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete appointment services"
  ON appointment_services FOR DELETE
  TO authenticated
  USING (true);

-- Habilitar RLS en appointment_agents
ALTER TABLE appointment_agents ENABLE ROW LEVEL SECURITY;

-- Policies para appointment_agents
CREATE POLICY "Authenticated users can view appointment agents"
  ON appointment_agents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage appointment agents"
  ON appointment_agents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete appointment agents"
  ON appointment_agents FOR DELETE
  TO authenticated
  USING (true);