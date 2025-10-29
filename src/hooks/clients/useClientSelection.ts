import { useState, useCallback } from 'react';
import { Client } from '../../types/database';

export function useClientSelection() {
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());

  const handleSelectAll = useCallback((checked: boolean, clients: Client[]) => {
    if (checked) {
      setSelectedClientIds(new Set(clients.map((c) => c.id)));
    } else {
      setSelectedClientIds(new Set());
    }
  }, []);

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

  const clearSelection = useCallback(() => {
    setSelectedClientIds(new Set());
  }, []);

  return {
    selectedClientIds,
    setSelectedClientIds,
    handleSelectAll,
    handleSelectClient,
    clearSelection,
  };
}
