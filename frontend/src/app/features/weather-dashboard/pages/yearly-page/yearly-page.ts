import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { WeatherService } from '../../../../core/services/weather.service';
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

  /** Lista de años disponibles generada dinámicamente desde el año actual hasta 1960. */
  years = Array.from({ length: new Date().getFullYear() - 1960 + 1 }, (_, i) => new Date().getFullYear() - i);
  
  /** Texto introducido en el buscador de autocomplete */
  searchInput = signal<string>('2024');

  /** Años filtrados según la búsqueda */
  filteredYears = computed(() => {
    const search = this.searchInput();
    if (!search) return this.years;
    return this.years.filter(y => y.toString().includes(search));
  });

  /** Signal con el año seleccionado actualmente por el usuario. */
  selectedYear = signal<number>(2024);
  
  /** Signal reactivo que almacena los registros climáticos del año seleccionado. */
  weatherData = signal<WeatherRecord[]>([]);
  /** Flag reactivo que indica si hay una petición de red en progreso. */
  loading = signal<boolean>(false);

  ngOnInit() {
    this.loadData();
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
    
    // Fetch data for the full selected year
    const year = this.selectedYear();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    this.weatherService.getHistoricalData('5402', startDate, endDate).subscribe({
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
