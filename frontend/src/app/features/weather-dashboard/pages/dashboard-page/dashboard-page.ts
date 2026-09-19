import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { WeatherService } from '../../../../core/services/weather.service';
import { WeatherRecord } from '../../../../core/models/weather.interface';
import { TemperatureSection } from '../../components/temperature-section/temperature-section';
import { PrecipitationSection } from '../../components/precipitation-section/precipitation-section';

import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    TemperatureSection,
    PrecipitationSection, 
    MatCardModule, 
    MatToolbarModule, 
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    ReactiveFormsModule
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss'
})
export class DashboardPage implements OnInit {
  private readonly weatherService = inject(WeatherService);
  private readonly destroyRef = inject(DestroyRef);
  
  weatherData = signal<WeatherRecord[]>([]);
  loading = signal<boolean>(true);
  maxDate = new Date(); // Limita el calendario para no elegir el futuro

  dateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null)
  });

  ngOnInit() {
    this.loadData();
  }

  setPreset(preset: '12m' | 'ytd' | '3y') {
    const today = new Date();
    // Por defecto AEMET suele tener hasta el último día del mes pasado
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    let start: Date;

    if (preset === '12m') {
      start = new Date(end.getFullYear() - 1, end.getMonth() + 1, 1);
    } else if (preset === 'ytd') {
      start = new Date(today.getFullYear(), 0, 1); // 1 de enero del año actual
    } else {
      start = new Date(end.getFullYear() - 3, end.getMonth() + 1, 1);
    }

    this.dateRange.patchValue({ start, end });
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    let startStr: string | undefined = undefined;
    let endStr: string | undefined = undefined;

    const start = this.dateRange.value.start;
    const end = this.dateRange.value.end;

    // Solo enviamos las fechas si ambas están seleccionadas
    if (start && end) {
      startStr = start.toISOString().split('T')[0];
      endStr = end.toISOString().split('T')[0];
    }

    this.weatherService.getHistoricalData('5402', startStr, endStr)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.weatherData.set(data);
          
          // Si el formulario estaba vacío (ej: carga inicial), lo rellenamos con la realidad
          if (data.length > 0 && (!this.dateRange.value.start || !this.dateRange.value.end)) {
            const firstDate = new Date(data[0].fecha);
            const lastDate = new Date(data[data.length - 1].fecha);
            this.dateRange.patchValue({ start: firstDate, end: lastDate }, { emitEvent: false });
          }
          
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error cargando el clima:', err);
          this.loading.set(false);
        }
      });
  }
}
