/**
 * Tag Service
 *
 * Handles all database operations related to client tags.
 * Provides functions for CRUD operations on tags and tag assignments.
 */

import { ClientTag, ClientTagAssignment } from '../types/database';
import { TagSchemaType } from '../schemas/client.schema';
import * as baseService from './base.service';
import { supabase } from '../lib/supabase';

const TAGS_TABLE = 'client_tags';
const ASSIGNMENTS_TABLE = 'client_tags_assignments';

/**
 * Fetch all tags ordered by name
 */
export async function fetchAllTags(): Promise<ClientTag[]> {
  return baseService.fetchAll<ClientTag>(TAGS_TABLE, {
    column: 'name',
    ascending: true,
  });
}

/**
 * Fetch tags for a specific client
 */
export async function fetchTagsByClientId(clientId: string): Promise<ClientTag[]> {
  const { data, error } = await supabase
    .from(ASSIGNMENTS_TABLE)
    .select(`
      tag_id,
      ${TAGS_TABLE} (
        id,
        name,
        created_at
      )
    `)
    .eq('client_id', clientId);

  if (error) throw error;

  return data?.map((item: any) => item.client_tags).filter(Boolean) || [];
}

/**
 * Create a new tag
 */
export async function createTag(tagData: TagSchemaType): Promise<ClientTag> {
  return baseService.create<ClientTag, TagSchemaType>(TAGS_TABLE, tagData);
}

/**
 * Check if a tag with the given name already exists
 */
export async function tagExists(name: string): Promise<ClientTag | null> {
  const { data, error } = await supabase
    .from(TAGS_TABLE)
    .select('*')
    .ilike('name', name)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Delete a tag globally (will cascade delete all assignments)
 */
export async function deleteTag(tagId: string): Promise<void> {
  return baseService.remove(TAGS_TABLE, tagId);
}

/**
 * Assign a tag to a client
 */
export async function assignTagToClient(clientId: string, tagId: string): Promise<ClientTagAssignment> {
  const { data, error } = await supabase
    .from(ASSIGNMENTS_TABLE)
    .insert({ client_id: clientId, tag_id: tagId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove a tag from a client
 */
export async function removeTagFromClient(clientId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from(ASSIGNMENTS_TABLE)
    .delete()
    .eq('client_id', clientId)
    .eq('tag_id', tagId);

  if (error) throw error;
}

/**
 * Get count of clients using each tag
 */
export async function getTagUsageCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from(ASSIGNMENTS_TABLE)
    .select('tag_id');

  if (error) throw error;

  const counts: Record<string, number> = {};
  data?.forEach((item) => {
    counts[item.tag_id] = (counts[item.tag_id] || 0) + 1;
  });

  return counts;
}

/**
 * Fetch client IDs that have specific tags
 */
export async function fetchClientIdsByTags(tagIds: string[]): Promise<string[]> {
  if (tagIds.length === 0) return [];

  const { data, error } = await supabase
    .from(ASSIGNMENTS_TABLE)
    .select('client_id')
    .in('tag_id', tagIds);

  if (error) throw error;

  const clientIds = new Set<string>();
  data?.forEach((item) => clientIds.add(item.client_id));

  return Array.from(clientIds);
}

/**
 * Sync tags for a client (removes old tags and adds new ones)
 */
export async function syncClientTags(clientId: string, tagIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from(ASSIGNMENTS_TABLE)
    .delete()
    .eq('client_id', clientId);

  if (deleteError) throw deleteError;

  if (tagIds.length > 0) {
    const assignments = tagIds.map((tagId) => ({
      client_id: clientId,
      tag_id: tagId,
    }));

    const { error: insertError } = await supabase
      .from(ASSIGNMENTS_TABLE)
      .insert(assignments);

    if (insertError) throw insertError;
  }
}
