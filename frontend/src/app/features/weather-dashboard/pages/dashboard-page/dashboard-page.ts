import { Component, inject, signal, OnInit } from '@angular/core';
import { WeatherService } from '../../../../core/services/weather.service';
import { WeatherRecord } from '../../../../core/models/weather.interface';
import { WeatherChart } from '../../components/weather-chart/weather-chart';

import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Componente contenedor (Smart Component) que representa la página principal del Dashboard.
 * Se encarga de gestionar el estado de la aplicación, recuperar datos a través del servicio
 * y pasárselos a los componentes presentacionales.
 */
@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [WeatherChart, MatCardModule, MatToolbarModule, MatProgressSpinnerModule],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css'
})
export class DashboardPage implements OnInit {
  /** Inyección del servicio de datos meteorológicos */
  private readonly weatherService = inject(WeatherService);
  
  /** Signal reactivo que almacena los registros meteorológicos recuperados */
  weatherData = signal<WeatherRecord[]>([]);
  
  /** Signal que indica el estado de carga de la petición */
  loading = signal<boolean>(true);

  /**
   * Ciclo de vida inicial. Se ejecuta tras crear el componente.
   * Realiza la petición HTTP inicial para obtener los datos de la estación 5402.
   */
  ngOnInit() {
    // Al cargar la pantalla, pedimos los datos al backend
    this.weatherService.getHistoricalData('5402').subscribe({
      next: (data) => {
        this.weatherData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando el clima:', err);
        this.loading.set(false);
      }
    });
  }
}
