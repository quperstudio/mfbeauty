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

export function useSocialMediaManager({
  initialList = [],
  phoneValue = '',
  onSyncWhatsAppWithPhone = false,
}: UseSocialMediaManagerProps = {}): UseSocialMediaManagerReturn {
  const [socialMediaList, setSocialMediaList] = useState<SocialMedia[]>(initialList);
  const [newSocialMediaType, setNewSocialMediaType] = useState<SocialMediaType>('whatsapp');
  const [newSocialMediaLink, setNewSocialMediaLink] = useState<string>('');
  const [socialMediaInputError, setSocialMediaInputError] = useState<string>('');

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

    const existingTypes = new Set(updatedList.map(sm => sm.type));
    const availableOptions = SOCIAL_TYPE_OPTIONS.filter(opt => !existingTypes.has(opt.value));

    // Seleccionar la siguiente opción disponible
    const nextDefaultType = availableOptions.length > 0 ? availableOptions[0].value : 'whatsapp';
    setNewSocialMediaType(nextDefaultType);

    setNewSocialMediaLink('');
    setSocialMediaInputError('');
    return true;
  }, [newSocialMediaLink, newSocialMediaType, socialMediaList]);

  const handleRemoveSocialMedia = useCallback((typeToRemove: SocialMediaType) => {
    setSocialMediaList(prev => prev.filter(sm => sm.type !== typeToRemove));

    const existingTypes = new Set(socialMediaList.filter(sm => sm.type !== typeToRemove).map(sm => sm.type));
    const availableOptions = SOCIAL_TYPE_OPTIONS.filter(opt => !existingTypes.has(opt.value));

    if (availableOptions.length > 0) {
      setNewSocialMediaType(availableOptions[0].value);
      setNewSocialMediaLink('');
    } else {
      setNewSocialMediaLink('');
    }
  }, [socialMediaList]);

  const clearInputError = useCallback(() => {
    setSocialMediaInputError('');
  }, []);

  const resetList = useCallback((list: SocialMedia[]) => {
    setSocialMediaList(list);

    // FIX para que el Select muestre la primera opción disponible (soluciona errores 1, 2 y mejora UX 2)
    const existingTypes = new Set(list.map(sm => sm.type));
    const availableOptions = SOCIAL_TYPE_OPTIONS.filter(opt => !existingTypes.has(opt.value));

    // Seleccionar la primera opción disponible. Usar 'whatsapp' como valor por defecto/fallback
    const nextDefaultType = availableOptions.length > 0 ? availableOptions[0].value : 'whatsapp';
    
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