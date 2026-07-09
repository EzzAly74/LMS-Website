import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { LanguageService } from '../services/language.service';

/**
 * Attaches the active UI language as Accept-Language so the backend returns
 * localized (translatable) fields. The Laravel SetLocale middleware resolves
 * ar | en from this header.
 */
export const localeInterceptor: HttpInterceptorFn = (req, next) => {
  const lang = inject(LanguageService).current();
  return next(req.clone({ setHeaders: { 'Accept-Language': lang } }));
};
