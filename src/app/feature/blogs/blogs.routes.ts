import { Routes } from '@angular/router';

export const BLOGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/blog-listing-page/blog-listing-page.component').then(
        (m) => m.BlogListingPageComponent,
      ),
    title: 'core.nav.blogs',
  },
  {
    path: ':slug',
    loadComponent: () =>
      import('./components/blog-detail-page/blog-detail-page.component').then(
        (m) => m.BlogDetailPageComponent,
      ),
    title: 'core.nav.blogs',
  },
];
