import React, { useState, useRef, useEffect } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { ScrollArea } from './scroll-area';
import { ClientTag } from '../../types/database';
import { cn } from '@/lib/utils';

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedTagIds = new Set(selectedTags.map(tag => tag.id));

  const filteredAvailableTags = availableTags.filter(tag =>
    !selectedTagIds.has(tag.id) &&
    tag.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowDropdown(value.length > 0);
  };

  const handleInputFocus = () => {
    if (inputValue.length > 0) {
      setShowDropdown(true);
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
      setShowDropdown(false);
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

      <div className="space-y-2">
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

          {showDropdown && filteredAvailableTags.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-hidden"
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
            </div>
          )}
        </div>

        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 border border-border rounded-lg bg-muted/30">
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
