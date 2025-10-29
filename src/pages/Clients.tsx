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
import ClientBulkActionBar from '../components/clients/ClientBulkActionBar';
import ClientProfileModal from '../components/clients/ClientProfileModal';
import AssignReferrerModal from '../components/clients/AssignReferrerModal';
import ClientsTableView from '../components/clients/ClientsTableView';
import ClientsListView from '../components/clients/ClientsListView';
import { useClientsPage } from '../hooks/clients/useClientsPage';
import { CLIENT_FILTER_LABELS } from '../constants/clients.constants';

export default function Clients() {
  const { user } = useAuth();
  const {
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
    selectedClientIds,
    setSelectedClientIds,
    isProfileModalOpen,
    setIsProfileModalOpen,
    profileClientId,
    isAssignReferrerModalOpen,
    setIsAssignReferrerModalOpen,
    bulkActionLoading,
    
    // CAMBIOS CLAVE 1: Recibir los nuevos estados/manejadores
    deleteTarget, 
    setDeleteTarget,
    handleConfirmDelete, 
    
    // Los manejadores de entrada se mantienen
    confirmDeleteClient, 
    handleBulkDelete,
    
    handleSaveClient,
    handleEditClient,
    handleCreateClient,
    handleSort,
    handleSelectAll,
    handleSelectClient,
    handleViewProfile,
    handleBulkDuplicate,
    handleBulkExport,
    handleAssignReferrer,
    
    isSmallScreen,
    filterCounts,
  } = useClientsPage();
  
  // FUNCIÓN HELPER para mensaje dinámico
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const hasActiveFilters = activeFilter !== 'all' || selectedTagIds.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Clientes"
        description="Gestiona tu base de clientes"
        actionLabel="Nuevo Cliente"
        actionIcon={Plus}
        onAction={handleCreateClient}
      />

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

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Filtros:</span>

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

      {selectedClientIds.size > 0 && (
        <ClientBulkActionBar
          selectedCount={selectedClientIds.size}
          onDelete={handleBulkDelete} // Llama a la función que pone 'bulk' en deleteTarget
          onDuplicate={() => handleBulkDuplicate()}
          onExport={() => handleBulkExport()}
          onAssignReferrer={() => setIsAssignReferrerModalOpen(true)}
          onClearSelection={() => setSelectedClientIds(new Set())}
          isLoading={bulkActionLoading}
        />
      )}

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
            <ClientsTableView
              clients={clients}
              selectedClientIds={selectedClientIds}
              sortField={sortField}
              sortDirection={sortDirection}
              userRole={user?.role}
              onSelectAll={handleSelectAll}
              onSelectClient={handleSelectClient}
              onSort={handleSort}
              onViewProfile={handleViewProfile}
              onEdit={handleEditClient}
              onDelete={confirmDeleteClient} // Llama a la función que pone el ID en deleteTarget
              onExport={handleBulkExport}
              onDuplicate={handleBulkDuplicate}
              onAssignReferrer={(clientIds) => {
                setSelectedClientIds(new Set(clientIds));
                setIsAssignReferrerModalOpen(true);
              }}
            />

            <ClientsListView
              clients={clients}
              selectedClientIds={selectedClientIds}
              isSmallScreen={isSmallScreen}
              userRole={user?.role}
              onSelectClient={handleSelectClient}
              onViewProfile={handleViewProfile}
              onEdit={handleEditClient}
              onDelete={confirmDeleteClient} // Llama a la función que pone el ID en deleteTarget
              onExport={handleBulkExport}
              onDuplicate={handleBulkDuplicate}
              onAssignReferrer={(clientIds) => {
                setSelectedClientIds(new Set(clientIds));
                setIsAssignReferrerModalOpen(true);
              }}
            />
          </>
        )}
      </div>

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
        client={selectedClient}
        clients={allClients}
      />

      <ClientProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        clientId={profileClientId}
        onEdit={(client) => {
          setIsProfileModalOpen(false);
          handleEditClient(client);
        }}
      />

      <AssignReferrerModal
        isOpen={isAssignReferrerModalOpen}
        onClose={() => setIsAssignReferrerModalOpen(false)}
        onSave={handleAssignReferrer}
        clients={allClients}
        excludeIds={Array.from(selectedClientIds)}
      />

      {/* CAMBIO CLAVE 2: Diálogo de eliminación UNIFICADO (individual y masivo) */}
      <AlertDialog
        open={deleteTarget !== null}
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