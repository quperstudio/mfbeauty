import { ClientTag, ClientTagAssignment } from '../types/database';
import { TagSchemaType } from '../schemas/client.schema';
import * as baseService from './base.service';
import { supabase } from '../lib/supabase';

const TAGS_TABLE = 'client_tags';
const ASSIGNMENTS_TABLE = 'client_tags_assignments';

// GESTIÓN DE ETIQUETAS (CRUD en la tabla TAGS)
// ------------------------------------------

/** Obtiene todas las etiquetas ordenadas por nombre */
export async function fetchAllTags(): Promise<ClientTag[]> {
  return baseService.fetchAll<ClientTag>(TAGS_TABLE, {
    column: 'name',
    ascending: true,
  });
}

/** Crea una nueva etiqueta */
export async function createTag(tagData: TagSchemaType): Promise<ClientTag> {
  return baseService.create<ClientTag, TagSchemaType>(TAGS_TABLE, tagData);
}

/**
 * Revisa si una etiqueta con el nombre dado ya existe (insensible a mayúsculas)
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

/** Elimina una etiqueta globalmente (elimina también todas sus asignaciones por cascada) */
export async function deleteTag(tagId: string): Promise<void> {
  return baseService.remove(TAGS_TABLE, tagId);
}

// ASIGNACIÓN DE ETIQUETAS (Operaciones en la tabla ASSIGNMENTS)
// -------------------------------------------------------------

/** Obtiene las etiquetas de un cliente específico */
export async function fetchTagsByClientId(clientId: string): Promise<ClientTag[]> {
  const { data, error } = await supabase
    .from(ASSIGNMENTS_TABLE)
    .select(`
      tag_id,
      ${TAGS_TABLE} (id, name, created_at)
    `)
    .eq('client_id', clientId);

  if (error) throw error;

  // Mapea los resultados para extraer solo los objetos de etiqueta anidados
  return data?.map((item: any) => item.client_tags).filter(Boolean) || [];
}

/** Asigna una etiqueta a un cliente */
export async function assignTagToClient(clientId: string, tagId: string): Promise<ClientTagAssignment> {
  const { data, error } = await supabase
    .from(ASSIGNMENTS_TABLE)
    .insert({ client_id: clientId, tag_id: tagId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Remueve una etiqueta de un cliente */
export async function removeTagFromClient(clientId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from(ASSIGNMENTS_TABLE)
    .delete()
    .eq('client_id', clientId)
    .eq('tag_id', tagId);

  if (error) throw error;
}

/**
 * Sincroniza las etiquetas de un cliente.
 * Elimina todas las etiquetas anteriores y asigna el nuevo conjunto.
 */
export async function syncClientTags(clientId: string, tagIds: string[]): Promise<void> {
  // 1. Eliminar asignaciones existentes para el cliente
  const { error: deleteError } = await supabase
    .from(ASSIGNMENTS_TABLE)
    .delete()
    .eq('client_id', clientId);

  if (deleteError) throw deleteError;

  // 2. Insertar nuevas asignaciones si hay etiquetas
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

// FUNCIONES DE CONSULTA (UTILITY)
// ------------------------------

/** Obtiene el conteo de clientes que usan cada etiqueta */
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

/** Obtiene los IDs de clientes que tienen un conjunto específico de etiquetas */
export async function fetchClientIdsByTags(tagIds: string[]): Promise<string[]> {
  if (tagIds.length === 0) return [];

  const { data, error } = await supabase
    .from(ASSIGNMENTS_TABLE)
    .select('client_id')
    .in('tag_id', tagIds);

  if (error) throw error;

  // Usar Set para asegurar IDs únicos y luego convertir a array
  const clientIds = new Set<string>();
  data?.forEach((item) => clientIds.add(item.client_id));

  return Array.from(clientIds);
}