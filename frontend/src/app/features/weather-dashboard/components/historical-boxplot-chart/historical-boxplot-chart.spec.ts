import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoricalBoxplotChart } from './historical-boxplot-chart';
import { ComponentRef } from '@angular/core';

import { provideEchartsCore } from 'ngx-echarts';

describe('HistoricalBoxplotChart', () => {
  let component: HistoricalBoxplotChart;
  let fixture: ComponentFixture<HistoricalBoxplotChart>;
  let componentRef: ComponentRef<HistoricalBoxplotChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoricalBoxplotChart],
      providers: [
        provideEchartsCore({ echarts: { init: () => ({ setOption: () => {}, dispose: () => {}, resize: () => {}, getWidth: () => 100, getHeight: () => 100, isDisposed: () => false }) } })
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistoricalBoxplotChart);
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

  it('should compute boxplot and outliers from data', () => {
    componentRef.setInput('weatherData', [
      { fecha: '1975-01-01', tmed: 10 },
      { fecha: '1976-01-01', tmed: 15 },
      { fecha: '1977-01-01', tmed: 20 },
      { fecha: '1978-01-01', tmed: 25 },
      { fecha: '1979-01-01', tmed: 30 },
      // Outlier for 1970s
      { fecha: '1974-01-01', tmed: 100 },
      // Another decade
      { fecha: '1985-01-01', tmed: 20 },
      // Null tmed
      { fecha: '1986-01-01', tmed: null }
    ]);
    fixture.detectChanges();
    
    const option: any = component.chartOption();
    expect(option.series).toBeDefined();
    expect(option.series.length).toBe(2); // boxplot and outlier
    expect(option.xAxis.data).toEqual(['1970s', '1980s']);
    
    // Check tooltip formatter (simulating a call)
    const boxplotTooltip = option.tooltip.formatter({ seriesName: 'boxplot', name: '1970', data: [0, 10, 15, 20, 25, 30] });
    expect(boxplotTooltip).toContain('Década de 1970s');
    
    const outlierTooltip = option.tooltip.formatter({ seriesName: 'outlier', data: [0, 100] });
    expect(outlierTooltip).toContain('Atípico: 100.0 °C');
  });
});
