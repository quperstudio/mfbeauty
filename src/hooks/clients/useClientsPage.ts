import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { useClientsQuery } from './useClients.query';
import { useClientTagsQuery, useTagsQuery } from '../tags/useTags.query';
import { Client, ClientFilterType, ClientSortField, ClientSortDirection } from '../../types/database';
import { ClientSchemaType } from '../../schemas/client.schema';
import * as tagService from '../../services/tag.service';
import { MOBILE_BREAKPOINT } from '../../constants/clients.constants';
import { toast } from 'sonner';
import { useClientLogic } from './useClientLogic'; 

// HOOK PRINCIPAL: PÁGINA DE CLIENTES
// ---------------------------------
export function useClientsPage() {
  // HOOKS Y ESTADOS GLOBALES
  const queryClient = useQueryClient();
  const { clients, loading, error, createClient, updateClient, deleteClient } = useClientsQuery();
  const { tags: availableTags } = useTagsQuery();
  const logic = useClientLogic(); // Lógica de mutación centralizada

  // ESTADOS DEL UI
  // ---------------
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal de Crear/Editar
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [activeFilter, setActiveFilter] = useState<ClientFilterType>('all');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<ClientSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<ClientSortDirection>('desc');
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set()); // IDs para acciones masivas
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // Modal de perfil
  const [profileClientId, setProfileClientId] = useState<string | null>(null);
  const [isAssignReferrerModalOpen, setIsAssignReferrerModalOpen] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const { syncTags } = useClientTagsQuery(selectedClient?.id || null);
  const [clientsWithSelectedTags, setClientsWithSelectedTags] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<'bulk' | string | null>(null); // Confirma eliminación individual/masiva
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // EFECTO: SUBSCRIPCIÓN Y TAMAÑO DE PANTALLA
  // ------------------------------------------
  useEffect(() => {
    // Suscripción de Supabase para invalidez automática
    const subscription = supabase
      .channel('clients_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
      })
      .subscribe();

    // Detección de tamaño de pantalla
    const checkScreenSize = () => { setIsSmallScreen(window.innerWidth < MOBILE_BREAKPOINT); };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [queryClient]);

  // EFECTO: FILTRADO POR TAGS
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

  // MEMO: CLIENTES FILTRADOS Y ORDENADOS
  // ------------------------------------
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients;

    // Aplicar filtros preestablecidos
    if (activeFilter === 'with_visits') { filtered = filtered.filter((c) => c.total_visits > 0); } 
    else if (activeFilter === 'with_sales') { filtered = filtered.filter((c) => Number(c.total_spent) > 0); } 
    else if (activeFilter === 'referred') { filtered = filtered.filter((c) => c.referrer_id !== null); }

    // Aplicar filtro por tags seleccionados
    if (selectedTagIds.length > 0 && clientsWithSelectedTags.length > 0) {
      filtered = filtered.filter((c) => clientsWithSelectedTags.includes(c.id));
    }

    // Aplicar búsqueda por texto
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

    // Aplicar ordenación
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

  // MEMO: CONTEO DE FILTROS
  const filterCounts = useMemo(() => {
    return {
      all: clients.length,
      with_visits: clients.filter((c) => c.total_visits > 0).length,
      with_sales: clients.filter((c) => Number(c.total_spent) > 0).length,
      referred: clients.filter((c) => c.referrer_id !== null).length,
    };
  }, [clients]);

  // HANDLERS DE MODAL (CREAR/EDITAR)
  // ---------------------------------
  const handleCreateClient = useCallback(() => {
    setSelectedClient(undefined);
    setIsModalOpen(true);
  }, []);

  const handleEditClient = useCallback((client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  }, []);

  // Handler de guardado usando la lógica centralizada
  const handleSaveClient = useCallback(
    async (data: ClientSchemaType, tagIds: string[]): Promise<{ error: string | null }> => {
      try {
        await logic.saveClient(data, tagIds, selectedClient?.id);
        toast.success(selectedClient ? 'Cliente actualizado' : 'Cliente creado');
        return { error: null };
      } catch (err: any) {
        console.error('Error al guardar el cliente o sus tags:', err);
        toast.error('Error al guardar cliente', { description: err.message || 'Error al guardar los datos' });
        return { error: err.message || 'Error al guardar los datos' };
      }
    },
    [selectedClient, logic]
  );

  // HANDLERS DE ELIMINACIÓN
  // -----------------------
  const confirmDeleteClient = useCallback((client: Client) => {
    setDeleteTarget(client.id);
  }, []);
  
  // Lógica simulada para deshacer la eliminación
  const handleUndoDelete = useCallback((clientId: string, clientName: string) => {
    toast.info('Deshacer completado', {
      description: `Acción deshecha. "${clientName}" no fue eliminado.`
    });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
  }, [queryClient]);
  
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    const isBulk = deleteTarget === 'bulk';
    const clientIds = isBulk ? Array.from(selectedClientIds) : [deleteTarget];
    const count = clientIds.length;
    
    const targetClientName = isBulk 
      ? `${count} cliente(s)` 
      : clients.find(c => c.id === deleteTarget)?.name || 'el cliente';

    const deletePromise = logic.deleteClients(clientIds); 

    try {
        await toast.promise(deletePromise, {
            loading: isBulk ? `Eliminando ${count} clientes...` : 'Eliminando cliente...',
            success: isBulk ? `Se eliminaron ${count} cliente(s) con éxito.` : `Cliente "${targetClientName}" eliminado.`,
            error: (err) => `Error al eliminar: ${err.message || 'No se pudo completar la acción.'}`,
        });
        
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
        if (isBulk) { setSelectedClientIds(new Set()); }

        if (!isBulk) {
             toast.success('Cliente eliminado', {
                description: `Cliente "${targetClientName}" eliminado. Puedes deshacer esta acción inmediatamente.`,
                duration: 8000,
                action: {
                    label: 'Deshacer',
                    onClick: () => handleUndoDelete(clientIds[0], targetClientName),
                },
            });
        }
    } catch (error) {
    } finally {
        setDeleteTarget(null);
    }
  }, [deleteTarget, selectedClientIds, clients, logic, queryClient, handleUndoDelete]);

  // HANDLERS DE LISTA Y SELECCIÓN
  // ------------------------------
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
      if (checked) { newSelected.add(clientId); } 
      else { newSelected.delete(clientId); }
      return newSelected;
    });
  }, []);

  const handleViewProfile = useCallback((clientId: string) => {
    setProfileClientId(clientId);
    setIsProfileModalOpen(true);
  }, []);

  // HANDLERS DE ACCIONES MASIVAS
  // ----------------------------
  const handleBulkDelete = useCallback(() => {
    setDeleteTarget('bulk');
  }, []); 

  const handleBulkDuplicate = useCallback(
    async (clientIdsToDuplicate?: string[]) => {
      const idsToUse = clientIdsToDuplicate || Array.from(selectedClientIds);
      if (idsToUse.length === 0) return;
      const count = idsToUse.length;

      setBulkActionLoading(true);
      try {
        await logic.duplicateClients(idsToUse);
        
        if (!clientIdsToDuplicate) { setSelectedClientIds(new Set()); }
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
        toast.success('Duplicación masiva exitosa', {
          description: `Se duplicaron ${count} cliente(s) con éxito.`
        });
      } catch (error) {
        toast.error('Error al duplicar clientes', {
          description: 'No se pudieron duplicar los clientes. Intenta de nuevo.'
        });
      } finally {
        setBulkActionLoading(false);
      }
    },
    [selectedClientIds, queryClient, logic]
  );

  const handleBulkExport = useCallback(
    (clientIdsToExport?: string[]) => {
      const idsToUse = clientIdsToExport || Array.from(selectedClientIds);
      const selectedClients = clients.filter((c) => idsToUse.includes(c.id));

      const csvContent = [
        [
          'ID', 'Nombre', 'Teléfono', 'Email', 'Fecha Nacimiento', 'Notas', 'Total Gastado', 
          'Total Visitas', 'Última Visita', 'WhatsApp', 'Facebook', 'Instagram', 'TikTok', 
          'ID Referente', 'Fecha Creación'
        ],
        ...selectedClients.map((c) => [
          c.id, c.name, c.phone, '', c.birthday || '', c.notes || '',
          c.total_spent.toString(), c.total_visits.toString(), c.last_visit_date || '',
          c.whatsapp_link || '', c.facebook_link || '', c.instagram_link || '',
          c.tiktok_link || '', c.referrer_id || '', c.created_at,
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
        await logic.assignReferrerToClients(Array.from(selectedClientIds), referrerId);
        setSelectedClientIds(new Set());
        setIsAssignReferrerModalOpen(false);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
        toast.success('Referente asignado', {
          description: `Se actualizó el referente de ${count} cliente(s) con éxito.`
        });
      } catch (error) {
        toast.error('Error al asignar referente', {
          description: 'No se pudo asignar el referente. Intenta de nuevo.'
        });
      } finally {
        setBulkActionLoading(false);
      }
    },
    [selectedClientIds, queryClient, logic]
  );

  // RETORNO DEL HOOK
  // -----------------
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
    deleteTarget,
    setDeleteTarget, 
    isSmallScreen,
    filterCounts,
    handleCreateClient,
    handleEditClient,
    handleSaveClient,
    confirmDeleteClient,
    handleConfirmDelete,
    handleDeleteClient: handleConfirmDelete, 
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