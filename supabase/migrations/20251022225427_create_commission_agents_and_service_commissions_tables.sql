/*
  # Tablas de Agentes de Comisión y Comisiones de Servicios

  1. Nuevas Tablas
    - `commission_agents`
      - `id` (uuid, primary key) - ID único del agente
      - `name` (text) - Nombre completo del agente
      - `phone` (text) - Teléfono
      - `email` (text, nullable) - Email
      - `base_commission_percentage` (decimal) - Porcentaje base de comisión
      - `active` (boolean) - Estado activo/inactivo
      - `notes` (text, nullable) - Notas adicionales
      - `whatsapp_link` (text, nullable) - Link o username de WhatsApp
      - `facebook_link` (text, nullable) - Link de Facebook
      - `instagram_link` (text, nullable) - Username de Instagram
      - `tiktok_link` (text, nullable) - Username de TikTok
      - `created_at` (timestamptz) - Fecha de creación

    - `service_commissions` (Junction table)
      - `id` (uuid, primary key) - ID único
      - `service_id` (uuid) - ID del servicio
      - `agent_id` (uuid) - ID del agente
      - `commission_type` (text) - Tipo: 'percentage' o 'fixed'
      - `commission_value` (decimal) - Valor de la comisión
      - `created_at` (timestamptz) - Fecha de creación

  2. Seguridad
    - Enable RLS on both tables
    - Authenticated users can view and manage commission agents
    - Only administrators can delete

  3. Índices
    - Index on service_id and agent_id for quick lookups
*/

-- Crear tabla de agentes de comisión
CREATE TABLE IF NOT EXISTS commission_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  base_commission_percentage decimal DEFAULT 0 CHECK (base_commission_percentage >= 0 AND base_commission_percentage <= 100),
  active boolean DEFAULT true,
  notes text,
  whatsapp_link text,
  facebook_link text,
  instagram_link text,
  tiktok_link text,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de comisiones de servicios (junction)
CREATE TABLE IF NOT EXISTS service_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES commission_agents(id) ON DELETE CASCADE NOT NULL,
  commission_type text NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value decimal NOT NULL CHECK (commission_value >= 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(service_id, agent_id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_service_commissions_service ON service_commissions(service_id);
CREATE INDEX IF NOT EXISTS idx_service_commissions_agent ON service_commissions(agent_id);

-- Habilitar RLS en commission_agents
ALTER TABLE commission_agents ENABLE ROW LEVEL SECURITY;

-- Policies para commission_agents
CREATE POLICY "Authenticated users can view agents"
  ON commission_agents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create agents"
  ON commission_agents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update agents"
  ON commission_agents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Administrators can delete agents"
  ON commission_agents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );

-- Habilitar RLS en service_commissions
ALTER TABLE service_commissions ENABLE ROW LEVEL SECURITY;

-- Policies para service_commissions
CREATE POLICY "Authenticated users can view service commissions"
  ON service_commissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create service commissions"
  ON service_commissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update service commissions"
  ON service_commissions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete service commissions"
  ON service_commissions FOR DELETE
  TO authenticated
  USING (true);