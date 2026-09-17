import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardPage } from './dashboard-page';
import { WeatherService } from '../../../../core/services/weather.service';
import { WeatherRecord } from '../../../../core/models/weather.interface';
import { of, throwError } from 'rxjs';
import { provideEchartsCore } from 'ngx-echarts';

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;
  let weatherServiceSpy: any;

  const mockData: WeatherRecord[] = [
    { fecha: '2023-01-01', tmax: 15, tmed: 10, tmin: 5, racha: 20, velmedia: 10, sol: 8, presMax: 1020, presMin: 1010 }
  ];

  beforeAll(() => {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  });

  beforeEach(async () => {
    weatherServiceSpy = {
      getHistoricalData: vitest.fn().mockReturnValue(of(mockData))
    };

    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        { provide: WeatherService, useValue: weatherServiceSpy },
        provideEchartsCore({ echarts: () => import('echarts') })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
  });

  it('should create and fetch data on init', async () => {
    // OnInit se ejecuta al hacer el primer detectChanges
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();
    expect(weatherServiceSpy.getHistoricalData).toHaveBeenCalledWith('5402');
    
    // Debería guardar los datos y quitar el loading
    expect(component.weatherData()).toEqual(mockData);
    expect(component.loading()).toBe(false);
  });

  it('should handle errors correctly on init', async () => {
    // Sobrescribimos el mock para que devuelva error
    weatherServiceSpy.getHistoricalData.mockReturnValue(throwError(() => new Error('API Error')));
    
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.weatherData()).toEqual([]);
    expect(component.loading()).toBe(false);
  });
});
