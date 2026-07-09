import { Routes } from '@angular/router';

import { guestGuard } from './core/auth/guest.guard';
import { AuthLayoutComponent } from './core/layout/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { LmsRoutes } from './core/enums/lms-routes.enum';

export const routes: Routes = [
  {
    path: LmsRoutes.Login,
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    loadChildren: () => import('./feature/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: LmsRoutes.Catalogue, pathMatch: 'full' },
      {
        path: LmsRoutes.Catalogue,
        loadChildren: () =>
          import('./feature/catalogue/catalogue.routes').then((m) => m.CATALOGUE_ROUTES),
      },
      {
        path: LmsRoutes.WhoWeAre,
        loadChildren: () =>
          import('./feature/who-we-are/who-we-are.routes').then((m) => m.WHO_WE_ARE_ROUTES),
      },
      {
        path: LmsRoutes.Blogs,
        loadChildren: () => import('./feature/blogs/blogs.routes').then((m) => m.BLOGS_ROUTES),
      },
      // Guarded learner features (My Learnings, Profile, Notifications) are wired
      // here as each is built. authGuard is applied per feature route.
    ],
  },
  { path: '**', redirectTo: LmsRoutes.Catalogue },
];
