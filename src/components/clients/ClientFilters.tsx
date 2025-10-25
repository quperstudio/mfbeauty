import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Filter, ChevronDown, Tag, X } from 'lucide-react';
import { ClientFilterType, ClientTag } from '../../types/database';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ClientFiltersProps {
  activeFilter: ClientFilterType;
  onFilterChange: (filter: ClientFilterType) => void;
  counts: {
    all: number;
    with_visits: number;
    with_sales: number;
    referred: number;
  };
  availableTags: ClientTag[];
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

export default function ClientFilters({ activeFilter, onFilterChange, counts, availableTags, selectedTagIds, onTagsChange }: ClientFiltersProps) {
  const filters = [
    { value: 'all' as const, label: 'Todos', count: counts.all },
    { value: 'with_visits' as const, label: 'Con Visitas', count: counts.with_visits },
    { value: 'with_sales' as const, label: 'Con Ventas', count: counts.with_sales },
    { value: 'referred' as const, label: 'Referidos', count: counts.referred },
  ];

  const buttonText = 'Filtrar por';

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTagIds.filter(id => id !== tagId));
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 w-auto sm:w-[200px]">
            <Filter className="h-4 w-4" />
            <span className="truncate">{buttonText}</span>
            <ChevronDown className="h-4 w-4 ml-auto -mr-1" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[200px]">
          {filters.map((filter) => (
            <DropdownMenuItem
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <span>{filter.label}</span>
                  {activeFilter === filter.value && <Check className="h-4 w-4 ml-2 text-primary" />}
                </div>

                <span className="ml-4 px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                  {filter.count}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {availableTags.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Tag className="h-4 w-4" />
              Etiquetas
              {selectedTagIds.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {selectedTagIds.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Filtrar por etiquetas</h4>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {availableTags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={selectedTagIds.includes(tag.id)}
                        onCheckedChange={() => handleToggleTag(tag.id)}
                      />
                      <label
                        htmlFor={`tag-${tag.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {tag.name}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {selectedTagIds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {availableTags
            .filter(tag => selectedTagIds.includes(tag.id))
            .map((tag) => (
              <Badge key={tag.id} variant="outline" className="gap-1">
                {tag.name}
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
        </div>
      )}
    </div>
  );
}