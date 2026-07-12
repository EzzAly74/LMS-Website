import { Routes } from '@angular/router';

export const MY_LEARNINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/my-learnings-page/my-learnings-page.component').then(
        (m) => m.MyLearningsPageComponent,
      ),
    title: 'core.nav.my_learnings',
  },
];
