import { Injectable, inject, isDevMode } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { WeatherRecord } from '../models/weather.interface';

/**
 * Servicio centralizado para la recuperación de datos meteorológicos de la AEMET.
 * Gestiona tanto llamadas al backend (FastAPI) como un modo de fallback 100% offline
 * para garantizar la autonomía de la aplicación.
 */
@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = isDevMode() 
    ? 'http://127.0.0.1:8000/api/v1/weather'
    : 'https://aemet-visualizer-pro-backend.onrender.com/api/v1/weather';

  /**
   * Recupera los datos históricos de una estación meteorológica.
   * Si el backend falla, carga los datos desde un JSON estático local (Fallback Offline).
   * 
   * @param estacion ID de la estación (por defecto '5402' - Córdoba/Aeropuerto)
   * @param startDate Fecha de inicio opcional en formato YYYY-MM-DD
   * @param endDate Fecha de fin opcional en formato YYYY-MM-DD
   * @returns Un Observable que emite un array de registros meteorológicos (`WeatherRecord[]`)
   */
  getHistoricalData(estacion: string = '5402', startDate?: string, endDate?: string): Observable<WeatherRecord[]> {
    let params = new HttpParams().set('estacion', estacion);
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);

    return this.http.get<WeatherRecord[]>(`${this.apiUrl}/historical`, { params }).pipe(
      catchError(err => {
        console.warn('Backend API unreachable, falling back to 100% offline static database...');
        return this.http.get<{ [key: string]: WeatherRecord[] }>('/historical-offline.json').pipe(
          map(data => {
            const records = data[estacion] || [];
            // Filtro básico en frontend si se piden fechas (la app pide startDate='1950-01-01')
            if (startDate || endDate) {
               return records.filter(r => {
                 let valid = true;
                 if (startDate && r.fecha < startDate) valid = false;
                 if (endDate && r.fecha > endDate) valid = false;
                 return valid;
               });
            }
            return records;
          }),
          catchError(() => of([]))
        );
      })
    );
  }
}
