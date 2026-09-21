import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemperatureSection } from './temperature-section';
import { provideEchartsCore } from 'ngx-echarts';
import { ThemeService } from '../../../../core/services/theme.service';
import { signal } from '@angular/core';

describe('TemperatureSection', () => {
  let component: TemperatureSection;
  let fixture: ComponentFixture<TemperatureSection>;
  let mockThemeService: any;

  beforeEach(async () => {
    mockThemeService = { isDark: signal(false) };
    await TestBed.configureTestingModule({
      imports: [TemperatureSection],
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
        provideEchartsCore({ echarts: () => import('echarts') })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TemperatureSection);
    component = fixture.componentInstance;
  });

  it('should handle empty data', () => {
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    expect(component.maxTemp()).toBeNull();
    expect(component.minTemp()).toBeNull();
    expect(component.avgTemp()).toBeNull();
  });

  it('should compute temperatures and format tooltip', () => {
    const data = [
      { fecha: '2023-01-01', tmax: 20, tmed: 15, tmin: 10 },
      { fecha: '2023-01-02', tmax: null, tmed: null, tmin: null }
    ] as any;
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
    
    expect(component.maxTemp()).toBe('20.0');
    expect(component.minTemp()).toBe('10.0');
    expect(component.avgTemp()).toBe('15.0');
    
    const options: any = component.chartOption();
    const formatter = options.tooltip.formatter;
    const res = formatter([{ axisValue: '2023-01-01', marker: '<M>', seriesName: 'Temp. Máxima', value: 20 }]);
    expect(res).toContain('20 ºC');

    const res2 = formatter({ axisValue: '2023-01-02', marker: '<M>', seriesName: 'Temp. Máxima', value: null });
    expect(res2).toContain('-- ºC');
  });
});
