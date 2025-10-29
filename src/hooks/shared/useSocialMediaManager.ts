import { useState, useMemo, useCallback, useEffect } from 'react'; 
import { SocialMedia, SocialMediaType } from '../../types/database';
import { SOCIAL_TYPE_OPTIONS, SOCIAL_MEDIA_LABELS } from '../../lib/constants';
import { cleanSocialMediaInput } from '../../lib/formats';

export interface UseSocialMediaManagerProps {
  initialList?: SocialMedia[];
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

// 1. Creamos una función helper para calcular el *siguiente* tipo disponible basándonos en una lista.
const getNextAvailableType = (list: SocialMedia[]): SocialMediaType => {
  const existingTypes = new Set(list.map(sm => sm.type));
  const availableOptions = SOCIAL_TYPE_OPTIONS.filter(opt => !existingTypes.has(opt.value));
  
  // Devuelve la primera opción disponible, o 'whatsapp' como fallback si todo está lleno
  return availableOptions.length > 0 ? availableOptions[0].value : 'whatsapp'; 
};

export function useSocialMediaManager({
  initialList = [],
  phoneValue = '',
  onSyncWhatsAppWithPhone = false,
}: UseSocialMediaManagerProps = {}): UseSocialMediaManagerReturn {

  const [socialMediaList, setSocialMediaList] = useState<SocialMedia[]>(initialList);
   
  // 2. Usamos el helper para inicializar el estado del Select.  Usamos un inicializador de función en useState para que esto solo se ejecute una vez.
  const [newSocialMediaType, setNewSocialMediaType] = useState<SocialMediaType>(() => 
    getInitialType(initialList)
  );
  
  const [newSocialMediaLink, setNewSocialMediaLink] = useState<string>('');
  const [socialMediaInputError, setSocialMediaInputError] = useState<string>('');

  useEffect(() => {
    setSocialMediaList(initialList);

    // 3. Cuando la lista inicial cambia (p.ej. al editar), también debemos re-calcular el tipo por defecto para el Select.
    setNewSocialMediaType(getInitialType(initialList));
    setNewSocialMediaLink('');
    
  }, [initialList]);

  const socialMediaOptions = useMemo(() => {
    const existingTypes = new Set(socialMediaList.map(sm => sm.type));
    return SOCIAL_TYPE_OPTIONS.filter(opt => !existingTypes.has(opt.value));
  }, [socialMediaList]);

  useEffect(() => {
    if (onSyncWhatsAppWithPhone && phoneValue) {
      const whatsappExists = socialMediaList.some(sm => sm.type === 'whatsapp');
      if (newSocialMediaType === 'whatsapp' && !whatsappExists) {
        setNewSocialMediaLink(phoneValue);
      }
    }
  }, [phoneValue, newSocialMediaType, socialMediaList, onSyncWhatsAppWithPhone]);

  const handleAddSocialMedia = useCallback((): boolean => {
    if (!newSocialMediaLink.trim()) {
      setSocialMediaInputError('El enlace/usuario no puede estar vacío.');
      return false;
    }

    const exists = socialMediaList.some(sm => sm.type === newSocialMediaType);
    if (exists) {
      setSocialMediaInputError(`Ya existe una red social de tipo ${SOCIAL_MEDIA_LABELS[newSocialMediaType]}.`);
      return false;
    }

    const cleanedLink = cleanSocialMediaInput(newSocialMediaType, newSocialMediaLink.trim());
    const updatedList = [...socialMediaList, { type: newSocialMediaType, link: cleanedLink }];
    setSocialMediaList(updatedList);
    
    // 4. Usamos el helper aquí también para mantener la lógica consistente.
    const nextDefaultType = getInitialType(updatedList);
    setNewSocialMediaType(nextDefaultType);

    setNewSocialMediaLink('');
    setSocialMediaInputError('');
    return true;
  }, [newSocialMediaLink, newSocialMediaType, socialMediaList]);

  const handleRemoveSocialMedia = useCallback((typeToRemove: SocialMediaType) => {
    const updatedList = socialMediaList.filter(sm => sm.type !== typeToRemove);
    setSocialMediaList(updatedList);

    // 5. Usamos el helper aquí también.
    const nextDefaultType = getInitialType(updatedList);
    setNewSocialMediaType(nextDefaultType);
    setNewSocialMediaLink('');
    
  }, [socialMediaList]);

  const clearInputError = useCallback(() => {
    setSocialMediaInputError('');
  }, []);

  const resetList = useCallback((list: SocialMedia[]) => {
    setSocialMediaList(list);

    // 6. Y finalmente, usamos el helper aquí.
    const nextDefaultType = getInitialType(list);
    
    setNewSocialMediaType(nextDefaultType);
    setNewSocialMediaLink('');
    setSocialMediaInputError('');
  }, []);

  return {
    socialMediaList,
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

// Renombramos la función para que coincida con los puntos 2-6
const getInitialType = getNextAvailableType;