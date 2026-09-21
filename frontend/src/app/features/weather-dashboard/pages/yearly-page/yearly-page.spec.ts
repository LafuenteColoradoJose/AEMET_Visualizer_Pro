
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { YearlyPage } from './yearly-page';
import { WeatherService } from '../../../../core/services/weather.service';
import { StationService } from '../../../../core/services/station.service';
import { of, throwError } from 'rxjs';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideEchartsCore } from 'ngx-echarts';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('YearlyPage', () => {
  let component: YearlyPage;
  let fixture: ComponentFixture<YearlyPage>;
  let weatherServiceSpy: any;
  let mockStationService: any;

  beforeEach(async () => {
    weatherServiceSpy = {
      getHistoricalData: vi.fn().mockReturnValue(of([{ fecha: '2024-01-01', tmed: 10 }]))
    };

    mockStationService = {
      selectedStation: signal({ id: 'ANDALUCIA', name: 'Andalucía (Regional)' }),
      loadStations: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [YearlyPage],
      providers: [
        { provide: WeatherService, useValue: weatherServiceSpy },
        { provide: StationService, useValue: mockStationService },
        provideAnimationsAsync(),
        provideHttpClient(),
        provideEchartsCore({ echarts: () => import('echarts') })
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(YearlyPage);
    component = fixture.componentInstance;
  });

  it('should create and fetch data on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(weatherServiceSpy.getHistoricalData).toHaveBeenCalled();
  });

  it('should handle onSearchChange and filteredYears', () => {
    fixture.detectChanges();
    component.onSearchChange('202');
    expect(component.searchInput()).toBe('202');
    expect(component.filteredYears().length).toBeGreaterThan(0);
    
    component.onSearchChange('');
    expect(component.filteredYears().length).toBe(component.years.length);
  });

  it('should fetch data onYearSelected', () => {
    fixture.detectChanges();
    weatherServiceSpy.getHistoricalData.mockClear();
    component.onYearSelected(2022);
    expect(component.selectedYear()).toBe(2022);
    expect(component.searchInput()).toBe('2022');
    expect(weatherServiceSpy.getHistoricalData).toHaveBeenCalledWith('ANDALUCIA', '2022-01-01', '2022-12-31');
  });

  it('should handle error when fetching data', () => {
    weatherServiceSpy.getHistoricalData.mockReturnValue(throwError(() => new Error('API Error')));
    fixture.detectChanges();
    
    expect(component.weatherData()).toEqual([]);
    expect(component.loading()).toBe(false);
  });

  it('should compute isPartialYear correctly', () => {
    fixture.detectChanges();
    // Default is current year (2024, etc), should return false
    expect(component.isPartialYear()).toBe(false);

    // Past year with incomplete data
    component.selectedYear.set(2022);
    component.weatherData.set([{ fecha: '2022-01-01' }] as any);
    expect(component.isPartialYear()).toBe(true); // Only 1 record, missing > 30 days

    // Past year with complete data
    const completeData = Array(365).fill({ fecha: '2022-01-01' });
    component.weatherData.set(completeData as any);
    expect(component.isPartialYear()).toBe(false);
  });
});
