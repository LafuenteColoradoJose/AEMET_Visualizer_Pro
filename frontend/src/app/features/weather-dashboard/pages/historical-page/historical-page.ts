import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WeatherService } from '../../../../core/services/weather.service';
import { WeatherRecord } from '../../../../core/models/weather.interface';
import { HistoricalBoxplotChart } from '../../components/historical-boxplot-chart/historical-boxplot-chart';
import { HistoricalAnomaliesChart } from '../../components/historical-anomalies-chart/historical-anomalies-chart';

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
    HistoricalAnomaliesChart
  ],
  templateUrl: './historical-page.html',
  styleUrl: './historical-page.scss'
})
export class HistoricalPage implements OnInit {
  private weatherService = inject(WeatherService);
  
  /** Signal reactivo que almacena todo el histórico de registros. */
  weatherData = signal<WeatherRecord[]>([]);
  
  /** Flag reactivo que indica si hay una petición de red en progreso. */
  loading = signal<boolean>(false);

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    
    // Fetch data for the full historical range (from 1950 to present day)
    const startDate = '1950-01-01';
    // const endDate is omitted, so the backend uses today by default

    this.weatherService.getHistoricalData('5402', startDate).subscribe({
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
