/**
 * React Query Key Constants
 *
 * Centralized location for all React Query cache keys.
 * This ensures consistency across the application and makes
 * cache invalidation more maintainable.
 *
 * Usage:
 *
 * import { QUERY_KEYS } from '../lib/queryKeys';
 *
 * const { data } = useQuery({
 *   queryKey: QUERY_KEYS.clients.all,
 *   queryFn: fetchClients
 * });
 *
 * queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
 */

export const QUERY_KEYS = {
  clients: {
    all: ['clients'] as const,
    detail: (id: string) => ['clients', id] as const,
    filtered: (filters: Record<string, any>) => ['clients', 'filtered', filters] as const,
    details: (id: string) => ['clients', 'details', id] as const,
    referrals: (id: string) => ['clients', 'referrals', id] as const,
  },
  services: {
    all: ['services'] as const,
    detail: (id: string) => ['services', id] as const,
    byCategory: (categoryId: string) => ['services', 'category', categoryId] as const,
  },
  serviceCategories: {
    all: ['service-categories'] as const,
    detail: (id: string) => ['service-categories', id] as const,
  },
  commissionAgents: {
    all: ['commission-agents'] as const,
    detail: (id: string) => ['commission-agents', id] as const,
    active: ['commission-agents', 'active'] as const,
  },
  appointments: {
    all: ['appointments'] as const,
    detail: (id: string) => ['appointments', id] as const,
    byClient: (clientId: string) => ['appointments', 'client', clientId] as const,
    byDate: (date: string) => ['appointments', 'date', date] as const,
    byStatus: (status: string) => ['appointments', 'status', status] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    detail: (id: string) => ['transactions', id] as const,
    byType: (type: string) => ['transactions', 'type', type] as const,
    byDateRange: (start: string, end: string) => ['transactions', 'range', start, end] as const,
  },
  commissions: {
    all: ['commissions'] as const,
    detail: (id: string) => ['commissions', id] as const,
    byAgent: (agentId: string) => ['commissions', 'agent', agentId] as const,
    byStatus: (status: string) => ['commissions', 'status', status] as const,
  },
  cashRegister: {
    all: ['cash-register'] as const,
    current: ['cash-register', 'current'] as const,
    detail: (id: string) => ['cash-register', id] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
    current: ['users', 'current'] as const,
  },
  tags: {
    all: ['tags'] as const,
    byClient: (clientId: string) => ['tags', 'client', clientId] as const,
    usageCounts: ['tags', 'usage-counts'] as const,
  },
} as const;
