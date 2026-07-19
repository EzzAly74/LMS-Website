/**
 * Canonical response envelope produced by the Laravel backend
 * (see app/Http/Traits/ApiResponse.php). This is the ONLY wrapper shape in the
 * API — do not invent a per-feature envelope.
 *
 * success:    { status: 'success', message, result? , meta? }
 * error:      { status: 'error',   message, errors? }   // with a real HTTP status code
 */
export type ApiStatus = 'success' | 'error';

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiResponse<T = unknown> {
  status: ApiStatus;
  message: string;
  result?: T;
  meta?: PaginationMeta;
  errors?: Record<string, string[]>;
}

/** Convenience view over a paginated response, built by feature code from result + meta. */
export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export function isApiError(response: ApiResponse): boolean {
  return response.status === 'error';
}
