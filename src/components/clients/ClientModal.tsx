import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Client, ClientTag } from '../../types/database';
import { clientSchema, ClientSchemaType } from '../../schemas/client.schema';
import { parsePhoneInput, formatPhoneRealTime, cleanSocialMediaInput, getSocialMediaIcon } from '../../lib/formats';
import { SOCIAL_MEDIA_LABELS, SocialMediaType } from '../../lib/constants';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from "@/lib/utils";
import TagInput from '@/components/ui/TagInput';
import { useTagsQuery, useClientTagsQuery } from '../../hooks/queries/useTags.query';
import { useAuth } from '../../contexts/AuthContext';
import * as clientService from '../../services/client.service';
import { useToast } from "../../hooks/use-toast";

type ClientFormSchema = z.infer<typeof clientFormSchema>;

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
}

export function ClientModal({ isOpen, onClose, client }: ClientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allTagsData, isLoading: isAllTagsLoading } = useTags();
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

  const form = useForm<ClientFormSchema>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      instagram: '',
      tags: [],
    },
  });

  useEffect(() => {
    if (isEditMode && client) {
      form.reset({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        phone: client.phone || '',
        email: client.email || '',
        instagram: client.instagram || '',
        tags: client.tags || [],
      });
    } else {
      form.reset({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        instagram: '',
        tags: [],
      });
    }
  }, [isOpen, isEditMode, client, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleTagAdd = async (tagName: string) => {
    // Intenta crear la etiqueta
    const { data: newTag, error } = await tagService.createTag({ name: tagName });
    if (error) {
      toast({
        title: 'Error al crear etiqueta',
        description:
          'La etiqueta ya existe o hubo un error. Se usará la etiqueta existente.',
        variant: 'destructive',
      });
    } else if (newTag) {
      toast({
        title: 'Etiqueta creada',
        description: `La etiqueta "${newTag.name}" se ha creado con éxito.`,
      });
      // Invalidar la query de tags para que se actualice la lista de sugerencias
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    }
  };

  const onSubmit = (data: ClientFormSchema) => {
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre(s) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre(s) del cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido(s)</FormLabel>
                    <FormControl>
                      <Input placeholder="Apellido(s) del cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="cliente@correo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instagram"
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
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etiquetas</FormLabel>
                  <FormControl>
                    {/* --- AJUSTE IMPLEMENTADO AQUÍ --- */}
                    <TagInput
                      ref={field.ref}
                      placeholder="Escribe para agregar etiquetas..."
                      tags={field.value}
                      setTags={field.onChange}
                      onTagAdd={handleTagAdd}
                      allTags={allTagsData?.map((t) => t.name) || []}
                      isLoading={isAllTagsLoading}
                    />
                    {/* --- FIN DEL AJUSTE --- */}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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