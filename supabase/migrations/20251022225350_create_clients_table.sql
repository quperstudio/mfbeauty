/*
  # Tabla de Clientes

  1. Nueva Tabla
    - `clients`
      - `id` (uuid, primary key) - ID único del cliente
      - `name` (text) - Nombre completo del cliente
      - `phone` (text) - Teléfono de 10 dígitos
      - `birthday` (date, nullable) - Fecha de cumpleaños
      - `notes` (text, nullable) - Notas personalizadas
      - `referrer_id` (uuid, nullable) - ID del cliente que lo refirió
      - `whatsapp_link` (text, nullable) - Link o username de WhatsApp
      - `facebook_link` (text, nullable) - Link de Facebook
      - `instagram_link` (text, nullable) - Username de Instagram
      - `tiktok_link` (text, nullable) - Username de TikTok
      - `total_spent` (decimal) - Total gastado por el cliente
      - `total_visits` (integer) - Número total de visitas
      - `last_visit_date` (timestamptz, nullable) - Fecha de última visita
      - `created_at` (timestamptz) - Fecha de creación

  2. Seguridad
    - Enable RLS on `clients` table
    - Authenticated users can view, create, and update clients
    - Only administrators can delete clients

  3. Índices
    - Index on phone for quick searches
    - Index on name for quick searches
    - Index on referrer_id for referral queries
*/

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  birthday date,
  notes text,
  referrer_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  whatsapp_link text,
  facebook_link text,
  instagram_link text,
  tiktok_link text,
  total_spent decimal DEFAULT 0,
  total_visits integer DEFAULT 0,
  last_visit_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_referrer ON clients(referrer_id);

-- Habilitar RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios autenticados pueden ver clientes
CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Usuarios autenticados pueden crear clientes
CREATE POLICY "Authenticated users can create clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Usuarios autenticados pueden actualizar clientes
CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Solo administradores pueden eliminar clientes
CREATE POLICY "Administrators can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );