import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { Client } from '../../types/database';
import { ClientSchemaType } from '../../schemas/client.schema';

export function useClients() {
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string | string[]) => {
      const idsArray = Array.isArray(ids) ? ids : [ids];
      const { error } = await supabase.from('clients').delete().in('id', idsArray);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { data, error } = await supabase.rpc('duplicate_client_with_tags', {
        original_client_id: clientId,
      });

      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  const assignReferrerMutation = useMutation({
    mutationFn: async ({ clientIds, referrerId }: { clientIds: string[]; referrerId: string | null }) => {
      const { data, error } = await supabase.rpc('assign_referrer_to_clients', {
        client_ids: clientIds,
        new_referrer_id: referrerId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  const checkDuplicatePhoneMutation = useMutation({
    mutationFn: async ({ phone, excludeClientId }: { phone: string; excludeClientId?: string }) => {
      let query = supabase.from('clients').select('*').eq('phone', phone);

      if (excludeClientId) {
        query = query.neq('id', excludeClientId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data as Client | null;
    },
  });

  return {
    clients,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    createClient: createMutation.mutateAsync,
    updateClient: updateMutation.mutateAsync,
    deleteClients: deleteMutation.mutateAsync,
    duplicateClient: duplicateMutation.mutateAsync,
    assignReferrer: assignReferrerMutation.mutateAsync,
    checkDuplicatePhone: checkDuplicatePhoneMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
    isAssigningReferrer: assignReferrerMutation.isPending,
  };
}

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
