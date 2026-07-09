import { Routes } from '@angular/router';

export const BLOGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/blogs-page/blogs-page.component').then((m) => m.BlogsPageComponent),
    title: 'core.nav.blogs',
  },
];
