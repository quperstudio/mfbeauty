import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { parseISO, isFuture } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { ClientWithDetails, User, Appointment, Client, ClientTag } from '../../types/database';

// HOOK PRINCIPAL: useClientDetails
// --------------------------------
// Obtiene la información detallada de un cliente, incluyendo citas, referidos, etiquetas y el usuario que lo creó.
export function useClientDetails(clientId: string | null) {
  // CONSULTA 1: DATOS BÁSICOS DEL CLIENTE
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: QUERY_KEYS.clients.detail(clientId || ''),
    queryFn: async () => {
      if (!clientId) return null;

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();

      if (error) throw error;
      return data as Client | null;
    },
    enabled: !!clientId,
  });

  // CONSULTA 2: CITAS DEL CLIENTE
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: QUERY_KEYS.appointments.byClient(clientId || ''),
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', clientId)
        // Ordena por fecha y hora descendente (la más reciente primero)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) throw error;
      return (data as Appointment[]) || [];
    },
    enabled: !!clientId,
  });

  // CONSULTA 3: CLIENTES REFERIDOS POR ESTE CLIENTE
  const { data: referrals = [], isLoading: referralsLoading } = useQuery({
    queryKey: QUERY_KEYS.clients.referrals(clientId || ''),
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('referrer_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Client[]) || [];
    },
    enabled: !!clientId,
  });

  // CONSULTA 4: ETIQUETAS ASIGNADAS AL CLIENTE
  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: QUERY_KEYS.tags.byClient(clientId || ''),
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('client_tags_assignments')
        .select(
          `
          tag_id,
          client_tags (id, name, created_at) // Obtiene el detalle de la etiqueta
        `
        )
        .eq('client_id', clientId);

      if (error) throw error;

      // Mapea y filtra para obtener solo los objetos de etiqueta
      return data?.map((item: any) => item.client_tags).filter(Boolean) || [];
    },
    enabled: !!clientId,
  });

  // CONSULTA 5: INFORMACIÓN DEL USUARIO CREADOR
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
    enabled: !!client?.created_by_user_id, // Solo se ejecuta si ya tenemos el ID del cliente
  });

  // PROCESAMIENTO: Combinar todos los datos en un solo objeto de detalle
  const clientWithDetails: ClientWithDetails | null = client
    ? {
        ...client,
        appointments,
        referrals,
        tags: tags as ClientTag[],
        created_by: createdByUser || undefined,
      }
    : null;

  // PROCESAMIENTO: Clasificar Citas (Próximas y Pasadas)
  const { futureAppointments, pastAppointments } = useMemo(() => {
    if (!clientWithDetails?.appointments) {
      return { futureAppointments: [], pastAppointments: [] };
    }

    const future: Appointment[] = [];
    const past: Appointment[] = [];

    clientWithDetails.appointments.forEach((appointment) => {
      const appointmentDate = parseISO(appointment.appointment_date);
      // Determina si la cita es futura
      if (isFuture(appointmentDate)) {
        future.push(appointment);
      } else {
        past.push(appointment);
      }
    });

    // Ordena las futuras de la más próxima a la más lejana
    future.sort((a, b) => parseISO(a.appointment_date).getTime() - parseISO(b.appointment_date).getTime());
    // Ordena las pasadas de la más reciente a la más antigua
    past.sort((a, b) => parseISO(b.appointment_date).getTime() - parseISO(a.appointment_date).getTime());

    return { futureAppointments: future, pastAppointments: past };
  }, [clientWithDetails?.appointments]);

  // RETORNO DEL HOOK
  // -----------------
  return {
    client: clientWithDetails,
    // Combina todos los estados de carga
    loading: clientLoading || appointmentsLoading || referralsLoading || tagsLoading || createdByLoading,
    error: null, // Asume que el manejo de errores se hace dentro de las consultas
    futureAppointments,
    pastAppointments,
  };
}