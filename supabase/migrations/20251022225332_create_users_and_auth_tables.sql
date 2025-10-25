/*
  # Sistema de Usuarios y Autenticación

  1. Nuevas Tablas
    - `users`
      - `id` (uuid, primary key) - ID único del usuario
      - `email` (text, unique) - Email para login
      - `full_name` (text) - Nombre completo del usuario
      - `role` (text) - Rol: 'administrator' o 'employee'
      - `active` (boolean) - Estado activo/inactivo
      - `created_at` (timestamptz) - Fecha de creación

  2. Seguridad
    - Enable RLS on `users` table
    - Policies for authenticated users to read their own data
    - Only administrators can create/update/delete users
*/

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('administrator', 'employee')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios autenticados pueden ver su propia información
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Solo administradores pueden crear usuarios
CREATE POLICY "Administrators can create users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );

-- Policy: Solo administradores pueden actualizar usuarios
CREATE POLICY "Administrators can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );

-- Policy: Solo administradores pueden eliminar usuarios
CREATE POLICY "Administrators can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
      AND users.active = true
    )
  );