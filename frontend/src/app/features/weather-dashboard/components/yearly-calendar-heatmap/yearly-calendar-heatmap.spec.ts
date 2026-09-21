import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YearlyCalendarHeatmap } from './yearly-calendar-heatmap';
import { provideEchartsCore } from 'ngx-echarts';
import { ThemeService } from '../../../../core/services/theme.service';
import { signal } from '@angular/core';

describe('YearlyCalendarHeatmap', () => {
  let component: YearlyCalendarHeatmap;
  let fixture: ComponentFixture<YearlyCalendarHeatmap>;
  let mockThemeService: any;

  beforeEach(async () => {
    mockThemeService = { isDark: signal(false) };
    await TestBed.configureTestingModule({
      imports: [YearlyCalendarHeatmap],
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
        provideEchartsCore({ echarts: () => import('echarts') })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(YearlyCalendarHeatmap);
    component = fixture.componentInstance;
  });

  it('should compute chart option', () => {
    fixture.componentRef.setInput('year', 2023);
    const data = [
      { fecha: '2023-01-01', tmax: 20 },
      { fecha: '2024-01-01', tmax: 25 },
      { fecha: '2023-01-02', tmax: null }
    ] as any;
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
    
    const options: any = component.chartOption();
    expect(options.series[0].data.length).toBe(1);
    expect(options.calendar[0].itemStyle.borderColor).toBe('#eee');

    const formatter = options.tooltip.formatter;
    expect(formatter({ data: ['2023-01-01', 20] })).toContain('2023-01-01: 20 °C');
  });

  it('should compute dark mode', () => {
    mockThemeService.isDark.set(true);
    fixture.componentRef.setInput('year', 2023);
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    
    const options: any = component.chartOption();
    expect(options.calendar[0].itemStyle.borderColor).toBe('#333');
  });
});
