import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
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
import { Client } from '@/types/database'; 

// PROPIEDADES DEL COMPONENTE
// --------------------------
interface AssignReferrerModalProps {
  /** Estado de apertura del modal, controlado por useClientsPage */
  isOpen: boolean;
  /** Función para cerrar el modal, de useClientsPage */
  onClose: () => void;
  onSubmit: (referrerId: string | null) => void;
  /** Estado de carga, de useClientsPage */
  isLoading: boolean;
  /** Lista completa de clientes para poblar el dropdown, de useClientsPage */
  allClients: Client[];
  /** IDs de los clientes seleccionados para la acción, de useClientsPage */
  selectedClientIds: Set<string>;
}

// COMPONENTE PRINCIPAL
// --------------------
export default function AssignReferrerModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  allClients,
  selectedClientIds,
}: AssignReferrerModalProps) {
  
  // 'selectedId' puede ser un ID de cliente, 'none' (para null), o 'mixed' (referentes diferentes)
  const [selectedId, setSelectedId] = useState<string>('');


  // EFECTO PARA INICIALIZAR EL SELECT CON EL ESTADO ACTUAL DE LOS CLIENTES SELECCIONADOS
  useEffect(() => {
    if (!isOpen) {
      // Resetear el estado cuando se cierra el modal
      setSelectedId('');
      return;
    }
    
    if (selectedClientIds.size === 0) return;

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

  }, [isOpen, selectedClientIds, allClients]);

  // MEMO: Opciones de clientes para el dropdown (excluye a los clientes seleccionados)
  const referrerOptions = useMemo(() => {
    return allClients.filter(c => !selectedClientIds.has(c.id));
  }, [allClients, selectedClientIds]);


  const handleSubmit = () => {
    // Convierte el valor especial 'none' a null antes de enviar
    onSubmit(selectedId === 'none' ? null : selectedId);
  };

  // VARIABLES DE UI
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
        
        {/* CUERPO DEL MODAL (SELECTOR) */}
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
              <SelectItem value="none">
                <span className="text-muted-foreground">(Ninguno)</span>
              </SelectItem>
              
              {/* Opción especial para el caso mixto, siempre deshabilitada */}
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
        
        {/* PIE DE PÁGINA (BOTONES) */}
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
            )}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}