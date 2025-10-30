import { useState, useCallback } from 'react';
import { Client } from '../../types/database';

// HOOK PRINCIPAL: useClientSelection
// ----------------------------------
// Gestiona el estado de selección de múltiples clientes para acciones masivas.
export function useClientSelection() {
  // ESTADO DE SELECCIÓN
  // -------------------
  // Set (conjunto) para almacenar los IDs de los clientes seleccionados (ofrece rendimiento rápido para añadir/eliminar).
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());

  // MANEJADORES DE SELECCIÓN
  // ------------------------

  // FUNCIÓN: Seleccionar todos o deseleccionar todos los clientes de la lista
  const handleSelectAll = useCallback((checked: boolean, clients: Client[]) => {
    if (checked) {
      // Selecciona todos los IDs
      setSelectedClientIds(new Set(clients.map((c) => c.id)));
    } else {
      // Deselecciona todos
      setSelectedClientIds(new Set());
    }
  }, []);

  // FUNCIÓN: Seleccionar o deseleccionar un cliente individual
  const handleSelectClient = useCallback((clientId: string, checked: boolean) => {
    setSelectedClientIds((prev) => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(clientId);
      } else {
        newSelected.delete(clientId);
      }
      return newSelected;
    });
  }, []);

  // FUNCIÓN: Limpiar toda la selección actual
  const clearSelection = useCallback(() => {
    setSelectedClientIds(new Set());
  }, []);

  // RETORNO DEL HOOK
  // -----------------
  return {
    selectedClientIds,
    setSelectedClientIds,
    handleSelectAll,
    handleSelectClient,
    clearSelection,
  };
}