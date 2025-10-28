import { useQuery } from '@tanstack/react-query';
import * as clientService from '../../services/client.service';
import * as appointmentService from '../../services/appointment.service';
import * as tagService from '../../services/tag.service';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { ClientWithDetails, User } from '../../types/database';
import { supabase } from '../../lib/supabase';

export function useClientDetailsQuery(clientId: string | null) {
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: QUERY_KEYS.clients.detail(clientId || ''),
    queryFn: () => clientService.fetchClientById(clientId || ''),
    enabled: !!clientId,
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: QUERY_KEYS.appointments.byClient(clientId || ''),
    queryFn: () => appointmentService.fetchAppointmentsByClient(clientId || ''),
    enabled: !!clientId,
  });

  const { data: referrals = [], isLoading: referralsLoading } = useQuery({
    queryKey: QUERY_KEYS.clients.referrals(clientId || ''),
    queryFn: () => clientService.fetchClientReferrals(clientId || ''),
    enabled: !!clientId,
  });

  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: QUERY_KEYS.tags.byClient(clientId || ''),
    queryFn: () => tagService.fetchTagsByClientId(clientId || ''),
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
        tags,
        created_by: createdByUser || undefined,
      }
    : null;

  return {
    client: clientWithDetails,
    loading: clientLoading || appointmentsLoading || referralsLoading || tagsLoading || createdByLoading,
    error: null,
  };
}
