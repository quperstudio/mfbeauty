import React, { useState, useRef } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { ScrollArea } from './scroll-area';
import { ClientTag } from '../../types/database';
import { cn } from '@/lib/utils';
// Importaciones de Shadcn UI para el Popover
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TagInputProps {
  label?: string;
  placeholder?: string;
  selectedTags: ClientTag[];
  availableTags: ClientTag[];
  onAddTag: (tagName: string) => Promise<void>;
  onRemoveTag: (tagId: string) => void;
  onDeleteTagGlobally?: (tagId: string) => void;
  maxTags?: number;
  disabled?: boolean;
  error?: string;
  canDeleteGlobally?: boolean;
}

export default function TagInput({
  label = 'Etiquetas',
  placeholder = 'Escribe y presiona Enter para agregar...',
  selectedTags,
  availableTags,
  onAddTag,
  onRemoveTag,
  onDeleteTagGlobally,
  maxTags = 5,
  disabled = false,
  error,
  canDeleteGlobally = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  // Se mantiene la variable, pero ahora se usa en Popover 'open'
  const [isPopoverOpen, setIsPopoverOpen] = useState(false); 
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Se eliminó dropdownRef y el useEffect asociado

  const selectedTagIds = new Set(selectedTags.map(tag => tag.id));

  const filteredAvailableTags = availableTags.filter(tag =>
    !selectedTagIds.has(tag.id) &&
    tag.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Se elimina el useEffect para manejar clics fuera, Popover se encarga.

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    // Abrir Popover si hay texto o para mostrar sugerencias
    if (value.length > 0) {
      setIsPopoverOpen(true);
    } else if (filteredAvailableTags.length > 0) {
      setIsPopoverOpen(true);
    } else {
      // Cierra si se borra el texto y no hay sugerencias visibles
      setIsPopoverOpen(false); 
    }
  };

  const handleInputFocus = () => {
    // Muestra el Popover al enfocar, si no se ha alcanzado el límite
    if (!reachedMaxTags && filteredAvailableTags.length > 0) { 
      setIsPopoverOpen(true);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      await handleAddTag(inputValue.trim());
    }
  };

  const handleAddTag = async (tagName: string) => {
    if (selectedTags.length >= maxTags) {
      return;
    }

    setLoading(true);
    try {
      await onAddTag(tagName);
      setInputValue('');
      setIsPopoverOpen(false); // Cierra Popover al agregar
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExistingTag = async (tag: ClientTag) => {
    await handleAddTag(tag.name);
  };

  const reachedMaxTags = selectedTags.length >= maxTags;

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium text-muted-foreground">
          {label} {selectedTags.length > 0 && `(${selectedTags.length}/${maxTags})`}
        </Label>
      )}

      {/* Las etiquetas seleccionadas se muestran aquí, encima del input */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1 pb-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="pl-2 pr-1 py-1 gap-1 text-sm"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => onRemoveTag(tag.id)}
                disabled={disabled}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors disabled:opacity-50"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Popover open={isPopoverOpen && filteredAvailableTags.length > 0} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={handleKeyDown}
                placeholder={reachedMaxTags ? `Máximo ${maxTags} etiquetas alcanzado` : placeholder}
                disabled={disabled || loading || reachedMaxTags}
                error={error}
                className={cn(
                  "pr-10",
                  reachedMaxTags && "opacity-50 cursor-not-allowed"
                )}
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                </div>
              )}
            </div>
          </PopoverTrigger>
        
          {/* El contenido del Dropdown ahora es PopoverContent */}
          <PopoverContent 
            className="w-[var(--radix-popover-trigger-width)] p-1 max-h-60 overflow-hidden" 
            align="start"
            sideOffset={4}
          >
            <ScrollArea className="max-h-60">
              <div className="p-1">
                {filteredAvailableTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer group"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectExistingTag(tag)}
                      className="flex-1 text-left text-sm text-foreground"
                    >
                      {tag.name}
                    </button>
                    {canDeleteGlobally && onDeleteTagGlobally && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTagGlobally(tag.id);
                        }}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {reachedMaxTags && (
          <p className="text-xs text-muted-foreground">
            Has alcanzado el límite máximo de {maxTags} etiquetas
          </p>
        )}
      </div>
    </div>
  );
}