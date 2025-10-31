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
  // Nota: Los clientes eliminados son filtrados por RLS Y por filtro explícito como capa defensiva
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.clients.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .is('deleted_at', null) // Filtro explícito para garantizar que no aparezcan clientes eliminados
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

  // MUTACIÓN 3: SOFT DELETE CLIENTE(S)
  // Nota: No eliminamos permanentemente, solo marcamos como eliminado
  const deleteMutation = useMutation({
    mutationFn: async (ids: string | string[]): Promise<number> => {
      const idsArray = Array.isArray(ids) ? ids : [ids];

      console.log(`[useClients] Iniciando soft delete de ${idsArray.length} cliente(s):`, idsArray);

      // Soft delete: actualizar deleted_at
      // deleted_by se asigna automáticamente via trigger
      const { data, error, count } = await supabase
        .from('clients')
        .update({
          deleted_at: new Date().toISOString()
        })
        .in('id', idsArray)
        .select();

      if (error) {
        console.error('[useClients] Error en soft delete:', error);
        throw error;
      }

      // Obtener el conteo real de filas afectadas
      const affectedCount = data?.length || count || 0;
      console.log(`[useClients] Soft delete completado. Filas afectadas: ${affectedCount}`);

      // Advertencia si no se afectaron todas las filas esperadas
      if (affectedCount < idsArray.length) {
        console.warn(
          `[useClients] ADVERTENCIA: Se esperaba eliminar ${idsArray.length} cliente(s), pero solo se eliminaron ${affectedCount}.`
        );
      }

      return affectedCount;
    },
    // Invalida la lista de clientes para reflejar el cambio
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
        .is('deleted_at', null) // Filtro explícito para excluir clientes eliminados
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Client[]) || [];
    },
    enabled: !!clientId, // Se ejecuta solo si hay un ID de cliente
  });
}
