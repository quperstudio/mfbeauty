import { Trash2, Copy, Download, UserPlus, X, Loader2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ClientBulkActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onAssignReferrer: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

export default function ClientBulkActionBar({
  selectedCount,
  onDelete,
  onDuplicate,
  onExport,
  onAssignReferrer,
  onClearSelection,
  isLoading = false,
}: ClientBulkActionBarProps) {
  
  const primaryActions = [
    { label: 'Exportar', icon: Download, onClick: onExport },
  ];

  const secondaryActions = [
    { label: 'Duplicar', icon: Copy, onClick: onDuplicate },
    { label: 'Relacionar cliente', icon: UserPlus, onClick: onAssignReferrer },
  ];

  return (
    <TooltipProvider>
      <div className="bg-primary/10 border border-primary rounded-xl p-3 sm:p-4 mb-4 shadow-soft flex items-center justify-between transition-opacity duration-200" style={{ opacity: isLoading ? 0.7 : 1 }}>
        
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-foreground whitespace-nowrap">
            {selectedCount} {selectedCount === 1 ? 'cliente seleccionado' : 'clientes seleccionados'}
          </span>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                onClick={onClearSelection}
                variant="ghost"
                size="icon"
                disabled={isLoading}
                className="w-8 h-8 text-muted-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Limpiar selección</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          
          {primaryActions.map(action => (
            <Tooltip key={action.label} delayDuration={200}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={action.onClick}
                  disabled={isLoading}
                  className="hidden sm:inline-flex w-8 h-8 text-foreground/80 hover:bg-muted"
                >
                  <action.icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{action.label}</TooltipContent>
            </Tooltip>
          ))}

          {secondaryActions.map(action => (
            <Tooltip key={action.label} delayDuration={200}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={action.onClick}
                  disabled={isLoading}
                  className="hidden md:inline-flex w-8 h-8 text-foreground/80 hover:bg-muted"
                >
                  <action.icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{action.label}</TooltipContent>
            </Tooltip>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={isLoading}
                className="md:hidden w-8 h-8 text-foreground/80 hover:bg-muted"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {[...primaryActions, ...secondaryActions].map(action => (
                <DropdownMenuItem 
                  key={action.label} 
                  onClick={action.onClick}
                  className="cursor-pointer"
                >
                  <action.icon className="w-4 h-4 mr-2" />
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                disabled={isLoading}
                className="hidden md:inline-flex w-8 h-8 text-foreground/80 hover:bg-primary/50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Eliminar clientes seleccionados</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}