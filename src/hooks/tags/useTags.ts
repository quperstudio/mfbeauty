import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { ClientTag, ClientTagAssignment } from '../../types/database';
import { TagSchemaType } from '../../schemas/client.schema';

export function useTags() {
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.tags.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data as ClientTag[]) || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (tagData: TagSchemaType) => {
      const existingTag = await queryClient.fetchQuery({
        queryKey: ['tag-exists', tagData.name],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('client_tags')
            .select('*')
            .ilike('name', tagData.name)
            .maybeSingle();

          if (error) throw error;
          return data as ClientTag | null;
        },
      });

      if (existingTag) {
        return existingTag;
      }

      const { data, error } = await supabase
        .from('client_tags')
        .insert([tagData])
        .select()
        .single();

      if (error) throw error;
      return data as ClientTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase.from('client_tags').delete().eq('id', tagId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  return {
    tags,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    createTag: createMutation.mutateAsync,
    deleteTag: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useClientTags(clientId: string | null) {
  const queryClient = useQueryClient();

  const { data: clientTags = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.tags.byClient(clientId || ''),
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('client_tags_assignments')
        .select(
          `
          tag_id,
          client_tags (id, name, created_at)
        `
        )
        .eq('client_id', clientId);

      if (error) throw error;

      return data?.map((item: any) => item.client_tags).filter(Boolean) || [];
    },
    enabled: !!clientId,
  });

  const assignMutation = useMutation({
    mutationFn: async ({ clientId, tagId }: { clientId: string; tagId: string }) => {
      const { data, error } = await supabase
        .from('client_tags_assignments')
        .insert({ client_id: clientId, tag_id: tagId })
        .select()
        .single();

      if (error) throw error;
      return data as ClientTagAssignment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.byClient(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async ({ clientId, tagId }: { clientId: string; tagId: string }) => {
      const { error } = await supabase
        .from('client_tags_assignments')
        .delete()
        .eq('client_id', clientId)
        .eq('tag_id', tagId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.byClient(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async ({ clientId, tagIds }: { clientId: string; tagIds: string[] }) => {
      const { error: deleteError } = await supabase
        .from('client_tags_assignments')
        .delete()
        .eq('client_id', clientId);

      if (deleteError) throw deleteError;

      if (tagIds.length > 0) {
        const assignments = tagIds.map((tagId) => ({
          client_id: clientId,
          tag_id: tagId,
        }));

        const { error: insertError } = await supabase
          .from('client_tags_assignments')
          .insert(assignments);

        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.byClient(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  const fetchClientIdsByTags = async (tagIds: string[]): Promise<string[]> => {
    if (tagIds.length === 0) return [];

    const { data, error } = await supabase
      .from('client_tags_assignments')
      .select('client_id')
      .in('tag_id', tagIds);

    if (error) throw error;

    const clientIds = new Set<string>();
    data?.forEach((item) => clientIds.add(item.client_id));

    return Array.from(clientIds);
  };

  return {
    clientTags,
    loading: isLoading,
    assignTag: assignMutation.mutateAsync,
    removeTag: removeMutation.mutateAsync,
    syncTags: syncMutation.mutateAsync,
    fetchClientIdsByTags,
    isAssigning: assignMutation.isPending,
    isRemoving: removeMutation.isPending,
    isSyncing: syncMutation.isPending,
  };
}
