import { useState, useMemo, useCallback, useEffect } from 'react'; 
import { SocialMedia, SocialMediaType } from '../../types/database';
import { SOCIAL_TYPE_OPTIONS, SOCIAL_MEDIA_LABELS } from '../../lib/constants';
import { cleanSocialMediaInput } from '../../lib/formats';

// TIPOS DE DATOS BASE
// -------------------
export interface UseSocialMediaManagerProps {
  list: SocialMedia[];  // Lista de redes sociales activas
  onChange: (list: SocialMedia[]) => void;  // Callback al cambiar la lista
  phoneValue?: string;
  onSyncWhatsAppWithPhone?: boolean;
}

export interface UseSocialMediaManagerReturn {
  socialMediaList: SocialMedia[];
  newSocialMediaType: SocialMediaType;
  newSocialMediaLink: string;
  socialMediaInputError: string;
  socialMediaOptions: Array<{ value: SocialMediaType; label: string }>;
  setNewSocialMediaType: (type: SocialMediaType) => void;
  setNewSocialMediaLink: (link: string) => void;
  handleAddSocialMedia: () => boolean;
  handleRemoveSocialMedia: (type: SocialMediaType) => void;
  clearInputError: () => void;
  resetList: (list: SocialMedia[]) => void;
}

// FUNCIÓN DE AYUDA
// ----------------
// Determina el siguiente tipo de red social que no está en uso
const getNextAvailableType = (list: SocialMedia[]): SocialMediaType => {
  const existingTypes = new Set(list.map(sm => sm.type));
  const availableOptions = SOCIAL_TYPE_OPTIONS.filter(opt => !existingTypes.has(opt.value));
  return availableOptions.length > 0 ? availableOptions[0].value : 'whatsapp'; 
};
const getInitialType = getNextAvailableType;

// HOOK PRINCIPAL: GESTOR DE REDES SOCIALES
// ----------------------------------------
export function useSocialMediaManager({
  list, 
  onChange, 
  phoneValue = '',
  onSyncWhatsAppWithPhone = false,
}: UseSocialMediaManagerProps): UseSocialMediaManagerReturn {
   
  // ESTADOS LOCALES
  const [newSocialMediaType, setNewSocialMediaType] = useState<SocialMediaType>(() => getInitialType(list));
  const [newSocialMediaLink, setNewSocialMediaLink] = useState<string>('');
  const [socialMediaInputError, setSocialMediaInputError] = useState<string>('');

  // EFECTO: SINCRONIZAR ESTADO AL CAMBIAR LA LISTA (PROP)
  useEffect(() => {
    setNewSocialMediaType(getInitialType(list));
    setNewSocialMediaLink('');
  }, [list]);

  // MEMO: OPCIONES DISPONIBLES
  // Filtra los tipos de redes que ya están en la lista
  const socialMediaOptions = useMemo(() => {
    const existingTypes = new Set(list.map(sm => sm.type));
    return SOCIAL_TYPE_OPTIONS.filter(opt => !existingTypes.has(opt.value));
  }, [list]);

  // EFECTO: SINCRONIZAR WHATSAPP CON TELÉFONO
  useEffect(() => {
    if (onSyncWhatsAppWithPhone && phoneValue) {
      const whatsappExists = list.some(sm => sm.type === 'whatsapp');
      if (newSocialMediaType === 'whatsapp' && !whatsappExists) {
        setNewSocialMediaLink(phoneValue);
      }
    }
  }, [phoneValue, newSocialMediaType, list, onSyncWhatsAppWithPhone]);

  // HANDLER: AGREGAR RED SOCIAL
  const handleAddSocialMedia = useCallback((): boolean => {
    if (!newSocialMediaLink.trim()) {
      setSocialMediaInputError('El enlace/usuario no puede estar vacío.');
      return false;
    }

    const exists = list.some(sm => sm.type === newSocialMediaType);
    if (exists) {
      setSocialMediaInputError(`Ya existe una red social de tipo ${SOCIAL_MEDIA_LABELS[newSocialMediaType]}.`);
      return false;
    }

    const cleanedLink = cleanSocialMediaInput(newSocialMediaType, newSocialMediaLink.trim());
    const updatedList = [...list, { type: newSocialMediaType, link: cleanedLink }];
    
    onChange(updatedList);
    
    const nextDefaultType = getInitialType(updatedList);
    setNewSocialMediaType(nextDefaultType);
    setNewSocialMediaLink('');
    setSocialMediaInputError('');
    return true;
  }, [newSocialMediaLink, newSocialMediaType, list, onChange]);

  // HANDLER: ELIMINAR RED SOCIAL
  const handleRemoveSocialMedia = useCallback((typeToRemove: SocialMediaType) => {
    const updatedList = list.filter(sm => sm.type !== typeToRemove);
    
    onChange(updatedList);

    const nextDefaultType = getInitialType(updatedList);
    setNewSocialMediaType(nextDefaultType);
    setNewSocialMediaLink('');
    
  }, [list, onChange]);

  // HANDLER: LIMPIAR ERRORES
  const clearInputError = useCallback(() => {
    setSocialMediaInputError('');
  }, []);

  // HANDLER: REINICIAR LISTA
  const resetList = useCallback((newList: SocialMedia[]) => {
    onChange(newList);

    const nextDefaultType = getInitialType(newList);
    
    setNewSocialMediaType(nextDefaultType);
    setNewSocialMediaLink('');
    setSocialMediaInputError('');
  }, [onChange]);

  // RETORNO DEL HOOK
  // -----------------
  return {
    socialMediaList: list,
    newSocialMediaType,
    newSocialMediaLink,
    socialMediaInputError,
    socialMediaOptions,
    setNewSocialMediaType,
    setNewSocialMediaLink,
    handleAddSocialMedia,
    handleRemoveSocialMedia,
    clearInputError,
    resetList,
  };
}