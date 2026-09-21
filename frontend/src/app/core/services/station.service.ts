import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Station {
  id: string;
  nombre: string;
  provincia: string;
}

@Injectable({
  providedIn: 'root'
})
export class StationService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8000/api/v1/weather';
  
  // Lista de estaciones disponibles
  stations = signal<Station[]>([]);
  
  // Estación activa (por defecto ANDALUCIA)
  selectedStation = signal<Station>({
    id: 'ANDALUCIA',
    nombre: 'Toda Andalucía (Promedio)',
    provincia: 'ANDALUCIA'
  });

  loadStations() {
    this.http.get<Station[]>(`${this.apiUrl}/stations`).subscribe({
      next: (data) => {
        this.stations.set(data);
        // Si no hemos cargado datos, inicializamos con Andalucia
        if (data.length > 0 && !this.selectedStation().id) {
            this.selectedStation.set(data[0]);
        }
      },
      error: (err) => console.error('Error fetching stations', err)
    });
  }

  setStation(stationId: string) {
    const s = this.stations().find(x => x.id === stationId);
    if (s) {
      this.selectedStation.set(s);
    }
  }
}
