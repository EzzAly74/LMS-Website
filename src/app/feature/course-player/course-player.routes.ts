import { Routes } from '@angular/router';

export const COURSE_PLAYER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/course-player-page/course-player-page.component').then(
        (m) => m.CoursePlayerPageComponent,
      ),
    title: 'core.nav.my_learnings',
  },
];
