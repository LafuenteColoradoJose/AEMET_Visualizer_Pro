import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { WeatherService } from '../../../../core/services/weather.service';
import { StationService } from '../../../../core/services/station.service';
import { WeatherRecord } from '../../../../core/models/weather.interface';
import { YearlyCalendarHeatmap } from '../../components/yearly-calendar-heatmap/yearly-calendar-heatmap';
import { YearlyRadialChart } from '../../components/yearly-radial-chart/yearly-radial-chart';

/**
 * Página principal para la sección "Análisis Anual".
 * Orquesta la recuperación de datos de un año completo y distribuye la información
 * a los componentes gráficos secundarios (Heatmap y Gráfico Radial).
 */
@Component({
  selector: 'app-yearly-page',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatFormFieldModule, 
    MatInputModule,
    MatAutocompleteModule, 
    MatProgressSpinnerModule, 
    MatIconModule,
    YearlyCalendarHeatmap,
    YearlyRadialChart
  ],
  templateUrl: './yearly-page.html',
  styleUrl: './yearly-page.scss'
})
export class YearlyPage implements OnInit {
  private weatherService = inject(WeatherService);

  readonly stationService = inject(StationService);

  /** Lista de años disponibles generada dinámicamente desde el año actual hasta 1960. */
  years = Array.from({ length: new Date().getFullYear() - 1960 + 1 }, (_, i) => new Date().getFullYear() - i);
  
  /** Texto introducido en el buscador de autocomplete */
  searchInput = signal<string>(new Date().getFullYear().toString());

  /** Años filtrados según la búsqueda */
  filteredYears = computed(() => {
    const search = this.searchInput();
    if (!search) return this.years;
    return this.years.filter(y => y.toString().includes(search));
  });

  /** Signal con el año seleccionado actualmente por el usuario. */
  selectedYear = signal<number>(new Date().getFullYear());
  
  /** Signal reactivo que almacena los registros climáticos del año seleccionado. */
  weatherData = signal<WeatherRecord[]>([]);
  /** Flag reactivo que indica si hay una petición de red en progreso. */
  loading = signal<boolean>(false);

  /** 
   * Determina de forma dinámica y genérica si el año actual tiene datos parciales 
   * (faltan más de 30 días respecto al año completo). 
   */
  isPartialYear = computed(() => {
    const data = this.weatherData();
    if (data.length === 0) return false;
    
    const year = this.selectedYear();
    
    if (year === new Date().getFullYear()) {
      return false;
    }

    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const expectedDays = isLeap ? 366 : 365;
    
    return data.length < (expectedDays - 30);
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
    // Initial load happens via effect
  }

  onSearchChange(value: string) {
    this.searchInput.set(value);
  }

  onYearSelected(year: number) {
    this.selectedYear.set(year);
    this.searchInput.set(year.toString());
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    
    const year = this.selectedYear();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const stationId = this.stationService.selectedStation().id;
    this.weatherService.getHistoricalData(stationId, startDate, endDate).subscribe({
      next: (data) => {
        this.weatherData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching yearly data', err);
        this.weatherData.set([]);
        this.loading.set(false);
      }
    });
  }
}
