import React from 'react';
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

// PROPS
// -----
export interface SocialMediaManagerProps {
  value: SocialMedia[];
  onChange: (socialMediaList: SocialMedia[]) => void;
  phoneValue?: string;
  syncWhatsAppWithPhone?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}

// COMPONENTE PRINCIPAL
// --------------------
export default function SocialMediaManager({
  value,
  onChange,
  phoneValue = '',
  syncWhatsAppWithPhone = false,
  disabled = false,
  label = 'Redes sociales',
  className,
}: SocialMediaManagerProps) {

  const manager = useSocialMediaManager({
    list: value,
    onChange: onChange,
    phoneValue,
    onSyncWhatsAppWithPhone: syncWhatsAppWithPhone,
  });

  const handleAdd = () => {
    const success = manager.handleAddSocialMedia();
    if (!success && manager.socialMediaInputError) {
      toast.warning('Advertencia', { 
        description: manager.socialMediaInputError,
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
    manager.setNewSocialMediaType(value as SocialMediaType);
    manager.setNewSocialMediaLink('');
    manager.clearInputError();
  };

return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
       
      {/* Entrada para agregar nueva red social */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 items-end">
        <Select
          value={manager.newSocialMediaType}
          onValueChange={handleTypeChange}
          disabled={disabled || manager.socialMediaOptions.length === 0}
          name="newSocialMediaType"
        >
          <SelectTrigger className={cn(manager.socialMediaInputError && 'border-destructive')}>
            <SelectValue placeholder={manager.socialMediaOptions.length === 0 ? 'Todas añadidas' : 'Selecciona Tipo'} />
          </SelectTrigger>
          <SelectContent>
            {manager.socialMediaOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={manager.newSocialMediaLink}
          onChange={(e) => manager.setNewSocialMediaLink(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={manager.newSocialMediaType === 'whatsapp' ? 'Número de teléfono' : 'Usuario o enlace'}
          disabled={disabled || manager.socialMediaOptions.length === 0}
          className={cn(manager.socialMediaInputError && 'border-destructive')}
        />
      </div>

      {/* Mensaje de error */}
      {manager.socialMediaInputError && (
        <p className="text-sm text-destructive">{manager.socialMediaInputError}</p>
      )}

      {/* Lista de redes sociales añadidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
        {manager.socialMediaList.map((sm) => (
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
              onClick={() => manager.handleRemoveSocialMedia(sm.type)}
              disabled={disabled}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}