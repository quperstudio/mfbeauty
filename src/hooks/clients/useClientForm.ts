import { useState, useEffect, useMemo, useCallback } from 'react';
import { z } from 'zod';
import { format } from 'date-fns';
import { Client, ClientTag, SocialMedia } from '../../types/database';
import { clientSchema, ClientSchemaType } from '../../schemas/client.schema';
import { parsePhoneInput, mapSocialMediaListToFields, mapEntityToSocialMediaList } from '../../lib/formats';
import { useTags, useClientTags } from '../tags/useTags';
import { useClients } from './useClients';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { initialFormData as initialFormDataConstant } from '../../constants/clients.constants';

// TIPOS DE DATOS BASE
// -------------------
type ClientFormDataBase = {
  name: string;
  phone: string;
  birthday: string | null;
  notes: string;
  referrer_id: string;
};

interface UseClientFormParams {
  client?: Client;
  isOpen: boolean;
  onSave: (data: ClientSchemaType, tagIds: string[], clientId?: string) => Promise<{ error: string | null }>;
  onClose: () => void;
  clients: Client[];
}

// HOOK PRINCIPAL: USECLIENTFORM
// -----------------------------
// Hook de formulario para ClientModal.
export function useClientForm({ client, isOpen, onSave, onClose, clients }: UseClientFormParams) {
  // Contextos y Hooks
  const { user } = useAuth();
  const { tags: availableTags, createTag, deleteTag } = useTags();
  const { clientTags } = useClientTags(client?.id || null);

  // ESTADOS LOCALES DEL FORMULARIO
  // ------------------------------
  const [formData, setFormData] = useState<ClientFormDataBase>(initialFormDataConstant);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<ClientTag[]>([]);
  const [socialMediaList, setSocialMediaList] = useState<SocialMedia[]>([]);
  const [initialSocialMediaList, setInitialSocialMediaList] = useState<SocialMedia[]>([]);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);

  // EFECTO: INICIALIZAR FORMULARIO
  // ---------------------------------
  useEffect(() => {
    if (isOpen) {
      if (client) {
        setFormData({
          name: client.name,
          phone: client.phone,
          birthday: client.birthday || null,
          notes: client.notes || '',
          referrer_id: client.referrer_id || '',
        });

        const initialSocialMedia = mapEntityToSocialMediaList(client);
        setSocialMediaList(initialSocialMedia);
        setInitialSocialMediaList(initialSocialMedia);
      } else {
        setFormData(initialFormDataConstant);
        setSocialMediaList([]);
        setInitialSocialMediaList([]);
        setSelectedTags([]);
      }
      setErrors({});
    }
  }, [client, isOpen]);

  // EFECTO: CARGAR TAGS DEL CLIENTE
  useEffect(() => {
    if (isOpen && client) {
      setSelectedTags(clientTags);
    }
  }, [client, clientTags, isOpen]);

  // HANDLERS DE CAMBIO DE INPUTS
  // -----------------------------
  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleBirthdayChange = useCallback((date: Date | null) => {
    if (date) {
      const dateString = format(date, 'yyyy-MM-dd');
      setFormData((prev) => ({ ...prev, birthday: dateString }));
    } else {
      setFormData((prev) => ({ ...prev, birthday: null }));
    }
  }, []);

  // FUNCIÓN DE VALIDACIÓN ZOD
  // -------------------------
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    try {
      const socialMediaLinks = mapSocialMediaListToFields(socialMediaList);
      const dataToValidate = { ...formData, ...socialMediaLinks };
      clientSchema.parse(dataToValidate);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((err) => {
          const field = err.path[0] as string;
          newErrors[field] = err.message;
        });
      }
      setErrors(newErrors);
      return false;
    }
  }, [formData, socialMediaList]);

  // MANEJADOR DE ENVÍO
  // --------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Errores de validación', {
        description: 'Por favor, revisa los campos marcados en rojo para corregir los errores.',
      });
      return;
    }

    // Preparar datos para guardar
    const socialMediaLinks = mapSocialMediaListToFields(socialMediaList);
    const rawData = { ...formData, ...socialMediaLinks };

    const sanitizedData: ClientSchemaType = {
      name: rawData.name.trim(),
      phone: rawData.phone,
      birthday: rawData.birthday?.trim() || null,
      notes: rawData.notes?.trim() || null,
      referrer_id: rawData.referrer_id?.trim() || null,
      whatsapp_link: socialMediaLinks.whatsapp_link?.trim() || null,
      facebook_link: socialMediaLinks.facebook_link?.trim() || null,
      instagram_link: socialMediaLinks.instagram_link?.trim() || null,
      tiktok_link: socialMediaLinks.tiktok_link?.trim() || null,
      created_by_user_id: client ? undefined : user?.id || null, // Solo se agrega al crear
    };

    const tagIds = selectedTags.map((tag) => tag.id);

    // Guardar
    setLoading(true);
    const result = await onSave(sanitizedData, tagIds, client?.id);
    setLoading(false);

    if (result.error) {
      toast.error('Error al guardar el cliente', { description: result.error });
    } else {
      resetModalState();
      onClose();
      toast.success('Operación exitosa', {
        description: `¡Cliente ${client ? 'actualizado' : 'creado'} con éxito!`,
      });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const cleaned = parsePhoneInput(rawValue); // Formatea la entrada del teléfono

    setFormData((prev) => ({ ...prev, phone: cleaned }));

    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: '' }));
    }
  };

  const handleSocialMediaChange = useCallback((updatedList: SocialMedia[]) => {
    setSocialMediaList(updatedList);
  }, []);

  // LÓGICA DE CAMBIOS SIN GUARDAR
  // -----------------------------
  const hasUnsavedChanges = useCallback((): boolean => {
    // Función para normalizar los datos de texto y referencia
    const normalizeFormData = (data: ClientFormDataBase) => ({
      name: data.name.trim(),
      phone: data.phone,
      birthday: data.birthday || null,
      notes: (data.notes || '').trim() || null,
      referrer_id: (data.referrer_id || '').trim() || null,
    });

    const currentNormalized = normalizeFormData(formData);
    const initialNormalized = client
      ? normalizeFormData({
          name: client.name,
          phone: client.phone,
          birthday: client.birthday || null,
          notes: client.notes || '',
          referrer_id: client.referrer_id || '',
        })
      : normalizeFormData(initialFormDataConstant);

    const formChanged = JSON.stringify(currentNormalized) !== JSON.stringify(initialNormalized);

    // Función para normalizar la lista de redes sociales
    const normalizeSocialMedia = (list: SocialMedia[]) =>
      list
        .map((sm) => ({ type: sm.type, link: sm.link.trim() }))
        .sort((a, b) => a.type.localeCompare(b.type));

    const socialMediaChanged =
      JSON.stringify(normalizeSocialMedia(socialMediaList)) !==
      JSON.stringify(normalizeSocialMedia(initialSocialMediaList));

    // Comprobación de cambios en los tags
    const currentTagIds = selectedTags.map((t) => t.id).sort();
    const initialTagIds = client && clientTags.length > 0 ? clientTags.map((t) => t.id).sort() : [];
    const tagsChanged = JSON.stringify(currentTagIds) !== JSON.stringify(initialTagIds);

    return formChanged || socialMediaChanged || tagsChanged;
  }, [formData, socialMediaList, selectedTags, client, initialSocialMediaList, clientTags]);

  const resetModalState = useCallback(() => {
    setFormData(initialFormDataConstant);
    setSocialMediaList([]);
    setInitialSocialMediaList([]);
    setSelectedTags([]);
    setErrors({});
  }, []);

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesDialog(true); 
    } else {
      resetModalState();
      onClose();
    }
  }, [hasUnsavedChanges, onClose, resetModalState]);

  const confirmClose = useCallback(() => {
    setShowUnsavedChangesDialog(false);
    resetModalState();
    onClose();
  }, [onClose, resetModalState]);

  // OPCIONES DE REFERENTE
  // ---------------------
  const referrerOptions = useMemo(() => {
    const options = [
      { value: '__RESET__', label: 'Ninguno' },
      ...clients
        .filter((c) => c.id !== client?.id) // Excluye al cliente actual
        .map((c) => ({ value: c.id, label: c.name })),
    ];
    return options;
  }, [clients, client?.id]);

  // MANEJADORES DE TAGS
  // -------------------
  const onAddTag = async (tagName: string) => {
    const normalizedTagName = tagName.toLowerCase().trim();
    const alreadySelected = selectedTags.some((t) => t.name.toLowerCase() === normalizedTagName);
    if (alreadySelected) return;

    const existingTag = availableTags.find((t) => t.name.toLowerCase() === normalizedTagName);
    let tagToAdd: ClientTag | undefined;

    if (existingTag) {
      tagToAdd = existingTag;
    } else {
      // Crea un nuevo tag si no existe
      const newTag = await createTag({ name: tagName });
      if (!newTag) {
        toast.error("Error al crear la etiqueta");
        return;
      }
      tagToAdd = newTag;
    }

    if (tagToAdd) {
      setSelectedTags((prev) => [...prev, tagToAdd!]);
    }
  };

  const onRemoveTag = (tagId: string) => {
    setSelectedTags((prev) => prev.filter((t) => t.id !== tagId));
  };

  const onDeleteTagGlobally = async (tagId: string) => {
    await deleteTag(tagId);
    setSelectedTags((prev) => prev.filter((t) => t.id !== tagId));
  };

  // RETORNO DEL HOOK
  // -----------------
  return {
    formData,
    errors,
    loading,
    selectedTags,
    socialMediaList,
    showUnsavedChangesDialog,
    availableTags,
    referrerOptions,
    handlers: {
      handleFormChange,
      handlePhoneChange,
      handleBirthdayChange,
      handleSocialMediaChange,
      handleSubmit,
      handleClose,
      confirmClose,
      setShowUnsavedChangesDialog,
      setFormData,
    },
    tagHandlers: {
      onAddTag,
      onRemoveTag,
      onDeleteTagGlobally,
    },
  };
}