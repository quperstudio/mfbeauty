import { useState, useCallback } from 'react';
import { Client } from '../../types/database';

// HOOK PRINCIPAL: useClientModals
// --------------------------------
// Gestiona el estado de apertura y cierre de todos los modales/diálogos relacionados con clientes.
export function useClientModals() {
  // ESTADOS DE VISIBILIDAD DE MODALES
  // ---------------------------------
  // Controla el modal de creación/edición de cliente (ClientModal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Almacena el cliente seleccionado para edición
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  // Controla el modal del perfil detallado del cliente
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  // ID del cliente cuyo perfil se está visualizando
  const [profileClientId, setProfileClientId] = useState<string | null>(null);
  // Controla el modal de asignación masiva de referente
  const [isAssignReferrerModalOpen, setIsAssignReferrerModalOpen] = useState(false);
  // Almacena el objetivo de la acción de eliminación (ID del cliente o 'bulk' para masiva)
  const [deleteTarget, setDeleteTarget] = useState<'bulk' | string | null>(null);

  // MANEJADORES PARA ABRIR MODALES
  // ------------------------------

  // FUNCIÓN: Abrir el modal para crear un nuevo cliente
  const handleCreateClient = useCallback(() => {
    setSelectedClient(undefined); // Asegura que el formulario esté vacío
    setIsModalOpen(true);
  }, []);

  // FUNCIÓN: Abrir el modal para editar un cliente existente
  const handleEditClient = useCallback((client: Client) => {
    setSelectedClient(client); // Carga los datos del cliente en el formulario
    setIsModalOpen(true);
  }, []);

  // FUNCIÓN: Abrir el modal de perfil detallado
  const handleViewProfile = useCallback((clientId: string) => {
    setProfileClientId(clientId);
    setIsProfileModalOpen(true);
  }, []);

  // MANEJADORES PARA ELIMINACIÓN
  // ----------------------------

  // FUNCIÓN: Establecer el objetivo de eliminación para un cliente individual
  const confirmDeleteClient = useCallback((client: Client) => {
    setDeleteTarget(client.id);
  }, []);

  // FUNCIÓN: Establecer el objetivo de eliminación para la acción masiva
  const confirmBulkDelete = useCallback(() => {
    setDeleteTarget('bulk');
  }, []);

  // FUNCIÓN: Cerrar el diálogo de confirmación de eliminación
  const closeDeleteDialog = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  // RETORNO DEL HOOK
  // -----------------
  return {
    isModalOpen,
    setIsModalOpen,
    selectedClient,
    setSelectedClient,
    isProfileModalOpen,
    setIsProfileModalOpen,
    profileClientId,
    isAssignReferrerModalOpen,
    setIsAssignReferrerModalOpen,
    deleteTarget,
    setDeleteTarget,
    handleCreateClient,
    handleEditClient,
    handleViewProfile,
    confirmDeleteClient,
    confirmBulkDelete,
    closeDeleteDialog,
  };
}