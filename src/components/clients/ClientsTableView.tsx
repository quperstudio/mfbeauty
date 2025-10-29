import { handleOpenLink } from "../../lib/utils";
import { Eye, Pen, Trash2, Copy, Download, UserPlus, MoreVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Client, ClientSortField, ClientSortDirection } from '../../types/database';
import { formatCurrency, formatPhone, parseDate, getSocialMediaLinks } from '../../lib/formats';
import { canDeleteClients } from '../../lib/permissions';
import { UserRole } from '../../types/database';

// PROPS
// -----
interface ClientsTableViewProps {
  clients: Client[];
  selectedClientIds: Set<string>;
  sortField: ClientSortField;
  sortDirection: ClientSortDirection;
  userRole?: UserRole;
  onSelectAll: (checked: boolean) => void;
  onSelectClient: (clientId: string, checked: boolean) => void;
  onSort: (field: ClientSortField) => void;
  onViewProfile: (clientId: string) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onExport: (clientIds: string[]) => void;
  onDuplicate: (clientIds: string[]) => void;
  onAssignReferrer: (clientIds: string[]) => void;
}

// COMPONENTE PRINCIPAL
// --------------------
export default function ClientsTableView({
  clients, selectedClientIds, sortField, sortDirection, userRole,
  onSelectAll, onSelectClient, onSort, onViewProfile, onEdit, onDelete,
  onExport, onDuplicate, onAssignReferrer,
}: ClientsTableViewProps) {

  // Función para mostrar icono de ordenamiento
  const getSortIcon = (field: ClientSortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  return (
    <TooltipProvider>
      {/* VISTA DE TABLA PARA ESCRITORIO */}
      <div className="hidden md:block overflow-x-auto">
        <Table>

          {/* CABECERA DE LA TABLA (ORDENAMIENTO) */}
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedClientIds.size === clients.length && clients.length > 0}
                  onCheckedChange={onSelectAll}
                  aria-label="Seleccionar todos"
                />
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort('name')}>
                <div className="flex items-center gap-2">Cliente{getSortIcon('name')}</div>
              </TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort('total_visits')}>
                <div className="flex items-center gap-2">Visitas{getSortIcon('total_visits')}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort('total_spent')}>
                <div className="flex items-center gap-2">Gastado{getSortIcon('total_spent')}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort('last_visit_date')}>
                <div className="flex items-center gap-2">Última Visita{getSortIcon('last_visit_date')}</div>
              </TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          {/* CUERPO DE LA TABLA (CLIENTES) */}
          <TableBody>
            {clients.map((client) => {
              const { visibleLinks } = getSocialMediaLinks(client, null);

              return (
                <TableRow key={client.id} className={selectedClientIds.has(client.id) ? 'bg-primary/10' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedClientIds.has(client.id)}
                      onCheckedChange={(checked) => onSelectClient(client.id, !!checked)}
                    />
                  </TableCell>
                  {/* Nombre y Teléfono */}
                  <TableCell>
                    <p className="font-medium">{client.name}</p>
                    <span className="text-sm text-muted-foreground mt-0.5">{formatPhone(client.phone)}</span>
                  </TableCell>
                  {/* Enlaces de Contacto */}
                  <TableCell>
                    <div className="flex items-center gap-2">
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
                    </div>
                  </TableCell>
                  {/* Visitas */}
                  <TableCell>
                    <Badge variant="purple">{client.total_visits}</Badge>
                  </TableCell>
                  {/* Gastado */}
                  <TableCell>
                    <span className="font-medium text-foreground">
                      {formatCurrency(Number(client.total_spent))}
                    </span>
                  </TableCell>
                  {/* Última Visita */}
                  <TableCell>
                    {client.last_visit_date ? (
                      <span className="text-sm">
                        {format(parseDate(client.last_visit_date) || new Date(), 'dd/MM/yyyy', { locale: es })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin visitas</span>
                    )}
                  </TableCell>
                  {/* Acciones */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Ver Perfil */}
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onViewProfile(client.id)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Ver perfil completo</TooltipContent>
                      </Tooltip>
                      {/* Editar */}
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onEdit(client)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-lg transition-colors"
                          >
                            <Pen className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Editar cliente</TooltipContent>
                      </Tooltip>
                      {/* Más Acciones */}
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
                              className="text-destructive hover:bg-destructive/20 hover:text-destructive-foreground focus:bg-destructive/20 focus:text-destructive-foreground cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}