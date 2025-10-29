import { useState, useCallback } from 'react';
import { Client } from '../../types/database';

export function useClientModals() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileClientId, setProfileClientId] = useState<string | null>(null);
  const [isAssignReferrerModalOpen, setIsAssignReferrerModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<'bulk' | string | null>(null);

  const handleCreateClient = useCallback(() => {
    setSelectedClient(undefined);
    setIsModalOpen(true);
  }, []);

  const handleEditClient = useCallback((client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  }, []);

  const handleViewProfile = useCallback((clientId: string) => {
    setProfileClientId(clientId);
    setIsProfileModalOpen(true);
  }, []);

  const confirmDeleteClient = useCallback((client: Client) => {
    setDeleteTarget(client.id);
  }, []);

  const confirmBulkDelete = useCallback(() => {
    setDeleteTarget('bulk');
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteTarget(null);
  }, []);

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
