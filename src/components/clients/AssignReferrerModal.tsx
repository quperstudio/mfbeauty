// src/components/clients/AssignReferrerModal.tsx

import { useState, useEffect, useMemo } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Client } from '@/types/database'; // Asegúrate de que la ruta sea correcta

interface AssignReferrerModalProps {
  /** Estado de apertura del modal, controlado por useClientsPage */
  isOpen: boolean;
  /** Función para cerrar el modal, de useClientsPage */
  onClose: () => void;
  /** * Función de submit que llama a la lógica de negocio (handleAssignReferrer).
   * Proviene de useClientsPage.
   */
  onSubmit: (referrerId: string | null) => void;
  /** Estado de carga, de useClientsPage */
  isLoading: boolean;
  /** Lista completa de clientes para poblar el dropdown, de useClientsPage */
  allClients: Client[];
  /** IDs de los clientes seleccionados para la acción, de useClientsPage */
  selectedClientIds: Set<string>;
}

export default function AssignReferrerModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  allClients,
  selectedClientIds,
}: AssignReferrerModalProps) {
  
  /** * Estado interno para manejar el valor del <Select>.
   * Usamos valores especiales:
   * - 'none': Representa un referrer_id nulo (Ninguno).
   * - 'mixed': Estado especial si los clientes seleccionados tienen diferentes referentes.
   * - 'client-id...': Un ID de cliente real.
   */
  const [selectedId, setSelectedId] = useState<string>('');

  /**
   * Lógica para determinar el estado inicial del <Select> (Requerimiento 2).
   * Se ejecuta cada vez que se abre el modal.
   */
  useEffect(() => {
    if (isOpen && selectedClientIds.size > 0) {
      const selectedClients = allClients.filter(c => selectedClientIds.has(c.id));
      if (selectedClients.length === 0) return;

      // Usamos 'none' para representar 'null' y facilitar la comparación
      const firstReferrerId = selectedClients[0].referrer_id || 'none';
      
      // Comprobar si todos los clientes seleccionados tienen el mismo referente
      const allHaveSameReferrer = selectedClients.every(
        c => (c.referrer_id || 'none') === firstReferrerId
      );

      // Si todos son iguales, establecer ese valor. Si son mixtos, establecer 'mixed'.
      setSelectedId(allHaveSameReferrer ? firstReferrerId : 'mixed');
    } else if (!isOpen) {
      // Resetear el estado cuando se cierra el modal
      setSelectedId('');
    }
  }, [isOpen, selectedClientIds, allClients]);

  /**
   * Filtra la lista de clientes para el dropdown.
   * Un cliente no puede ser su propio referente, ni referente de un grupo
   * al que pertenece.
   */
  const referrerOptions = useMemo(() => {
    return allClients.filter(c => !selectedClientIds.has(c.id));
  }, [allClients, selectedClientIds]);

  /**
   * Maneja el envío del formulario.
   * Convierte los valores especiales ('none') a 'null' para la base de datos.
   */
  const handleSubmit = () => {
    // Si el valor es 'none', enviamos 'null'.
    // Si es un ID, enviamos el ID.
    onSubmit(selectedId === 'none' ? null : selectedId);
  };

  const selectedCount = selectedClientIds.size;
  const isDisabled = isLoading || selectedId === 'mixed';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asignar Referente</DialogTitle>
          <DialogDescription>
            {`Selecciona un cliente para asignarlo como referente de los ${selectedCount} ${
              selectedCount === 1 ? 'cliente seleccionado' : 'clientes seleccionados'
            }.`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-2">
          <Label htmlFor="referrer-select">Cliente Referente</Label>
          <Select
            value={selectedId}
            onValueChange={setSelectedId}
            disabled={isLoading}
          >
            <SelectTrigger id="referrer-select" className="w-full">
              <SelectValue placeholder="Seleccionar un cliente..." />
            </SelectTrigger>
            <SelectContent>
              {/* Opción para "Ninguno" */}
              <SelectItem value="none">
                <span className="text-muted-foreground">(Ninguno)</span>
              </SelectItem>
              
              {/* Opción especial si los valores son mixtos */}
              {selectedId === 'mixed' && (
                <SelectItem value="mixed" disabled>
                  (Varios referentes seleccionados)
                </SelectItem>
              )}
              
              {/* Lista de clientes disponibles */}
              {referrerOptions.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedId === 'mixed' && (
             <p className="text-xs text-destructive">
               Los clientes seleccionados tienen referentes mixtos. Debes seleccionar una opción unificada.
             </p>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={onClose} 
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isDisabled}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}