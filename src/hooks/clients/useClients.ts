import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { Client } from '../../types/database';
import { ClientSchemaType } from '../../schemas/client.schema';

// HOOK PRINCIPAL: useClients
// --------------------------
// Proporciona la lista de clientes y las funciones CRUD para gestionarlos.
export function useClients() {
  const queryClient = useQueryClient();

  // CONSULTA 1: OBTENER TODOS LOS CLIENTES
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

  // MUTACIÓN 1: CREAR CLIENTE
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
    // Invalida la lista de clientes para forzar una actualización
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  // MUTACIÓN 2: ACTUALIZAR CLIENTE
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClientSchemaType }) => {
      const { data: result, error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as Client;
    },
    // Invalida la lista de clientes para forzar una actualización
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  // MUTACIÓN 3: ELIMINAR CLIENTE(S)
  const deleteMutation = useMutation({
    mutationFn: async (ids: string | string[]) => {
      const idsArray = Array.isArray(ids) ? ids : [ids];
      // Permite eliminar uno o varios clientes
      const { error } = await supabase.from('clients').delete().in('id', idsArray);

      if (error) throw error;
    },
    // Invalida la lista de clientes para reflejar la eliminación
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  // MUTACIÓN 4: ASIGNAR REFERENTE (Masivo)
  const assignReferrerMutation = useMutation({
    mutationFn: async ({ clientIds, referrerId }: { clientIds: string[]; referrerId: string | null }) => {
      // Llama a una función RPC para actualizar el referente de múltiples clientes
      const { data, error } = await supabase.rpc('assign_referrer_to_clients', {
        client_ids: clientIds,
        new_referrer_id: referrerId,
      });

      if (error) throw error;
      return data;
    },
    // Invalida la lista para reflejar los cambios en el referente
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  // RETORNO DEL HOOK (Funciones y Estados)
  // --------------------------------------
  return {
    clients,
    loading: isLoading,
    // Formatea el error para que sea amigable
    error: error instanceof Error ? error.message : null,
    createClient: createMutation.mutateAsync,
    updateClient: updateMutation.mutateAsync,
    deleteClients: deleteMutation.mutateAsync,
    assignReferrer: assignReferrerMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAssigningReferrer: assignReferrerMutation.isPending,
  };
}

// HOOK AUXILIAR: useClientReferrals
// ---------------------------------
// Obtiene la lista de clientes referidos por un cliente específico.
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
    enabled: !!clientId, // Se ejecuta solo si hay un ID de cliente
  });
}
