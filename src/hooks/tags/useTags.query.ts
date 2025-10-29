import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TagSchemaType } from '../../schemas/client.schema';
import * as tagService from '../../services/tag.service';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { ClientTag } from '../../types/database';

/**
 * Hook for managing global tags
 */
export function useTagsQuery() {
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.tags.all,
    queryFn: tagService.fetchAllTags,
  });

  const createMutation = useMutation({
    mutationFn: tagService.createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tagService.deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  const createTag = async (data: TagSchemaType): Promise<{ tag: ClientTag | null; error: string | null }> => {
    try {
      const existing = await tagService.tagExists(data.name);
      if (existing) {
        return { tag: existing, error: null };
      }
      const tag = await createMutation.mutateAsync(data);
      return { tag, error: null };
    } catch (err) {
      return { tag: null, error: err instanceof Error ? err.message : 'Error al crear etiqueta' };
    }
  };

  const deleteTag = async (tagId: string) => {
    try {
      await deleteMutation.mutateAsync(tagId);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al eliminar etiqueta' };
    }
  };

  return {
    tags,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    createTag,
    deleteTag,
    refresh: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.all }),
  };
}

/**
 * Hook for managing tags for a specific client
 */
export function useClientTagsQuery(clientId: string | null) {
  const queryClient = useQueryClient();

  const { data: clientTags = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.tags.byClient(clientId || ''),
    queryFn: () => (clientId ? tagService.fetchTagsByClientId(clientId) : Promise.resolve([])),
    enabled: !!clientId,
  });

  const assignMutation = useMutation({
    mutationFn: ({ clientId, tagId }: { clientId: string; tagId: string }) =>
      tagService.assignTagToClient(clientId, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.byClient(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ clientId, tagId }: { clientId: string; tagId: string }) =>
      tagService.removeTagFromClient(clientId, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.byClient(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  const syncMutation = useMutation({
    mutationFn: ({ clientId, tagIds }: { clientId: string; tagIds: string[] }) =>
      tagService.syncClientTags(clientId, tagIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.byClient(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  const assignTag = async (clientId: string, tagId: string) => {
    try {
      await assignMutation.mutateAsync({ clientId, tagId });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al asignar etiqueta' };
    }
  };

  const removeTag = async (clientId: string, tagId: string) => {
    try {
      await removeMutation.mutateAsync({ clientId, tagId });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al remover etiqueta' };
    }
  };

  const syncTags = async (clientId: string, tagIds: string[]) => {
    try {
      await syncMutation.mutateAsync({ clientId, tagIds });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al sincronizar etiquetas' };
    }
  };

  return {
    clientTags,
    loading: isLoading,
    assignTag,
    removeTag,
    syncTags,
  };
}
