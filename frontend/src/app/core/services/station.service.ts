import { Injectable, signal, inject, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

/**
 * Interfaz que define la estructura de una estación meteorológica en el frontend.
 */
export interface Station {
  /** Identificador único de la estación (ej. '5402' para Córdoba Aeropuerto) */
  id: string;
  /** Nombre amigable de la estación */
  nombre: string;
  /** Provincia donde se encuentra la estación */
  provincia: string;
}

/**
 * Servicio encargado de gestionar el estado y la recuperación del catálogo
 * de estaciones meteorológicas disponibles.
 * Emplea Signals de Angular 18+ para un estado reactivo.
 */
@Injectable({
  providedIn: 'root'
})
export class StationService {
  private http = inject(HttpClient);
  private readonly apiUrl = isDevMode() 
    ? 'http://127.0.0.1:8000/api/v1/weather'
    : 'https://aemet-visualizer-pro-backend.onrender.com/api/v1/weather';
  
  /** Signal reactivo que contiene el catálogo completo de estaciones cargadas */
  stations = signal<Station[]>([]);
  
  /** Signal reactivo de la estación seleccionada actualmente por el usuario */
  selectedStation = signal<Station>({
    id: 'ANDALUCIA',
    nombre: 'Toda Andalucía (Promedio)',
    provincia: 'ANDALUCIA'
  });

  /**
   * Obtiene la lista de estaciones desde el backend o del fallback estático local.
   * Actualiza el signal `stations` y establece una estación por defecto si es necesario.
   */
  loadStations() {
    this.http.get<Station[]>(`${this.apiUrl}/stations`).pipe(
      catchError(err => {
        console.warn('Backend API unreachable, falling back to offline stations catalog...');
        return this.http.get<Station[]>('/stations-offline.json');
      })
    ).subscribe({
      next: (data) => {
        this.stations.set(data);
        if (data.length > 0 && !this.selectedStation().id) {
            this.selectedStation.set(data[0]);
        }
      },
      error: (err) => console.error('Error fetching stations offline', err)
    });
  }

  /**
   * Actualiza la estación actualmente seleccionada en base a su ID.
   * 
   * @param stationId El ID de la estación a establecer como activa.
   */
  setStation(stationId: string) {
    const s = this.stations().find(x => x.id === stationId);
    if (s) {
      this.selectedStation.set(s);
    }
  }
}
