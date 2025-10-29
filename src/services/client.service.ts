import { Client } from '../types/database';
import { ClientSchemaType } from '../schemas/client.schema';
import * as baseService from './base.service';
import { supabase } from '../lib/supabase';

const TABLE_NAME = 'clients';

// FUNCIONES CRUD BÁSICAS (usando baseService)
// ------------------------------------------

/** Obtiene todos los clientes (más nuevos primero) */
export async function fetchClients(): Promise<Client[]> {
  return baseService.fetchAll<Client>(TABLE_NAME, {
    column: 'created_at',
    ascending: false,
  });
}

/** Obtiene un cliente por su ID */
export async function fetchClientById(id: string): Promise<Client | null> {
  return baseService.fetchById<Client>(TABLE_NAME, id);
}

/** Crea un nuevo cliente */
export async function createClient(clientData: ClientSchemaType): Promise<Client> {
  return baseService.create<Client, ClientSchemaType>(TABLE_NAME, clientData);
}

/** Actualiza un cliente existente */
export async function updateClient(id: string, clientData: ClientSchemaType): Promise<Client> {
  return baseService.update<Client, ClientSchemaType>(TABLE_NAME, id, clientData);
}

/** Cuenta el total de clientes */
export async function countClients(): Promise<number> {
  return baseService.count(TABLE_NAME);
}

// FUNCIONES AVANZADAS DE CONSULTA Y MANIPULACIÓN
// ---------------------------------------------

/** Obtiene clientes con la información de quién los refirió (sin filtro específico) */
export async function fetchClientsWithReferrer(): Promise<Client[]> {
  return baseService.fetchWithFilter<Client>(TABLE_NAME, {}, {
    column: 'created_at',
    ascending: false,
  });
}

/** Obtiene los clientes que fueron referidos por un cliente específico */
export async function fetchClientReferrals(clientId: string): Promise<Client[]> {
  return baseService.fetchWithFilter<Client>(TABLE_NAME, { referrer_id: clientId }, {
    column: 'created_at',
    ascending: false,
  });
}

/**
 * Revisa si un número de teléfono ya está registrado
 * @param phone El número de teléfono a verificar
 * @param excludeClientId Opcional: ID del cliente actual para excluir en la verificación
 */
export async function checkDuplicatePhone(phone: string, excludeClientId?: string): Promise<Client | null> {
  let query = supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('phone', phone);

  if (excludeClientId) {
    query = query.neq('id', excludeClientId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  return data;
}

/** Obtiene todos los clientes con sus tags relacionados */
export async function fetchClientsWithTags(): Promise<Client[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(`
      *,
      client_tags_assignments (
        client_tags (
          id,
          name,
          created_at
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// FUNCIONES DE ACCIÓN MASIVA
// --------------------------

/** Elimina uno o varios clientes por ID(s) */
export async function deleteClients(ids: string | string[]): Promise<void> {
  const idsArray = Array.isArray(ids) ? ids : [ids];

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .in('id', idsArray);

  if (error) throw error;
}

/** Actualiza la persona que refirió (referrer_id) a múltiples clientes */
export async function updateMultipleClientsReferrer(ids: string[], referrerId: string | null): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update({ referrer_id: referrerId })
    .in('id', ids);

  if (error) throw error;
}


/** Duplica un cliente (crea una copia con datos relacionados como tags) */
export async function duplicateClient(id: string): Promise<Client> {
  const client = await fetchClientById(id);
  if (!client) throw new Error('Cliente no encontrado');

  // Excluir campos de estado y metadatos (ID, fechas, gastos, visitas)
  const { id: _, created_at, total_spent, total_visits, last_visit_date, ...clientData } = client;

  const duplicatedData = {
    ...clientData,
    name: `${client.name} (Copia)`,
    // Asegurar que los campos de redes sociales se incluyan
    whatsapp_link: client.whatsapp_link,
    facebook_link: client.facebook_link,
    instagram_link: client.instagram_link,
    tiktok_link: client.tiktok_link,
  };

  // 1. Crear el nuevo registro del cliente
  const newClient = await baseService.create<Client, typeof duplicatedData>(TABLE_NAME, duplicatedData);

  // 2. Copiar asignaciones de tags
  const { data: tagAssignments, error: tagError } = await supabase
    .from('client_tags_assignments')
    .select('tag_id')
    .eq('client_id', id);

  if (tagError) throw tagError;

  if (tagAssignments && tagAssignments.length > 0) {
    const newAssignments = tagAssignments.map((assignment) => ({
      client_id: newClient.id,
      tag_id: assignment.tag_id,
    }));

    const { error: insertError } = await supabase
      .from('client_tags_assignments')
      .insert(newAssignments);

    if (insertError) throw insertError;
  }

  return newClient;
}