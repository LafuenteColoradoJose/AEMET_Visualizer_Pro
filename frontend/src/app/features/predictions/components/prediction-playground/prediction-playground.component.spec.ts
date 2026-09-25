import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PredictionPlaygroundComponent } from './prediction-playground.component';
import { AiPredictionService } from '../../services/ai-prediction.service';
import { StationService } from '../../../../core/services/station.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NgxEchartsModule, provideEchartsCore } from 'ngx-echarts';
import { signal } from '@angular/core';
import { vi } from 'vitest';

// (Further down in the file, we update the module override)
describe('PredictionPlaygroundComponent', () => {
  let component: PredictionPlaygroundComponent;
  let fixture: ComponentFixture<PredictionPlaygroundComponent>;
  let aiServiceSpy: any;
  let stationServiceSpy: any;

  beforeEach(async () => {
    aiServiceSpy = {
      isModelLoaded: signal(true),
      loadModel: vi.fn().mockResolvedValue(undefined),
      predictAndTrace: vi.fn().mockReturnValue({
        activations: [
          new Array(11).fill(0.5), // 11 inputs
          new Array(12).fill(0.1),
          new Array(8).fill(-0.2)
        ],
        predictions: { tmax: 25.5, tmin: 15.2, prec: 0 }
      })
    };

    stationServiceSpy = {
      selectedStation: signal({ id: 'ANDALUCIA', name: 'Andalucía' }),
      loadStations: vi.fn(),
      stations: signal([{ id: 'ANDALUCIA', nombre: 'Andalucía' }]),
      setStation: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [PredictionPlaygroundComponent],
      providers: [
        { provide: AiPredictionService, useValue: aiServiceSpy },
        { provide: StationService, useValue: stationServiceSpy },
        provideAnimationsAsync(),
        provideEchartsCore({ echarts: () => import('echarts') })
      ]
    })
    .compileComponents();
    
    // We override window innerWidth for mobile coverage
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });

    fixture = TestBed.createComponent(PredictionPlaygroundComponent);
    component = fixture.componentInstance;
  });

  it('should create and load model on init', async () => {
    await component.ngOnInit();
    expect(component.isLoading()).toBe(false);
    expect(aiServiceSpy.loadModel).toHaveBeenCalled();
  });

  it('should handle resize and update isMobile', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    component.onResize();
    expect(component.isMobile()).toBe(true);
    
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    component.onResize();
    expect(component.isMobile()).toBe(false);
  });

  it('should format year properly for slider', () => {
    expect(component.formatYear(2045)).toBe('2045');
  });

  it('should handle year and month changes', () => {
    component.selectedYear.set(2040);
    component.selectedMonth.set(8);
    expect(component.selectedYear()).toBe(2040);
    expect(component.selectedMonth()).toBe(8);
  });

  it('should compute forwardPass when model is loaded and station exists', () => {
    fixture.detectChanges();
    const result = component.forwardPass();
    expect(result).not.toBeNull();
    // Verify it's called with the component's default selectedYear and selectedMonth
    expect(aiServiceSpy.predictAndTrace).toHaveBeenCalledWith(component.currentYear, component.currentMonth, 'ANDALUCIA');
  });

  it('should return null from forwardPass if model is not loaded', () => {
    aiServiceSpy.isModelLoaded = signal(false);
    fixture.detectChanges();
    expect(component.forwardPass()).toBeNull();
  });

  it('should return null from forwardPass if station is null', () => {
    stationServiceSpy.selectedStation.set({});
    fixture.detectChanges();
    expect(component.forwardPass()).toBeNull();
  });

  it('should return null from forwardPass if year or month is 0/null', () => {
    component.selectedYear.set(0);
    fixture.detectChanges();
    expect(component.forwardPass()).toBeNull();

    component.selectedYear.set(component.currentYear);
    component.selectedMonth.set(0);
    fixture.detectChanges();
    expect(component.forwardPass()).toBeNull();
  });

  it('should return empty chartOption if forwardPass is null', () => {
    aiServiceSpy.isModelLoaded = signal(false);
    fixture.detectChanges();
    expect(component.chartOption()).toEqual({});
  });

  it('should generate chart options with lines and nodes', () => {
    fixture.detectChanges();
    const options = component.chartOption() as any;
    expect(options.series.length).toBe(2);
    expect(options.series[0].type).toBe('graph');
    expect(options.series[1].type).toBe('lines');
    
    // Check tooltip formatter
    const tooltipFormatter = options.tooltip.formatter;
    expect(tooltipFormatter({ name: 'Node\nName' })).toBe('Node<br/>Name');
    expect(tooltipFormatter({})).toBe('');
  });

  it('should render the UI components properly', () => {
    // Check loader initially
    component.isLoading.set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.playground-container')).toBeTruthy();
    expect(compiled.querySelector('mat-spinner')).toBeTruthy();
    
    // Now disable loader to see the grid
    component.isLoading.set(false);
    // Set a future year to test the future-badge
    component.selectedYear.set(2050);
    fixture.detectChanges();
    
    // Check that controls exist
    expect(compiled.querySelector('.month-selector')).toBeTruthy();
    expect(compiled.querySelector('mat-slider')).toBeTruthy();
    expect(compiled.querySelector('.year-badge')).toBeTruthy();
    expect(compiled.querySelector('app-station-selector')).toBeTruthy(); // Replaced station-chip
    expect(compiled.querySelector('.climate-disclaimer')).toBeTruthy();
    expect(compiled.querySelector('.echarts-graph')).toBeTruthy();

    // Year > currentYear has future-badge class
    expect(compiled.querySelector('.future-badge')).toBeTruthy();
  });

  it('should generate mobile chart options correctly', () => {
    component.isMobile.set(true);
    fixture.detectChanges();
    const options = component.chartOption() as any;
    expect(options.series[0].roam).toBe(true);
  });
});
