
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoricalPage } from './historical-page';
import { WeatherService } from '../../../../core/services/weather.service';
import { StationService } from '../../../../core/services/station.service';
import { of, throwError } from 'rxjs';
import { provideEchartsCore } from 'ngx-echarts';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('HistoricalPage', () => {
  let component: HistoricalPage;
  let fixture: ComponentFixture<HistoricalPage>;
  let weatherServiceSpy: any;
  let mockStationService: any;

  beforeEach(async () => {
    weatherServiceSpy = {
      getHistoricalData: vi.fn().mockReturnValue(of([
        { fecha: '2020-01-01', tmed: 10 },
        { fecha: '2022-12-31', tmed: 15 }
      ]))
    };

    mockStationService = {
      selectedStation: signal({ id: 'ANDALUCIA', name: 'Andalucía (Regional)' }),
      loadStations: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [HistoricalPage],
      providers: [
        { provide: WeatherService, useValue: weatherServiceSpy },
        { provide: StationService, useValue: mockStationService },
        provideHttpClient(),
        provideEchartsCore({ echarts: () => import('echarts') })
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistoricalPage);
    component = fixture.componentInstance;
  });

  it('should create and fetch data on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(weatherServiceSpy.getHistoricalData).toHaveBeenCalledWith('ANDALUCIA', '1950-01-01');
    expect(component.dateRange()).toBe('2020 - 2022');
  });

  it('should handle error when fetching data', () => {
    weatherServiceSpy.getHistoricalData.mockReturnValue(throwError(() => new Error('API Error')));
    fixture.detectChanges();
    expect(component.weatherData()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(component.dateRange()).toBe('Calculando...');
  });
});
