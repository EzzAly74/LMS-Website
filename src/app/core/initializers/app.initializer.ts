import { inject } from '@angular/core';
import { catchError, firstValueFrom, of } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { LanguageService } from '../services/language.service';

/**
 * Runs before the app renders: loads the active language's translations and,
 * when a token exists, rehydrates the current user (clearing the session if the
 * token is no longer valid). Injected inside an APP_INITIALIZER factory.
 */
export function appInitializerFactory(): () => Promise<unknown> {
  const language = inject(LanguageService);
  const auth = inject(AuthService);

  return async () => {
    await firstValueFrom(language.init());

    if (!auth.hasToken()) {
      return;
    }

    await firstValueFrom(
      auth.loadCurrentUser().pipe(
        catchError(() => {
          auth.clearSession();
          return of(null);
        }),
      ),
    );
  };
}
