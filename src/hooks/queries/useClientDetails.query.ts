import { useQuery } from '@tanstack/react-query';
import * as clientService from '../../services/client.service';
import * as appointmentService from '../../services/appointment.service';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { ClientWithDetails } from '../../types/database';

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

  const clientWithDetails: ClientWithDetails | null = client
    ? {
        ...client,
        appointments,
        referrals,
      }
    : null;

  return {
    client: clientWithDetails,
    loading: clientLoading || appointmentsLoading || referralsLoading,
    error: null,
  };
}
