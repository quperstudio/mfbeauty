-- Este archivo representa el estado actual (y roto) de la base de datos
-- después de intentar la solución v8.
-- Las funciones (Paso 1) están fallando y devolviendo NULL.

-- ===================================================================
-- PASO 1: FUNCIONES (Estado Actual - Devuelven NULL)
-- ===================================================================
-- (Nota: Estas son las funciones 'SECURITY DEFINER' de la v8)

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT organization_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_user_organization_id() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT role
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- ===================================================================
-- PASO 2: POLÍTICAS DE 'users' (Estado Actual)
-- ===================================================================
-- (Nota: Estas son las políticas de la v8 que dependen de las funciones rotas)

CREATE POLICY "User can view their own data"
  ON public.users FOR SELECT
  TO authenticated
  USING ( (id = auth.uid()) );

CREATE POLICY "Administrators can create users in own organization"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    public.get_user_role() = 'administrator'
  );

CREATE POLICY "Administrators can update users in own organization"
  ON public.users FOR UPDATE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    public.get_user_role() = 'administrator'
  )
  WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "Administrators can delete users in own organization"
  ON public.users FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    public.get_user_role() = 'administrator'
  );

-- ===================================================================
-- PASO 3: POLÍTICAS DE 'clients' (Estado Actual)
-- ===================================================================
-- (Nota: Estas son las políticas de la v8 que fallan
-- porque las funciones del Paso 1 devuelven NULL)

CREATE POLICY "clients_select_active_in_organization"
  ON clients FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND deleted_at IS NULL
  );

CREATE POLICY "clients_insert_in_organization"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "clients_delete_administrators_only"
  ON clients FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    public.get_user_role() = 'administrator'
  );

CREATE POLICY "clients_update_administrators_full_access"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    public.get_user_role() = 'administrator'
  )
  WITH CHECK (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "clients_update_employees_restricted"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    public.get_user_role() = 'employee'
  )
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND deleted_at IS NULL
  );