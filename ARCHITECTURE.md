# Arquitectura del Sistema - Guía Completa

Esta documentación describe la arquitectura, patrones y convenciones utilizadas en este proyecto CRM para salones de belleza.

## Visión General

Este proyecto implementa una arquitectura basada en **Custom Hooks especializados** con React Query para gestión de estado y Supabase como backend. La arquitectura está diseñada para ser mantenible, escalable y seguir las mejores prácticas de React moderno.

## Stack Tecnológico

- **Frontend Framework:** React 18 con TypeScript
- **Estado y Cache:** TanStack React Query v5
- **Base de Datos:** Supabase (PostgreSQL con RLS)
- **Validación:** Zod para esquemas y validación runtime
- **Formularios:** React Hook Form con resolvers de Zod
- **UI Components:** Radix UI primitives + TailwindCSS
- **Build Tool:** Vite
- **Routing:** React Router DOM v7

## Estructura del Proyecto

```
src/
├── components/           # Componentes React
│   ├── clients/         # Componentes específicos del módulo de clientes
│   │   ├── AssignReferrerModal.tsx
│   │   ├── ClientBulkActionBar.tsx
│   │   ├── ClientFilters.tsx
│   │   ├── ClientModal.tsx
│   │   ├── ClientProfileModal.tsx
│   │   ├── ClientsListView.tsx
│   │   └── ClientsTableView.tsx
│   ├── layout/          # Componentes de layout (AppLayout, Sidebar, Topbar)
│   ├── shared/          # Componentes compartidos (EmptyState, PageHeader, SearchBar)
│   └── ui/              # Componentes UI reutilizables (Badge, Button, etc.)
├── constants/           # Constantes de la aplicación
│   └── clients.constants.ts
├── contexts/            # Contextos de React
│   ├── AuthContext.tsx  # Autenticación y gestión de sesión
│   └── ThemeContext.tsx # Tema claro/oscuro
├── hooks/               # Custom Hooks
│   ├── clients/         # Hooks del módulo de clientes
│   │   ├── useClients.ts           # Operaciones CRUD base
│   │   ├── useClientActions.ts     # Acciones complejas (guardar, eliminar, duplicar)
│   │   ├── useClientDetails.ts     # Detalles y datos relacionados
│   │   ├── useClientFilters.ts     # Filtrado y ordenamiento
│   │   ├── useClientForm.ts        # Lógica de formularios
│   │   ├── useClientModals.ts      # Estado de modales
│   │   ├── useClientSelection.ts   # Selección masiva
│   │   └── useClientsPage.ts       # Hook compositor de la página
│   ├── shared/          # Hooks compartidos
│   └── tags/            # Hooks de etiquetas
│       └── useTags.ts
├── lib/                 # Utilidades y configuración
│   ├── clients/         # Helpers específicos de clientes
│   │   └── client-helpers.ts
│   ├── calculations.ts  # Funciones de cálculo
│   ├── constants.ts     # Constantes globales
│   ├── formats.ts       # Formateadores (fechas, moneda, teléfono)
│   ├── permissions.ts   # Lógica de permisos
│   ├── queryClient.ts   # Configuración de React Query
│   ├── queryKeys.ts     # Keys centralizadas para cache
│   ├── supabase.ts      # Cliente de Supabase
│   └── utils.ts         # Utilidades generales
├── pages/               # Páginas de la aplicación
│   ├── Clients.tsx      # Página de gestión de clientes
│   ├── Dashboard.tsx    # Dashboard principal
│   ├── Login.tsx        # Página de login
│   ├── Register.tsx     # Página de registro
│   └── ComingSoon.tsx   # Placeholder para páginas futuras
├── schemas/             # Esquemas de validación Zod
│   └── client.schema.ts
└── types/               # Definiciones de tipos TypeScript
    ├── api.ts           # Tipos para respuestas API
    ├── database.ts      # Tipos de entidades de base de datos
    └── forms.ts         # Tipos para formularios
```

## Capas de la Arquitectura

### 1. Capa de Acceso a Datos (Hooks Base)

Los hooks base manejan las operaciones CRUD directas con Supabase usando React Query.

**Ejemplo: `src/hooks/clients/useClients.ts`**

```typescript
export function useClients() {
  const queryClient = useQueryClient();

  // Query para obtener todos los clientes
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.clients.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Client[]) || [];
    },
  });

  // Mutation para crear cliente
  const createMutation = useMutation({
    mutationFn: async (clientData: ClientSchemaType) => {
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  return {
    clients,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    createClient: createMutation.mutateAsync,
    // ... más operaciones
  };
}
```

**Características:**
- Acceso directo a Supabase
- Uso de React Query para cache y estado
- Invalidación automática de cache tras mutaciones
- Manejo de errores centralizado

### 2. Capa de Lógica de Negocio (Hooks Especializados)

Hooks que implementan lógica de negocio específica y orquestan múltiples operaciones.

**Hooks Especializados del Módulo Clientes:**

#### `useClientActions.ts`
Maneja acciones complejas que involucran múltiples pasos:
- `handleSaveClient` - Crear/actualizar cliente + sincronizar tags
- `handleDeleteClients` - Eliminar con confirmación y toast
- `handleBulkDuplicate` - Duplicar múltiples clientes
- `handleBulkExport` - Exportar a CSV
- `handleAssignReferrer` - Asignar referente a múltiples clientes

#### `useClientModals.ts`
Gestiona el estado de todos los modales:
- Estado de apertura/cierre de modales
- Cliente seleccionado para edición
- Target de eliminación (individual o masivo)

#### `useClientSelection.ts`
Maneja la selección masiva de clientes:
- IDs de clientes seleccionados (Set)
- Seleccionar/deseleccionar individual
- Seleccionar/deseleccionar todos
- Limpiar selección

#### `useClientFilters.ts`
Gestiona filtrado, búsqueda y ordenamiento:
- Query de búsqueda
- Filtros por estado (con visitas, con ventas, referidos)
- Filtros por tags
- Ordenamiento multi-campo
- Cálculo de contadores de filtros

#### `useClientForm.ts`
Lógica específica de formularios:
- Integración con react-hook-form
- Validación con Zod
- Gestión de tags
- Auto-generación de links de redes sociales

### 3. Capa de Composición (Hook Compositor)

El hook compositor combina todos los hooks especializados en una única interfaz coherente.

**Ejemplo: `src/hooks/clients/useClientsPage.ts`**

```typescript
export function useClientsPage() {
  const queryClient = useQueryClient();
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Componer hooks especializados
  const { clients, loading, error } = useClients();
  const { tags: availableTags } = useTags();
  const filters = useClientFilters(clients);
  const selection = useClientSelection();
  const modals = useClientModals();
  const actions = useClientActions();

  // Suscripción a cambios en tiempo real
  useEffect(() => {
    const subscription = supabase
      .channel('clients_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'clients'
      }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Funciones de orquestación
  const handleConfirmDelete = async () => {
    if (!modals.deleteTarget) return;

    const isBulk = modals.deleteTarget === 'bulk';
    const clientIds = isBulk
      ? Array.from(selection.selectedClientIds)
      : [modals.deleteTarget];

    await actions.handleDeleteClients(clientIds);

    if (isBulk) selection.clearSelection();
    modals.setDeleteTarget(null);
  };

  // Retornar interfaz unificada
  return {
    clients: filters.filteredAndSortedClients,
    allClients: clients,
    loading,
    availableTags,
    isSmallScreen,
    ...filters,
    ...selection,
    ...modals,
    bulkActionLoading: actions.bulkActionLoading,
    handleSaveClient: actions.handleSaveClient,
    handleConfirmDelete,
    handleBulkDuplicate,
    // ... más funciones
  };
}
```

**Ventajas del Hook Compositor:**
- Interfaz única y cohesiva para el componente
- Orquesta múltiples hooks especializados
- Maneja efectos secundarios complejos
- Facilita testing al separar responsabilidades

### 4. Capa de Presentación (Componentes)

Los componentes se enfocan exclusivamente en UI e interacción del usuario.

**Ejemplo: `src/pages/Clients.tsx`**

```typescript
export default function Clients() {
  const { user } = useAuth();

  // Un solo hook proporciona toda la funcionalidad
  const {
    clients,
    allClients,
    loading,
    availableTags,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    setIsModalOpen,
    selectedClient,
    activeFilter,
    setActiveFilter,
    selectedClientIds,
    handleSelectAll,
    handleSelectClient,
    handleSaveClient,
    handleEditClient,
    handleCreateClient,
    handleViewProfile,
    handleBulkDelete,
    handleBulkDuplicate,
    // ... más
  } = useClientsPage();

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gestiona tu base de clientes"
        actionLabel="Nuevo Cliente"
        onAction={handleCreateClient}
      />

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <ClientFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        availableTags={availableTags}
      />

      {clients.length === 0 ? (
        <EmptyState icon={Users} title="No hay clientes" />
      ) : (
        <>
          <ClientsTableView
            clients={clients}
            selectedClientIds={selectedClientIds}
            onSelectAll={handleSelectAll}
            onSelectClient={handleSelectClient}
            onEdit={handleEditClient}
            onDelete={confirmDeleteClient}
          />

          <ClientsListView
            clients={clients}
            selectedClientIds={selectedClientIds}
            onEdit={handleEditClient}
          />
        </>
      )}

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
        client={selectedClient}
      />
    </div>
  );
}
```

## Patrones Clave

### 1. Separación de Responsabilidades

Cada capa tiene una responsabilidad clara:

- **Hooks Base:** Comunicación con Supabase
- **Hooks Especializados:** Lógica de negocio específica
- **Hook Compositor:** Orquestación y coordinación
- **Componentes:** UI y experiencia de usuario

### 2. Gestión de Estado con React Query

**Configuración Global (`src/lib/queryClient.ts`):**

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

**Keys Centralizadas (`src/lib/queryKeys.ts`):**

```typescript
export const QUERY_KEYS = {
  clients: {
    all: ['clients'] as const,
    detail: (id: string) => ['clients', id] as const,
    referrals: (id: string) => ['clients', 'referrals', id] as const,
  },
  tags: {
    all: ['tags'] as const,
    byClient: (clientId: string) => ['tags', 'client', clientId] as const,
  },
} as const;
```

**Beneficios:**
- Cache automático de datos
- Sincronización en segundo plano
- Invalidación inteligente
- Estados de loading/error consistentes

### 3. Validación con Zod

**Esquemas Tipados (`src/schemas/client.schema.ts`):**

```typescript
const emptyStringToNull = z
  .string()
  .transform(val => val?.trim() === '' ? null : val?.trim() || null)
  .nullable()
  .optional();

export const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').trim(),
  phone: z
    .string()
    .min(1, 'El teléfono es requerido')
    .regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos'),
  birthday: emptyStringToNull,
  notes: emptyStringToNull,
  referrer_id: emptyStringToNull,
  whatsapp_link: emptyStringToNull,
  facebook_link: emptyStringToNull,
  instagram_link: emptyStringToNull,
  tiktok_link: emptyStringToNull,
});

export type ClientSchemaType = z.infer<typeof clientSchema>;
```

**Integración con React Hook Form:**

```typescript
const form = useForm<ClientSchemaType>({
  resolver: zodResolver(clientSchema),
  defaultValues: client || defaultValues,
});
```

### 4. Real-time con Supabase

Las suscripciones en tiempo real se configuran en los hooks compositores:

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('clients_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'clients'
    }, () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, [queryClient]);
```

### 5. Memorización de Funciones

**IMPORTANTE:** Las funciones que se pasan como dependencias a `useEffect` deben memorizarse con `useCallback`:

```typescript
// ❌ INCORRECTO - Causa bucles infinitos
const fetchData = async () => { /* ... */ };

useEffect(() => {
  fetchData();
}, [fetchData]); // fetchData cambia en cada render

// ✅ CORRECTO - Función memorizada
const fetchData = useCallback(async () => { /* ... */ }, []);

useEffect(() => {
  fetchData();
}, [fetchData]); // fetchData mantiene la misma referencia
```

### 6. Refs en Componentes

Los componentes que se usan dentro de componentes compuestos de Radix UI deben soportar refs:

```typescript
// ✅ CORRECTO - Con forwardRef
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
    );
  }
);

Badge.displayName = "Badge";
```

## Flujo de Datos

```
Usuario Interactúa con UI
        ↓
Componente llama función del Hook Compositor
        ↓
Hook Compositor orquesta Hooks Especializados
        ↓
Hook Especializado usa Hook Base
        ↓
Hook Base ejecuta operación en Supabase
        ↓
React Query actualiza cache
        ↓
Componente re-renderiza con nuevos datos
```

## Seguridad

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado en Supabase:

```sql
-- Ejemplo de política RLS
CREATE POLICY "Users can read own data"
  ON clients FOR SELECT
  TO authenticated
  USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can update own data"
  ON clients FOR UPDATE
  TO authenticated
  USING (created_by_user_id = auth.uid())
  WITH CHECK (created_by_user_id = auth.uid());
```

### Autenticación

Manejada por `AuthContext`:
- Login/logout con Supabase Auth
- Persistencia de sesión
- Protección de rutas con `ProtectedRoute`
- Gestión de permisos por rol

## Estrategia de Soft Delete

### Filosofía y Propósito

Este sistema implementa **soft delete** (eliminación lógica) en lugar de hard delete (eliminación física) para entidades críticas del negocio. El soft delete marca registros como eliminados sin borrarlos permanentemente, permitiendo:

1. **Recuperación de Datos**: Protección contra eliminaciones accidentales
2. **Integridad Histórica**: Preservación de registros para auditoría y reportes
3. **Trazabilidad**: Mantener histórico completo de transacciones y relaciones
4. **Cumplimiento Legal**: Retención de datos para regulaciones y auditorías

### Entidades con Soft Delete

Las siguientes tablas implementan soft delete con las columnas `deleted_at` y `deleted_by`:

| Tabla | Soft Delete | Razón |
|-------|-------------|-------|
| `clients` | ✅ Sí | Preservar histórico de citas y transacciones |
| `appointments` | ✅ Sí | Mantener registro de servicios prestados |
| `services` | ✅ Sí | Referencias en citas históricas |
| `service_categories` | ✅ Sí | Clasificación de servicios históricos |
| `commission_agents` | ✅ Sí | Histórico de comisiones y rendimiento |
| `commissions` | ✅ Sí | Auditoría de pagos |
| `cash_register_sessions` | ✅ Sí | Conciliación financiera |
| `transaction_categories` | ✅ Sí | Clasificación de transacciones históricas |
| `transactions` | ❌ No | **INMUTABLE** - Nunca se elimina |
| `appointment_services` | ❌ No | Depende de appointments (CASCADE) |
| `appointment_agents` | ❌ No | Depende de appointments (CASCADE) |

**Nota Importante sobre Transactions:**
- La tabla `transactions` **NO tiene soft delete** porque es inmutable por diseño
- Las transacciones financieras nunca deben modificarse ni eliminarse por regulaciones contables
- Ver migración `20251030053445_add_immutability_to_transactions.sql` para detalles

### Funcionamiento Técnico

#### 1. Columnas de Soft Delete

Cada tabla con soft delete tiene estas columnas:

```sql
deleted_at timestamptz,           -- NULL = activo, NOT NULL = eliminado
deleted_by uuid REFERENCES users(id),  -- Usuario que eliminó el registro
updated_at timestamptz NOT NULL DEFAULT now(),
updated_by uuid REFERENCES users(id)
```

#### 2. Políticas RLS Automáticas

Las políticas RLS de SELECT filtran automáticamente registros eliminados:

```sql
CREATE POLICY "Users can view clients in own organization"
  ON clients FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    deleted_at IS NULL  -- Filtra automáticamente registros eliminados
  );
```

**Implicación**: Los queries normales desde el frontend NO necesitan agregar `WHERE deleted_at IS NULL` explícitamente.

#### 3. Operación de Soft Delete

En el hook `useClients.ts`:

```typescript
const deleteMutation = useMutation({
  mutationFn: async (ids: string | string[]) => {
    const idsArray = Array.isArray(ids) ? ids : [ids];

    // Soft delete: actualizar deleted_at
    // deleted_by se asigna automáticamente via trigger
    const { error } = await supabase
      .from('clients')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', idsArray);

    if (error) throw error;
  },
});
```

### Manejo de Números Telefónicos Únicos

#### Problema

Los clientes tienen un número de teléfono único (`phone`), pero con soft delete surge un conflicto:
- Si un cliente se archiva (soft delete), su teléfono queda "bloqueado"
- No se puede crear un nuevo cliente con ese mismo teléfono
- La restricción UNIQUE tradicional impide la reutilización

#### Solución: Índice Único Parcial

Implementamos un **partial unique index** que solo aplica a registros activos:

```sql
-- Índice único parcial en clientes activos solamente
CREATE UNIQUE INDEX clients_phone_active_unique
ON clients(organization_id, phone)
WHERE deleted_at IS NULL;
```

**Ventajas:**
- ✅ Permite reutilizar números telefónicos de clientes archivados
- ✅ Mantiene unicidad estricta entre clientes activos
- ✅ Mejor rendimiento que constraint global
- ✅ Soporte para multi-tenancy (incluye `organization_id`)

**Comportamiento:**
- Un cliente activo con teléfono "5551234567" → **Único** ✅
- Se archiva ese cliente → El teléfono queda disponible
- Nuevo cliente con "5551234567" → **Permitido** ✅
- Múltiples clientes archivados pueden tener el mismo teléfono
- Solo UN cliente activo por organización puede tener un teléfono específico

Ver migración: `20251030071512_fix_phone_unique_constraint_with_partial_index.sql`

### Relaciones de Claves Foráneas

#### Política: ON DELETE SET NULL para Datos Históricos

Las entidades que referencian `clients` usan `ON DELETE SET NULL` en lugar de `CASCADE` para **preservar datos históricos**:

```sql
-- ✅ CORRECTO: Preserva citas cuando se elimina el cliente
ALTER TABLE appointments
ADD CONSTRAINT appointments_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE SET NULL;

-- ✅ CORRECTO: Preserva transacciones cuando se elimina el cliente
ALTER TABLE transactions
ADD CONSTRAINT transactions_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE SET NULL;
```

**Implicación:**
- Cuando un cliente se elimina (soft o hard delete), las citas y transacciones **NO se borran**
- El campo `client_id` se establece en `NULL`
- Los datos históricos permanecen intactos (fecha, monto, servicios, etc.)
- Los reportes pueden seguir mostrando agregaciones sin pérdida de información

#### Entidades Dependientes con CASCADE

Algunas tablas junction usan `ON DELETE CASCADE` porque dependen completamente de su entidad padre:

```sql
-- appointment_services depende de appointments
CREATE TABLE appointment_services (
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  -- ...
);
```

### Patrones de Consulta

#### Queries de Registros Activos (Por Defecto)

La mayoría de queries en la aplicación solo necesitan datos activos. Las políticas RLS filtran automáticamente:

```typescript
// ✅ AUTOMÁTICO: Solo devuelve clientes activos (deleted_at IS NULL)
const { data: clients } = await supabase
  .from('clients')
  .select('*')
  .order('created_at', { ascending: false });
```

**No necesitas agregar** `.is('deleted_at', null)` porque RLS lo hace automáticamente.

#### Queries Históricos (Incluyen Archivados)

Para reportes, auditorías o vistas administrativas que necesitan incluir registros archivados:

```typescript
// Queries históricos requieren bypass de RLS o políticas especiales
// Ejemplo: Reporte de todas las citas (incluyendo clientes archivados)
const { data: appointments } = await supabase
  .from('appointments')
  .select(`
    *,
    clients!left (
      id,
      name,
      phone
    )
  `)
  .order('appointment_date', { ascending: false });

// El LEFT JOIN incluirá clients incluso si están archivados
// Si client_id es NULL (cliente eliminado permanentemente), la relación será null
```

#### Queries de Referrals

Los referidos (clientes que refirieron a otros) deben filtrarse para excluir archivados:

```typescript
// ✅ Hook useClientReferrals filtra automáticamente vía RLS
export function useClientReferrals(clientId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.clients.referrals(clientId || ''),
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('referrer_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Client[]) || [];
    },
    enabled: !!clientId,
  });
}
// RLS filtra automáticamente deleted_at IS NULL
```

### Visualización de Datos Históricos

#### Principio: Mostrar Siempre el Nombre Original

En reportes, citas pasadas y transacciones históricas, **SIEMPRE** se debe mostrar el nombre original del cliente, incluso si está archivado.

**❌ INCORRECTO: Ocultar o reemplazar el nombre**
```typescript
// NO HACER ESTO
const clientName = client?.deleted_at
  ? 'Cliente Archivado'
  : client.name;
```

**✅ CORRECTO: Mostrar el nombre original**
```typescript
// Siempre mostrar el nombre real
const clientName = client?.name || 'Cliente Eliminado';

// Opcionalmente, agregar indicador visual
{client?.deleted_at && (
  <Badge variant="secondary">Archivado</Badge>
)}
```

#### Ejemplo: Vista de Citas Históricas

```typescript
// Componente de historial de citas
function AppointmentHistory() {
  const { data: appointments } = useQuery({
    queryKey: ['appointments', 'history'],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (id, name, phone, deleted_at)
        `)
        .order('appointment_date', { ascending: false });

      return data;
    },
  });

  return (
    <div>
      {appointments?.map(apt => (
        <div key={apt.id}>
          <p>Cliente: {apt.clients?.name || 'Sin información'}</p>
          {apt.clients?.deleted_at && (
            <Badge variant="outline">Archivado</Badge>
          )}
          <p>Fecha: {apt.appointment_date}</p>
        </div>
      ))}
    </div>
  );
}
```

### Experiencia de Usuario

#### Comportamiento Esperado al Eliminar un Cliente

1. **Vista Principal (Clients.tsx):**
   - El cliente desaparece instantáneamente de la lista
   - RLS filtra automáticamente `deleted_at IS NULL`
   - No se requiere refresh manual

2. **Búsqueda y Filtros:**
   - Los clientes archivados NO aparecen en búsquedas
   - NO aparecen en dropdowns de selección (ej: crear cita)
   - NO aparecen en el selector de referentes

3. **Histórico de Citas:**
   - Las citas pasadas del cliente archivado **siguen visibles**
   - Se muestra el nombre original del cliente
   - Opcionalmente, se puede agregar un badge "Archivado"

4. **Reportes y Transacciones:**
   - Los montos y estadísticas incluyen clientes archivados
   - Los reportes financieros no pierden información
   - Se pueden generar reportes históricos completos

#### Validación de Teléfonos Duplicados

Al crear un nuevo cliente, la validación de teléfono duplicado solo verifica clientes **activos**:

```typescript
// El índice parcial maneja esto automáticamente
// Supabase arrojará error solo si existe un cliente activo con el teléfono
const { data, error } = await supabase
  .from('clients')
  .insert([{ name: 'Juan', phone: '5551234567' }]);

// Si error?.code === '23505' → Teléfono duplicado en clientes activos
// Si no hay error → El teléfono estaba disponible (nunca usado o de cliente archivado)
```

### Directrices para Desarrollo Futuro

#### Al Crear Nuevas Entidades

Si una nueva entidad requiere soft delete:

1. **Agregar columnas en la migración:**
```sql
ALTER TABLE nueva_tabla ADD COLUMN deleted_at timestamptz;
ALTER TABLE nueva_tabla ADD COLUMN deleted_by uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE nueva_tabla ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL;
ALTER TABLE nueva_tabla ADD COLUMN updated_by uuid REFERENCES users(id) ON DELETE SET NULL;
```

2. **Actualizar política RLS de SELECT:**
```sql
CREATE POLICY "Users can view active records"
  ON nueva_tabla FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id() AND
    deleted_at IS NULL
  );
```

3. **Crear índice para performance:**
```sql
CREATE INDEX idx_nueva_tabla_deleted_at
ON nueva_tabla(organization_id, deleted_at);
```

#### Al Referenciar Clientes

Si una nueva tabla necesita referenciar `clients`:

```sql
-- ✅ Usar ON DELETE SET NULL para preservar histórico
CREATE TABLE nueva_tabla (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  -- ...
);
```

#### Al Implementar Módulo de Citas

Cuando se desarrolle la funcionalidad de citas:

1. **Selector de Clientes:**
   - Usar query estándar (RLS filtra automáticamente)
   - Los clientes archivados NO aparecerán en el dropdown

2. **Vista de Historial:**
   - Usar LEFT JOIN para incluir clientes archivados
   - Mostrar siempre el nombre original del cliente
   - Agregar badge "Archivado" si `deleted_at IS NOT NULL`

3. **Reportes de Ingresos:**
   - Incluir todas las citas sin filtrar por `deleted_at` del cliente
   - Los ingresos históricos deben mantenerse completos

### Tabla de Referencia Rápida

| Escenario | Filtrar `deleted_at IS NULL`? | Método |
|-----------|-------------------------------|--------|
| Lista de clientes activos | ✅ Sí | Automático (RLS) |
| Crear nueva cita → seleccionar cliente | ✅ Sí | Automático (RLS) |
| Asignar referente | ✅ Sí | Automático (RLS) |
| Historial de citas de un cliente | ❌ No | LEFT JOIN con clientes |
| Reporte de ingresos mensuales | ❌ No | Incluir todas las transacciones |
| Búsqueda de cliente | ✅ Sí | Automático (RLS) |
| Dashboard de estadísticas | ❌ No | Incluir datos históricos completos |
| Auditoría administrativa | ❌ No | Query especial o bypass RLS |

### Recursos y Migraciones Relacionadas

Migraciones clave para soft delete:

1. `20251030053420_add_soft_delete_and_audit_columns.sql`
   - Agrega columnas deleted_at, deleted_by, updated_at, updated_by

2. `20251030053536_update_rls_to_exclude_soft_deleted.sql`
   - Actualiza políticas RLS para filtrar registros eliminados

3. `20251030053513_create_audit_triggers.sql`
   - Triggers automáticos para updated_by y deleted_by

4. `20251030071512_fix_phone_unique_constraint_with_partial_index.sql`
   - Índice único parcial para reutilización de teléfonos

5. `20251030071548_fix_appointments_client_fk_for_data_preservation.sql`
   - Cambia foreign key a ON DELETE SET NULL

## Problemas Comunes y Soluciones

### Error: Maximum update depth exceeded

**Causa:** Función no memorizada usada como dependencia de `useEffect`.

**Solución:** Envolver la función con `useCallback`:

```typescript
// Antes
const fetchData = async () => { /* ... */ };

// Después
const fetchData = useCallback(async () => { /* ... */ }, []);
```

### Error: Function components cannot be given refs

**Causa:** Componente no soporta refs pero se usa en un contexto que las requiere (Radix UI).

**Solución:** Usar `React.forwardRef`:

```typescript
const MyComponent = React.forwardRef<HTMLDivElement, Props>(
  (props, ref) => <div ref={ref} {...props} />
);
```

### Cache no se invalida

**Causa:** Query key incorrecta o falta de invalidación.

**Solución:**
1. Usar keys de `QUERY_KEYS`
2. Invalidar después de mutaciones:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
}
```

## Mejores Prácticas

### Hooks

1. **Siempre usa `useCallback` para funciones en dependencias de `useEffect`**
2. **Usa `useMemo` para cálculos costosos**
3. **Mantén los hooks pequeños y enfocados**
4. **Retorna interfaces consistentes**
5. **Documenta hooks complejos**

### Componentes

1. **Componentes pequeños y reutilizables**
2. **Props explícitas y bien tipadas**
3. **Separar lógica en hooks**
4. **Usar componentes de composición**
5. **Implementar loading y error states**

### TypeScript

1. **Tipar todas las funciones**
2. **Usar `as const` para constantes literales**
3. **Inferir tipos de Zod con `z.infer`**
4. **Evitar `any`, usar `unknown` si es necesario**
5. **Definir interfaces para objetos complejos**

### React Query

1. **Keys centralizadas en `queryKeys.ts`**
2. **Invalidar cache tras mutaciones**
3. **Configurar `staleTime` apropiadamente**
4. **Usar `enabled` para queries condicionales**
5. **Manejar estados `isLoading` e `error`**

## Escalabilidad

### Para agregar un nuevo módulo (ej: Citas)

1. **Crear tipos en `src/types/database.ts`:**
```typescript
export interface Appointment {
  id: string;
  client_id: string;
  date: string;
  // ...
}
```

2. **Crear esquema en `src/schemas/appointment.schema.ts`:**
```typescript
export const appointmentSchema = z.object({
  client_id: z.string().uuid(),
  date: z.string(),
  // ...
});
```

3. **Agregar query keys en `src/lib/queryKeys.ts`:**
```typescript
appointments: {
  all: ['appointments'] as const,
  detail: (id: string) => ['appointments', id] as const,
}
```

4. **Crear hooks siguiendo el patrón:**
   - `src/hooks/appointments/useAppointments.ts` (base)
   - `src/hooks/appointments/useAppointmentActions.ts` (acciones)
   - `src/hooks/appointments/useAppointmentsPage.ts` (compositor)

5. **Crear componentes:**
   - `src/components/appointments/` (componentes específicos)
   - `src/pages/Appointments.tsx` (página principal)

6. **Crear migración de base de datos:**
   - `supabase/migrations/YYYYMMDDHHMMSS_create_appointments.sql`

## Performance

### Optimizaciones Implementadas

1. **React Query Cache:** Datos en cache por 5 minutos
2. **Memoización:** `useCallback` y `useMemo` en lugares críticos
3. **Code Splitting:** Por rutas con React Router
4. **Lazy Loading:** Componentes pesados cargados bajo demanda

### Consideraciones Futuras

Para escalar más allá de 5,000 registros:
- Implementar paginación en listados
- Virtualización de listas con `react-virtual`
- Debounce en búsquedas
- Optimistic updates en mutaciones críticas

## Testing

### Estrategia Recomendada

**Hooks:**
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useClients } from './useClients';

test('fetches clients', async () => {
  const { result } = renderHook(() => useClients());

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.clients).toHaveLength(10);
});
```

**Componentes:**
```typescript
import { render, screen } from '@testing-library/react';
import Clients from './Clients';

test('renders clients list', () => {
  render(<Clients />);

  expect(screen.getByText('Clientes')).toBeInTheDocument();
});
```

## Recursos Adicionales

- [React Query Documentation](https://tanstack.com/query/latest)
- [Supabase Documentation](https://supabase.com/docs)
- [Zod Documentation](https://zod.dev)
- [React Hook Form](https://react-hook-form.com)
- [Radix UI](https://www.radix-ui.com)

---

**Última actualización:** 2025-10-29
**Versión del proyecto:** 0.0.0 (MVP)
