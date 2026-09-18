import { describe, it, expect, beforeEach } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YearlyCalendarHeatmap } from './yearly-calendar-heatmap';
import { provideEchartsCore } from 'ngx-echarts';
import { ComponentRef } from '@angular/core';

describe('YearlyCalendarHeatmap', () => {
  let component: YearlyCalendarHeatmap;
  let fixture: ComponentFixture<YearlyCalendarHeatmap>;
  let componentRef: ComponentRef<YearlyCalendarHeatmap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YearlyCalendarHeatmap],
      providers: [
        provideEchartsCore({ echarts: () => import('echarts') })
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(YearlyCalendarHeatmap);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    
    // Provide inputs
    componentRef.setInput('data', [
      { fecha: '2023-01-01', tmax: 15.5 },
      { fecha: '2023-01-02', tmax: null }, // Should be filtered out
      { fecha: '2024-01-01', tmax: 20.0 }  // Should be filtered out (wrong year)
    ]);
    componentRef.setInput('year', 2023);
    fixture.detectChanges();
  });

  it('should create and compute chart options', () => {
    expect(component).toBeTruthy();
    const options = component.chartOption();
    expect(options).toBeTruthy();
    
    // Check series data is mapped correctly
    const seriesData = (options.series as any)[0].data;
    expect(seriesData.length).toBe(1);
    expect(seriesData[0]).toEqual(['2023-01-01', 15.5]);
  });

  it('should format tooltip', () => {
    const options = component.chartOption();
    const formatter = (options.tooltip as any).formatter;
    const tooltipText = formatter({ data: ['2023-01-01', 15.5] });
    expect(tooltipText).toBe('2023-01-01: 15.5 °C');
  });
});

