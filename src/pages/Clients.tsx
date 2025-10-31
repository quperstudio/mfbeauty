import { Plus, X, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '../components/shared/PageHeader';
import SearchBar from '../components/shared/SearchBar';
import EmptyState from '../components/shared/EmptyState';
import ClientModal from '../components/clients/ClientModal';
import ClientFilters from '../components/clients/ClientFilters';
import AssignReferrerModal from '@/components/clients/AssignReferrerModal';
import ClientBulkActionBar from '../components/clients/ClientBulkActionBar';
import ClientProfileModal from '../components/clients/ClientProfileModal';
import ClientsTableView from '../components/clients/ClientsTableView';
import ClientsListView from '../components/clients/ClientsListView';
import { useClientsPage } from '../hooks/clients/useClientsPage';
import { CLIENT_FILTER_LABELS } from '../constants/clients.constants';
import { useClientSelection } from '../hooks/clients/useClientSelection';

// COMPONENTE PRINCIPAL: CLIENTES
// ------------------------------
export default function Clients() {
  // Obtiene la información del usuario autenticado
  const { user } = useAuth();
  
  // HOOK FRAGMENTADO: ESTADO DE SELECCIÓN MASIVA
  const {
    selectedClientIds: selectedIdsFromHook,
    handleSelectAll: handleSelectAllHook,
    handleSelectClient,
    clearSelection: clearSelectionHook,
  } = useClientSelection();

  // Hook que maneja toda la lógica, estado y datos de la página
  const {
    // Datos y Estados
    clients,
    allClients,
    loading,
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
    isProfileModalOpen,
    setIsProfileModalOpen,
    profileClientId,
    isAssignReferrerModalOpen,
    setIsAssignReferrerModalOpen,
    bulkActionLoading,
    
    // Estado y manejadores de eliminación unificada
    deleteTarget,
    setDeleteTarget,
    handleConfirmDelete,
    
    // Funciones de Manejo
    confirmDeleteClient,
    handleBulkDelete,
    handleSaveClient, // Guarda los cambios de un cliente (usado en ClientModal)
    handleEditClient,
    handleCreateClient,
    handleSort,
    handleViewProfile,
    handleBulkExport,
    handleAssignReferrer,
    isSmallScreen,
    filterCounts,
    hasActiveFilters,
    clearSelection, // Esta función probablemente limpia estados UI del hook principal
    handleEditFromProfile,
    handleAssignReferrerToClients,
  } = useClientsPage();
  
  // Mapear el estado y los manejadores del hook fragmentado
  const selectedClientIds = selectedIdsFromHook;
  
  // El manejador de 'Seleccionar Todos' necesita la lista actual de clientes
  const handleSelectAll = (checked: boolean) => handleSelectAllHook(checked, clients); 
  
  const selectedCount = selectedClientIds.size; // Conteo para la barra de acciones

  // FUNCIÓN HELPER
  // --------------
  // Genera el mensaje dinámico para el diálogo de eliminación (individual o masiva)
  const getDeleteMessage = () => {
    if (deleteTarget === 'bulk') {
      return `¿Estás seguro de que deseas eliminar ${selectedClientIds.size} cliente(s) seleccionado(s)?`;
    }
    
    if (deleteTarget) {
      const client = allClients.find(c => c.id === deleteTarget);
      const clientName = client ? `a "${client.name}"` : 'al cliente seleccionado';
      return `¿Estás seguro de que deseas eliminar ${clientName}?`;
    }
    return '¿Estás seguro de continuar?';
  };

  // Renderizado de Carga Inicial
  // ----------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // RENDERIZADO PRINCIPAL DE LA VISTA
  // ---------------------------------
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Encabezado de la página */}
      <PageHeader
        title="Clientes"
        description="Gestiona tu base de clientes"
        actionLabel="Nuevo Cliente"
        actionIcon={Plus}
        onAction={handleCreateClient}
      />

      {/* Barra de búsqueda y Filtros */}
      <div className="flex items-center justify-between gap-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar por nombre, teléfono o redes sociales..."
        />
        <ClientFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={filterCounts}
          availableTags={availableTags}
          selectedTagIds={selectedTagIds}
          onTagsChange={setSelectedTagIds}
        />
      </div>

      {/* Indicadores de Filtros Activos (Badges) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Filtros:</span>

          {/* Filtro de estado */}
          {activeFilter !== 'all' && (
            <Badge variant="outline" className="gap-1.5 pl-2 pr-1">
              {CLIENT_FILTER_LABELS[activeFilter]}
              <button
                onClick={() => setActiveFilter('all')}
                className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                aria-label={`Quitar filtro ${CLIENT_FILTER_LABELS[activeFilter]}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Badge>
          )}

          {/* Filtros por Tag */}
          {availableTags
            .filter((tag) => selectedTagIds.includes(tag.id))
            .map((tag) => (
              <Badge key={tag.id} variant="outline" className="gap-1.5 pl-2 pr-1">
                {tag.name}
                <button
                  onClick={() => setSelectedTagIds((prevIds) => prevIds.filter((id) => id !== tag.id))}
                  className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                  aria-label={`Quitar etiqueta ${tag.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Badge>
            ))}
        </div>
      )}

      {/* Barra de Acciones Masivas */}
      {selectedCount > 0 && (
        <ClientBulkActionBar
          selectedCount={selectedCount}
          userRole={user?.role}
          onDelete={handleBulkDelete}
          onExport={() => handleBulkExport(clients.filter(c => selectedClientIds.has(c.id)))}
          onAssignReferrer={() => setIsAssignReferrerModalOpen(true)}
          onClearSelection={clearSelectionHook}
          isLoading={bulkActionLoading}
        />
      )}

      {/* Vista de Clientes (Tabla o Lista) / Estado Vacío */}
      <div className="card">
        {clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title={
              searchQuery || activeFilter !== 'all'
                ? 'No se encontraron clientes'
                : 'No hay clientes registrados aún'
            }
          >
            {!searchQuery && activeFilter === 'all' && (
              <button onClick={handleCreateClient} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto">
                <Plus className="w-5 h-5 inline mr-2" />
                Agregar Primer Cliente
              </button>
            )}
          </EmptyState>
        ) : (
          <>
            {/* Vista de Tabla (para desktop) */}
            <ClientsTableView
              clients={clients}
              selectedClientIds={selectedClientIds}
              sortField={sortField}
              sortDirection={sortDirection}
              userRole={user?.role}
              onSelectAll={handleSelectAll} // Usa el manejador del hook fragmentado
              onSelectClient={handleSelectClient} // Usa el manejador del hook fragmentado
              onSort={handleSort}
              onViewProfile={handleViewProfile}
              onEdit={handleEditClient}
              onDelete={confirmDeleteClient} // Abre el diálogo de eliminación individual
              onExport={handleBulkExport}
              onAssignReferrer={handleAssignReferrerToClients}
            />

            {/* Vista de Lista (para mobile) */}
            <ClientsListView
              clients={clients}
              selectedClientIds={selectedClientIds}
              isSmallScreen={isSmallScreen}
              userRole={user?.role}
              onSelectClient={handleSelectClient}
              onViewProfile={handleViewProfile}
              onEdit={handleEditClient}
              onDelete={confirmDeleteClient}
              onExport={handleBulkExport}
              onAssignReferrer={handleAssignReferrerToClients}
            />
          </>
        )}
      </div>

      {/* MODALES */}
      {/* Modal para crear o editar un cliente */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
        client={selectedClient}
        clients={allClients}
      />

      {/* Modal para ver el perfil completo del cliente */}
      <ClientProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        clientId={profileClientId}
        onEdit={handleEditFromProfile}
      />

      {/* Modal para asignar un referente */}
      <AssignReferrerModal
        isOpen={isAssignReferrerModalOpen}
        onClose={() => setIsAssignReferrerModalOpen(false)}
        onSubmit={handleAssignReferrer}
        isLoading={bulkActionLoading} 
        allClients={allClients}
        selectedClientIds={selectedClientIds}
      />

      {/* DIÁLOGO DE CONFIRMACIÓN DE ELIMINACIÓN UNIFICADO */}
      <AlertDialog
        open={deleteTarget !== null} // Abierto si hay un target de eliminación
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null); // Reinicia el target al cerrar
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              {getDeleteMessage()}
              <br />
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar {deleteTarget === 'bulk' ? 'cliente(s)' : 'cliente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}