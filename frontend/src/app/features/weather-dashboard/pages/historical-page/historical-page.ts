import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WeatherService } from '../../../../core/services/weather.service';
import { StationService } from '../../../../core/services/station.service';
import { WeatherRecord } from '../../../../core/models/weather.interface';
import { HistoricalBoxplotChart } from '../../components/historical-boxplot-chart/historical-boxplot-chart';
import { HistoricalAnomaliesChart } from '../../components/historical-anomalies-chart/historical-anomalies-chart';
import { HistoricalPrecipitationChart } from '../../components/historical-precipitation-chart/historical-precipitation-chart';

/**
 * Página principal para la sección "Tendencias Históricas".
 * Se encarga de descargar todo el registro histórico desde 1960 para
 * realizar agrupaciones a nivel de cliente (décadas, medias anuales, etc.)
 */
@Component({
  selector: 'app-historical-page',
  standalone: true,
  imports: [
    CommonModule, 
    MatProgressSpinnerModule,
    HistoricalBoxplotChart,
    HistoricalAnomaliesChart,
    HistoricalPrecipitationChart
  ],
  templateUrl: './historical-page.html',
  styleUrl: './historical-page.scss'
})
export class HistoricalPage implements OnInit {
  private weatherService = inject(WeatherService);
  
  readonly stationService = inject(StationService);
  
  /** Signal reactivo que almacena todo el histórico de registros. */
  weatherData = signal<WeatherRecord[]>([]);
  
  /** Flag reactivo que indica si hay una petición de red en progreso. */
  loading = signal<boolean>(false);

  /** Rango dinámico de años basado en los datos devueltos. */
  dateRange = computed(() => {
    const data = this.weatherData();
    if (!data.length) return 'Calculando...';
    // Se asume que los datos vienen ordenados, pero por si acaso buscamos el min y max
    let minYear = Infinity;
    let maxYear = -Infinity;
    for (const record of data) {
      const year = parseInt(record.fecha.split('-')[0], 10);
      if (year < minYear) minYear = year;
      if (year > maxYear) maxYear = year;
    }
    return `${minYear} - ${maxYear}`;
  });

  constructor() {
    effect(() => {
      const station = this.stationService.selectedStation();
      if (station.id) {
        this.loadData();
      }
    });
  }

  ngOnInit() {
  }

  private loadData() {
    this.loading.set(true);
    
    // Fetch data for the full historical range (from 1950 to present day)
    const startDate = '1950-01-01';
    // const endDate is omitted, so the backend uses today by default

    const stationId = this.stationService.selectedStation().id;
    this.weatherService.getHistoricalData(stationId, startDate).subscribe({
      next: (data) => {
        this.weatherData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching historical data', err);
        this.weatherData.set([]);
        this.loading.set(false);
      }
    });
  }
}
