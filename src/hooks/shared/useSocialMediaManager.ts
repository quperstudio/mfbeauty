import { useState, useMemo, useCallback, useEffect } from 'react'; 
import { SocialMedia, SocialMediaType } from '../../types/database';
import { SOCIAL_TYPE_OPTIONS, SOCIAL_MEDIA_LABELS } from '../../lib/constants';
import { cleanSocialMediaInput } from '../../lib/formats';

export interface UseSocialMediaManagerProps {
  // Ahora toma la lista actual como 'list'
  list: SocialMedia[]; 
  // Ahora requiere la función para actualizar el estado del padre
  onChange: (list: SocialMedia[]) => void; 
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

const getNextAvailableType = (list: SocialMedia[]): SocialMediaType => {
  const existingTypes = new Set(list.map(sm => sm.type));
  const availableOptions = SOCIAL_TYPE_OPTIONS.filter(opt => !existingTypes.has(opt.value));
  
  return availableOptions.length > 0 ? availableOptions[0].value : 'whatsapp'; 
};

export function useSocialMediaManager({
  list, // Lista controlada desde el padre
  onChange, // Función de actualización del padre
  phoneValue = '',
  onSyncWhatsAppWithPhone = false,
}: UseSocialMediaManagerProps): UseSocialMediaManagerReturn {

  // ELIMINADO: const [socialMediaList, setSocialMediaList] = useState<SocialMedia[]>(initialList);
   
  // Inicializa el tipo disponible basado en la lista (prop)
  const [newSocialMediaType, setNewSocialMediaType] = useState<SocialMediaType>(() => 
    getInitialType(list)
  );
  
  const [newSocialMediaLink, setNewSocialMediaLink] = useState<string>('');
  const [socialMediaInputError, setSocialMediaInputError] = useState<string>('');

  // Sincroniza el Select de tipo de red social cuando la 'list' (prop) cambia
  useEffect(() => {
    setNewSocialMediaType(getInitialType(list));
    setNewSocialMediaLink('');
    // ELIMINADO: No hay necesidad de llamar a setSocialMediaList, ya que 'list' es la fuente de verdad.
  }, [list]);

  const socialMediaOptions = useMemo(() => {
    // Usa la prop 'list' directamente
    const existingTypes = new Set(list.map(sm => sm.type));
    return SOCIAL_TYPE_OPTIONS.filter(opt => !existingTypes.has(opt.value));
  }, [list]);

  useEffect(() => {
    if (onSyncWhatsAppWithPhone && phoneValue) {
      // Usa la prop 'list' directamente
      const whatsappExists = list.some(sm => sm.type === 'whatsapp');
      if (newSocialMediaType === 'whatsapp' && !whatsappExists) {
        setNewSocialMediaLink(phoneValue);
      }
    }
  }, [phoneValue, newSocialMediaType, list, onSyncWhatsAppWithPhone]);

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
    
    // CAMBIO CLAVE: Llama a onChange para actualizar el estado del padre
    onChange(updatedList);
    
    const nextDefaultType = getInitialType(updatedList);
    setNewSocialMediaType(nextDefaultType);

    setNewSocialMediaLink('');
    setSocialMediaInputError('');
    return true;
  }, [newSocialMediaLink, newSocialMediaType, list, onChange]);

  const handleRemoveSocialMedia = useCallback((typeToRemove: SocialMediaType) => {
    const updatedList = list.filter(sm => sm.type !== typeToRemove);
    
    // CAMBIO CLAVE: Llama a onChange para actualizar el estado del padre
    onChange(updatedList);

    const nextDefaultType = getInitialType(updatedList);
    setNewSocialMediaType(nextDefaultType);
    setNewSocialMediaLink('');
    
  }, [list, onChange]);

  const clearInputError = useCallback(() => {
    setSocialMediaInputError('');
  }, []);

  const resetList = useCallback((newList: SocialMedia[]) => {
    // Llama a onChange para actualizar el estado del padre
    onChange(newList);

    const nextDefaultType = getInitialType(newList);
    
    setNewSocialMediaType(nextDefaultType);
    setNewSocialMediaLink('');
    setSocialMediaInputError('');
  }, [onChange]);

  return {
    socialMediaList: list, // Devuelve la prop 'list' como la lista actual
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

const getInitialType = getNextAvailableType;