import { supabase } from '../lib/supabase';

/**
 * Base Service
 *
 * Generic CRUD operations for Supabase tables.
 * Use these functions as building blocks for entity-specific services.
 *
 * Example usage in a service:
 *
 * export async function fetchProducts(): Promise<Product[]> {
 *   return fetchAll<Product>('products');
 * }
 *
 * export async function createProduct(data: ProductInput): Promise<Product> {
 *   return create<Product, ProductInput>('products', data);
 * }
 */

/**
 * Fetch all records from a table
 */
export async function fetchAll<T>(
  table: string,
  orderBy?: { column: string; ascending?: boolean }
): Promise<T[]> {
  let query = supabase.from(table).select('*');

  if (orderBy) {
    query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data as T[]) || [];
}

/**
 * Fetch a single record by ID
 */
export async function fetchById<T>(table: string, id: string): Promise<T | null> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as T | null;
}

/**
 * Create a new record
 */
export async function create<T, TInput>(
  table: string,
  data: TInput
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result as T;
}

/**
 * Update an existing record by ID
 */
export async function update<T, TInput>(
  table: string,
  id: string,
  data: TInput
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result as T;
}

/**
 * Delete a record by ID
 */
export async function remove(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);

  if (error) throw error;
}

/**
 * Fetch records with custom filters
 */
export async function fetchWithFilter<T>(
  table: string,
  filters: Record<string, any>,
  orderBy?: { column: string; ascending?: boolean }
): Promise<T[]> {
  let query = supabase.from(table).select('*');

  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  if (orderBy) {
    query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data as T[]) || [];
}

/**
 * Count records in a table with optional filters
 */
export async function count(
  table: string,
  filters?: Record<string, any>
): Promise<number> {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { count: total, error } = await query;

  if (error) throw error;
  return total || 0;
}
