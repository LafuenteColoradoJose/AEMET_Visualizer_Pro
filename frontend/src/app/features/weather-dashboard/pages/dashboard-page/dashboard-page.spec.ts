
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardPage } from './dashboard-page';
import { WeatherService } from '../../../../core/services/weather.service';
import { StationService } from '../../../../core/services/station.service';
import { of, throwError } from 'rxjs';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideEchartsCore } from 'ngx-echarts';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;
  let weatherServiceSpy: any;
  let mockStationService: any;

  beforeEach(async () => {
    weatherServiceSpy = {
      getHistoricalData: vi.fn().mockReturnValue(of([
        { fecha: '2023-01-01', tmed: 10 },
        { fecha: '2023-12-31', tmed: 15 }
      ]))
    };

    mockStationService = {
      selectedStation: signal({ id: 'ANDALUCIA', name: 'Andalucía (Regional)' }),
      loadStations: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        { provide: WeatherService, useValue: weatherServiceSpy },
        { provide: StationService, useValue: mockStationService },
        provideAnimationsAsync(),
        provideHttpClient(),
        provideEchartsCore({ echarts: () => import('echarts') })
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
  });

  it('should create and fetch data on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(weatherServiceSpy.getHistoricalData).toHaveBeenCalledWith('ANDALUCIA', undefined, undefined);
    expect(component.dateRange.value.start).toEqual(new Date('2023-01-01'));
  });

  it('should set preset to 12m', () => {
    fixture.detectChanges();
    weatherServiceSpy.getHistoricalData.mockClear();
    component.setPreset('12m');
    expect(component.dateRange.value.start).toBeDefined();
    expect(weatherServiceSpy.getHistoricalData).toHaveBeenCalled();
  });

  it('should set preset to ytd', () => {
    fixture.detectChanges();
    component.setPreset('ytd');
    expect(component.dateRange.value.start).toBeDefined();
  });

  it('should set preset to 3y', () => {
    fixture.detectChanges();
    component.setPreset('3y');
    expect(component.dateRange.value.start).toBeDefined();
  });

  it('should load data with custom dates', () => {
    fixture.detectChanges();
    weatherServiceSpy.getHistoricalData.mockClear();
    component.dateRange.patchValue({ start: new Date('2022-01-01'), end: new Date('2022-12-31') });
    component.loadData();
    expect(weatherServiceSpy.getHistoricalData).toHaveBeenCalledWith('ANDALUCIA', '2022-01-01', '2022-12-31');
  });

  it('should handle error in loadData', () => {
    weatherServiceSpy.getHistoricalData.mockReturnValue(throwError(() => new Error('API Error')));
    fixture.detectChanges();
    expect(component.loading()).toBe(false);
  });
});
