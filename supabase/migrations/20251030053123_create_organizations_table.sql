/*
  # Create Organizations Table

  1. New Tables
    - `organizations`
      - `id` (uuid, primary key) - Unique organization identifier
      - `name` (text) - Internal name of the organization
      - `business_name` (text) - Public-facing business name
      - `slug` (text, unique) - URL-friendly unique identifier
      - `active` (boolean) - Whether organization is active
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on `organizations` table
    - Only authenticated users can read organizations
    - System can create organizations during registration

  3. Indexes
    - Unique index on slug for fast lookups
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  business_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view organizations
CREATE POLICY "Authenticated users can view organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (true);

-- Policy: System can insert organizations (for registration flow)
CREATE POLICY "System can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);
