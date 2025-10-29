import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Client } from '../../types/database';
import { ClientSchemaType } from '../../schemas/client.schema';
import { formatPhoneRealTime } from '../../lib/formats';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DatePicker } from '@/components/ui/date-picker';
import { TagInput } from '@/components/ui/TagInput';
import SocialMediaManager from '../shared/SocialMediaManager';
import { useClientForm } from '../../hooks/clients/useClientForm';

// PROPS
// -----
interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  // CAMBIO CLAVE: onSave ahora acepta un clientID opcional, permitiendo a la lógica
  // (handleSaveClient en useClientActions.ts) decidir si es CREATE o UPDATE.
  onSave: (data: ClientSchemaType, tagIds: string[], clientId?: string) => Promise<{ error: string | null }>;
  client?: Client;
  clients: Client[];
}

// COMPONENTE PRINCIPAL
// --------------------
export default function ClientModal({ isOpen, onClose, onSave, client, clients }: ClientModalProps) {
  // HOOK DE LÓGICA DEL FORMULARIO
  // El hook useClientForm ya tiene acceso a 'client' (el cliente a editar).
  // Se asume que useClientForm ha sido actualizado internamente para usar client.id 
  // al llamar a la función onSave (la cual es handleSaveClient)
  const {
    formData, errors, loading, selectedTags, socialMediaList, 
    showUnsavedChangesDialog, phoneCheckLoading, availableTags,
    referrerOptions, handlers, tagHandlers,
  } = useClientForm({ client, isOpen, onSave, onClose, clients });

  return (
    <>
  return (
    <>
      <Dialog open={isOpen} onOpenChange={handlers.handleClose}>
        <DialogContent className="w-10/12 md:max-w-l h-[85vh] flex flex-col p-0 bg-card text-card-foreground border-border">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle>{client ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handlers.handleSubmit} id="client-form" className="flex flex-col flex-grow h-0 min-h-0">
            <ScrollArea className="flex-grow h-0 min-h-0">
              <div className="space-y-3 p-6 pt-0 sm:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label htmlFor="client-name" className="block text-sm font-medium text-muted-foreground mb-1.5">
                      Nombre Completo *
                    </label>
                    <Input
                      id="client-name"
                      name="name"
                      value={formData.name}
                      onChange={handlers.handleFormChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
                      error={errors.name}
                      placeholder="Ej. Marisela Félix"
                      disabled={loading}
                    />
                    {errors.name && <p className="text-sm text-destructive mt-1.5">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="client-phone" className="block text-sm font-medium text-muted-foreground mb-1.5">
                      Teléfono *
                    </label>
                    <Input
                      id="client-phone"
                      name="phone"
                      value={formatPhoneRealTime(formData.phone)}
                      onChange={handlers.handlePhoneChange}
                      error={errors.phone}
                      placeholder="(667) 341 2404"
                      maxLength={15}
                      disabled={loading}
                    />
                    {errors.phone && <p className="text-sm text-destructive mt-1.5">{errors.phone}</p>}
                  </div>
                </div>

                <SocialMediaManager
                  key={client?.id || 'new-client'}
                  initialValues={socialMediaList}
                  phoneValue={formData.phone}
                  syncWhatsAppWithPhone={!client}
                  onChange={handlers.handleSocialMediaChange}
                  disabled={loading}
                  label="Redes sociales"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <DatePicker
                    label="Fecha de Cumpleaños"
                    value={formData.birthday}
                    onChange={handlers.handleBirthdayChange}
                    placeholder="Selecciona una fecha"
                    disabled={loading}
                  />
                  <div>
                    <Label htmlFor="referrer-select" className="block text-sm font-medium text-muted-foreground mb-1">
                      Referido Por
                    </Label>
                    <Select
                      value={formData.referrer_id || ''}
                      onValueChange={(value) => {
                        const finalValue = value === '__RESET__' ? '' : value;
                        handlers.setFormData((prev) => ({ ...prev, referrer_id: finalValue }));
                      }}
                      disabled={loading}
                      name="referrer_id"
                    >
                      <SelectTrigger id="referrer-select" className={errors.referrer_id ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Ninguno" />
                      </SelectTrigger>
                      <SelectContent>
                        {referrerOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.referrer_id && <p className="text-sm text-destructive mt-1.5">{errors.referrer_id}</p>}
                  </div>
                </div>

                <TagInput
                  label="Etiquetas"
                  placeholder="Escribe y presiona Enter para agregar..."
                  selectedTags={selectedTags}
                  availableTags={availableTags}
                  onAddTag={tagHandlers.onAddTag}
                  onRemoveTag={tagHandlers.onRemoveTag}
                  onDeleteTagGlobally={tagHandlers.onDeleteTagGlobally}
                  maxTags={5}
                  disabled={loading}
                  canDeleteGlobally={true}
                />

                <div>
                  <label htmlFor="client-notes" className="block text-sm font-medium text-muted-foreground mb-1.5">
                    Notas
                  </label>
                  <Textarea
                    id="client-notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handlers.handleFormChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
                    rows={3}
                    placeholder="Notas adicionales sobre el cliente..."
                    disabled={loading}
                  />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="pb-4 pt-4 border-t border-border bg-background px-6 gap-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handlers.handleClose}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="default"
                size="default"
                disabled={loading || phoneCheckLoading}
                className="w-full sm:w-auto"
              >
                {loading || phoneCheckLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                    {phoneCheckLoading ? 'Validando...' : 'Guardando...'}
                  </div>
                ) : (
                  <>{client ? 'Actualizar' : 'Crear'} Cliente</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ALERTA: Descartar Cambios */}
      <AlertDialog open={showUnsavedChangesDialog} onOpenChange={handlers.setShowUnsavedChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. Si cierras ahora, se perderán todos los cambios realizados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handlers.setShowUnsavedChangesDialog(false)}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction onClick={handlers.confirmClose} className="bg-destructive hover:bg-destructive/90">
              Descartar cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );