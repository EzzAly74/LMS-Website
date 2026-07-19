import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { LmsRoutes } from '../enums/lms-routes.enum';
import { AuthService } from './auth.service';

/** Keeps authenticated users out of guest-only routes (e.g. Login). */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? router.createUrlTree([LmsRoutes.Catalogue]) : true;
};
