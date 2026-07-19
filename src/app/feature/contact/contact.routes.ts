import { Routes } from '@angular/router';

export const CONTACT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/contact-page/contact-page.component').then((m) => m.ContactPageComponent),
    title: 'core.nav.request_demo',
  },
];
