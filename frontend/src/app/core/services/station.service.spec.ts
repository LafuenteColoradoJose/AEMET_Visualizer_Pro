import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { StationService, Station } from './station.service';

describe('StationService', () => {
  let service: StationService;
  let httpMock: HttpTestingController;

  const mockStations: Station[] = [
    { id: 'ANDALUCIA', nombre: 'Toda Andalucía (Promedio)', provincia: 'ANDALUCIA' },
    { id: '5402', nombre: 'Córdoba Aeropuerto', provincia: 'Córdoba' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StationService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(StationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.selectedStation().id).toBe('ANDALUCIA');
  });

  it('should load stations and set default if none selected', () => {
    // Reset initial state
    service.selectedStation.set({ id: '', nombre: '', provincia: '' });
    
    service.loadStations();
    
    const req = httpMock.expectOne('http://127.0.0.1:8000/api/v1/weather/stations');
    expect(req.request.method).toBe('GET');
    req.flush(mockStations);
    
    expect(service.stations()).toEqual(mockStations);
    expect(service.selectedStation()).toEqual(mockStations[0]);
  });

  it('should load stations and NOT overwrite if already selected', () => {
    service.selectedStation.set(mockStations[1]); // Already selected Córdoba
    
    service.loadStations();
    
    const req = httpMock.expectOne('http://127.0.0.1:8000/api/v1/weather/stations');
    req.flush(mockStations);
    
    expect(service.stations()).toEqual(mockStations);
    expect(service.selectedStation()).toEqual(mockStations[1]); // Preserves Córdoba
  });

  it('should handle error when loading stations', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    service.loadStations();
    
    const req = httpMock.expectOne('http://127.0.0.1:8000/api/v1/weather/stations');
    req.flush('Error fetching data', { status: 500, statusText: 'Server Error' });
    
    const offlineReq = httpMock.expectOne('/stations-offline.json');
    offlineReq.flush([]);
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Backend API unreachable'));
    expect(service.stations()).toEqual([]);
  });

  it('should set station by id if it exists', () => {
    service.stations.set(mockStations);
    
    service.setStation('5402');
    
    expect(service.selectedStation()).toEqual(mockStations[1]);
  });

  it('should not set station if id does not exist', () => {
    service.stations.set(mockStations);
    const initial = service.selectedStation();
    
    service.setStation('9999');
    
    expect(service.selectedStation()).toEqual(initial);
  });
});
