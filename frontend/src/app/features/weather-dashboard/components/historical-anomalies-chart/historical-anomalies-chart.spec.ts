import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoricalAnomaliesChart } from './historical-anomalies-chart';
import { provideEchartsCore } from 'ngx-echarts';
import { ThemeService } from '../../../../core/services/theme.service';
import { signal } from '@angular/core';

describe('HistoricalAnomaliesChart', () => {
  let component: HistoricalAnomaliesChart;
  let fixture: ComponentFixture<HistoricalAnomaliesChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoricalAnomaliesChart],
      providers: [
        { provide: ThemeService, useValue: { isDark: signal(false) } },
        provideEchartsCore({ echarts: () => import('echarts') })
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistoricalAnomaliesChart);
    component = fixture.componentInstance;
  });

  it('should create and handle empty data', () => {
    fixture.componentRef.setInput('weatherData', []);
    fixture.detectChanges();
    expect(component.chartOption()).toEqual({});
  });

  it('should compute temp anomalies and format tooltip (+)', () => {
    fixture.componentRef.setInput('weatherData', [
      { fecha: '1975-01-01', tmed: 10, prec: 5 },
      { fecha: '1976-01-01', tmed: 20, prec: 10 },
      { fecha: '1977-01-01', tmed: null }
    ] as any);
    fixture.detectChanges();
    
    const option: any = component.chartOption();
    expect(option.series[0].data[0].value).toBe(-5);
    expect(option.series[0].data[1].value).toBe(5);
    
    const tooltip = option.tooltip.formatter([{ name: '1976', value: 5 }]);
    expect(tooltip).toContain('+5.00 °C');
  });

  it('should compute prec anomalies and format tooltip (-)', () => {
    fixture.componentRef.setInput('weatherData', [
      { fecha: '1975-01-01', tmed: 10, prec: 5 },
      { fecha: '1976-01-01', tmed: 20, prec: 15 }
    ] as any);
    component.activeMetric.set('prec');
    fixture.detectChanges();
    
    const option: any = component.chartOption();
    expect(option.series[0].data[0].value).toBe(-5);
    
    const tooltip = option.tooltip.formatter([{ name: '1975', value: -5 }]);
    expect(tooltip).toContain('-5.00 mm');
  });
});
