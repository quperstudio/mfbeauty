import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClientSchemaType } from '../../schemas/client.schema';
import * as clientService from '../../services/client.service';
import { QUERY_KEYS } from '../../lib/queryKeys'; 

// HOOK PRINCIPAL: CLIENTES
// ------------------------
export function useClientsQuery() {
  // CLIENTE DE CONSULTA
  const queryClient = useQueryClient();

  // Obtiene la lista completa de clientes
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.clients.all,
    queryFn: clientService.fetchClients,
  });

  // MUTACIONES
  // ----------
  // Mutación para crear un nuevo cliente
  const createMutation = useMutation({
    mutationFn: clientService.createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  // Mutación para actualizar un cliente existente
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientSchemaType }) =>
      clientService.updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  // Mutación para eliminar cliente(s)
  const deleteMutation = useMutation({
    mutationFn: (ids: string | string[]) => clientService.deleteClients(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  // Mutación para duplicar un cliente
  const duplicateMutation = useMutation({
    mutationFn: clientService.duplicateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  // Mutación para asignar un referente a múltiples clientes
  const assignReferrerMutation = useMutation({
    mutationFn: ({ clientIds, referrerId }: { clientIds: string[]; referrerId: string }) =>
      clientService.updateMultipleClientsReferrer(clientIds, referrerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  // FUNCIONES PÚBLICAS
  // ------------------
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

  // RETORNO DEL HOOK
  // -----------------
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