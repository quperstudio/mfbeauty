/**
 * API Response Types
 *
 * Standardized response types for API operations across the application.
 * These types ensure consistent error handling and response structure.
 */

/**
 * Standard API Error Response
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Standard Success Response for mutations
 */
export interface ApiResponse<T = void> {
  data?: T;
  error: string | null;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Query Result with loading and error states
 */
export interface QueryResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Mutation Result
 */
export interface MutationResult<T = void> {
  mutate: (data: T) => Promise<ApiResponse<T>>;
  loading: boolean;
  error: string | null;
}

/**
 * Filter Options for queries
 */
export interface FilterOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Date Range Filter
 */
export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

/**
 * Realtime Subscription Options
 */
export interface RealtimeOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  filter?: string;
}
