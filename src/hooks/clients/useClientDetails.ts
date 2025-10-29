import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { parseISO, isFuture } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { ClientWithDetails, User, Appointment, Client, ClientTag } from '../../types/database';

export function useClientDetails(clientId: string | null) {
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

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: QUERY_KEYS.appointments.byClient(clientId || ''),
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', clientId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) throw error;
      return (data as Appointment[]) || [];
    },
    enabled: !!clientId,
  });

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

  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: QUERY_KEYS.tags.byClient(clientId || ''),
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('client_tags_assignments')
        .select(
          `
          tag_id,
          client_tags (id, name, created_at)
        `
        )
        .eq('client_id', clientId);

      if (error) throw error;

      return data?.map((item: any) => item.client_tags).filter(Boolean) || [];
    },
    enabled: !!clientId,
  });

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

  const clientWithDetails: ClientWithDetails | null = client
    ? {
        ...client,
        appointments,
        referrals,
        tags: tags as ClientTag[],
        created_by: createdByUser || undefined,
      }
    : null;

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

    future.sort((a, b) => parseISO(a.appointment_date).getTime() - parseISO(b.appointment_date).getTime());
    past.sort((a, b) => parseISO(b.appointment_date).getTime() - parseISO(a.appointment_date).getTime());

    return { futureAppointments: future, pastAppointments: past };
  }, [clientWithDetails?.appointments]);

  return {
    client: clientWithDetails,
    loading: clientLoading || appointmentsLoading || referralsLoading || tagsLoading || createdByLoading,
    error: null,
    futureAppointments,
    pastAppointments,
  };
}
