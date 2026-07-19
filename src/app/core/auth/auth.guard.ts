import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { LmsRoutes } from '../enums/lms-routes.enum';
import { AuthService } from './auth.service';

/** Protects learner-only routes (My Learnings, Profile, etc.). */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree([LmsRoutes.Login], {
    queryParams: { returnUrl: state.url },
  });
};
