import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Client } from '../types/database';
import { ClientFormData } from '../types/forms';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setClients(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();

    const subscription = supabase
      .channel('clients_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        fetchClients();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const cleanClientData = (data: ClientFormData) => {
    return {
      name: data.name,
      phone: data.phone,
      birthday: data.birthday || null,
      notes: data.notes || null,
      referrer_id: data.referrer_id || null,
      whatsapp_link: data.whatsapp_link || null,
      facebook_link: data.facebook_link || null,
      instagram_link: data.instagram_link || null,
      tiktok_link: data.tiktok_link || null,
    };
  };

  const createClient = async (data: ClientFormData) => {
    try {
      const cleanedData = cleanClientData(data);
      const { error: insertError } = await supabase
        .from('clients')
        .insert([cleanedData]);

      if (insertError) throw insertError;
      await fetchClients();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al crear cliente' };
    }
  };

  const updateClient = async (id: string, data: ClientFormData) => {
    try {
      const cleanedData = cleanClientData(data);
      const { error: updateError } = await supabase
        .from('clients')
        .update(cleanedData)
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchClients();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al actualizar cliente' };
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchClients();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error al eliminar cliente' };
    }
  };

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    refresh: fetchClients,
  };
}
