import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'overview',
    loadComponent: () => import('./features/weather-dashboard/pages/dashboard-page/dashboard-page').then(c => c.DashboardPage),
    data: { animation: 'OverviewPage' }
  },
  {
    path: 'yearly',
    loadComponent: () => import('./features/weather-dashboard/pages/yearly-page/yearly-page').then(c => c.YearlyPage),
    data: { animation: 'YearlyPage' }
  },
  {
    path: 'historical',
    loadComponent: () => import('./features/weather-dashboard/pages/historical-page/historical-page').then(c => c.HistoricalPage),
    data: { animation: 'HistoricalPage' }
  },
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'overview'
  }
];
