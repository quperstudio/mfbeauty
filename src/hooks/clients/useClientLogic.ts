// src/hooks/clients/useClientLogic.ts

import { useCallback } from 'react';
import { useClientsQuery } from './useClients.query';
import { useClientTagsQuery } from '../tags/useTags.query';
import * as clientService from '../../services/client.service';
import * as tagService from '../../services/tag.service'; // <-- AÑADIDO: Necesario para leer/sincronizar tags
import { ClientSchemaType } from '../../schemas/client.schema';

/**
 * Hook de Lógica de Negocio para Clientes
 *
 * Encapsula los casos de uso y orquestación de operaciones complejas.
 * NO contiene toasts ni estado de UI (eso es responsabilidad de useClientsPage).
 *
 * Esta capa orquesta múltiples servicios y mutaciones para completar
 * operaciones de negocio complejas como guardar un cliente con tags,
 * eliminar múltiples clientes, duplicarlos, etc.
 *
 * @returns Funciones de lógica de negocio para operaciones con clientes
 */
export function useClientLogic() {
  const { createClient, updateClient, deleteClient, duplicateClient, assignReferrer } = useClientsQuery();
  const { syncTags } = useClientTagsQuery(null);

  /**
   * Guardar cliente con tags (crear o actualizar)
   * Orquesta: validación de duplicado + guardar cliente + sincronizar tags
   */
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

    // 2. Guardar cliente (crear o actualizar)
    const client = existingClientId
      ? await updateClient(existingClientId, data)
      : await createClient(data);

    // 3. Sincronizar tags
    const syncResult = await syncTags(client.id, tagIds);
    if (syncResult.error) {
      throw new Error(syncResult.error);
    }
  }, [createClient, updateClient, syncTags]);

  /**
   * Eliminar uno o múltiples clientes
   */
  const deleteClients = useCallback(async (ids: string | string[]): Promise<void> => {
    await deleteClient(ids);
  }, [deleteClient]);

  /**
   * Duplicar múltiples clientes (ORQUESTACIÓN CORREGIDA)
   * Asegura que se copien las entidades relacionadas (tags).
   */
  const duplicateClients = useCallback(async (clientIds: string[]): Promise<void> => {
    // Usamos Promise.all para manejar la duplicación de forma concurrente
    const duplicationPromises = clientIds.map(async (clientId) => {
      // 1. Obtener las tags del cliente original
      const originalTags = await tagService.fetchTagsByClientId(clientId);
      const originalTagIds = originalTags.map(tag => tag.id);

      // 2. Duplicar el cliente principal (asumimos que devuelve el nuevo cliente)
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
  }, []); // Dependencias: clientService, tagService

  /** 
   * Asignar referente a múltiples clientes
   */
  const assignReferrerToClients = useCallback(async (
    clientIds: string[],
    referrerId: string
  ): Promise<void> => {
    await assignReferrer(clientIds, referrerId);
  }, [assignReferrer]);

  return {
    saveClient,
    deleteClients,
    duplicateClients,
    assignReferrerToClients,
  };
}