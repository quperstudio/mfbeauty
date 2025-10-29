import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { Client } from '../../types/database';
import { ClientSchemaType } from '../../schemas/client.schema';
import { useClients } from './useClients';
import { useClientTags } from '../tags/useTags';
import { generateCSV, downloadCSV } from '../../lib/clients/client-helpers';

export function useClientActions() {
  const queryClient = useQueryClient();
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const {
    createClient,
    updateClient,
    deleteClients,
    duplicateClient,
    assignReferrer,
    checkDuplicatePhone,
  } = useClients();

  const { syncTags } = useClientTags(null);

  const handleSaveClient = useCallback(
    async (
      data: ClientSchemaType,
      tagIds: string[],
      existingClientId?: string
    ): Promise<{ error: string | null }> => {
      try {
        if (!existingClientId) {
          const duplicate = await checkDuplicatePhone({ phone: data.phone });
          if (duplicate) {
            return { error: 'El teléfono ya está registrado' };
          }
        }

        const client = existingClientId
          ? await updateClient({ id: existingClientId, data })
          : await createClient(data);

        await syncTags({ clientId: client.id, tagIds });

        toast.success(existingClientId ? 'Cliente actualizado' : 'Cliente creado');
        return { error: null };
      } catch (err: any) {
        console.error('Error al guardar el cliente:', err);
        const errorMessage = err.message || 'Error al guardar los datos';
        toast.error('Error al guardar cliente', { description: errorMessage });
        return { error: errorMessage };
      }
    },
    [createClient, updateClient, syncTags, checkDuplicatePhone]
  );

  const handleDeleteClients = useCallback(
    async (clientIds: string[], clientName?: string) => {
      try {
        await deleteClients(clientIds);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });

        if (clientIds.length === 1 && clientName) {
          toast.success('Cliente eliminado', {
            description: `Cliente "${clientName}" eliminado.`,
          });
        } else {
          toast.success(`Se eliminaron ${clientIds.length} cliente(s) con éxito.`);
        }
      } catch (error: any) {
        toast.error('Error al eliminar', {
          description: error.message || 'No se pudo completar la acción.',
        });
        throw error;
      }
    },
    [deleteClients, queryClient]
  );

  const handleBulkDuplicate = useCallback(
    async (clientIds: string[]) => {
      if (clientIds.length === 0) {
        toast.error('Error', { description: 'No hay clientes seleccionados para duplicar.' });
        return;
      }

      setBulkActionLoading(true);
      try {
        const results = await Promise.allSettled(
          clientIds.map((id) => duplicateClient(id))
        );

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const errorCount = results.filter(r => r.status === 'rejected').length;

        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });

        if (errorCount === 0) {
          toast.success('Duplicación exitosa', {
            description: `Se duplicaron ${successCount} cliente(s) con éxito.`,
          });
        } else if (successCount > 0) {
          toast.warning('Duplicación parcial', {
            description: `Se duplicaron ${successCount} cliente(s), pero fallaron ${errorCount}.`,
          });
        } else {
          toast.error('Error al duplicar clientes', {
            description: 'No se pudieron duplicar los clientes. Intenta de nuevo.',
          });
        }
      } catch (error) {
        toast.error('Error al duplicar clientes', {
          description: 'No se pudieron duplicar los clientes. Intenta de nuevo.',
        });
      } finally {
        setBulkActionLoading(false);
      }
    },
    [duplicateClient, queryClient]
  );

  const handleBulkExport = useCallback((clients: Client[]) => {
    const csvContent = generateCSV(clients);
    const filename = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  }, []);

  const handleAssignReferrer = useCallback(
    async (clientIds: string[], referrerId: string | null) => {
      setBulkActionLoading(true);
      try {
        await assignReferrer({ clientIds, referrerId });

        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
        toast.success('Referente asignado', {
          description: `Se actualizó el referente de ${clientIds.length} cliente(s) con éxito.`,
        });
      } catch (error) {
        toast.error('Error al asignar referente', {
          description: 'No se pudo asignar el referente. Intenta de nuevo.',
        });
        throw error;
      } finally {
        setBulkActionLoading(false);
      }
    },
    [assignReferrer, queryClient]
  );

  return {
    bulkActionLoading,
    handleSaveClient,
    handleDeleteClients,
    handleBulkDuplicate,
    handleBulkExport,
    handleAssignReferrer,
  };
}
