import { useState } from 'react';
import Modal from '@/components/ui/modal';
import SelectWrapper from '@/components/ui/select-wrapper';
import { Button } from '@/components/ui/button';
import { Client } from '../../types/database';

interface AssignReferrerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (referrerId: string | null) => Promise<void>;
  clients: Client[];
  excludeIds: string[];
}

export default function AssignReferrerModal({
  isOpen,
  onClose,
  onSave,
  clients,
  excludeIds,
}: AssignReferrerModalProps) {
  const [selectedReferrerId, setSelectedReferrerId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const availableClients = clients.filter((c) => !excludeIds.includes(c.id));

  const referrerOptions = [
    { value: '', label: 'Ninguno (Quitar referente)' },
    ...availableClients.map((c) => ({ value: c.id, label: c.name })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(selectedReferrerId || null);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asignar Referido Por" size="sm">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Selecciona el cliente que refirió a los clientes seleccionados.
        </p>

        <SelectWrapper
          label="Referido Por"
          value={selectedReferrerId}
          onChange={(value) => setSelectedReferrerId(value)}
          options={referrerOptions}
          disabled={loading}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
