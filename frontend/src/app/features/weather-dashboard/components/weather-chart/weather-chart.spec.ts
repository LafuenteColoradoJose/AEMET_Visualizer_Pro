import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeatherChart } from './weather-chart';
import { WeatherRecord } from '../../../../core/models/weather.interface';
import { provideEchartsCore } from 'ngx-echarts';

describe('WeatherChart', () => {
  let component: WeatherChart;
  let fixture: ComponentFixture<WeatherChart>;

  const mockData: WeatherRecord[] = [
    { fecha: '2023-01-01', tmax: 15, tmed: 10, tmin: 5, racha: 20, velmedia: 10, sol: 8, presMax: 1020, presMin: 1010 },
    { fecha: '2023-01-02', tmax: 16, tmed: 11, tmin: 6, racha: 22, velmedia: 12, sol: 9, presMax: 1021, presMin: 1011 },
  ];

  beforeAll(() => {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherChart],
      providers: [provideEchartsCore({ echarts: () => import('echarts') })]
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherChart);
    component = fixture.componentInstance;
    
    // Asignar el valor al input required
    fixture.componentRef.setInput('data', mockData);
    
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute chartOption correctly based on input data', () => {
    const options = component.chartOption();
    
    // Verificar series
    expect(options.series).toHaveLength(3);
    expect((options.series as any)[0].name).toBe('Temp. Máxima');
    expect((options.series as any)[0].data).toEqual([15, 16]);
    
    expect((options.series as any)[1].name).toBe('Temp. Media');
    expect((options.series as any)[1].data).toEqual([10, 11]);
    
    expect((options.series as any)[2].name).toBe('Temp. Mínima');
    expect((options.series as any)[2].data).toEqual([5, 6]);

    // Verificar eje X
    expect((options.xAxis as any).data).toEqual(['2023-01-01', '2023-01-02']);
  });
});
