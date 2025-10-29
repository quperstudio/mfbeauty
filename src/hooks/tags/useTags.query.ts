import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TagSchemaType } from '../../schemas/client.schema';
import * as tagService from '../../services/tag.service';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { ClientTag } from '../../types/database';

// HOOK 1: ETIQUETAS GLOBALES (useTagsQuery)
// ----------------------------------------
// Hook para gestionar las etiquetas de cliente a nivel global.
export function useTagsQuery() {
  const queryClient = useQueryClient();

  // CONSULTA: Obtener todas las etiquetas
  const { data: tags = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.tags.all,
    queryFn: tagService.fetchAllTags,
  });

  // MUTACIÓN: Crear etiqueta
  const createMutation = useMutation({
    mutationFn: tagService.createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.all });
    },
  });

  // MUTACIÓN: Eliminar etiqueta
  const deleteMutation = useMutation({
    mutationFn: tagService.deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all }); // Invalida clientes por si se elimina una tag asignada
    },
  });

  // FUNCIÓN: Crear una etiqueta (o devolver existente si ya está)
  const createTag = async (data: TagSchemaType): Promise<{ tag: ClientTag | null; error: string | null }> => {
    try {
      const existing = await tagService.tagExists(data.name);
      if (existing) { return { tag: existing, error: null }; } // Devuelve existente si hay duplicado
      const tag = await createMutation.mutateAsync(data);
      return { tag, error: null };
    } catch (err) {
      return { tag: null, error: err instanceof Error ? err.message : 'Error al crear etiqueta' };
    }
  };

  // FUNCIÓN: Eliminar una etiqueta globalmente
  const deleteTag = async (tagId: string) => {
    try {
      await deleteMutation.mutateAsync(tagId);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al eliminar etiqueta' };
    }
  };

  // RETORNO
  return {
    tags,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    createTag,
    deleteTag,
    refresh: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.all }),
  };
}

// HOOK 2: ETIQUETAS POR CLIENTE (useClientTagsQuery)
// --------------------------------------------------
// Hook para gestionar las etiquetas de un cliente específico.
export function useClientTagsQuery(clientId: string | null) {
  const queryClient = useQueryClient();

  // CONSULTA: Obtener etiquetas de un cliente específico
  const { data: clientTags = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.tags.byClient(clientId || ''),
    queryFn: () => (clientId ? tagService.fetchTagsByClientId(clientId) : Promise.resolve([])),
    enabled: !!clientId, // Solo se ejecuta si hay un clientId
  });

  // MUTACIÓN: Asignar una etiqueta al cliente
  const assignMutation = useMutation({
    mutationFn: ({ clientId, tagId }: { clientId: string; tagId: string }) =>
      tagService.assignTagToClient(clientId, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.byClient(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  // MUTACIÓN: Remover una etiqueta del cliente
  const removeMutation = useMutation({
    mutationFn: ({ clientId, tagId }: { clientId: string; tagId: string }) =>
      tagService.removeTagFromClient(clientId, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.byClient(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  // MUTACIÓN: Sincronizar etiquetas (reemplazar la lista actual)
  const syncMutation = useMutation({
    mutationFn: ({ clientId, tagIds }: { clientId: string; tagIds: string[] }) =>
      tagService.syncClientTags(clientId, tagIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags.byClient(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
  });

  // FUNCIÓN: Asignar etiqueta
  const assignTag = async (clientId: string, tagId: string) => {
    try {
      await assignMutation.mutateAsync({ clientId, tagId });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al asignar etiqueta' };
    }
  };

  // FUNCIÓN: Remover etiqueta
  const removeTag = async (clientId: string, tagId: string) => {
    try {
      await removeMutation.mutateAsync({ clientId, tagId });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al remover etiqueta' };
    }
  };

  // FUNCIÓN: Sincronizar (reemplazar) todas las etiquetas
  const syncTags = async (clientId: string, tagIds: string[]) => {
    try {
      await syncMutation.mutateAsync({ clientId, tagIds });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al sincronizar etiquetas' };
    }
  };

  // RETORNO
  return {
    clientTags,
    loading: isLoading,
    assignTag,
    removeTag,
    syncTags,
  };
}