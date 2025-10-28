import React, { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSocialMediaIcon } from '@/lib/formats';
import { SocialMedia, SocialMediaType } from '../../types/database';
import { useSocialMediaManager } from '../../hooks/shared/useSocialMediaManager';
import { useToast } from '../../hooks/use-toast';

export interface SocialMediaManagerProps {
  initialValues?: SocialMedia[];
  phoneValue?: string;
  syncWhatsAppWithPhone?: boolean;
  onChange?: (socialMediaList: SocialMedia[]) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export default function SocialMediaManager({
  initialValues = [],
  phoneValue = '',
  syncWhatsAppWithPhone = false,
  onChange,
  disabled = false,
  label = 'Redes sociales',
  className,
}: SocialMediaManagerProps) {
  const { toast } = useToast();

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
    initialList: initialValues,
    phoneValue,
    onSyncWhatsAppWithPhone: syncWhatsAppWithPhone,
  });

  useEffect(() => {
    if (onChange) {
      onChange(socialMediaList);
    }
  }, [socialMediaList, onChange]);

  useEffect(() => {
    resetList(initialValues);
  }, [initialValues, resetList]);

  const handleAdd = () => {
    const success = handleAddSocialMedia();
    if (!success && socialMediaInputError) {
      toast({
        title: 'Advertencia',
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

      <div className="space-y-2">
        {socialMediaList.map((sm) => (
          <div
            key={sm.type}
            className="group flex items-center justify-between p-2 bg-secondary/30 text-secondary-foreground rounded-lg"
          >
            <div className="flex items-center gap-2 pl-2">
              {React.createElement(getSocialMediaIcon(sm.type)!, { className: 'w-4 h-4' })}
              <span className="text-sm">{sm.link}</span>
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