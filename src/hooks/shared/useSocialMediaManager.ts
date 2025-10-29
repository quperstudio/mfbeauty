// src/hooks/shared/useSocialMediaManager.ts

import { useState, useMemo, useCallback, useEffect } from 'react'; 
import { SocialMedia, SocialMediaType } from '../../types/database';
import { SOCIAL_TYPE_OPTIONS, SOCIAL_MEDIA_LABELS } from '../../lib/constants';
import { cleanSocialMediaInput } from '../../lib/formats';

export interface UseSocialMediaManagerProps {
  // list era 'initialList' y era opcional
  list: SocialMedia[]; 
  // Se añade onChange
  onChange: (list: SocialMedia[]) => void; 
  phoneValue?: string;
  onSyncWhatsAppWithPhone?: boolean;
}

export interface UseSocialMediaManagerReturn {
  socialMediaList: SocialMedia[]; // Este será ahora un valor derivado
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

// ... (la función getNextAvailableType se mantiene igual) ...

const getInitialType = getNextAvailableType;

export function useSocialMediaManager({
  list, // Renombrado de initialList
  onChange, // Nueva prop
  phoneValue = '',
  onSyncWhatsAppWithPhone = false,
}: UseSocialMediaManagerProps): UseSocialMediaManagerReturn {

  // 1. ELIMINAR el estado interno
  // const [socialMediaList, setSocialMediaList] = useState<SocialMedia[]>(initialList);
   
  // 2. Usar la 'list' (prop) para el tipo inicial
  const [newSocialMediaType, setNewSocialMediaType] = useState<SocialMediaType>(() => 
    getInitialType(list)
  );
  
  const [newSocialMediaLink, setNewSocialMediaLink] = useState<string>('');
  const [socialMediaInputError, setSocialMediaInputError] = useState<string>('');

  // 3. ELIMINAR el useEffect de sincronización
  /*
  useEffect(() => {
    setSocialMediaList(initialList);
    setNewSocialMediaType(getInitialType(initialList));
    setNewSocialMediaLink('');
  }, [initialList]);
  */

  // 4. Actualizar el 'useMemo' para que dependa de 'list' (la prop)
  const socialMediaOptions = useMemo(() => {
    const existingTypes = new Set(list.map(sm => sm.type));
    return SOCIAL_TYPE_OPTIONS.filter(opt => !existingTypes.has(opt.value));
  }, [list]); // Depende de 'list'

  useEffect(() => {
    if (onSyncWhatsAppWithPhone && phoneValue) {
      const whatsappExists = list.some(sm => sm.type === 'whatsapp'); // Usa 'list'
      if (newSocialMediaType === 'whatsapp' && !whatsappExists) {
        setNewSocialMediaLink(phoneValue);
      }
    }
  }, [phoneValue, newSocialMediaType, list, onSyncWhatsAppWithPhone]); // Usa 'list'

  const handleAddSocialMedia = useCallback((): boolean => {
    // ... (validaciones se mantienen igual) ...

    const exists = list.some(sm => sm.type === newSocialMediaType); // Usa 'list'
    if (exists) {
      // ...
      return false;
    }

    const cleanedLink = cleanSocialMediaInput(newSocialMediaType, newSocialMediaLink.trim());
    const updatedList = [...list, { type: newSocialMediaType, link: cleanedLink }]; // Usa 'list'
    
    // 5. Llamar a 'onChange' en lugar de 'setSocialMediaList'
    onChange(updatedList); 
    
    const nextDefaultType = getInitialType(updatedList);
    setNewSocialMediaType(nextDefaultType);
    setNewSocialMediaLink('');
    setSocialMediaInputError('');
    return true;
  }, [newSocialMediaLink, newSocialMediaType, list, onChange]); // Añadir 'list' y 'onChange'

  const handleRemoveSocialMedia = useCallback((typeToRemove: SocialMediaType) => {
    const updatedList = list.filter(sm => sm.type !== typeToRemove); // Usa 'list'
    
    // 6. Llamar a 'onChange' en lugar de 'setSocialMediaList'
    onChange(updatedList); 

    const nextDefaultType = getInitialType(updatedList);
    setNewSocialMediaType(nextDefaultType);
    setNewSocialMediaLink('');
    
  }, [list, onChange]); // Añadir 'list' y 'onChange'

  const clearInputError = useCallback(() => {
    setSocialMediaInputError('');
  }, []);

  const resetList = useCallback((newList: SocialMedia[]) => {
    // 7. Llamar a 'onChange' en lugar de 'setSocialMediaList'
    onChange(newList); 

    const nextDefaultType = getInitialType(newList);
    setNewSocialMediaType(nextDefaultType);
    setNewSocialMediaLink('');
    setSocialMediaInputError('');
  }, [onChange]); // Añadir 'onChange'

  return {
    socialMediaList: list, // 8. Devolver la prop 'list' directamente
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