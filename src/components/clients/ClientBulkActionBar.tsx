import { Trash2, Download, UserPlus, X, Loader2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { canDeleteClients } from '../../lib/permissions';
import { UserRole } from '../../types/database';

// CONSTANTES DE ACCIÓN
// --------------------
const ACTION_BUTTON_CLASSES = "w-8 h-8 text-foreground/80 hover:bg-primary/50";
const DROPDOWN_ITEM_CLASSES = "cursor-pointer";

interface Action {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  destructive?: boolean;
  requiresPermission?: (role: UserRole) => boolean;
}

// PROPS
// -----
interface ClientBulkActionBarProps {
  selectedCount: number;
  userRole?: UserRole;
  onDelete: () => void;
  onExport: () => void;
  onAssignReferrer: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

// COMPONENTE PRINCIPAL
// --------------------
export default function ClientBulkActionBar({
  selectedCount, userRole, onDelete, onExport, onAssignReferrer, onClearSelection, isLoading = false,
}: ClientBulkActionBarProps) {

  // Definición de todas las acciones
  const actions: Action[] = [
    { label: 'Exportar', icon: Download, onClick: onExport },
    { label: 'Relacionar cliente', icon: UserPlus, onClick: onAssignReferrer },
    { label: 'Eliminar', icon: Trash2, onClick: onDelete, destructive: true, requiresPermission: canDeleteClients },
  ];

  // Filtrar acciones según permisos
  const visibleActions = actions.filter(action => {
    if (action.requiresPermission && userRole) {
      return action.requiresPermission(userRole);
    }
    return true;
  });

  // Componente interno para renderizar un botón de acción con Tooltip
  const ActionButton = ({ action }: { action: Action }) => (
    <Tooltip delayDuration={200} >
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={action.onClick}
          disabled={isLoading}
          className={`hidden md:inline-flex ${ACTION_BUTTON_CLASSES} ${action.destructive ? 'hover:bg-destructive/10 hover:text-destructive' : ''}`}
        >
          {action.label === 'Eliminar' && isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <action.icon className="w-4 h-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{action.label}</TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider>
      <div
        className="bg-primary/10 border border-primary rounded-xl p-3 sm:p-4 mb-4 shadow-soft flex items-center justify-between transition-opacity duration-200"
        style={{ opacity: isLoading ? 0.7 : 1 }}
      >

        {/* Conteo de clientes seleccionados y botón de borrar selección */}
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-foreground whitespace-nowrap pl-2">
            {selectedCount} {selectedCount === 1 ? 'cliente seleccionado' : 'clientes seleccionados'}
          </span>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                onClick={onClearSelection}
                variant="ghost"
                size="icon"
                disabled={isLoading}
                className={`hidden md:inline-flex ${ACTION_BUTTON_CLASSES} bg-primary/10 border border-primary rounded-xl p-3 sm:p-4 mb-4 shadow-soft flex items-center justify-between transition-opacity duration-200`}
              >
                <X className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Descartar selección</TooltipContent>
          </Tooltip>
        </div>

        {/* Botones de acción (Desktop) y Menú (Mobile) */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Botones visibles en Desktop */}
          {visibleActions.map(action => (
            <ActionButton key={action.label} action={action} />
          ))}

          {/* Menú de Más Acciones (Visible en Mobile y Tablet) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={isLoading}
                className={`md:hidden ${ACTION_BUTTON_CLASSES}`}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {visibleActions.map(action => (
                <DropdownMenuItem
                  key={action.label}
                  onClick={action.onClick}
                  disabled={isLoading}
                  className={`${DROPDOWN_ITEM_CLASSES} ${action.destructive ? 'text-destructive hover:bg-destructive/10 focus:bg-destructive/10' : ''}`}
                >
                  {action.label === 'Eliminar' && isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <action.icon className="w-4 h-4 mr-2" />
                  )}
                  {action.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onClick={onClearSelection}
                disabled={isLoading}
                className={`${DROPDOWN_ITEM_CLASSES} text-muted-foreground`}
              >
                <X className="w-4 h-4 mr-2" />
                Descartar selección 
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}
