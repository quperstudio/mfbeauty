/**
 * Clients Query Hook
 *
 * Custom React Query hook for managing client data with CRUD operations.
 *
 * ARCHITECTURE PATTERN:
 * This hook demonstrates the standard pattern for entity queries in this project:
 *
 * 1. Import React Query hooks (useQuery, useMutation, useQueryClient)
 * 2. Import entity service functions
 * 3. Import query keys from centralized location
 * 4. Define query with useQuery for fetching data
 * 5. Define mutations for create, update, delete
 * 6. Wrap mutations in async functions with error handling
 * 7. Return data, loading states, and operation functions
 *
 * REALTIME UPDATES:
 * Set up Supabase realtime subscriptions directly in components using:
 *
 * const queryClient = useQueryClient();
 * useEffect(() => {
 *   const subscription = supabase
 *     .channel('table_changes')
 *     .on('postgres_changes', { event: '*', schema: 'public', table: 'table_name' }, () => {
 *       queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entity.all });
 *     })
 *     .subscribe();
 *   return () => subscription.unsubscribe();
 * }, [queryClient]);
 *
 * USAGE:
 *
 * const { clients, loading, error, createClient, updateClient, deleteClient } = useClientsQuery();
 *
 * // Create
 * const result = await createClient(data);
 * if (result.error) console.error(result.error);
 *
 * // Update
 * await updateClient(id, data);
 *
 * // Delete
 * await deleteClient(id);
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClientSchemaType } from '../../schemas/client.schema';
import * as clientService from '../../services/client.service';
import { QUERY_KEYS } from '../../lib/queryKeys'; 

export function useClientsQuery() {
  // SECCIÓN: HOOKS Y CLIENTE DE CONSULTA
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.clients.all,
    queryFn: clientService.fetchClients,
  });

  // SECCIÓN: MUTACIONES (Silenciosas - sin toasts)
  const createMutation = useMutation({
    mutationFn: clientService.createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientSchemaType }) =>
      clientService.updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string | string[]) => clientService.deleteClients(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: clientService.duplicateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  const assignReferrerMutation = useMutation({
    mutationFn: ({ clientIds, referrerId }: { clientIds: string[]; referrerId: string }) =>
      clientService.updateMultipleClientsReferrer(clientIds, referrerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  // SECCIÓN: FUNCIONES PÚBLICAS
  const createClient = async (data: ClientSchemaType) => {
    const newClient = await createMutation.mutateAsync(data);
    return newClient;
  };

  const updateClient = async (id: string, data: ClientSchemaType) => {
    const updatedClient = await updateMutation.mutateAsync({ id, data });
    return updatedClient;
  };

  const deleteClient = async (ids: string | string[]) => {
    await deleteMutation.mutateAsync(ids);
  };

  const duplicateClient = async (id: string) => {
    const duplicatedClient = await duplicateMutation.mutateAsync(id);
    return duplicatedClient;
  };

  const assignReferrer = async (clientIds: string[], referrerId: string) => {
    await assignReferrerMutation.mutateAsync({ clientIds, referrerId });
  };

  // SECCIÓN: RETORNO DEL HOOK
  return {
    clients,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    createClient,
    updateClient,
    deleteClient,
    duplicateClient,
    assignReferrer,
    refresh: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all }),
  };
}