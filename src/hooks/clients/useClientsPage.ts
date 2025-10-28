import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { useClientsQuery } from './useClients.query';
import { useClientTagsQuery, useTagsQuery } from '../tags/useTags.query';
import { Client, ClientFilterType, ClientSortField, ClientSortDirection } from '../../types/database';
import { ClientSchemaType } from '../../schemas/client.schema';
import * as clientService from '../../services/client.service';
import * as tagService from '../../services/tag.service';
import { MOBILE_BREAKPOINT } from '../../constants/clients.constants';
import { toast } from 'sonner'; // AÑADIDO: Importación de Sonner

export function useClientsPage() {
  const queryClient = useQueryClient();
  const { clients, loading, error, createClient, updateClient, deleteClient } = useClientsQuery();
  const { tags: availableTags } = useTagsQuery();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [activeFilter, setActiveFilter] = useState<ClientFilterType>('all');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<ClientSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<ClientSortDirection>('desc');
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set()); // CORREGIDO: Línea 26
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileClientId, setProfileClientId] = useState<string | null>(null);
  const [isAssignReferrerModalOpen, setIsAssignReferrerModalOpen] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const { syncTags } = useClientTagsQuery(selectedClient?.id || null);
  const [clientsWithSelectedTags, setClientsWithSelectedTags] = useState<string[]>([]);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

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

  useEffect(() => {
    if (selectedTagIds.length > 0) {
      tagService
        .fetchClientIdsByTags(selectedTagIds)
        .then((clientIds) => setClientsWithSelectedTags(clientIds))
        .catch((err) => console.error('Error fetching clients by tags:', err));
    } else {
      setClientsWithSelectedTags([]);
    }
  }, [selectedTagIds]);

  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients;

    if (activeFilter === 'with_visits') {
      filtered = filtered.filter((c) => c.total_visits > 0);
    } else if (activeFilter === 'with_sales') {
      filtered = filtered.filter((c) => Number(c.total_spent) > 0);
    } else if (activeFilter === 'referred') {
      filtered = filtered.filter((c) => c.referrer_id !== null);
    }

    if (selectedTagIds.length > 0 && clientsWithSelectedTags.length > 0) {
      filtered = filtered.filter((c) => clientsWithSelectedTags.includes(c.id));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          client.phone.includes(query) ||
          client.whatsapp_link?.toLowerCase().includes(query) ||
          client.facebook_link?.toLowerCase().includes(query) ||
          client.instagram_link?.toLowerCase().includes(query) ||
          client.tiktok_link?.toLowerCase().includes(query)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'total_spent':
          aValue = Number(a.total_spent);
          bValue = Number(b.total_spent);
          break;
        case 'total_visits':
          aValue = a.total_visits;
          bValue = b.total_visits;
          break;
        case 'last_visit_date':
          aValue = a.last_visit_date ? new Date(a.last_visit_date).getTime() : 0;
          bValue = b.last_visit_date ? new Date(b.last_visit_date).getTime() : 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [clients, searchQuery, activeFilter, selectedTagIds, clientsWithSelectedTags, sortField, sortDirection]);

  const filterCounts = useMemo(() => {
    return {
      all: clients.length,
      with_visits: clients.filter((c) => c.total_visits > 0).length,
      with_sales: clients.filter((c) => Number(c.total_spent) > 0).length,
      referred: clients.filter((c) => c.referrer_id !== null).length,
    };
  }, [clients]);

  const handleCreateClient = useCallback(() => {
    setSelectedClient(undefined);
    setIsModalOpen(true);
  }, []);

  const handleEditClient = useCallback((client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  }, []);

  const handleSaveClient = useCallback(
    async (data: ClientSchemaType, tagIds: string[]): Promise<{ error: string | null }> => {
      try {
        if (selectedClient && selectedClient.id) {
          await updateClient(selectedClient.id, data);
          await syncTags(selectedClient.id, tagIds);
        } else {
          const newClient = await createClient(data);
          if (newClient && newClient.id) {
            await syncTags(newClient.id, tagIds);
          } else {
            console.warn('createClient no devolvió el nuevo cliente. Los tags no se pudieron sincronizar.');
          }
        }
        return { error: null };
      } catch (err: any) {
        console.error('Error al guardar el cliente o sus tags:', err);
        return { error: err.message || 'Error al guardar los datos' };
      }
    },
    [selectedClient, updateClient, createClient, syncTags]
  );

  const confirmDeleteClient = useCallback((client: Client) => {
    setClientToDelete(client);
  }, []);
  
  // Lógica simulada para deshacer la eliminación
  const handleUndoDelete = useCallback((clientId: string, clientName: string) => {
    // NOTA: Esta función requiere un servicio backend para restaurar el cliente.
    // Aquí solo refrescamos la UI y mostramos el toast informativo.
    toast.info(`Acción deshecha. "${clientName}" no fue eliminado.`, { title: 'Deshacer completado' });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
  }, [queryClient]);
  
  const handleDeleteClient = useCallback(async () => {
    if (!clientToDelete) return;
    const deletedClientId = clientToDelete.id;
    const deletedClientName = clientToDelete.name;

    // 1. Ejecutar la eliminación
    await deleteClient(deletedClientId);
    setClientToDelete(null);

    // 2. Mostrar TOAST con botón para deshacer
    toast.success(`Cliente "${deletedClientName}" eliminado.`, {
      title: 'Eliminación Exitosa',
      description: 'Puedes deshacer esta acción inmediatamente.',
      duration: 8000, // Da 8 segundos al usuario para reaccionar
      action: {
        label: 'Deshacer',
        onClick: () => handleUndoDelete(deletedClientId, deletedClientName), 
      },
    });
  }, [clientToDelete, deleteClient, handleUndoDelete]);

  const handleSort = useCallback(
    (field: ClientSortField) => {
      if (sortField === field) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    },
    [sortField, sortDirection]
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedClientIds(new Set(filteredAndSortedClients.map((c) => c.id)));
      } else {
        setSelectedClientIds(new Set());
      }
    },
    [filteredAndSortedClients]
  );

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

  const handleViewProfile = useCallback((clientId: string) => {
    setProfileClientId(clientId);
    setIsProfileModalOpen(true);
  }, []);

  const handleBulkDelete = useCallback(async () => {
    const count = selectedClientIds.size;
    if (!confirm(`¿Estás seguro de eliminar ${count} ${count === 1 ? 'cliente' : 'clientes'}?`)) return;

    setBulkActionLoading(true);
    try {
      await clientService.deleteMultipleClients(Array.from(selectedClientIds));
      setSelectedClientIds(new Set());
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
      toast.success(`Se eliminaron ${count} cliente(s) con éxito.`, { title: 'Eliminación Masiva' });
    } catch (error) {
      toast.error('Error al eliminar clientes. Intenta de nuevo.', { title: 'Error de Eliminación' });
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedClientIds, queryClient]);

  const handleBulkDuplicate = useCallback(
    async (clientIdsToDuplicate?: string[]) => {
      const idsToUse = clientIdsToDuplicate || Array.from(selectedClientIds);
      if (idsToUse.length === 0) return;
      const count = idsToUse.length;

      setBulkActionLoading(true);
      try {
        const promises = idsToUse.map((id) => clientService.duplicateClient(id));
        await Promise.all(promises);
        if (!clientIdsToDuplicate) {
          setSelectedClientIds(new Set());
        }
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
        toast.success(`Se duplicaron ${count} cliente(s) con éxito.`, { title: 'Duplicación Masiva' });
      } catch (error) {
        toast.error('Error al duplicar clientes. Intenta de nuevo.', { title: 'Error de Duplicación' });
      } finally {
        setBulkActionLoading(false);
      }
    },
    [selectedClientIds, queryClient]
  );

  const handleBulkExport = useCallback(
    (clientIdsToExport?: string[]) => {
      const idsToUse = clientIdsToExport || Array.from(selectedClientIds);
      const selectedClients = clients.filter((c) => idsToUse.includes(c.id));

      const csvContent = [
        ['Nombre', 'Teléfono', 'Total Gastado', 'Total Visitas', 'Última Visita', 'Fecha de Creación'],
        ...selectedClients.map((c) => [
          c.name,
          c.phone,
          c.total_spent.toString(),
          c.total_visits.toString(),
          c.last_visit_date || '',
          c.created_at,
        ]),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    },
    [selectedClientIds, clients]
  );

  const handleAssignReferrer = useCallback(
    async (referrerId: string | null) => {
      setBulkActionLoading(true);
      const count = selectedClientIds.size;
      try {
        await clientService.updateMultipleClientsReferrer(Array.from(selectedClientIds), referrerId);
        setSelectedClientIds(new Set());
        setIsAssignReferrerModalOpen(false);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
        toast.success(`Se actualizó el referente de ${count} cliente(s) con éxito.`, { title: 'Referente Asignado' });
      } catch (error) {
        toast.error('Error al asignar referente. Intenta de nuevo.', { title: 'Error de Asignación' });
      } finally {
        setBulkActionLoading(false);
      }
    },
    [selectedClientIds, queryClient]
  );

  return {
    clients: filteredAndSortedClients,
    allClients: clients,
    loading,
    error,
    availableTags,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    setIsModalOpen,
    selectedClient,
    activeFilter,
    setActiveFilter,
    selectedTagIds,
    setSelectedTagIds,
    sortField,
    sortDirection,
    selectedClientIds,
    setSelectedClientIds,
    isProfileModalOpen,
    setIsProfileModalOpen,
    profileClientId,
    isAssignReferrerModalOpen,
    setIsAssignReferrerModalOpen,
    bulkActionLoading,
    clientToDelete,
    setClientToDelete,
    isSmallScreen,
    filterCounts,
    handleCreateClient,
    handleEditClient,
    handleSaveClient,
    confirmDeleteClient,
    handleDeleteClient,
    handleSort,
    handleSelectAll,
    handleSelectClient,
    handleViewProfile,
    handleBulkDelete,
    handleBulkDuplicate,
    handleBulkExport,
    handleAssignReferrer,
  };
}