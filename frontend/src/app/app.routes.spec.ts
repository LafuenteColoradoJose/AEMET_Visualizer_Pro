import { describe, it, expect } from "vitest";
import { routes } from './app.routes';
import { DashboardPage } from './features/weather-dashboard/pages/dashboard-page/dashboard-page';
import { YearlyPage } from './features/weather-dashboard/pages/yearly-page/yearly-page';
import { HistoricalPage } from './features/weather-dashboard/pages/historical-page/historical-page';
import { PredictionPlaygroundComponent } from './features/predictions/components/prediction-playground/prediction-playground.component';

describe('App Routes', () => {
  it('should have the correct routes', () => {
    expect(routes.length).toBe(6);
  });

  it('should load DashboardPage for overview', async () => {
    const route = routes.find(r => r.path === 'overview');
    const component = await (route?.loadComponent as Function)();
    expect(component).toBe(DashboardPage);
  });

  it('should load YearlyPage for yearly', async () => {
    const route = routes.find(r => r.path === 'yearly');
    const component = await (route?.loadComponent as Function)();
    expect(component).toBe(YearlyPage);
  });

  it('should load HistoricalPage for historical', async () => {
    const route = routes.find(r => r.path === 'historical');
    const component = await (route?.loadComponent as Function)();
    expect(component).toBe(HistoricalPage);
  });

  it('should load PredictionPlaygroundComponent for predictions', async () => {
    const route = routes.find(r => r.path === 'predictions');
    const component = await (route?.loadComponent as Function)();
    expect(component).toBe(PredictionPlaygroundComponent);
  });
});
