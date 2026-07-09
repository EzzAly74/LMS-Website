import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { TokenStorageService } from '../auth/token-storage.service';

/** Attaches the Sanctum bearer token to outgoing requests when present. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStorageService).get();
  if (!token) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
