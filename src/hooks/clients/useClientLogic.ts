// src/hooks/clients/useClientLogic.ts

import { useCallback } from 'react';
import { useClientsQuery } from './useClients.query';
import { useClientTagsQuery } from '../tags/useTags.query';
import * as clientService from '../../services/client.service';
import * as tagService from '../../services/tag.service';
import { ClientSchemaType } from '../../schemas/client.schema';

// HOOK PRINCIPAL: USECLIENTLOGIC
// ------------------------------
// Encapsula los casos de uso y orquestación de operaciones complejas de clientes.
export function useClientLogic() {
  const { createClient, updateClient, deleteClient, duplicateClient, assignReferrer } = useClientsQuery();
  const { syncTags } = useClientTagsQuery(null);

  // FUNCIÓN DE GUARDADO (CREAR O ACTUALIZAR)
  // ----------------------------------------
  // Orquesta: validación de duplicado + guardar cliente + sincronizar tags.
  const saveClient = useCallback(async (
    data: ClientSchemaType,
    tagIds: string[],
    existingClientId?: string
  ): Promise<void> => {
    // 1. Validar teléfono duplicado (solo en creación)
    if (!existingClientId) {
      const duplicate = await clientService.checkDuplicatePhone(data.phone);
      if (duplicate) {
        throw new Error('El teléfono ya está registrado');
      }
    }

    // 2. Guardar cliente
    const client = existingClientId
      ? await updateClient(existingClientId, data)
      : await createClient(data);

    // 3. Sincronizar tags
    const syncResult = await syncTags(client.id, tagIds);
    if (syncResult.error) {
      throw new Error(syncResult.error);
    }
  }, [createClient, updateClient, syncTags]);

  // FUNCIÓN DE ELIMINACIÓN
  // ----------------------
  const deleteClients = useCallback(async (ids: string | string[]): Promise<void> => {
    await deleteClient(ids);
  }, [deleteClient]);

  // FUNCIÓN DE DUPLICACIÓN CON ENTIDADES RELACIONADAS (TAGS)
  // --------------------------------------------------------
  const duplicateClients = useCallback(async (clientIds: string[]): Promise<void> => {
    // Usamos Promise.all para manejar la duplicación de forma concurrente
    const duplicationPromises = clientIds.map(async (clientId) => {
      // 1. Obtener las tags del cliente original
      const originalTags = await tagService.fetchTagsByClientId(clientId);
      const originalTagIds = originalTags.map(tag => tag.id);

      // 2. Duplicar el cliente principal
      const newClient = await clientService.duplicateClient(clientId);

      if (!newClient || !newClient.id) {
          throw new Error(`Fallo al obtener ID del cliente duplicado: ${clientId}`);
      }
      
      // 3. Sincronizar tags al nuevo cliente
      if (originalTagIds.length > 0) {
        await tagService.syncClientTags(newClient.id, originalTagIds);
      }
    });

    await Promise.all(duplicationPromises); // Ejecutar todas las duplicaciones concurrentemente
  }, []);

  // FUNCIÓN DE ASIGNAR REFERENTE
  // ----------------------------
  const assignReferrerToClients = useCallback(async (
    clientIds: string[],
    referrerId: string
  ): Promise<void> => {
    await assignReferrer(clientIds, referrerId);
  }, [assignReferrer]);

  // RETORNO DEL HOOK
  // -----------------
  return {
    saveClient,
    deleteClients,
    duplicateClients,
    assignReferrerToClients,
  };
}