import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Filter, ChevronDown } from 'lucide-react';
import { ClientFilterType, ClientTag } from '../../types/database';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// PROPS
// -----
interface ClientFiltersProps {
  activeFilter: ClientFilterType;
  onFilterChange: (filter: ClientFilterType) => void;
  counts: { all: number; with_visits: number; with_sales: number; referred: number; };
  availableTags: ClientTag[];
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

// COMPONENTE PRINCIPAL
// --------------------
export default function ClientFilters({ activeFilter, onFilterChange, counts, availableTags, selectedTagIds, onTagsChange }: ClientFiltersProps) {
  // DEFINICIÓN DE FILTROS BÁSICOS
  const filters = [
    { value: 'all' as const, label: 'Todos', count: counts.all },
    { value: 'with_visits' as const, label: 'Con Visitas', count: counts.with_visits },
    { value: 'with_sales' as const, label: 'Con Ventas', count: counts.with_sales },
    { value: 'referred' as const, label: 'Referidos', count: counts.referred },
  ];

  // MANEJADOR DE CAMBIO DE ETIQUETAS
  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  // CONTEO DE FILTROS ACTIVOS (1 por filtro de estado, N por tags)
  const activeFilterCount = (activeFilter !== 'all' ? 1 : 0) + selectedTagIds.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 w-auto">
          <Filter className="h-4 w-4" />
          <span>Filtrar por</span>
          {activeFilterCount > 0 ? (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {activeFilterCount}
            </Badge>
          ) : (
            <ChevronDown className="h-4 w-4 opacity-70" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-4 max-w-60">
        <div className="space-y-4 min-w-[200px]">
          
          {/* SECCIÓN 1: FILTROS DE ESTADO */}
          <div>
            <h4 className="font-medium text-sm mb-2 px-2">Estado</h4>
            <div className="space-y-1">
              {filters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={activeFilter === filter.value ? "secondary" : "ghost"}
                  onClick={() => onFilterChange(filter.value)}
                  className="w-full justify-between cursor-pointer"
                  size="sm"
                >
                  <div className="flex items-center gap-2">
                    {activeFilter === filter.value && <Check className="h-4 w-4" />}
                    <span>{filter.label}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                    {filter.count}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* SECCIÓN 2: FILTROS DE ETIQUETAS */}
          {availableTags.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-sm mb-2 px-2">Etiquetas</h4>
                <ScrollArea className="max-h-60 px-2">
                  <div className="space-y-2 pb-2">
                    {availableTags.map((tag) => (
                      <div key={tag.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={selectedTagIds.includes(tag.id)}
                          onCheckedChange={() => handleToggleTag(tag.id)}
                        />
                        <label
                          htmlFor={`tag-${tag.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >{tag.name}</label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}