
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { YearlyPage } from './yearly-page';
import { WeatherService } from '../../../../core/services/weather.service';
import { StationService } from '../../../../core/services/station.service';
import { of, throwError, Subject } from 'rxjs';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideEchartsCore } from 'ngx-echarts';
import { provideHttpClient } from '@angular/common/http';
import { signal, Component, Input } from '@angular/core';
import { vi } from 'vitest';
import { YearlyCalendarHeatmap } from '../../components/yearly-calendar-heatmap/yearly-calendar-heatmap';
import { YearlyRadialChart } from '../../components/yearly-radial-chart/yearly-radial-chart';

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

  it('should handle error when fetching data and show empty state in DOM', () => {
    weatherServiceSpy.getHistoricalData.mockReturnValue(throwError(() => new Error('API Error')));
    fixture.detectChanges();
    
    expect(component.weatherData()).toEqual([]);
    expect(component.loading()).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state')).toBeTruthy();
  });

  it('should show loading spinner when loading is true', () => {
    // Override the mock to not complete immediately so loading stays true
    weatherServiceSpy.getHistoricalData = vi.fn().mockReturnValue(new Subject());
    
    // We create a new fixture to ensure clean state without the previous effects resolving
    const newFixture = TestBed.createComponent(YearlyPage);
    const newComponent = newFixture.componentInstance;
    
    newFixture.detectChanges();
    
    // The effect will trigger loadData, which sets loading to true
    // Because the observable is a Subject that hasn't emitted, loading stays true
    expect(newComponent.loading()).toBe(true);
    
    const compiled = newFixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loader-container')).not.toBeNull();
  });

  it('should compute isPartialYear correctly and show partial alert', () => {
    fixture.detectChanges();
    expect(component.isPartialYear()).toBe(false);

    component.selectedYear.set(2022);
    component.weatherData.set([{ fecha: '2022-01-01' }] as any);
    fixture.detectChanges();
    
    expect(component.isPartialYear()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.partial-alert')).toBeTruthy();

    const completeData = Array(365).fill({ fecha: '2022-01-01' });
    component.weatherData.set(completeData as any);
    fixture.detectChanges();
    
    expect(component.isPartialYear()).toBe(false);
    expect(compiled.querySelector('.partial-alert')).toBeFalsy();
  });
});
