/*
  # Tablas de Servicios y Categorías

  1. Nuevas Tablas
    - `service_categories`
      - `id` (uuid, primary key) - ID único de la categoría
      - `name` (text) - Nombre de la categoría
      - `description` (text, nullable) - Descripción de la categoría
      - `display_order` (integer) - Orden de visualización
      - `created_at` (timestamptz) - Fecha de creación

    - `services`
      - `id` (uuid, primary key) - ID único del servicio
      - `category_id` (uuid) - ID de la categoría
      - `name` (text) - Nombre del servicio
      - `description` (text, nullable) - Descripción del servicio
      - `duration_minutes` (integer) - Duración en minutos
      - `price` (decimal) - Precio de venta
      - `cost` (decimal) - Costo del servicio
      - `profit` (decimal) - Ganancia (price - cost)
      - `created_at` (timestamptz) - Fecha de creación

  2. Seguridad
    - Enable RLS on both tables
    - Authenticated users can view all
    - All authenticated users can create/update
    - Only administrators can delete

  3. Índices
    - Index on category_id for quick filtering
*/

-- Crear tabla de categorías de servicios
CREATE TABLE IF NOT EXISTS service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de servicios
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES service_categories(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL,
  price decimal NOT NULL CHECK (price > 0),
  cost decimal DEFAULT 0 CHECK (cost >= 0),
  profit decimal GENERATED ALWAYS AS (price - cost) STORED,
  created_at timestamptz DEFAULT now()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);

-- Habilitar RLS en service_categories
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

-- Policies para service_categories
CREATE POLICY "Authenticated users can view categories"
  ON service_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create categories"
  ON service_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON service_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Administrators can delete categories"
  ON service_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );

-- Habilitar RLS en services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policies para services
CREATE POLICY "Authenticated users can view services"
  ON services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update services"
  ON services FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Administrators can delete services"
  ON services FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );