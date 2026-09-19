import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoricalAnomaliesChart } from './historical-anomalies-chart';
import { ComponentRef } from '@angular/core';

import { provideEchartsCore } from 'ngx-echarts';

describe('HistoricalAnomaliesChart', () => {
  let component: HistoricalAnomaliesChart;
  let fixture: ComponentFixture<HistoricalAnomaliesChart>;
  let componentRef: ComponentRef<HistoricalAnomaliesChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoricalAnomaliesChart],
      providers: [
        provideEchartsCore({ echarts: { init: () => ({ setOption: () => {}, dispose: () => {}, resize: () => {}, getWidth: () => 100, getHeight: () => 100, isDisposed: () => false }) } })
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistoricalAnomaliesChart);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  it('should create', () => {
    componentRef.setInput('weatherData', []);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should compute chartOption correctly for empty data', () => {
    componentRef.setInput('weatherData', []);
    fixture.detectChanges();
    expect(component.chartOption()).toEqual({});
  });

  it('should compute temperature anomalies', () => {
    componentRef.setInput('weatherData', [
      { fecha: '1975-01-01', tmed: 10, prec: 5 },
      { fecha: '1975-02-01', tmed: 14, prec: null },
      { fecha: '1976-01-01', tmed: 20, prec: 10 },
      { fecha: '1977-01-01', tmed: null, prec: undefined }
    ]);
    fixture.detectChanges();
    
    // Mean of 1975 = 12
    // Mean of 1976 = 20
    // Historical mean = (12 + 20) / 2 = 16
    // Anomaly 1975 = 12 - 16 = -4
    // Anomaly 1976 = 20 - 16 = +4
    
    const option: any = component.chartOption();
    expect(option.series).toBeDefined();
    expect(option.xAxis.data).toEqual(['1975', '1976']);
    expect(option.series[0].data[0].value).toBe(-4);
    expect(option.series[0].data[1].value).toBe(4);
    
    // Check tooltip
    const tooltip = option.tooltip.formatter([{ name: '1975', value: -4 }]);
    expect(tooltip).toContain('-4.00 °C');
  });

  it('should compute precipitation anomalies when metric changes', () => {
    componentRef.setInput('weatherData', [
      { fecha: '1975-01-01', tmed: 10, prec: 5 },
      { fecha: '1975-02-01', tmed: 14, prec: 15 }, // 1975 sum = 20
      { fecha: '1976-01-01', tmed: 20, prec: 10 }  // 1976 sum = 10
    ]);
    fixture.detectChanges();
    
    component.activeMetric.set('prec');
    fixture.detectChanges();

    // Historical mean = (20 + 10) / 2 = 15
    // Anomaly 1975 = 20 - 15 = 5
    // Anomaly 1976 = 10 - 15 = -5
    
    const option: any = component.chartOption();
    expect(option.series[0].data[0].value).toBe(5);
    expect(option.series[0].data[1].value).toBe(-5);
  });
});
