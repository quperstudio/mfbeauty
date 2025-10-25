/*
  # Agregar Sistema de Etiquetas y Usuario Creador a Clientes

  1. Cambios en Tabla Clientes
    - Agregar columna `created_by_user_id` (uuid, nullable) - ID del usuario que creó el cliente
    - Referencia a tabla users con ON DELETE SET NULL

  2. Nuevas Tablas
    - `client_tags`
      - `id` (uuid, primary key) - ID único de la etiqueta
      - `name` (text, unique, not null) - Nombre de la etiqueta
      - `created_at` (timestamptz) - Fecha de creación
    
    - `client_tags_assignments`
      - `id` (uuid, primary key) - ID único de la asignación
      - `client_id` (uuid, not null) - ID del cliente
      - `tag_id` (uuid, not null) - ID de la etiqueta
      - `created_at` (timestamptz) - Fecha de creación
      - Constraint único compuesto en (client_id, tag_id) para evitar duplicados

  3. Índices
    - Índice en client_tags.name para búsquedas rápidas
    - Índice en client_tags_assignments.client_id para consultas de etiquetas por cliente
    - Índice en client_tags_assignments.tag_id para consultas de clientes por etiqueta
    - Índice en clients.created_by_user_id para consultas de auditoría

  4. Seguridad
    - Enable RLS en ambas tablas nuevas
    - Usuarios autenticados pueden ver, crear y actualizar etiquetas
    - Usuarios autenticados pueden asignar y desasignar etiquetas
    - Solo administradores pueden eliminar etiquetas globales

  5. Notas Importantes
    - created_by_user_id es nullable para mantener compatibilidad con clientes existentes
    - Las etiquetas son globales y reutilizables entre todos los clientes
    - Un cliente puede tener múltiples etiquetas (máximo 5, validado en aplicación)
*/

-- Agregar columna created_by_user_id a la tabla clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'created_by_user_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Crear índice para created_by_user_id
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by_user_id);

-- Crear tabla de etiquetas globales
CREATE TABLE IF NOT EXISTS client_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Crear índice en nombre de etiqueta
CREATE INDEX IF NOT EXISTS idx_client_tags_name ON client_tags(name);

-- Crear tabla de asignaciones de etiquetas a clientes
CREATE TABLE IF NOT EXISTS client_tags_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES client_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_client_tag UNIQUE (client_id, tag_id)
);

-- Crear índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_client_tags_assignments_client ON client_tags_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tags_assignments_tag ON client_tags_assignments(tag_id);

-- Habilitar RLS en client_tags
ALTER TABLE client_tags ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios autenticados pueden ver etiquetas
CREATE POLICY "Authenticated users can view tags"
  ON client_tags FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Usuarios autenticados pueden crear etiquetas
CREATE POLICY "Authenticated users can create tags"
  ON client_tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Solo administradores pueden eliminar etiquetas
CREATE POLICY "Administrators can delete tags"
  ON client_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );

-- Habilitar RLS en client_tags_assignments
ALTER TABLE client_tags_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios autenticados pueden ver asignaciones
CREATE POLICY "Authenticated users can view tag assignments"
  ON client_tags_assignments FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Usuarios autenticados pueden crear asignaciones
CREATE POLICY "Authenticated users can create tag assignments"
  ON client_tags_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Usuarios autenticados pueden eliminar asignaciones
CREATE POLICY "Authenticated users can delete tag assignments"
  ON client_tags_assignments FOR DELETE
  TO authenticated
  USING (true);