import { Routes } from '@angular/router';

export const WHO_WE_ARE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/who-we-are-page/who-we-are-page.component').then(
        (m) => m.WhoWeArePageComponent,
      ),
    title: 'core.nav.who_we_are',
  },
];
