import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { parseISO, isFuture } from 'date-fns';
import * as clientService from '../../services/client.service';
import * as appointmentService from '../../services/appointment.service';
import * as tagService from '../../services/tag.service';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { ClientWithDetails, User, Appointment } from '../../types/database';
import { supabase } from '../../lib/supabase';

// HOOK PRINCIPAL: DETALLES DEL CLIENTE
// ------------------------------------
// Carga todos los datos relacionados con un cliente (citas, referidos, tags y creador).
export function useClientDetailsQuery(clientId: string | null) {
  
  // CONSULTAS DE DATOS CON REACT-QUERY
  // ----------------------------------

  // 1. Carga los datos base del cliente
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: QUERY_KEYS.clients.detail(clientId || ''),
    queryFn: () => clientService.fetchClientById(clientId || ''),
    enabled: !!clientId,
  });

  // 2. Carga las citas asociadas al cliente
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: QUERY_KEYS.appointments.byClient(clientId || ''),
    queryFn: () => appointmentService.fetchAppointmentsByClient(clientId || ''),
    enabled: !!clientId,
  });

  // 3. Carga los clientes referidos por este cliente
  const { data: referrals = [], isLoading: referralsLoading } = useQuery({
    queryKey: QUERY_KEYS.clients.referrals(clientId || ''),
    queryFn: () => clientService.fetchClientReferrals(clientId || ''),
    enabled: !!clientId,
  });

  // 4. Carga las etiquetas (tags) del cliente
  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: QUERY_KEYS.tags.byClient(clientId || ''),
    queryFn: () => tagService.fetchTagsByClientId(clientId || ''),
    enabled: !!clientId,
  });

  // 5. Carga la información del usuario que creó el cliente (si existe)
  const { data: createdByUser, isLoading: createdByLoading } = useQuery({
    queryKey: ['user', client?.created_by_user_id],
    queryFn: async () => {
      if (!client?.created_by_user_id) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', client.created_by_user_id)
        .maybeSingle();
      if (error) throw error;
      return data as User | null;
    },
    enabled: !!client?.created_by_user_id,
  });
  
  // COMPOSICIÓN DEL OBJETO DETALLADO
  // --------------------------------
  // Combina los datos base con las relaciones cargadas
  const clientWithDetails: ClientWithDetails | null = client
    ? {
        ...client,
        appointments,
        referrals,
        tags,
        created_by: createdByUser || undefined,
      }
    : null;

  // CÁLCULO DE CITAS FUTURAS Y PASADAS
  // ----------------------------------
  // Utiliza useMemo para separar y ordenar citas
  const { futureAppointments, pastAppointments } = useMemo(() => {
    if (!clientWithDetails?.appointments) {
      return { futureAppointments: [], pastAppointments: [] };
    }
    const future: Appointment[] = [];
    const past: Appointment[] = [];
    clientWithDetails.appointments.forEach((appointment) => {
      const appointmentDate = parseISO(appointment.appointment_date);
      if (isFuture(appointmentDate)) {
        future.push(appointment);
      } else {
        past.push(appointment);
      }
    });
    // Ordena las futuras de más cercana a más lejana
    future.sort((a, b) => parseISO(a.appointment_date).getTime() - parseISO(b.appointment_date).getTime());
    // Ordena las pasadas de más reciente a más antigua
    past.sort((a, b) => parseISO(b.appointment_date).getTime() - parseISO(a.appointment_date).getTime());
    return { futureAppointments: future, pastAppointments: past };
  }, [clientWithDetails?.appointments]);

  // RETORNO DEL HOOK
  // -----------------
  return {
    client: clientWithDetails,
    // Calcula el estado general de carga
    loading: clientLoading || appointmentsLoading || referralsLoading || tagsLoading || createdByLoading,
    error: null,
    futureAppointments,
    pastAppointments,
  };
}