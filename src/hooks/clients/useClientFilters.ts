import { useState, useMemo, useEffect } from 'react';
import { Client, ClientFilterType, ClientSortField, ClientSortDirection } from '../../types/database';
import { filterClients, sortClients, calculateFilterCounts } from '../../lib/clients/client-helpers';
import { useClientTags } from '../tags/useTags';

export function useClientFilters(clients: Client[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ClientFilterType>('all');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<ClientSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<ClientSortDirection>('desc');
  const [clientsWithSelectedTags, setClientsWithSelectedTags] = useState<string[]>([]);

  const { fetchClientIdsByTags } = useClientTags(null);

  useEffect(() => {
    if (selectedTagIds.length > 0) {
      fetchClientIdsByTags(selectedTagIds)
        .then((clientIds) => setClientsWithSelectedTags(clientIds))
        .catch((err) => console.error('Error fetching clients by tags:', err));
    } else {
      setClientsWithSelectedTags([]);
    }
  }, [selectedTagIds, fetchClientIdsByTags]);

  const filteredAndSortedClients = useMemo(() => {
    const filtered = filterClients(clients, {
      type: activeFilter,
      selectedTagIds,
      clientsWithSelectedTags,
      searchQuery,
    });

    return sortClients(filtered, sortField, sortDirection);
  }, [clients, searchQuery, activeFilter, selectedTagIds, clientsWithSelectedTags, sortField, sortDirection]);

  const filterCounts = useMemo(() => {
    return calculateFilterCounts(clients);
  }, [clients]);

  const handleSort = (field: ClientSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const hasActiveFilters = activeFilter !== 'all' || selectedTagIds.length > 0;

  return {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    selectedTagIds,
    setSelectedTagIds,
    sortField,
    sortDirection,
    handleSort,
    filteredAndSortedClients,
    filterCounts,
    hasActiveFilters,
  };
}
