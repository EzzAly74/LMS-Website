import { Routes } from '@angular/router';

export const COURSE_DETAIL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/course-detail-page/course-detail-page.component').then(
        (m) => m.CourseDetailPageComponent,
      ),
    title: 'feature.course_detail.title',
  },
];
