import { describe, it, expect, beforeEach } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrecipitationSection } from './precipitation-section';
import { provideEchartsCore } from 'ngx-echarts';
import { WeatherRecord } from '../../../../core/models/weather.interface';

describe('PrecipitationSection', () => {
  let component: PrecipitationSection;
  let fixture: ComponentFixture<PrecipitationSection>;

  beforeAll(() => {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrecipitationSection],
      providers: [
        provideEchartsCore({ echarts: () => import('echarts') })
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrecipitationSection);
    component = fixture.componentInstance;
    
    // Set required input
    const mockData: WeatherRecord[] = [
      { fecha: '2023-01-01', tmax: 15, tmed: 10, tmin: 5, prec: 5.0, racha: 20, velmedia: 10, sol: 8, presMax: 1020, presMin: 1010 },
      { fecha: '2023-01-02', tmax: 15, tmed: 10, tmin: 5, prec: 0.0, racha: 20, velmedia: 10, sol: 8, presMax: 1020, presMin: 1010 }
    ];
    fixture.componentRef.setInput('data', mockData);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate precipitation metrics correctly', () => {
    expect(component.totalRain()).toBe('5.0');
    expect(component.rainyDays()).toBe(1);
  });
});
