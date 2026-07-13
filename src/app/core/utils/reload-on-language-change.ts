import { effect, inject } from '@angular/core';

import { LanguageService } from '../services/language.service';

/**
 * Re-runs `callback` whenever the active language changes (never on the
 * initial read). Backend responses are localized via the Accept-Language
 * header (see localeInterceptor) — anything already fetched needs an
 * explicit refetch on language switch, since Angular has no way to know an
 * HTTP response is locale-sensitive. Call from a component/service
 * constructor (a valid injection context).
 */
export function reloadOnLanguageChange(callback: () => void): void {
  const language = inject(LanguageService);
  let previous = language.current();

  effect(
    () => {
      const current = language.current();
      if (current !== previous) {
        previous = current;
        callback();
      }
    },
    // `callback` always sets a loading signal (and eventually the fetched
    // data) — writes that don't feed back into `language`, so this can't loop.
    { allowSignalWrites: true },
  );
}
