import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrecipitationSection } from './precipitation-section';
import { provideEchartsCore } from 'ngx-echarts';
import { ThemeService } from '../../../../core/services/theme.service';
import { signal } from '@angular/core';

describe('PrecipitationSection', () => {
  let component: PrecipitationSection;
  let fixture: ComponentFixture<PrecipitationSection>;
  let mockThemeService: any;

  beforeEach(async () => {
    mockThemeService = { isDark: signal(false) };
    await TestBed.configureTestingModule({
      imports: [PrecipitationSection],
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
        provideEchartsCore({ echarts: () => import('echarts') })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PrecipitationSection);
    component = fixture.componentInstance;
  });

  it('should handle empty data', () => {
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    expect(component.totalRain()).toBeNull();
    expect(component.rainyDays()).toBe(0);
    expect(component.monthlyData().labels).toEqual([]);
  });

  it('should compute totalRain and rainyDays', () => {
    const data = [
      { fecha: '2023-01-01', prec: 10 },
      { fecha: '2023-01-02', prec: 0 },
      { fecha: '2023-02-01', prec: 5 },
      { fecha: '2023-02-02', prec: null as any }
    ] as any;
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
    
    expect(component.totalRain()).toBe('15.0');
    expect(component.rainyDays()).toBe(2);
    expect(component.monthlyData().labels.length).toBe(2);
    
    const options: any = component.chartOption();
    const formatter = options.tooltip.formatter;
    const res1 = formatter([{ axisValue: 'Ene 2023', marker: '<M>', value: 10 }]);
    expect(res1).toContain('10 mm');
    
    const res2 = formatter({ axisValue: 'Feb 2023', marker: '<M>', value: 5 });
    expect(res2).toContain('5 mm');
  });
});
