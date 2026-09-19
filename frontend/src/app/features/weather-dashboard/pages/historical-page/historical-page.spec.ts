import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoricalPage } from './historical-page';
import { WeatherService } from '../../../../core/services/weather.service';
import { of, throwError } from 'rxjs';
import { provideEchartsCore } from 'ngx-echarts';

describe('HistoricalPage', () => {
  let component: HistoricalPage;
  let fixture: ComponentFixture<HistoricalPage>;
  let weatherServiceSpy: any;

  beforeEach(async () => {
    weatherServiceSpy = {
      getHistoricalData: vitest.fn().mockReturnValue(of([
        { fecha: '1970-01-01', tmed: 15 }
      ]))
    };

    await TestBed.configureTestingModule({
      imports: [HistoricalPage],
      providers: [
        { provide: WeatherService, useValue: weatherServiceSpy },
        provideEchartsCore({ echarts: { init: () => ({ setOption: () => {}, dispose: () => {}, resize: () => {}, getWidth: () => 100, getHeight: () => 100, isDisposed: () => false }) } })
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistoricalPage);
    component = fixture.componentInstance;
  });

  it('should create and load data on init', () => {
    fixture.detectChanges(); // calls ngOnInit
    expect(component).toBeTruthy();
    expect(weatherServiceSpy.getHistoricalData).toHaveBeenCalledWith('5402', '1950-01-01');
    expect(component.weatherData().length).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it('should handle error when loading data', () => {
    weatherServiceSpy.getHistoricalData.mockReturnValue(throwError(() => new Error('API Error')));
    const consoleSpy = vitest.spyOn(console, 'error').mockImplementation(() => {});
    
    fixture.detectChanges();
    
    expect(consoleSpy).toHaveBeenCalled();
    expect(component.weatherData()).toEqual([]);
    expect(component.loading()).toBe(false);
    consoleSpy.mockRestore();
  });

  it('should display empty state if no data', () => {
    weatherServiceSpy.getHistoricalData.mockReturnValue(of([]));
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state')).toBeTruthy();
  });

  it('should display loader while loading', () => {
    fixture.detectChanges(); // Init load finishes
    component.loading.set(true); // Manually trigger loading state again
    fixture.detectChanges(); // Update view
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loader-container')).toBeTruthy();
  });
});
