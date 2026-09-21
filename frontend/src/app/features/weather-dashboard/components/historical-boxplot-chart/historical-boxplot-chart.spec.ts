import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoricalBoxplotChart } from './historical-boxplot-chart';
import { provideEchartsCore } from 'ngx-echarts';
import { ThemeService } from '../../../../core/services/theme.service';
import { signal } from '@angular/core';

describe('HistoricalBoxplotChart', () => {
  let component: HistoricalBoxplotChart;
  let fixture: ComponentFixture<HistoricalBoxplotChart>;
  let mockThemeService: any;

  beforeEach(async () => {
    mockThemeService = { isDark: signal(false) };
    await TestBed.configureTestingModule({
      imports: [HistoricalBoxplotChart],
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
        provideEchartsCore({ echarts: () => import('echarts') })
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistoricalBoxplotChart);
    component = fixture.componentInstance;
  });

  it('should create and handle empty data', () => {
    fixture.componentRef.setInput('weatherData', []);
    fixture.detectChanges();
    expect(component.chartOption()).toEqual({});
  });

  it('should compute boxplot and outliers from data in light mode', () => {
    fixture.componentRef.setInput('weatherData', [
      { fecha: '1975-01-01', tmed: 10 },
      { fecha: '1976-01-01', tmed: 15 },
      { fecha: '1977-01-01', tmed: 20 },
      { fecha: '1978-01-01', tmed: 25 },
      { fecha: '1979-01-01', tmed: 30 },
      { fecha: '1974-01-01', tmed: 100 }, // Outlier
      { fecha: '1985-01-01', tmed: 20 }
    ] as any);
    fixture.detectChanges();
    
    const option: any = component.chartOption();
    
    
    const boxplotTooltip = option.tooltip.formatter({ seriesName: 'boxplot', name: '1970s', data: [0, 10, 15, 20, 25, 30] });
    expect(boxplotTooltip).toContain('1970s');
    
    const outlierTooltip = option.tooltip.formatter({ seriesName: 'outlier', data: [0, 100] });
    expect(outlierTooltip).toContain('100.0 °C');
  });

  it('should compute dark mode', () => {
    mockThemeService.isDark.set(true);
    fixture.componentRef.setInput('weatherData', [
      { fecha: '1985-01-01', tmed: 20 }
    ] as any);
    fixture.detectChanges();
    
    const option: any = component.chartOption();
    expect(option.xAxis).toBeDefined();
  });
});
