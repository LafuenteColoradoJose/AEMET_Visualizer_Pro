import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WeatherRecord } from '../models/weather.interface';

/**
 * Servicio centralizado para la recuperación de datos meteorológicos.
 * Se comunica con la API FastAPI para obtener registros cacheados en SQLite.
 */
@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8000/api/v1/weather';

  /**
   * Recupera los datos históricos de una estación meteorológica.
   * 
   * @param estacion ID de la estación (por defecto '5402' - Córdoba/Aeropuerto)
   * @param startDate Fecha de inicio opcional en formato YYYY-MM-DD
   * @param endDate Fecha de fin opcional en formato YYYY-MM-DD
   * @returns Un Observable que emite un array de registros meteorológicos (WeatherRecord)
   */
  getHistoricalData(estacion: string = '5402', startDate?: string, endDate?: string): Observable<WeatherRecord[]> {
    let params = new HttpParams().set('estacion', estacion);
    
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);

    return this.http.get<WeatherRecord[]>(`${this.apiUrl}/historical`, { params });
  }
}
