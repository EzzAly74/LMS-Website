import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { LmsRoutes } from '../enums/lms-routes.enum';
import { ApiResponse } from '../models/api-response.model';
import { NotificationService } from '../services/notification.service';

const HTTP_UNAUTHORIZED = 401;
const HTTP_UNPROCESSABLE = 422;

/**
 * Centralizes error handling so features don't duplicate generic toasts:
 * - 401 on an authenticated request → session expired: clear + redirect to login.
 * - 401 without a token / 422 → left for the caller (inline form/field handling).
 * - everything else → a single global error toast with the backend message.
 * The error is always re-thrown so feature code can still react.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notify = inject(NotificationService);
  const translate = inject(TranslateService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const hadAuth = req.headers.has('Authorization');

      if (error.status === HTTP_UNAUTHORIZED && hadAuth) {
        auth.clearSession();
        void router.navigate([LmsRoutes.Login]);
        return throwError(() => error);
      }

      const callerHandles = error.status === HTTP_UNAUTHORIZED || error.status === HTTP_UNPROCESSABLE;
      if (!callerHandles) {
        const body = error.error as ApiResponse | null;
        notify.error(body?.message ?? translate.instant('common.error_generic'));
      }

      return throwError(() => error);
    }),
  );
};
