import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { Client } from '../../types/database';
import { ClientSchemaType } from '../../schemas/client.schema';
import { useClients } from './useClients';
import { useClientTags } from '../tags/useTags';
import { generateCSV, downloadCSV } from '../../lib/clients/client-helpers';

// HOOK PRINCIPAL
// ---------------
export function useClientActions() {
  // ESTADO Y HOOKS
  const queryClient = useQueryClient();
  // Estado para indicar si una acción masiva está en curso (Duplicar, Asignar Referente)
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // HOOKS DE LÓGICA DE CLIENTES Y ETIQUETAS
  // Obtiene las funciones CRUD principales para clientes
  const {
    createClient,
    updateClient,
    deleteClients,
    duplicateClient,
    assignReferrer,
  } = useClients();

  // Obtiene la función para sincronizar etiquetas (tags)
  const { syncTags } = useClientTags(null);

  // MANEJADORES DE ACCIONES INDIVIDUALES Y MASIVAS
  // ---------------------------------------------

  // FUNCIÓN: Guardar Cliente (Crear o Editar)
  // Se encarga de la lógica de creación/actualización y sincronización de etiquetas.
  const handleSaveClient = useCallback(
    async (
      data: ClientSchemaType,
      tagIds: string[],
      existingClientId?: string
    ): Promise<{ error: string | null }> => {
      try {
        const client = existingClientId
          ? await updateClient({ id: existingClientId, data })
          : await createClient(data);

        // Sincroniza las etiquetas del cliente
        await syncTags({ clientId: client.id, tagIds });

        toast.success(existingClientId ? 'Cliente actualizado' : 'Cliente creado');
        return { error: null };
      } catch (err: any) {
        console.error('Error al guardar el cliente:', err);

        // Detecta si el error es por teléfono duplicado (violación de restricción única)
        if (err.message && (err.message.includes('unique constraint') || err.message.includes('23505'))) {
          const errorMsg = 'El teléfono ya está registrado con otro cliente.';
          toast.error('Error al guardar', { description: errorMsg });
          return { error: errorMsg };
        }

        // Retorna error genérico
        toast.error('Error al guardar', { description: 'Ocurrió un error inesperado.' });
        return { error: 'Ocurrió un error inesperado.' };

      }
    },
    [createClient, updateClient, syncTags]
  );

  // FUNCIÓN: Eliminar Clientes (Individual o Masivo)
  const handleDeleteClients = useCallback(
    async (clientIds: string[], clientName?: string) => {
      try {
        await deleteClients(clientIds);
        // Invalida la caché para actualizar la lista
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

  // FUNCIÓN: Duplicar Clientes (Masivo)
  const handleBulkDuplicate = useCallback(
    async (clientIds: string[]) => {
      if (clientIds.length === 0) {
        toast.error('Error', { description: 'No hay clientes seleccionados para duplicar.' });
        return;
      }

      setBulkActionLoading(true);
      try {
        // Ejecuta todas las duplicaciones en paralelo
        const results = await Promise.allSettled(
          clientIds.map((id) => duplicateClient(id))
        );

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const errorCount = results.filter(r => r.status === 'rejected').length;

        // Invalida la caché para mostrar los nuevos clientes
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });

        // Manejo de notificaciones según los resultados
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
        // Manejo de error de Promise.allSettled
        toast.error('Error al duplicar clientes', {
          description: 'No se pudieron duplicar los clientes. Intenta de nuevo.',
        });
      } finally {
        setBulkActionLoading(false);
      }
    },
    [duplicateClient, queryClient]
  );

  // FUNCIÓN: Exportar Clientes a CSV (Masivo)
  const handleBulkExport = useCallback((clients: Client[]) => {
    const csvContent = generateCSV(clients);
    const filename = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  }, []);

  // FUNCIÓN: Asignar Referente (Masivo)
  const handleAssignReferrer = useCallback(
    async (clientIds: string[], referrerId: string | null) => {
      setBulkActionLoading(true);
      try {
        await assignReferrer({ clientIds, referrerId });

        // Invalida la caché para reflejar los cambios
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

  // RETORNO DE FUNCIONES Y ESTADOS
  // ------------------------------
  return {
    bulkActionLoading,
    handleSaveClient,
    handleDeleteClients,
    handleBulkDuplicate,
    handleBulkExport,
    handleAssignReferrer,
  };
}