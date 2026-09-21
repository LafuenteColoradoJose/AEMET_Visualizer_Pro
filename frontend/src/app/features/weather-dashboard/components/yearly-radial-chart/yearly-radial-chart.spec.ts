import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YearlyRadialChart } from './yearly-radial-chart';
import { provideEchartsCore } from 'ngx-echarts';
import { ThemeService } from '../../../../core/services/theme.service';
import { signal } from '@angular/core';

describe('YearlyRadialChart', () => {
  let component: YearlyRadialChart;
  let fixture: ComponentFixture<YearlyRadialChart>;
  let mockThemeService: any;

  beforeEach(async () => {
    mockThemeService = { isDark: signal(false) };
    await TestBed.configureTestingModule({
      imports: [YearlyRadialChart],
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
        provideEchartsCore({ echarts: () => import('echarts') })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(YearlyRadialChart);
    component = fixture.componentInstance;
  });

  it('should compute chart option', () => {
    fixture.componentRef.setInput('year', 2023);
    const data = [
      { fecha: '2023-01-01', prec: 10 },
      { fecha: '2023-02-01', prec: 1 }, // small
      { fecha: '2023-03-01', prec: 0 },
      { fecha: '2023-04-01', prec: -1 }, // invalid
      { fecha: '2024-01-01', prec: 100 }
    ] as any;
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
    
    const options: any = component.chartOption();
    expect(options.title.textStyle.color).toBe('#424242');

    const formatter = options.tooltip.formatter;
    expect(formatter({ name: 'Ene', value: 10 })).toContain('10 mm');
    expect(formatter({ name: 'Ene', value: 0 })).toContain('0 mm');

    // Label position test
    expect(options.series.data[0].label.position).toBe('inside'); // 10 is max, inside
    expect(options.series.data[1].label.position).toBe('end'); // 1 is small (< 20% of 10)
  });

  it('should compute dark mode', () => {
    mockThemeService.isDark.set(true);
    fixture.componentRef.setInput('year', 2023);
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    
    const options: any = component.chartOption();
    expect(options.title.textStyle.color).toBe('#e0e0e0');
  });
});
