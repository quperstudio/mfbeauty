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
