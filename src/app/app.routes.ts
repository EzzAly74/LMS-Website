import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { AuthLayoutComponent } from './core/layout/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { LmsRoutes } from './core/enums/lms-routes.enum';

export const routes: Routes = [
  {
    path: LmsRoutes.Login,
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    loadChildren: () =>
      import('./feature/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadChildren: () =>
          import('./feature/landing/landing.routes').then(
            (m) => m.LANDING_ROUTES,
          ),
      },
      {
        path: LmsRoutes.Catalogue,
        loadChildren: () =>
          import('./feature/catalogue/catalogue.routes').then(
            (m) => m.CATALOGUE_ROUTES,
          ),
      },
      {
        path: LmsRoutes.CourseDetail,
        loadChildren: () =>
          import('./feature/course-detail/course-detail.routes').then(
            (m) => m.COURSE_DETAIL_ROUTES,
          ),
      },
      {
        path: LmsRoutes.WhoWeAre,
        loadChildren: () =>
          import('./feature/who-we-are/who-we-are.routes').then(
            (m) => m.WHO_WE_ARE_ROUTES,
          ),
      },
      {
        path: LmsRoutes.Blogs,
        loadChildren: () =>
          import('./feature/blogs/blogs.routes').then((m) => m.BLOGS_ROUTES),
      },
      {
        path: LmsRoutes.RequestDemo,
        loadChildren: () =>
          import('./feature/contact/contact.routes').then(
            (m) => m.CONTACT_ROUTES,
          ),
      },
      {
        path: LmsRoutes.MyLearnings,
        canActivate: [authGuard],
        loadChildren: () =>
          import('./feature/my-learnings/my-learnings.routes').then(
            (m) => m.MY_LEARNINGS_ROUTES,
          ),
      },
      {
        path: `${LmsRoutes.MyLearnings}/:courseId/learn`,
        canActivate: [authGuard],
        loadChildren: () =>
          import('./feature/course-player/course-player.routes').then(
            (m) => m.COURSE_PLAYER_ROUTES,
          ),
      },
      {
        path: LmsRoutes.Profile,
        canActivate: [authGuard],
        loadChildren: () =>
          import('./feature/profile/profile.routes').then(
            (m) => m.PROFILE_ROUTES,
          ),
      },
    ],
  },
  { path: '**', redirectTo: LmsRoutes.Catalogue },
];
