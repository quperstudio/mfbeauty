import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Check, Filter, ChevronDown } from 'lucide-react';
import { ClientFilterType } from '../../types/database';

interface ClientFiltersProps {
  activeFilter: ClientFilterType;
  onFilterChange: (filter: ClientFilterType) => void;
  counts: {
    all: number;
    with_visits: number;
    with_sales: number;
    referred: number;
  };
}

export default function ClientFilters({ activeFilter, onFilterChange, counts }: ClientFiltersProps) {
  const filters = [
    { value: 'all' as const, label: 'Todos', count: counts.all },
    { value: 'with_visits' as const, label: 'Con Visitas', count: counts.with_visits },
    { value: 'with_sales' as const, label: 'Con Ventas', count: counts.with_sales },
    { value: 'referred' as const, label: 'Referidos', count: counts.referred },
  ];

  // El texto del botón siempre será "Filtrar por" (el placeholder)
  const buttonText = 'Filtrar por';

  return (
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
  );
}