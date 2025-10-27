import { useMemo, useState } from 'react';
import { format, isFuture, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Cake, Phone, DollarSign, Edit, MessageCircle, Facebook, Instagram, Music2, CalendarOff, CalendarCheck, CalendarSearch, AlertCircle, User as UserIcon, Tag as TagIcon, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useClientDetailsQuery } from '../../hooks/queries/useClientDetails.query';
import { formatCurrency, formatPhone, parseDate, buildSocialMediaUrl } from '../../lib/formats';
import { Appointment, Client } from '../../types/database';

// -----------------------------------------------------------------------------
// INTERFACES Y CONSTANTES
// -----------------------------------------------------------------------------

interface ClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string | null;
  onEdit: (client: Client) => void;
}

// Límite de caracteres para truncar notas
const NOTE_TRUNCATE_LENGTH = 200;

// -----------------------------------------------------------------------------
// COMPONENTE: ClientProfileModal
// -----------------------------------------------------------------------------

export default function ClientProfileModal({ isOpen, onClose, clientId, onEdit }: ClientProfileModalProps) {
  // Estado para expandir/colapsar notas
  const [showAllNotes, setShowAllNotes] = useState(false);

  // Hook de datos del cliente
  const { client, loading, error } = useClientDetailsQuery(clientId); 

  // Memoriza y clasifica citas (futuras/pasadas)
  const { futureAppointments, pastAppointments } = useMemo(() => {
  	if (!client?.appointments) {
    	return { futureAppointments: [], pastAppointments: [] };
  	}
  	const future: Appointment[] = [];
  	const past: Appointment[] = [];
  	client.appointments.forEach((appointment) => {
    	const appointmentDate = parseISO(appointment.appointment_date);
    	if (isFuture(appointmentDate)) {
      	future.push(appointment);
    	} else {
      	past.push(appointment);
    	}
  	});
  	future.sort((a, b) => parseISO(a.appointment_date).getTime() - parseISO(b.appointment_date).getTime());
  	past.sort((a, b) => parseISO(b.appointment_date).getTime() - parseISO(a.appointment_date).getTime());
  	return { futureAppointments: future, pastAppointments: past };
  }, [client?.appointments]);

  // ---------------------------------------------------------------------------
  // Funciones Helpers
  // ---------------------------------------------------------------------------

  // Retorna 'variant' de Badge según estado
  const getStatusBadgeVariant = (status: string) => {
  	switch (status) {
    	case 'completed': return 'success';
    	case 'confirmed': return 'info';
    	case 'pending': return 'warning';
    	case 'canceled': return 'destructive';
    	default: return 'default';
  	}
  };

  // Retorna label traducido de estado
  const getStatusLabel = (status: string) => {
  	switch (status) {
    	case 'completed': return 'Completada';
    	case 'confirmed': return 'Confirmada';
    	case 'pending': return 'Pendiente';
    	case 'canceled': return 'Cancelada';
    	default: return status;
  	}
  };

  // Helper para abrir enlaces en nueva pestaña
  const openLink = (url: string) => {
  	window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Función para obtener el nombre de usuario (o rol por defecto)
  const getUserDisplayName = (client: Client) => {
  	if (client.created_by) {
  		return client.created_by.name || (client.created_by.role === 'administrator' ? 'Administrador' : 'Empleado');
  	}
  	// Si no hay created_by (puede ser un registro muy antiguo o importado)
  	return 'Sistema';
  };

  // -----------------------------------------------------------------------------
  // ESTADO DE CARGA (Early Return)
  // -----------------------------------------------------------------------------
  if (loading) {
  	return (
    	<Dialog open={isOpen} onOpenChange={onClose}>
      	<DialogContent className="sm:max-w-lg">
        	<DialogHeader>
          	<DialogTitle>Cargando perfil...</DialogTitle>
        	</DialogHeader>
        	<div className="flex items-center justify-center py-12">
          	<Spinner size="lg" />
        	</div>
      	</DialogContent>
    	</Dialog>
  	);
  }

  // -----------------------------------------------------------------------------
  // ESTADO DE ERROR (Early Return)
  // -----------------------------------------------------------------------------
  // Maneja error de fetch o cliente no encontrado
  if (error || !client) {
  	return (
    	<Dialog open={isOpen} onOpenChange={onClose}>
      	<DialogContent className="sm:max-w-lg">
        	<DialogHeader>
          	<DialogTitle>Error</DialogTitle>
        	</DialogHeader>
        	<div className="flex flex-col items-center justify-center py-12 text-center">
          	<AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          	<p className="text-destructive-foreground font-medium">No se pudo cargar el perfil</p>
          	<p className="text-muted-foreground text-sm">El cliente no existe o hubo un error de conexión.</p>
        	</div>
      	</DialogContent>
    	</Dialog>
  	);
  }

  // --- COLUMNA IZQUIERDA (30% en Desktop) ---
  const LeftColumnContent = () => (
  	<div className="space-y-6 pr-2">
    	{/* Sección: Info principal */}
    	<div>
    		<h2 className="text-2xl font-bold text-foreground mb-3">{client.name}</h2>
    		<Button variant="outline" onClick={() => onEdit(client)}>
    			<Edit className="w-4 h-4 mr-2" />
    			Editar
    		</Button>
    	</div>

    	{/* Sección: Info básica */}
    	<div>
    		<h2 className="text-lg text-foreground mb-3">Información básica</h2>
    		<div className="space-y-2">
    			<div className="flex items-start text-muted-foreground text-sm">
  				<Phone className="w-4 h-4 mr-2 flex-shrink-0" />
  				<span className="line-clamp-2">{formatPhone(client.phone)}</span>
  			</div>
    			{client.birthday && (
    				<div className="flex items-start text-muted-foreground text-sm">
    					<Cake className="w-4 h-4 mr-2 flex-shrink-0" />
  					<span className="line-clamp-2">
  						Cumpleaños: {format(parseDate(client.birthday) || new Date(), 'dd MMM', { locale: es })}
  					</span>
  				</div>
    			)}
  			<div className="flex items-start text-muted-foreground text-sm">
  				<Clock className="w-4 h-4 mr-2 flex-shrink-0" />
  				<span className="line-clamp-2">
  					Creado el {format(parseDate(client.created_at) || new Date(), 'dd/MM/yyyy', { locale: es })}
  					{client.created_by && (
  						<span> por {getUserDisplayName(client)}</span>
  					)}
  					{!client.created_by && client.created_by_user_id && (
  						<span> por [Usuario ID: {client.created_by_user_id}]</span>
  					)}
  				</span>
  			</div>
    		</div>
    	</div>
  
  	{/* Sección: Redes Sociales */}
  	{client.whatsapp_link || client.facebook_link || client.instagram_link || client.tiktok_link ? (
  		<div>
  			<h2 className="text-lg text-foreground mb-3">Redes Sociales</h2>
  			<div className="flex flex-row flex-wrap gap-2">
  				{client.whatsapp_link && (
  					<Tooltip>
  						<TooltipTrigger asChild>
  							<Button
  								variant="outline"
  								size="icon"
  								onClick={() => openLink(buildSocialMediaUrl('whatsapp', client.whatsapp_link))}
  							>
  								<MessageCircle className="w-4 h-4" />
  							</Button>
  						</TooltipTrigger>
  						<TooltipContent><p>Abrir WhatsApp</p></TooltipContent>
  					</Tooltip>
  				)}
  				{client.facebook_link && (
  					<Tooltip>
  						<TooltipTrigger asChild>
  							<Button
  								variant="outline"
  								size="icon"
  								onClick={() => openLink(buildSocialMediaUrl('facebook', client.facebook_link))}
  							>
  								<Facebook className="w-4 h-4" />
  							</Button>
  						</TooltipTrigger>
  						<TooltipContent><p>Abrir Facebook</p></TooltipContent>
  					</Tooltip>
  				)}
  				{client.instagram_link && (
  					<Tooltip>
  						<TooltipTrigger asChild>
  							<Button
  								variant="outline"
  								size="icon"
  								onClick={() => openLink(buildSocialMediaUrl('instagram', client.instagram_link))}
  							>
  								<Instagram className="w-4 h-4" />
  							</Button>
  						</TooltipTrigger>
  						<TooltipContent><p>Abrir Instagram</p></TooltipContent>
  					</Tooltip>
  				)}
  				{client.tiktok_link && (
  					<Tooltip>
  						<TooltipTrigger asChild>
  							<Button
  								variant="outline"
  								size="icon"
  								onClick={() => openLink(buildSocialMediaUrl('tiktok', client.tiktok_link))}
  							>
  								<Music2 className="w-4 h-4" />
  							</Button>
  						</TooltipTrigger>
  						<TooltipContent><p>Abrir TikTok</p></TooltipContent>
  					</Tooltip>
  				)}
  			</div>
  		</div>
  	) : null}


  	{/* Sección: Etiquetas */}
  	{client.tags && client.tags.length > 0 && (
  		<div>
  			<h2 className="text-lg text-foreground mb-2 flex items-center gap-2">
  				<TagIcon className="w-4 h-4" />
  				Etiquetas
  			</h2>
  			<div className="flex flex-wrap gap-2">
  				{client.tags.map((tag) => (
  					<Badge key={tag.id} variant="outline">
  						{tag.name}
  					</Badge>
  				))}
  			</div>
  		</div>
  	)}
  	{/* Sección: Notas */}
  	{client.notes && (
  		<div>
  			<h2 className="text-lg text-foreground mb-2">Notas</h2>
  			<div className="text-muted-foreground rounded-lg p-3 border-2 border-border space-y-2">
  				<p className="whitespace-pre-wrap break-words text-sm">
  					{showAllNotes
  						? client.notes
  						: `${client.notes.substring(0, NOTE_TRUNCATE_LENGTH)}${
  							client.notes.length > NOTE_TRUNCATE_LENGTH ? '...' : ''
  						}`}
  				</p>
  				{client.notes.length > NOTE_TRUNCATE_LENGTH && (
  					<Button variant="link" onClick={() => setShowAllNotes(!showAllNotes)} className="p-0 h-auto text-xs">
  						{showAllNotes ? 'Ver menos' : 'Ver más'}
  					</Button>
  				)}
  			</div>
  		</div>
  	)}
  	</div>
  );

  // --- COLUMNA DERECHA (70% en Desktop) ---
  const RightColumnContent = () => (
  	<div className="space-y-6">
  	{/* Sección: Métricas (KPIs) */}
  	<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  		<div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
  			<div className="flex items-center justify-between">
  				<div>
  					<p className="text-xs text-primary mb-1">Ventas Totales</p>
  					<p className="text-xl font-bold text-foreground">
  						{formatCurrency(Number(client.total_spent))}
  					</p>
  				</div>
  				<DollarSign className="w-6 h-6 text-primary" />
  			</div>
  		</div>

  		<div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
  			<div className="flex items-center justify-between">
  				<div>
  					<p className="text-xs text-primary mb-1">Total Visitas</p>
  					<p className="text-xl font-bold text-foreground">{client.total_visits}</p>
  				</div>
  				<CalendarCheck className="w-6 h-6 text-primary" />
  			</div>
  		</div>

  		<div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
  			<div className="flex items-center justify-between">
  				<div>
  					<p className="text-xs text-primary mb-1">Última Visita</p>
  					<p className="text-xl font-semibold text-foreground truncate">
  						{client.last_visit_date
  							? format(parseDate(client.last_visit_date) || new Date(), 'dd/MM/yyyy', { locale: es })
  							: 'Sin visitas'}
  					</p>
  				</div>
  				<CalendarSearch className="w-6 h-6 text-info" />
  			</div>
  		</div>
  	</div>
  	
  	{/* Sección: Clientes Referidos */}
  	{client.referrals && client.referrals.length > 0 && (
  		<div className="flex items-start">
  			<h2 className="text-lg text-foreground mb-3">
  				Detalle de referidos
  			</h2>
         <Badge variant="outline" className="ml-2 font-semibold tex-primary">{client.referrals.length}</Badge>
  			<div className="space-y-2">
  				{client.referrals.map((referral) => (
  					<div key={referral.id} className="bg-card border border-border rounded-lg p-3">
  						<div className="flex items-center justify-between">
  							<div>
  								<p className="font-medium text-foreground">{referral.name}</p>
  								<p className="text-sm text-muted-foreground">{formatPhone(referral.phone)}</p>
  							</div>
  							<div className="text-right">
  								<p className="text-sm text-muted-foreground">Visitas: {referral.total_visits}</p>
  								<p className="text-sm font-semibold text-success">
  									{formatCurrency(Number(referral.total_spent))}
  								</p>
  							</div>
  						</div>
  					</div>
  				))}
  			</div>
  		</div>
  	)}

  	{/* Sección: Citas */}
  	<>
  		{/* Citas Futuras */}
  		{futureAppointments.length > 0 && (
  			<div>
  				<h2 className="text-lg text-foreground mb-3">Citas Futuras</h2>
  				<div className="space-y-2">
  					{futureAppointments.map((appointment) => (
  						<div key={appointment.id} className="bg-card border border-border rounded-lg p-3">
  							<div className="flex items-start justify-between mb-2">
  								<div className="flex items-center gap-2">
  									<Clock className="w-4 h-4 text-muted-foreground" />
  									<span className="text-sm font-medium text-foreground">
  										{format(parseISO(appointment.appointment_date), 'dd/MM/yyyy', { locale: es })} -{' '}
  										{appointment.appointment_time}
  									</span>
  								</div>
  								<Badge variant={getStatusBadgeVariant(appointment.status)}>
  									{getStatusLabel(appointment.status)}
  								</Badge>
  							</div>
  							<div className="flex items-center justify-between text-sm">
  								<span className="text-muted-foreground">Total</span>
  								<span className="font-semibold text-foreground">
  									{formatCurrency(Number(appointment.total_price))}
  								</span>
  							</div>
  							{appointment.notes && (
  								<p className="mt-2 text-xs text-muted-foreground">{appointment.notes}</p>
  							)}
  						</div>
  					))}
  				</div>
  			</div>
  		)}

  		{/* Citas Pasadas */}
  		{pastAppointments.length > 0 && (
  			<div>
  				<h2 className="text-lg text-foreground mb-3">Citas Pasadas</h2>
  				<div className="space-y-2">
  					{pastAppointments.map((appointment) => (
  						<div key={appointment.id} className="bg-muted/50 border border-border rounded-lg p-3">
  							<div className="flex items-start justify-between mb-2">
  								<div className="flex items-center gap-2">
  									<Clock className="w-4 h-4 text-muted-foreground" />
  									<span className="text-sm font-medium text-foreground">
  										{format(parseISO(appointment.appointment_date), 'dd/MM/yyyy', { locale: es })} -{' '}
  										{appointment.appointment_time}
  									</span>
  								</div>
  								<Badge variant={getStatusBadgeVariant(appointment.status)}>
  									{getStatusLabel(appointment.status)}
  								</Badge>
  							</div>
  							<div className="flex items-center justify-between text-sm">
  								<span className="text-muted-foreground">Total</span>
  								<span className="font-semibold text-foreground">
  									{formatCurrency(Number(appointment.total_price))}
  								</span>
  							</div>
  						</div>
  					))}
  				</div>
  			</div>
  		)}

  		{/* Estado vacío (sin citas) */}
  		{(!client.appointments || client.appointments.length === 0) && (
  			<div className="text-center py-8">
  				<CalendarOff className="w-12 h-12 text-muted mx-auto mb-3" />
  				<p className="text-muted-foreground/50">Este cliente no tiene citas registradas</p>
  			</div>
  		)}
  	</>
  	</div>
  );


  // -----------------------------------------------------------------------------
  // RENDER PRINCIPAL
  // -----------------------------------------------------------------------------
  return (
  	<Dialog open={isOpen} onOpenChange={onClose}>
  		<TooltipProvider>
  			<DialogContent className="w-10/12 lg:max-w-5xl h-[75vh] flex flex-col p-0">
    				<DialogHeader className="p-4 border-b border-border">
    					<DialogTitle>Perfil del Cliente</DialogTitle>
    				</DialogHeader>
  				<div className="flex-grow overflow-hidden">
  			
  					{/* --- Layout Móvil --- */}
  					{/* Apila LeftColumnContent y RightColumnContent */}
  					<ScrollArea className="h-full md:hidden">
  						<div className="p-6 space-y-6">
  							<LeftColumnContent />
  							<RightColumnContent />
  						</div>
  					</ScrollArea>

  					{/* --- Layout Desktop --- */}
  					<div className="hidden md:grid md:grid-cols-10 gap-6 h-full p-6 pt-0">
  						{/* Col Izq (30%) */}
  						<ScrollArea className="md:col-span-3 h-full">
  							<LeftColumnContent />
  						</ScrollArea>
  						{/* Col Der (70%) */}
  						<ScrollArea className="md:col-span-7 h-full">
  							<RightColumnContent />
  						</ScrollArea>
  					</div>
  				</div>
  			</DialogContent>
  		</TooltipProvider>
  	</Dialog>
  );
}