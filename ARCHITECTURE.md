# Architecture Guide

This document describes the architecture patterns and conventions used in this project.

## Overview

This project uses a scalable, service-oriented architecture with React Query for state management and Supabase for the backend. The architecture is designed to be consistent, maintainable, and easy to extend with new entities.

## Project Structure

```
src/
├── components/        # React components
│   ├── clients/       # Client-specific components
│   ├── layout/        # Layout components (Sidebar, Topbar, etc.)
│   └── ui/            # Reusable UI components
├── contexts/          # React contexts (Auth, Theme)
├── hooks/
│   └── queries/       # React Query hooks for data fetching
├── lib/               # Utility libraries
│   ├── calculations.ts
│   ├── constants.ts
│   ├── formats.ts
│   ├── permissions.ts
│   ├── queryClient.ts
│   ├── queryKeys.ts   # Centralized React Query keys
│   ├── supabase.ts    # Supabase client configuration
│   ├── utils.ts
│   └── validators.ts
├── pages/             # Page components
├── schemas/           # Zod validation schemas
├── services/          # Data access layer
│   ├── base.service.ts      # Generic CRUD operations
│   └── client.service.ts    # Client-specific operations
└── types/             # TypeScript type definitions
    ├── api.ts         # API response types
    ├── database.ts    # Database entity types
    └── forms.ts       # Form data types
```

## Architecture Layers

### 1. Service Layer (`src/services/`)

The service layer handles all database operations using Supabase. Each entity has its own service file.

**Pattern:**

```typescript
// Import base service and types
import * as baseService from './base.service';
import { EntityType } from '../types/database';
import { EntitySchemaType } from '../schemas/entity.schema';

const TABLE_NAME = 'entity_table';

// Fetch all records
export async function fetchEntities(): Promise<EntityType[]> {
  return baseService.fetchAll<EntityType>(TABLE_NAME, {
    column: 'created_at',
    ascending: false,
  });
}

// Fetch by ID
export async function fetchEntityById(id: string): Promise<EntityType | null> {
  return baseService.fetchById<EntityType>(TABLE_NAME, id);
}

// Create
export async function createEntity(data: EntitySchemaType): Promise<EntityType> {
  return baseService.create<EntityType, EntitySchemaType>(TABLE_NAME, data);
}

// Update
export async function updateEntity(id: string, data: EntitySchemaType): Promise<EntityType> {
  return baseService.update<EntityType, EntitySchemaType>(TABLE_NAME, id, data);
}

// Delete
export async function deleteEntity(id: string): Promise<void> {
  return baseService.remove(TABLE_NAME, id);
}
```

**Base Service Functions:**

- `fetchAll<T>()` - Fetch all records with optional ordering
- `fetchById<T>()` - Fetch single record by ID
- `create<T, TInput>()` - Create new record
- `update<T, TInput>()` - Update existing record
- `remove()` - Delete record
- `fetchWithFilter<T>()` - Fetch with custom filters
- `count()` - Count records with optional filters

### 2. React Query Hooks (`src/hooks/queries/`)

Custom hooks that use React Query for data fetching, caching, and state management.

**Pattern:**

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as entityService from '../../services/entity.service';
import { QUERY_KEYS } from '../../lib/queryKeys';

export function useEntitiesQuery() {
  const queryClient = useQueryClient();

  // Fetch query
  const { data: entities = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.entities.all,
    queryFn: entityService.fetchEntities,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: entityService.createEntity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entities.all });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entityService.updateEntity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entities.all });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: entityService.deleteEntity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entities.all });
    },
  });

  // Wrapper functions with error handling
  const createEntity = async (data) => {
    try {
      await createMutation.mutateAsync(data);
      return { error: null };
    } catch (err) {
      return { error: err.message };
    }
  };

  return {
    entities,
    loading: isLoading,
    error: error?.message ?? null,
    createEntity,
    updateEntity,
    deleteEntity,
    refresh: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entities.all }),
  };
}
```

### 3. Realtime Subscriptions

Supabase realtime subscriptions are set up directly in components, not in hooks.

**Pattern:**

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { QUERY_KEYS } from '../lib/queryKeys';

export default function EntitiesPage() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = supabase
      .channel('entities_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'entities'
      }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entities.all });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // ... rest of component
}
```

### 4. Query Keys (`src/lib/queryKeys.ts`)

Centralized location for all React Query cache keys.

```typescript
export const QUERY_KEYS = {
  entities: {
    all: ['entities'] as const,
    detail: (id: string) => ['entities', id] as const,
    filtered: (filters: Record<string, any>) => ['entities', 'filtered', filters] as const,
  },
};
```

### 5. Validation Schemas (`src/schemas/`)

Zod schemas for validating form inputs and API data.

```typescript
import { z } from 'zod';

export const entitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  // ... other fields
});

export type EntitySchemaType = z.infer<typeof entitySchema>;
```

## Key Principles

### 1. Separation of Concerns

- **Services**: Handle data access and business logic
- **Hooks**: Manage React Query state and mutations
- **Components**: Handle UI and user interactions
- **Schemas**: Define and validate data structures

### 2. Type Safety

- All functions are fully typed with TypeScript
- Use Zod schemas for runtime validation
- Database types defined in `src/types/database.ts`

### 3. Error Handling

- Services throw errors on failure
- Hooks catch errors and return them in a standardized format
- Components display errors to users

### 4. Consistency

- All entities follow the same patterns
- Standardized naming conventions
- Centralized query keys and types

### 5. Scalability

- Base service functions reduce code duplication
- Easy to add new entities by following existing patterns
- Clear separation makes testing easier

## Adding a New Entity

1. **Define types** in `src/types/database.ts`
2. **Create schema** in `src/schemas/entity.schema.ts`
3. **Create service** in `src/services/entity.service.ts` using base functions
4. **Add query keys** to `src/lib/queryKeys.ts`
5. **Create hook** in `src/hooks/queries/useEntity.query.ts`
6. **Create page component** in `src/pages/Entity.tsx`
7. **Add realtime subscription** in the component if needed
8. **Create database migration** in `supabase/migrations/`

## Best Practices

### Services

- Use base service functions for common operations
- Add entity-specific logic only when needed
- Always type function parameters and return values
- Let errors bubble up to be handled by hooks

### Hooks

- Always use query keys from `QUERY_KEYS`
- Invalidate related queries after mutations
- Wrap mutations in try-catch for error handling
- Return consistent interface: `{ data, loading, error, ...operations }`

### Components

- Use hooks for data access, not direct service calls
- Set up realtime subscriptions in useEffect
- Handle loading and error states appropriately
- Keep business logic in services, not components

### Realtime

- Set up subscriptions in components, not hooks
- Always clean up subscriptions in useEffect return
- Invalidate appropriate query keys on changes
- Include queryClient in useEffect dependencies

## Common Patterns

### Fetching Data

```typescript
const { entities, loading, error } = useEntitiesQuery();

if (loading) return <Spinner />;
if (error) return <Error message={error} />;
return <EntityList entities={entities} />;
```

### Creating Records

```typescript
const { createEntity } = useEntitiesQuery();

const handleCreate = async (data) => {
  const result = await createEntity(data);
  if (result.error) {
    showError(result.error);
  } else {
    showSuccess('Created successfully');
  }
};
```

### Updating Records

```typescript
const { updateEntity } = useEntitiesQuery();

const handleUpdate = async (id, data) => {
  const result = await updateEntity(id, data);
  if (result.error) {
    showError(result.error);
  }
};
```

### Deleting Records

```typescript
const { deleteEntity } = useEntitiesQuery();

const handleDelete = async (id) => {
  if (!confirm('Are you sure?')) return;
  await deleteEntity(id);
};
```

## Testing Strategy

### Services

- Test CRUD operations
- Test error handling
- Mock Supabase client

### Hooks

- Test query results
- Test mutation behavior
- Test error states
- Test cache invalidation

### Components

- Test rendering with different states
- Test user interactions
- Test realtime updates
- Mock hooks

## Performance Considerations

- React Query handles caching automatically
- Use `staleTime` to control refetch frequency
- Implement pagination for large datasets
- Use indexes in database for frequently queried fields
- Optimize realtime subscriptions to only needed tables

## Security

- Row Level Security (RLS) enabled on all tables
- Authentication checked at database level
- Permissions verified in components when needed
- Never expose sensitive data in client-side code
