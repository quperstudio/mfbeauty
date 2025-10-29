/**
 * Client Service
 *
 * Handles all database operations related to clients.
 * Uses base service functions for common CRUD operations.
 *
 * This service demonstrates the standard pattern for entity services:
 * 1. Import base service functions and entity types
 * 2. Define entity-specific operations using base functions
 * 3. Add custom business logic where needed
 * 4. Export functions with clear names and type safety
 */

import { Client } from '../types/database';
import { ClientSchemaType } from '../schemas/client.schema';
import * as baseService from './base.service';
import { supabase } from '../lib/supabase';

const TABLE_NAME = 'clients';

/**
 * Fetch all clients ordered by creation date (newest first)
 */
export async function fetchClients(): Promise<Client[]> {
  return baseService.fetchAll<Client>(TABLE_NAME, {
    column: 'created_at',
    ascending: false,
  });
}

/**
 * Fetch a single client by ID
 */
export async function fetchClientById(id: string): Promise<Client | null> {
  return baseService.fetchById<Client>(TABLE_NAME, id);
}

/**
 * Create a new client
 */
export async function createClient(clientData: ClientSchemaType): Promise<Client> {
  return baseService.create<Client, ClientSchemaType>(TABLE_NAME, clientData);
}

/**
 * Update an existing client
 */
export async function updateClient(id: string, clientData: ClientSchemaType): Promise<Client> {
  return baseService.update<Client, ClientSchemaType>(TABLE_NAME, id, clientData);
}

/**
 * Delete one or multiple clients by ID(s)
 * Handles both single client deletion and batch operations
 */
export async function deleteClients(ids: string | string[]): Promise<void> {
  const idsArray = Array.isArray(ids) ? ids : [ids];

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .in('id', idsArray);

  if (error) throw error;
}

/**
 * Fetch clients with referrer information
 */
export async function fetchClientsWithReferrer(): Promise<Client[]> {
  return baseService.fetchWithFilter<Client>(TABLE_NAME, {}, {
    column: 'created_at',
    ascending: false,
  });
}

/**
 * Count total clients
 */
export async function countClients(): Promise<number> {
  return baseService.count(TABLE_NAME);
}

/**
 * Fetch clients that were referred by a specific client
 */
export async function fetchClientReferrals(clientId: string): Promise<Client[]> {
  return baseService.fetchWithFilter<Client>(TABLE_NAME, { referrer_id: clientId }, {
    column: 'created_at',
    ascending: false,
  });
}

/**
 * Duplicate a client (create a copy with modified name and all related data including social media and tags)
 */
export async function duplicateClient(id: string): Promise<Client> {
  const client = await fetchClientById(id);
  if (!client) throw new Error('Cliente no encontrado');

  const { id: _, created_at, total_spent, total_visits, last_visit_date, ...clientData } = client;

  const duplicatedData = {
    ...clientData,
    name: `${client.name} (Copia)`,
    whatsapp_link: client.whatsapp_link,
    facebook_link: client.facebook_link,
    instagram_link: client.instagram_link,
    tiktok_link: client.tiktok_link,
  };

  const newClient = await baseService.create<Client, typeof duplicatedData>(TABLE_NAME, duplicatedData);

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

/**
 * Update the referrer_id for multiple clients
 */
export async function updateMultipleClientsReferrer(ids: string[], referrerId: string | null): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update({ referrer_id: referrerId })
    .in('id', ids);

  if (error) throw error;
}

/**
 * Check if a phone number is already registered
 * Returns the existing client if found, null otherwise
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

/**
 * Fetch clients with their tags
 */
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
