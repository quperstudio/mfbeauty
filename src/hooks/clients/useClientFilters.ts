import { useState, useMemo, useEffect } from 'react';
import { Client, ClientFilterType, ClientSortField, ClientSortDirection } from '../../types/database';
import { filterClients, sortClients, calculateFilterCounts } from '../../lib/clients/client-helpers';
import { useClientTags } from '../tags/useTags';

// HOOK PRINCIPAL: useClientFilters
// --------------------------------
// Gestiona el estado de filtrado, búsqueda y ordenamiento de una lista de clientes.
export function useClientFilters(clients: Client[]) {
  // ESTADOS DEL FILTRADO Y ORDENAMIENTO
  // ----------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  // Filtro activo (ej: 'all', 'referred', 'new', etc.)
  const [activeFilter, setActiveFilter] = useState<ClientFilterType>('all');
  // IDs de las etiquetas seleccionadas para filtrar
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  // Campo por el que se ordena
  const [sortField, setSortField] = useState<ClientSortField>('created_at');
  // Dirección del ordenamiento ('asc' o 'desc')
  const [sortDirection, setSortDirection] = useState<ClientSortDirection>('desc');
  // Lista de IDs de clientes que coinciden con las etiquetas seleccionadas
  const [clientsWithSelectedTags, setClientsWithSelectedTags] = useState<string[]>([]);

  // HOOKS Y LÓGICA ASÍNCRONA
  // ------------------------
  // Función para obtener clientes por etiquetas desde el backend
  const { fetchClientIdsByTags } = useClientTags(null);

  // EFECTO: Obtener IDs de clientes por etiquetas seleccionadas
  useEffect(() => {
    if (selectedTagIds.length > 0) {
      fetchClientIdsByTags(selectedTagIds)
        .then((clientIds) => setClientsWithSelectedTags(clientIds))
        .catch((err) => console.error('Error fetching clients by tags:', err));
    } else {
      setClientsWithSelectedTags([]);
    }
  }, [selectedTagIds, fetchClientIdsByTags]);

  // PROCESAMIENTO: Aplicar Filtros y Ordenamiento
  // ---------------------------------------------
  const filteredAndSortedClients = useMemo(() => {
    // 1. Aplicar filtros
    const filtered = filterClients(clients, {
      type: activeFilter,
      selectedTagIds,
      clientsWithSelectedTags,
      searchQuery,
    });

    // 2. Aplicar ordenamiento
    return sortClients(filtered, sortField, sortDirection);
  }, [clients, searchQuery, activeFilter, selectedTagIds, clientsWithSelectedTags, sortField, sortDirection]);

  // PROCESAMIENTO: Calcular el conteo de clientes por tipo de filtro
  const filterCounts = useMemo(() => {
    return calculateFilterCounts(clients);
  }, [clients]);

  // MANEJADOR DE ORDENAMIENTO
  // -------------------------
  // Cambia el campo de ordenamiento o invierte la dirección si el campo es el mismo.
  const handleSort = (field: ClientSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // CONSTANTE AUXILIAR: Verifica si hay algún filtro activo
  const hasActiveFilters = activeFilter !== 'all' || selectedTagIds.length > 0;

  // RETORNO DEL HOOK
  // -----------------
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