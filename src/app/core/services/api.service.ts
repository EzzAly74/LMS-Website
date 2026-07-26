import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

/**
 * Accepts primitive query params; null/undefined values are dropped.
 * Array values are sent as a single comma-separated query param (e.g.
 * `type=online,offline`) — the convention this API's list filters use.
 */
export type QueryParams = Record<string, string | number | boolean | string[] | number[] | null | undefined>;

interface RequestOptions {
  params?: QueryParams;
  context?: HttpContext;
}

/**
 * Typed HTTP wrapper around the Laravel API. Every response is an
 * {@link ApiResponse}. The active locale is attached by the locale interceptor
 * (Accept-Language header), and the bearer token by the auth interceptor —
 * this service stays transport-only.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  get<T>(path: string, options: RequestOptions = {}): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(this.url(path), {
      params: this.buildParams(options.params),
      context: options.context,
    });
  }

  post<T>(path: string, body?: unknown, options: RequestOptions = {}): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.url(path), body ?? {}, {
      params: this.buildParams(options.params),
      context: options.context,
    });
  }

  put<T>(path: string, body?: unknown, options: RequestOptions = {}): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(this.url(path), body ?? {}, {
      params: this.buildParams(options.params),
      context: options.context,
    });
  }

  patch<T>(path: string, body?: unknown, options: RequestOptions = {}): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(this.url(path), body ?? {}, {
      params: this.buildParams(options.params),
      context: options.context,
    });
  }

  delete<T>(path: string, options: RequestOptions = {}): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(this.url(path), {
      params: this.buildParams(options.params),
      context: options.context,
    });
  }

  /**
   * Fetch a binary file (e.g. a certificate JPEG/PDF) as a Blob. Goes
   * through HttpClient so the auth + locale interceptors still attach the
   * bearer token and Accept-Language — unlike a raw `<a href>` navigation,
   * which sends neither and would be rejected by the auth middleware.
   */
  getBlob(path: string, options: RequestOptions = {}): Observable<Blob> {
    return this.http.get(this.url(path), {
      params: this.buildParams(options.params),
      context: options.context,
      responseType: 'blob',
    });
  }

  private url(path: string): string {
    const normalized = path.startsWith('/') ? path.slice(1) : path;
    return `${this.baseUrl}/${normalized}`;
  }

  private buildParams(params?: QueryParams): HttpParams | undefined {
    if (!params) {
      return undefined;
    }
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        continue;
      }
      if (Array.isArray(value)) {
        if (value.length) {
          httpParams = httpParams.set(key, value.join(','));
        }
        continue;
      }
      httpParams = httpParams.set(key, String(value));
    }
    return httpParams;
  }
}
