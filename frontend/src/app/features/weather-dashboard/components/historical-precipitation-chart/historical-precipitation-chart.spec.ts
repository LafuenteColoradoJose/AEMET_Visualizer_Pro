import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoricalPrecipitationChart } from './historical-precipitation-chart';
import { provideEchartsCore } from 'ngx-echarts';
import { ThemeService } from '../../../../core/services/theme.service';
import { signal } from '@angular/core';

describe('HistoricalPrecipitationChart', () => {
  let component: HistoricalPrecipitationChart;
  let fixture: ComponentFixture<HistoricalPrecipitationChart>;
  let mockThemeService: any;

  beforeEach(async () => {
    mockThemeService = {
      isDark: signal(false)
    };

    await TestBed.configureTestingModule({
      imports: [HistoricalPrecipitationChart],
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
        provideEchartsCore({ echarts: () => import('echarts') })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoricalPrecipitationChart);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    // Es input.required, así que tenemos que darle un valor antes de detectChanges
    fixture.componentRef.setInput('weatherData', []);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should return empty object if no data provided', () => {
    fixture.componentRef.setInput('weatherData', []);
    fixture.detectChanges();
    
    // Al leer el computed chartOption() debería devolver {}
    expect(component.chartOption()).toEqual({});
  });

  it('should return valid chart options when data is provided (light mode)', () => {
    const data = [
      { fecha: '2010-01-01', prec: 10, tmax: 0, tmed: 0, tmin: 0, racha: 0, velmedia: 0, sol: 0, presMax: 0, presMin: 0 },
      { fecha: '2011-01-01', prec: 20, tmax: 0, tmed: 0, tmin: 0, racha: 0, velmedia: 0, sol: 0, presMax: 0, presMin: 0 },
      { fecha: '2012-01-01', prec: 30, tmax: 0, tmed: 0, tmin: 0, racha: 0, velmedia: 0, sol: 0, presMax: 0, presMin: 0 },
      { fecha: '2013-01-01', prec: 40, tmax: 0, tmed: 0, tmin: 0, racha: 0, velmedia: 0, sol: 0, presMax: 0, presMin: 0 },
      { fecha: '2014-01-01', prec: 50, tmax: 0, tmed: 0, tmin: 0, racha: 0, velmedia: 0, sol: 0, presMax: 0, presMin: 0 },
      { fecha: '2015-01-01', prec: 60, tmax: 0, tmed: 0, tmin: 0, racha: 0, velmedia: 0, sol: 0, presMax: 0, presMin: 0 }
    ];
    fixture.componentRef.setInput('weatherData', data);
    fixture.detectChanges();
    
    const options: any = component.chartOption();
    expect(options.title.text).toBe('Precipitación Total Anual');
    expect(options.title.textStyle.color).toBe('#424242'); // light mode
    expect(options.series.length).toBe(2);
    
    // Verifica los valores
    expect(options.xAxis.data).toContain('2010');
    expect(options.xAxis.data).toContain('2015');
    
    // Verifica la media móvil del año 2014 (índice 4 -> 10+20+30+40+50 = 150 / 5 = 30)
    expect(options.series[1].data[4]).toBe(30);
  });

  it('should return valid chart options in dark mode', () => {
    mockThemeService.isDark.set(true);
    
    const data = [
      { fecha: '2023-01-01', prec: 100, tmax: 0, tmed: 0, tmin: 0, racha: 0, velmedia: 0, sol: 0, presMax: 0, presMin: 0 }
    ];
    fixture.componentRef.setInput('weatherData', data);
    fixture.detectChanges();
    
    const options: any = component.chartOption();
    expect(options.title.textStyle.color).toBe('#e0e0e0'); // dark mode
  });
  
  it('should handle undefined or invalid prec data gracefully', () => {
    const data = [
      { fecha: '2023-01-01', prec: -5, tmax: 0, tmed: 0, tmin: 0, racha: 0, velmedia: 0, sol: 0, presMax: 0, presMin: 0 },
      { fecha: '2024-01-01', prec: null as any, tmax: 0, tmed: 0, tmin: 0, racha: 0, velmedia: 0, sol: 0, presMax: 0, presMin: 0 }
    ];
    fixture.componentRef.setInput('weatherData', data);
    fixture.detectChanges();
    
    // No hay datos válidos de precipitación, devuelve {}
    expect(component.chartOption()).toEqual({});
  });
});
