import { handleOpenLink } from "../../lib/utils";
import { Eye, Pen, Trash2, Copy, Download, UserPlus, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Client } from '../../types/database';
import { formatCurrency, formatPhone, parseDate, getSocialMediaLinks } from '../../lib/formats';
import { canDeleteClients } from '../../lib/permissions';
import { UserRole } from '../../types/database';
import { CLIENT_SOCIAL_MEDIA_LIMIT } from '../../constants/clients.constants';

// PROPS
// -----
interface ClientsListViewProps {
  clients: Client[];
  selectedClientIds: Set<string>;
  isSmallScreen: boolean;
  userRole?: UserRole;
  onSelectClient: (clientId: string, checked: boolean) => void;
  onViewProfile: (clientId: string) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onExport: (clientIds: string[]) => void;
  onDuplicate: (clientIds: string[]) => void;
  onAssignReferrer: (clientIds: string[]) => void;
}

// COMPONENTE PRINCIPAL
// --------------------
export default function ClientsListView({
  clients, selectedClientIds, isSmallScreen, userRole,
  onSelectClient, onViewProfile, onEdit, onDelete,
  onExport, onDuplicate, onAssignReferrer,
}: ClientsListViewProps) {
  return (
    <TooltipProvider>
      {/* VISTA DE LISTA PARA MÓVILES */}
      <div className="md:hidden divide-y divide-border">
        {clients.map((client) => {
          const { visibleLinks, hiddenCount, hiddenLinks } = getSocialMediaLinks(
            client,
            CLIENT_SOCIAL_MEDIA_LIMIT.MOBILE
          );

          const handleBadgeClick = () => {
            if (isSmallScreen) { onViewProfile(client.id); }
          };

          return (
            <div key={client.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                {/* Columna Izquierda: Checkbox, Nombre y Contacto */}
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    checked={selectedClientIds.has(client.id)}
                    onCheckedChange={(checked) => onSelectClient(client.id, !!checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{client.name}</h3>
                    <span className="text-sm text-muted-foreground">{formatPhone(client.phone)}</span>

                    {/* Enlaces de Redes Sociales */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {visibleLinks.map((link) => (
                        <Tooltip delayDuration={200} key={link.type}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost" size="icon" onClick={() => handleOpenLink(link.url)}
                              className={`h-7 w-7 text-muted-foreground hover:${link.color} p-0`}
                              aria-label={`${link.type} de ${client.name}`}
                            >
                              <link.icon className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{link.type}</TooltipContent>
                        </Tooltip>
                      ))}

                      {/* Botón para enlaces ocultos */}
                      {hiddenCount > 0 && (isSmallScreen ? (
                        <Badge variant="secondary" onClick={handleBadgeClick}
                          className="cursor-pointer hover:bg-muted-foreground/20 transition-colors">
                          +{hiddenCount}
                        </Badge>
                      ) : (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Badge variant="secondary" className="cursor-pointer hover:bg-muted-foreground/20 transition-colors">
                              +{hiddenCount}
                            </Badge>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 p-1 flex flex-col space-y-1">
                            {hiddenLinks.map((link) => (
                              <Button
                                key={link.type} variant="ghost" size="sm" onClick={() => handleOpenLink(link.url)}
                                className={`justify-start ${link.color}`}
                              >
                                <link.icon className="w-4 h-4 mr-2" />
                                {link.type}
                              </Button>
                            ))}
                          </PopoverContent>
                        </Popover>
                    ))}
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Acciones */}
                <div className="flex items-center space-x-2">
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onViewProfile(client.id)}
                        className="p-2 text-muted-foreground hover:text-info hover:bg-muted/50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Ver Perfil</TooltipContent>
                  </Tooltip>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onEdit(client)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-lg transition-colors"
                      >
                        <Pen className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>

                  {/* Dropdown de Más Acciones */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8 p-0 text-muted-foreground hover:bg-muted/50">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onExport([client.id])} className="cursor-pointer">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate([client.id])} className="cursor-pointer">
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onAssignReferrer([client.id])} className="cursor-pointer">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Relacionar cliente
                      </DropdownMenuItem>
                      {userRole && canDeleteClients(userRole) && (
                        <DropdownMenuItem
                          onClick={() => onDelete(client)}
                          className="text-destructive hover:bg-destructive/20 hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Detalle (Visitas, Gastado, Última Visita) */}
              <div className="grid grid-cols-3 gap-4 text-center mt-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Visitas</p>
                  <Badge variant="purple">{client.total_visits}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Gastado</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(Number(client.total_spent))}
                  </p>
                </div>
                {client.last_visit_date && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Última Visita</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseDate(client.last_visit_date) || new Date(), 'dd/MM/yy', { locale: es })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}