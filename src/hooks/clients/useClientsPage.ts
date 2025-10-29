import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { MOBILE_BREAKPOINT } from '../../constants/clients.constants';
import { useClients } from './useClients';
import { useTags } from '../tags/useTags';
import { useClientFilters } from './useClientFilters';
import { useClientSelection } from './useClientSelection';
import { useClientModals } from './useClientModals';
import { useClientActions } from './useClientActions';

export function useClientsPage() {
  const queryClient = useQueryClient();
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const { clients, loading, error } = useClients();
  const { tags: availableTags } = useTags();

  const filters = useClientFilters(clients);
  const selection = useClientSelection();
  const modals = useClientModals();
  const actions = useClientActions();

  useEffect(() => {
    const subscription = supabase
      .channel('clients_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
      })
      .subscribe();

    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < MOBILE_BREAKPOINT);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [queryClient]);

  const handleConfirmDelete = async () => {
    if (!modals.deleteTarget) return;

    const isBulk = modals.deleteTarget === 'bulk';
    const clientIds = isBulk ? Array.from(selection.selectedClientIds) : [modals.deleteTarget];

    const targetClientName = isBulk
      ? `${clientIds.length} cliente(s)`
      : clients.find((c) => c.id === modals.deleteTarget)?.name;

    try {
      await actions.handleDeleteClients(clientIds, targetClientName);

      if (isBulk) {
        selection.clearSelection();
      }
    } catch (error) {
    } finally {
      modals.setDeleteTarget(null);
    }
  };

  const handleBulkDuplicate = async (clientIds?: string[]) => {
    const idsToUse = clientIds || Array.from(selection.selectedClientIds);
    await actions.handleBulkDuplicate(idsToUse);
    if (!clientIds) {
      selection.clearSelection();
    }
  };

  const handleBulkExport = (clientIds?: string[]) => {
    const idsToUse = clientIds || Array.from(selection.selectedClientIds);
    const selectedClients = clients.filter((c) => idsToUse.includes(c.id));
    actions.handleBulkExport(selectedClients);
  };

  const handleAssignReferrer = async (referrerId: string | null) => {
    await actions.handleAssignReferrer(Array.from(selection.selectedClientIds), referrerId);
    selection.clearSelection();
    modals.setIsAssignReferrerModalOpen(false);
  };

  const handleEditFromProfile = (client: any) => {
    modals.setIsProfileModalOpen(false);
    modals.handleEditClient(client);
  };

  const handleSelectAll = (checked: boolean) => {
    selection.handleSelectAll(checked, filters.filteredAndSortedClients);
  };

  const handleAssignReferrerToClients = (clientIds: string[]) => {
    selection.setSelectedClientIds(new Set(clientIds));
    modals.setIsAssignReferrerModalOpen(true);
  };

  return {
    clients: filters.filteredAndSortedClients,
    allClients: clients,
    loading,
    error,
    availableTags,
    isSmallScreen,
    ...filters,
    ...selection,
    ...modals,
    bulkActionLoading: actions.bulkActionLoading,
    handleSaveClient: actions.handleSaveClient,
    handleConfirmDelete,
    handleDeleteClient: handleConfirmDelete,
    handleBulkDelete: modals.confirmBulkDelete,
    handleBulkDuplicate,
    handleBulkExport,
    handleAssignReferrer,
    handleSelectAll,
    handleEditFromProfile,
    handleAssignReferrerToClients,
    clearSelection: selection.clearSelection,
  };
}
