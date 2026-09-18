import { describe, it, expect, beforeEach } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YearlyRadialChart } from './yearly-radial-chart';
import { provideEchartsCore } from 'ngx-echarts';
import { ComponentRef } from '@angular/core';

describe('YearlyRadialChart', () => {
  let component: YearlyRadialChart;
  let fixture: ComponentFixture<YearlyRadialChart>;
  let componentRef: ComponentRef<YearlyRadialChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YearlyRadialChart],
      providers: [
        provideEchartsCore({ echarts: () => import('echarts') })
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(YearlyRadialChart);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    
    // Provide inputs
    componentRef.setInput('data', [
      { fecha: '2023-01-01', prec: 10.5 },
      { fecha: '2023-01-15', prec: 5.0 },
      { fecha: '2023-02-10', prec: null }, // Should be ignored
      { fecha: '2024-01-01', prec: 20.0 }  // Should be ignored (wrong year)
    ]);
    componentRef.setInput('year', 2023);
    fixture.detectChanges();
  });

  it('should create and compute chart options', () => {
    expect(component).toBeTruthy();
    const options = component.chartOption();
    expect(options).toBeTruthy();
    
    // Check series data is mapped correctly
    const seriesData = (options.series as any).data;
    expect(seriesData.length).toBe(12);
    expect(seriesData[0].value).toBe(15.5); // Jan total: 10.5 + 5.0
    expect(seriesData[1].value).toBe(0); // Feb total (null treated as 0)
  });
});

