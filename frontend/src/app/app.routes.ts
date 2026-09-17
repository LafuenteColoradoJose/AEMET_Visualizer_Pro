import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/weather-dashboard/pages/dashboard-page/dashboard-page').then(c => c.DashboardPage)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
