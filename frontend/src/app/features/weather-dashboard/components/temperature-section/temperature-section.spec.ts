import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemperatureSection } from './temperature-section';
import { provideEchartsCore } from 'ngx-echarts';
import { WeatherRecord } from '../../../../core/models/weather.interface';

describe('TemperatureSection', () => {
  let component: TemperatureSection;
  let fixture: ComponentFixture<TemperatureSection>;

  beforeAll(() => {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemperatureSection],
      providers: [
        provideEchartsCore({ echarts: () => import('echarts') })
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TemperatureSection);
    component = fixture.componentInstance;
    
    // Set required input
    const mockData: WeatherRecord[] = [
      { fecha: '2023-01-01', tmax: 15, tmed: 10, tmin: 5, prec: 2.5, racha: 20, velmedia: 10, sol: 8, presMax: 1020, presMin: 1010 }
    ];
    fixture.componentRef.setInput('data', mockData);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate temperature metrics correctly', () => {
    expect(component.maxTemp()).toBe('15.0');
    expect(component.minTemp()).toBe('5.0');
    expect(component.avgTemp()).toBe('10.0');
  });
});
