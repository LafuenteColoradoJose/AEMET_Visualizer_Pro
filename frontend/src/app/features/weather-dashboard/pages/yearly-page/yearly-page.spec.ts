import { describe, it, expect, beforeEach, vitest } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YearlyPage } from './yearly-page';
import { provideEchartsCore } from 'ngx-echarts';
import { WeatherService } from '../../../../core/services/weather.service';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('YearlyPage', () => {
  let component: YearlyPage;
  let fixture: ComponentFixture<YearlyPage>;
  let weatherServiceSpy: any;

  beforeEach(async () => {
    weatherServiceSpy = {
      getHistoricalData: vitest.fn().mockReturnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [YearlyPage, NoopAnimationsModule],
      providers: [
        provideEchartsCore({ echarts: () => import('echarts') }),
        { provide: WeatherService, useValue: weatherServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(YearlyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load data on init', () => {
    expect(component).toBeTruthy();
    expect(weatherServiceSpy.getHistoricalData).toHaveBeenCalled();
  });

  it('should reload data on year change', () => {
    weatherServiceSpy.getHistoricalData.mockClear();
    component.onYearSelected(2023);
    expect(weatherServiceSpy.getHistoricalData).toHaveBeenCalledWith('5402', '2023-01-01', '2023-12-31');
    expect(component.selectedYear()).toBe(2023);
    expect(component.searchInput()).toBe('2023');
  });

  it('should handle error when loading data', () => {
    weatherServiceSpy.getHistoricalData.mockReturnValue(throwError(() => new Error('API Error')));
    const consoleSpy = vitest.spyOn(console, 'error').mockImplementation(() => {});
    
    component.onYearSelected(2022); // calls loadData
    
    expect(consoleSpy).toHaveBeenCalled();
    expect(component.weatherData()).toEqual([]);
    expect(component.loading()).toBe(false);
    consoleSpy.mockRestore();
  });

  it('should render loading state', () => {
    component.loading.set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loader-container')).toBeTruthy();
  });

  it('should render grid when data is present', () => {
    component.loading.set(false);
    component.weatherData.set([{ fecha: '2023-01-01', tmax: 10 }] as any);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.dashboard-grid')).toBeTruthy();
  });

  it('should render empty state when no data', () => {
    component.loading.set(false);
    component.weatherData.set([]);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state')).toBeTruthy();
  });
});
