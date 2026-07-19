import { Routes } from '@angular/router';

export const CATALOGUE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/catalogue-page/catalogue-page.component').then(
        (m) => m.CataloguePageComponent,
      ),
    title: 'core.nav.catalogue',
  },
];
