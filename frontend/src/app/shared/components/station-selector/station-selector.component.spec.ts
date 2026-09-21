import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StationSelectorComponent } from './station-selector.component';
import { StationService } from '../../../core/services/station.service';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

describe('StationSelectorComponent', () => {
  let component: StationSelectorComponent;
  let fixture: ComponentFixture<StationSelectorComponent>;
  let mockStationService: any;

  beforeEach(async () => {
    mockStationService = {
      loadStations: vi.fn(),
      setStation: vi.fn(),
      stations: signal([{ id: 'ANDALUCIA', nombre: 'Toda Andalucía', provincia: 'ANDALUCIA' }, { id: '123', nombre: 'Sevilla', provincia: 'Sevilla' }]),
      selectedStation: signal({ id: 'ANDALUCIA', nombre: 'Toda Andalucía', provincia: 'ANDALUCIA' })
    };

    await TestBed.configureTestingModule({
      imports: [StationSelectorComponent],
      providers: [
        { provide: StationService, useValue: mockStationService },
        provideNoopAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StationSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load stations on init', () => {
    expect(component).toBeTruthy();
    expect(mockStationService.loadStations).toHaveBeenCalled();
  });
});
