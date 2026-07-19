import { Injectable } from '@angular/core';

const TOKEN_KEY = 'nas.token';

/** Persists the Sanctum bearer token. Single owner of the storage key. */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  }
}
