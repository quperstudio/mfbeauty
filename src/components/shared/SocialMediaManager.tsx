import React, { useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSocialMediaIcon } from '@/lib/formats';
import { SocialMedia, SocialMediaType } from '../../types/database';
import { useSocialMediaManager } from '../../hooks/shared/useSocialMediaManager';
import { toast } from 'sonner'; 

export interface SocialMediaManagerProps {
  // CAMBIO: Usar 'value' en lugar de 'initialValues'
  value: SocialMedia[];
  // CAMBIO: 'onChange' ya no es opcional
  onChange: (socialMediaList: SocialMedia[]) => void;
  phoneValue?: string;
  syncWhatsAppWithPhone?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export default function SocialMediaManager({
  // CAMBIO: Recibir 'value'
  value,
  onChange,
  phoneValue = '',
  syncWhatsAppWithPhone = false,
  disabled = false,
  label = 'Redes sociales',
  className,
}: SocialMediaManagerProps) {

  // ELIMINADO: const isFirstRender = useRef(true);

  const {
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
  } = useSocialMediaManager({
    // CAMBIO CLAVE: Pasar 'value' como 'list' y 'onChange' directamente
    list: value,
    onChange: onChange,
    phoneValue,
    onSyncWhatsAppWithPhone: syncWhatsAppWithPhone,
  });


  // ELIMINADO: Se elimina este useEffect que intentaba sincronizar el estado del padre (lo que causaba el race condition)
  /*
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (onChange) {
      onChange(socialMediaList);
    }
  }, [socialMediaList, onChange]); 
  */

  const handleAdd = () => {
    const success = handleAddSocialMedia();
    if (!success && socialMediaInputError) {
      toast.warning('Advertencia', { 
        description: socialMediaInputError,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleTypeChange = (value: string) => {
    const newType = value as SocialMediaType;
    setNewSocialMediaType(newType);
    setNewSocialMediaLink('');
    clearInputError();
  };

return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 items-end">
        <Select
          value={newSocialMediaType}
          onValueChange={handleTypeChange}
          disabled={disabled || socialMediaOptions.length === 0}
          name="newSocialMediaType"
        >
          <SelectTrigger className={cn(socialMediaInputError && 'border-destructive')}>
            <SelectValue placeholder={socialMediaOptions.length === 0 ? 'Todas añadidas' : 'Selecciona Tipo'} />
          </SelectTrigger>
          <SelectContent>
            {socialMediaOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={newSocialMediaLink}
          onChange={(e) => setNewSocialMediaLink(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={newSocialMediaType === 'whatsapp' ? 'Número de teléfono' : 'Usuario o enlace'}
          disabled={disabled || socialMediaOptions.length === 0}
          error={socialMediaInputError}
        />
      </div>

      {socialMediaInputError && (
        <p className="text-sm text-destructive">{socialMediaInputError}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
        {/* socialMediaList (la prop 'value') es usada para renderizar */}
        {socialMediaList.map((sm) => (
          <div
            key={sm.type}
            className="group flex items-center justify-between p-2 bg-muted/25 text-secondary-foreground rounded-lg"
          >
            <div className="flex items-center gap-2 pl-2">
              {React.createElement(getSocialMediaIcon(sm.type)!, { className: 'w-4 h-4' })}
              <span className="text-sm truncate">{sm.link}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveSocialMedia(sm.type)}
              disabled={disabled}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}