import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/profile-page/profile-page.component').then((m) => m.ProfilePageComponent),
    title: 'core.profile_menu.profile',
  },
  // External Training (Figma 2201:83481; D-057).
  {
    path: 'external-training/new',
    loadComponent: () =>
      import('./components/external-training-form/external-training-form.component').then((m) => m.ExternalTrainingFormComponent),
    title: 'feature.external_training.add_title',
  },
  {
    path: 'external-training/:id/edit',
    loadComponent: () =>
      import('./components/external-training-form/external-training-form.component').then((m) => m.ExternalTrainingFormComponent),
    title: 'feature.external_training.edit_title',
  },
];
