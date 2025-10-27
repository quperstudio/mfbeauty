import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Users, Phone, Calendar, DollarSign, Trash2, Pen, Eye, ArrowUp, ArrowDown, MoreVertical, Copy, Download, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import { useClientsQuery } from '../hooks/queries/useClients.query';
import { useClientTagsQuery, useTagsQuery } from '../hooks/queries/useTags.query';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { QUERY_KEYS } from '../lib/queryKeys';
import { canDeleteClients } from '../lib/permissions';
import { formatCurrency, formatPhone, parseDate, buildSocialMediaUrl, getSocialMediaIcon } from '../lib/formats';
import { SOCIAL_MEDIA_COLORS } from '../lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import ClientModal from '../components/clients/ClientModal';
import ClientFilters from '../components/clients/ClientFilters';
import ClientBulkActionBar from '../components/clients/ClientBulkActionBar';
import ClientProfileModal from '../components/clients/ClientProfileModal';
import AssignReferrerModal from '../components/clients/AssignReferrerModal';
import { Client, ClientFilterType, ClientSortField, ClientSortDirection } from '../types/database';
import * as clientService from '../services/client.service';
import * as tagService from '../services/tag.service';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


const handleOpenLink = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

export default function Clients() {
  
  // ===================================
  // ESTADOS Y HOOKS
  // ===================================
  const { clients, loading, error, createClient, updateClient, deleteClient } = useClientsQuery();
  const { tags: availableTags } = useTagsQuery();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { syncTags } = useClientTagsQuery(selectedClient?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [activeFilter, setActiveFilter] = useState<ClientFilterType>('all');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<ClientSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<ClientSortDirection>('desc');
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileClientId, setProfileClientId] = useState<string | null>(null);
  const [isAssignReferrerModalOpen, setIsAssignReferrerModalOpen] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const [clientsWithSelectedTags, setClientsWithSelectedTags] = useState<string[]>([]);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const MOBILE_BREAKPOINT = 640; 

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
      tagService.fetchClientIdsByTags(selectedTagIds)
        .then(clientIds => setClientsWithSelectedTags(clientIds))
        .catch(err => console.error('Error fetching clients by tags:', err));
    } else {
      setClientsWithSelectedTags([]);
    }
  }, [selectedTagIds]);

  // Función para obtener y limitar los enlaces de redes sociales
  const getSocialMediaLinks = (client: Client, limit: number | null = null) => {
    const links = [];
    if (client.whatsapp_link) {
      links.push({
        type: 'WhatsApp',
        url: buildSocialMediaUrl('whatsapp', client.whatsapp_link),
        icon: getSocialMediaIcon('whatsapp')!,
        color: SOCIAL_MEDIA_COLORS.whatsapp
      });
    }
    if (client.facebook_link) {
      links.push({
        type: 'Facebook',
        url: buildSocialMediaUrl('facebook', client.facebook_link),
        icon: getSocialMediaIcon('facebook')!,
        color: SOCIAL_MEDIA_COLORS.facebook
      });
    }
    if (client.instagram_link) {
      links.push({
        type: 'Instagram',
        url: buildSocialMediaUrl('instagram', client.instagram_link),
        icon: getSocialMediaIcon('instagram')!,
        color: SOCIAL_MEDIA_COLORS.instagram
      });
    }
    if (client.tiktok_link) {
      links.push({
        type: 'TikTok',
        url: buildSocialMediaUrl('tiktok', client.tiktok_link),
        icon: getSocialMediaIcon('tiktok')!,
        color: SOCIAL_MEDIA_COLORS.tiktok
      });
    }

    if (limit === null) {
        return { visibleLinks: links, hiddenCount: 0, hiddenLinks: [] };
    }

    // Muestra un máximo de 'limit' enlaces (para pantallas medianas/chicas)
    const visibleLinks = links.slice(0, limit);
    const hiddenCount = links.length - visibleLinks.length;
    const hiddenLinks = links.slice(limit);

    return { visibleLinks, hiddenCount, hiddenLinks };
  };

  // ===================================
  // LÓGICA DE FILTRADO Y ORDENAMIENTO
  // ===================================
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
          client.phone.includes(query)
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

  // Manejadores de Clientes (CRUD y selección)
  const handleCreateClient = () => {
    setSelectedClient(undefined);
    setIsModalOpen(true);
  };

  const handlePenClient = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

const handleSaveClient = async (data: any, tagIds: string[]) => {
    try {
      if (selectedClient && selectedClient.id) {
        // --- MODO EDICIÓN ---
        
        // 1. Actualiza los datos del cliente
        await updateClient(selectedClient.id, data);
        
        // 2. UTILIZA LA FUNCIÓN DEL HOOK QUE INVALIDA LA CACHÉ
        // (ya que useClientTagsQuery ya tiene la invalidación de 'clients.all')
        await syncTags(selectedClient.id, tagIds);

      } else {
        // --- MODO CREACIÓN ---

        // 1. Crea el cliente. Asumimos que createClient devuelve el cliente recién creado.
        const newClient = await createClient(data);

        // 2. Utiliza la función del hook con el ID recién creado
        if (newClient && newClient.id) {
          await syncTags(newClient.id, tagIds);
        } else {
          console.warn("createClient no devolvió el nuevo cliente. Los tags no se pudieron sincronizar.");
        }
      }

      // Si todo sale bien, devuelve el objeto que ClientModal espera
      return { error: null };

    } catch (err: any) {
      console.error("Error al guardar el cliente o sus tags:", err);
      // Si algo falla, se captura aquí
      return { error: err.message || 'Error al guardar los datos' };
    }
  };

  const confirmDeleteClient = (client: Client) => {
    setClientToDelete(client);
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    await deleteClient(clientToDelete.id);
    setClientToDelete(null); 
  };

  const handleSort = (field: ClientSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClientIds(new Set(filteredAndSortedClients.map((c) => c.id)));
    } else {
      setSelectedClientIds(new Set());
    }
  };

  const handleSelectClient = (clientId: string, checked: boolean) => {
    const newSelected = new Set(selectedClientIds);
    if (checked) {
      newSelected.add(clientId);
    } else {
      newSelected.delete(clientId);
    }
    setSelectedClientIds(newSelected);
  };

  const handleViewProfile = (clientId: string) => {
    setProfileClientId(clientId);
    setIsProfileModalOpen(true);
  };

  // ===================================
  // MANEJADORES DE ACCIONES MASIVAS
  // ===================================
  const handleBulkDelete = async () => {
    const count = selectedClientIds.size;
    if (!confirm(`¿Estás seguro de  ${count} ${count === 1 ? 'cliente' : 'clientes'}?`)) return;

    setBulkActionLoading(true);
    try {
      await clientService.deleteMultipleClients(Array.from(selectedClientIds));
      setSelectedClientIds(new Set());
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    } catch (error) {
      alert('Error al  clientes');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDuplicate = async (clientIdsToDuplicate?: string[]) => {
    const idsToUse = clientIdsToDuplicate || Array.from(selectedClientIds);
    if (idsToUse.length === 0) return;

    setBulkActionLoading(true);
    try {
      const promises = idsToUse.map((id) => clientService.duplicateClient(id));
      await Promise.all(promises);
      if (!clientIdsToDuplicate) {
        setSelectedClientIds(new Set());
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    } catch (error) {
      alert('Error al duplicar clientes');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkExport = (clientIdsToExport?: string[]) => {
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
  };

  const handleAssignReferrer = async (referrerId: string | null) => {
    setBulkActionLoading(true);
    try {
      await clientService.updateMultipleClientsReferrer(Array.from(selectedClientIds), referrerId);
      setSelectedClientIds(new Set());
      setIsAssignReferrerModalOpen(false);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    } catch (error) {
      alert('Error al asignar referente');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getSortIcon = (field: ClientSortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // ===================================
  // RENDERIZADO DEL COMPONENTE
  // ===================================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Ajuste 1: Título y Botón */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Clientes
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 truncate whitespace-nowrap overflow-hidden">
            Gestiona tu base de clientes
          </p>
        </div>
        {/* Clase 'w-full sm:w-auto min-w-max' removida para que el ancho se adapte al contenido. */}
        <Button onClick={handleCreateClient} className="w-auto"> 
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Ajuste 2: Filtros y Búsqueda */}
      <div className="flex items-center justify-between gap-4">
        {/* Barra de Búsqueda (Izquierda) */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        {/* Filtros (Derecha) - El componente ClientFilters debería adaptarse a su contenido. */}
        <ClientFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={filterCounts}
          availableTags={availableTags}
          selectedTagIds={selectedTagIds}
          onTagsChange={setSelectedTagIds}
        />
      </div>

      {/* ===================================
      // BARRA DE ACCIONES MASIVAS
      // =================================== */}
      {selectedClientIds.size > 0 && (
        <ClientBulkActionBar
          selectedCount={selectedClientIds.size}
          onDelete={handleBulkDelete}
          onDuplicate={() => handleBulkDuplicate()}
          onExport={() => handleBulkExport()}
          onAssignReferrer={() => setIsAssignReferrerModalOpen(true)}
          onClearSelection={() => setSelectedClientIds(new Set())}
          isLoading={bulkActionLoading}
        />
      )}

      {/* ===================================
      // TABLA / LISTA DE CLIENTES
      // =================================== */}
      <div className="card">
        
        {/* Sin Resultados */}
        {filteredAndSortedClients.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm sm:text-base text-muted-foreground">
              {searchQuery || activeFilter !== 'all' ? 'No se encontraron clientes' : 'No hay clientes registrados aún'}
            </p>
            {!searchQuery && activeFilter === 'all' && (
              <Button
                onClick={handleCreateClient}
                className="mt-4 w-full sm:w-auto"
              >
                <Plus className="w-5 h-5 mr-2" />
                Agregar Primer Cliente
              </Button>
            )}
          </div>
        ) : (
          <TooltipProvider>
            
            {/* Tabla para pantallas grandes (md:block) -> Muestra todas las redes sociales */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedClientIds.size === filteredAndSortedClients.length && filteredAndSortedClients.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="Seleccionar todos"
                      />
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-2">
                        Cliente
                        {getSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead>Contacto</TableHead> 
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('total_visits')}>
                      <div className="flex items-center gap-2">
                        Visitas
                        {getSortIcon('total_visits')}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('total_spent')}>
                      <div className="flex items-center gap-2">
                        Gastado
                        {getSortIcon('total_spent')}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('last_visit_date')}>
                      <div className="flex items-center gap-2">
                        Última Visita
                        {getSortIcon('last_visit_date')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedClients.map((client) => {
                    // Para pantallas grandes, se obtienen todos los enlaces (limit: null)
                    const { visibleLinks } = getSocialMediaLinks(client, null);
                    
                    return (
                      <TableRow key={client.id} className={selectedClientIds.has(client.id) ? 'bg-primary/10' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedClientIds.has(client.id)}
                            onCheckedChange={(checked) => handleSelectClient(client.id, !!checked)}
                          />
                        </TableCell>
                        
                        {/* Celda Cliente (Nombre + Teléfono sin link ni icono) */}
                        <TableCell>
                          <p className="font-medium">{client.name}</p>
                          <span className="text-sm text-muted-foreground mt-0.5">
                            {formatPhone(client.phone)}
                          </span>
                        </TableCell>

                        {/* Celda Contacto (Todas las Redes Sociales) */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            
                            {/* Mostrar todos los enlaces disponibles */}
                            {visibleLinks.map((link) => (
                              <Tooltip delayDuration={200} key={link.type}>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenLink(link.url)}
                                    className={`h-7 w-7 text-muted-foreground hover:${link.color} p-0`}
                                    aria-label={`${link.type} de ${client.name}`}
                                  >
                                    <link.icon className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{link.type}</TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="purple">{client.total_visits}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-foreground">
                            {formatCurrency(Number(client.total_spent))}
                          </span>
                        </TableCell>
                        <TableCell>
                          {client.last_visit_date ? (
                            <span className="text-sm">
                              {format(parseDate(client.last_visit_date) || new Date(), 'dd/MM/yyyy', { locale: es })}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Sin visitas</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Tooltip delayDuration={200}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleViewProfile(client.id)}
                                  className="p-2 text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-lg transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Ver perfil completo</TooltipContent>
                            </Tooltip>
                            <Tooltip delayDuration={200}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handlePenClient(client)}
                                  className="p-2 text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-lg transition-colors"
                                >
                                  <Pen className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Editar cliente</TooltipContent>
                            </Tooltip>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-8 h-8 p-0 text-muted-foreground hover:bg-muted/50">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleBulkExport([client.id])} 
                                  className="cursor-pointer"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Exportar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleBulkDuplicate([client.id])}
                                  className="cursor-pointer"
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Duplicar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedClientIds(new Set([client.id]));
                                    setIsAssignReferrerModalOpen(true);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Relacionar cliente
                                </DropdownMenuItem>
                                {user && canDeleteClients(user.role) && (
                                  <DropdownMenuItem 
                                    onClick={() => confirmDeleteClient(client)}
                                    className="cursor-pointer text-destructive focus:text-destructive-foreground"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Lista para pantallas chicas/medianas*/}
            <div className="md:hidden divide-y divide-border">
              {filteredAndSortedClients.map((client) => {
                // Para pantallas medianas/chicas, se limita a 1 enlace visible
                const { visibleLinks, hiddenCount, hiddenLinks } = getSocialMediaLinks(client, 1);
                
                // Función para manejar el clic en el badge según el tamaño de la pantalla
                const handleBadgeClick = () => {
                    if (isSmallScreen) {
                        // Pantallas chicas (Small): Abre el modal de perfil
                        handleViewProfile(client.id);
                    }
                    // Pantallas medianas: El Popover maneja la visibilidad, no se necesita acción programática aquí
                };

                return (
                  <div key={client.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          checked={selectedClientIds.has(client.id)}
                          onCheckedChange={(checked) => handleSelectClient(client.id, !!checked)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          {/* Nombre y Teléfono sin link ni icono */}
                          <h3 className="font-semibold text-foreground mb-1">
                            {client.name}
                          </h3>
                          <span className="text-sm text-muted-foreground">
                            {formatPhone(client.phone)}
                          </span>

                          {/* Botones de Redes Sociales */}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            
                            {/* 1. Enlace visible (máx. 1) */}
                            {visibleLinks.map((link) => (
                              <Tooltip delayDuration={200} key={link.type}>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenLink(link.url)}
                                    className={`h-7 w-7 text-muted-foreground hover:${link.color} p-0`}
                                    aria-label={`${link.type} de ${client.name}`}
                                  >
                                    <link.icon className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{link.type}</TooltipContent>
                              </Tooltip>
                            ))}

                            {/* 2. Botón de agrupación (+X) con lógica Popover/Modal */}
                            {hiddenCount > 0 && (
                                isSmallScreen ? (
                                    // Pantallas chicas: Click abre modal
                                    <Badge 
                                        variant="secondary" 
                                        className="cursor-pointer hover:bg-muted-foreground/20 transition-colors"
                                        onClick={handleBadgeClick}
                                    >
                                        +{hiddenCount}
                                    </Badge>
                                ) : (
                                    // Pantallas medianas: Click abre Popover
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Badge 
                                                variant="secondary" 
                                                className="cursor-pointer hover:bg-muted-foreground/20 transition-colors"
                                            >
                                                +{hiddenCount}
                                            </Badge>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-40 p-1 flex flex-col space-y-1">
                                            {hiddenLinks.map((link) => (
                                                <Button 
                                                    key={link.type}
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenLink(link.url)}
                                                    className={`justify-start ${link.color}`}
                                                >
                                                    <link.icon className={`w-4 h-4 mr-2`} />
                                                    {link.type}
                                                </Button>
                                            ))}
                                        </PopoverContent>
                                    </Popover>
                                )
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewProfile(client.id)}
                          className="p-2 text-muted-foreground hover:text-info hover:bg-muted/50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePenClient(client)}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-lg transition-colors"
                        >
                          <Pen className="w-4 h-4" />
                        </button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 p-0 text-muted-foreground hover:bg-muted/50">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleBulkExport([client.id])}
                              className="cursor-pointer"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Exportar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleBulkDuplicate([client.id])}
                              className="cursor-pointer"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedClientIds(new Set([client.id]));
                                setIsAssignReferrerModalOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Relacionar cliente
                            </DropdownMenuItem>
                            {user && canDeleteClients(user.role) && (
                              <DropdownMenuItem 
                                onClick={() => confirmDeleteClient(client)}
                                className="cursor-pointer text-destructive focus:text-destructive bg-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>

                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Visitas</p>
                        <Badge variant="purple">{client.total_visits}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Gastado</p>
                        <p className="text-sm font-medium text-foreground">
                          {formatCurrency(Number(client.total_spent))}
                        </p>
                      </div>
                      {client.last_visit_date && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Última Visita</p>
                            <p className="text-xs text-muted-foreground">
                                {format(parseDate(client.last_visit_date) || new Date(), 'dd/MM/yy', { locale: es })}
                            </p>
                          </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
          </TooltipProvider>
        )}
      </div>

      {/* ===================================
      // MODALES
      // =================================== */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
        client={selectedClient}
        clients={clients}
      />

      <ClientProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        clientId={profileClientId}
        onPen={(client) => {
          setIsProfileModalOpen(false);
          handlePenClient(client);
        }}
      />

      <AssignReferrerModal
        isOpen={isAssignReferrerModalOpen}
        onClose={() => setIsAssignReferrerModalOpen(false)}
        onSave={handleAssignReferrer}
        clients={clients}
        excludeIds={Array.from(selectedClientIds)}
      />
      
      {/* ===================================
      // ELIMINAR CLIENTE
      // =================================== */}
      <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al cliente <span className="font-semibold text-foreground">{clientToDelete?.name}</span> y todos sus datos relacionados (visitas, historial, etc.) de nuestros servidores. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive hover:bg-destructive/90">
              Eliminar cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}