import { supabase } from '../lib/supabase';
import { Appointment } from '../types/database';

/**
 * Fetch appointments for a specific client
 */
export async function fetchAppointmentsByClient(clientId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('client_id', clientId)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false });

  if (error) throw error;
  return (data as Appointment[]) || [];
}
