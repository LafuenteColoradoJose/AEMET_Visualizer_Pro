import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TestBed } from '@angular/core/testing';
import { WeatherService } from './weather.service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { WeatherRecord } from '../models/weather.interface';

describe('WeatherService', () => {
  let service: WeatherService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WeatherService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(WeatherService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get historical data with default station', () => {
    const dummyData: WeatherRecord[] = [];
    service.getHistoricalData().subscribe(data => {
      expect(data).toEqual(dummyData);
    });

    const req = httpMock.expectOne(req => req.url === 'http://127.0.0.1:8000/api/v1/weather/historical' && req.params.get('estacion') === '5402');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('start_date')).toBe(false);
    expect(req.request.params.has('end_date')).toBe(false);
    req.flush(dummyData);
  });

  it('should get historical data with date params', () => {
    const dummyData: WeatherRecord[] = [];
    service.getHistoricalData('1234', '2023-01-01', '2023-12-31').subscribe(data => {
      expect(data).toEqual(dummyData);
    });

    const req = httpMock.expectOne(req => req.url === 'http://127.0.0.1:8000/api/v1/weather/historical');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('estacion')).toBe('1234');
    expect(req.request.params.get('start_date')).toBe('2023-01-01');
    expect(req.request.params.get('end_date')).toBe('2023-12-31');
    req.flush(dummyData);
  });
});
