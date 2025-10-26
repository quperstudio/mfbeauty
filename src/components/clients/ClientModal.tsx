/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Save, UserPlus, X } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useCreateClient, useUpdateClient } from '@/hooks/queries/useClients.query';
// import { useTags } from '@/hooks/queries/useTags.query'; // Eliminado porque 'tags' no está en el schema
import { useToast } from '@/hooks/use-toast';
// --- CAMBIO AQUÍ: Importación corregida ---
import { clientSchema, ClientSchemaType } from '@/schemas/client.schema';
// import { tagService } from '@/services/tag.service'; // Eliminado
import { Client } from '@/types/database'; // Asumimos que Client ahora coincide con el schema

import { Button } from '../ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Modal } from '../ui/modal';
// import { TagInput } from '../ui/TagInput'; // Eliminado

// --- CAMBIO AQUÍ: Nombre del tipo corregido ---
// type ClientFormSchema = z.infer<typeof clientFormSchema>; // <- Incorrecto
// (Ya no es necesario, importamos ClientSchemaType directamente)

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null; // Asegúrate que el tipo Client coincida con el nuevo schema
}

export function ClientModal({ isOpen, onClose, client }: ClientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // const { data: allTagsData, isLoading: isAllTagsLoading } = useTags(); // Eliminado
  const { mutate: createClient, isPending: isCreating } = useCreateClient();
  const { mutate: updateClient, isPending: isUpdating } = useUpdateClient();

  const isPending = isCreating || isUpdating;
  const isEditMode = useMemo(() => !!client, [client]);
  const modalTitle = isEditMode ? 'Editar Cliente' : 'Agregar Nuevo Cliente';
  const modalDescription = isEditMode
    ? 'Actualiza la información de tu cliente.'
    : 'Completa el formulario para agregar un nuevo cliente.';
  const buttonIcon = isEditMode ? <Save /> : <UserPlus />;
  const buttonLabel = isEditMode ? 'Guardar Cambios' : 'Guardar Cliente';

  // --- CAMBIOS AQUÍ: Para coincidir con client.schema.ts ---
  const form = useForm<ClientSchemaType>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      phone: '',
      birthday: null,
      notes: null,
      referrer_id: null,
      whatsapp_link: null,
      facebook_link: null,
      instagram_link: null,
      tiktok_link: null,
      // created_by_user_id no se incluye en el form, se asigna en el backend/servicio
    },
  });

  useEffect(() => {
    if (isEditMode && client) {
      form.reset({
        name: client.name || '',
        phone: client.phone || '',
        birthday: client.birthday || null,
        notes: client.notes || null,
        referrer_id: client.referrer_id || null,
        whatsapp_link: client.whatsapp_link || null,
        facebook_link: client.facebook_link || null,
        instagram_link: client.instagram_link || null,
        tiktok_link: client.tiktok_link || null,
      });
    } else {
      form.reset({
        name: '',
        phone: '',
        birthday: null,
        notes: null,
        referrer_id: null,
        whatsapp_link: null,
        facebook_link: null,
        instagram_link: null,
        tiktok_link: null,
      });
    }
  }, [isOpen, isEditMode, client, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // --- Lógica de Tags eliminada ---
  // const handleTagAdd = ...

  // --- CAMBIO AQUÍ: El tipo 'data' es ahora ClientSchemaType ---
  const onSubmit = (data: ClientSchemaType) => {
    if (isEditMode && client) {
      // Modo Edición
      updateClient(
        { id: client.id, ...data },
        {
          onSuccess: () => {
            toast({
              title: 'Cliente actualizado',
              description: 'La información del cliente se actualizó correctamente.',
            });
            handleClose();
          },
          onError: (error) => {
            toast({
              title: 'Error al actualizar',
              description: error.message || 'No se pudo actualizar el cliente.',
              variant: 'destructive',
            });
          },
        }
      );
    } else {
      // Modo Creación
      createClient(data, {
        onSuccess: () => {
          toast({
            title: 'Cliente creado',
            description: 'El nuevo cliente se ha guardado correctamente.',
          });
          handleClose();
        },
        onError: (error) => {
          toast({
            title: 'Error al crear',
            description: error.message || 'No se pudo guardar el cliente.',
            variant: 'destructive',
          });
        },
      });
    }
  };

  return (
    <Modal
      title={modalTitle}
      description={modalDescription}
      isOpen={isOpen}
      onClose={handleClose}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            
            {/* --- CAMBIO AQUÍ: Campo 'name' en lugar de 'first_name' y 'last_name' --- */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre(s) y Apellido(s)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono *</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="Ej. 6671234567"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* --- CAMBIO AQUÍ: Campo 'email' eliminado --- */}

            {/* --- CAMBIO AQUÍ: Campo 'instagram' ahora es 'instagram_link' --- */}
            <FormField
              control={form.control}
              name="instagram_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        @
                      </span>
                      <Input
                        placeholder="usuario.de.instagram"
                        className="pl-7"
                        {...field}
                        value={field.value || ''} // Manejar valor nulo
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* --- CAMBIO AQUÍ: Campo 'tags' eliminado --- */}
            
            {/* Puedes agregar aquí los otros campos del schema si lo deseas (birthday, notes, etc.) */}

          </div>
          <FormDescription>
            Los campos marcados con * son obligatorios.
          </FormDescription>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {React.cloneElement(buttonIcon, {
                className: `mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`,
              })}
              {buttonLabel}
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
}  