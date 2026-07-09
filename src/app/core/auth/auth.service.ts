import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { ApiResponse } from '../models/api-response.model';
import { ApiService } from '../services/api.service';
import { AuthUser } from './models/auth-user.model';
import { LoginPayload, LoginResult } from './models/login.model';
import { TokenStorageService } from './token-storage.service';

/**
 * Owns authentication state (token + current user) for the learner website.
 * Auth is per-user Sanctum: POST /auth/user/login returns a bearer token that
 * the auth interceptor attaches to every subsequent request.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly _user = signal<AuthUser | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  /** True when a token exists but the profile has not been fetched yet. */
  hasToken(): boolean {
    return this.tokenStorage.get() !== null;
  }

  login(payload: LoginPayload): Observable<ApiResponse<LoginResult>> {
    return this.api.post<LoginResult>('auth/user/login', payload).pipe(
      tap((res) => {
        if (res.status === 'success' && res.result) {
          this.tokenStorage.set(res.result.token);
          this._user.set(res.result.user);
        }
      }),
    );
  }

  /** Rehydrate the current user from the stored token (used at app startup). */
  loadCurrentUser(): Observable<ApiResponse<AuthUser>> {
    return this.api.get<AuthUser>('auth/user/me').pipe(
      tap((res) => {
        if (res.status === 'success' && res.result) {
          this._user.set(res.result);
        }
      }),
    );
  }

  logout(): Observable<ApiResponse> {
    return this.api.post('auth/user/logout').pipe(tap(() => this.clearSession()));
  }

  /** Clears local session state without a server round-trip (e.g. on 401). */
  clearSession(): void {
    this.tokenStorage.clear();
    this._user.set(null);
  }
}
