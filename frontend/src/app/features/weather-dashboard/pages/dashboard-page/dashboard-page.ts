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

  dateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null)
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    let startStr: string | undefined = undefined;
    let endStr: string | undefined = undefined;

    const start = this.dateRange.value.start;
    const end = this.dateRange.value.end;

    if (start) {
      startStr = start.toISOString().split('T')[0];
    }
    if (end) {
      endStr = end.toISOString().split('T')[0];
    }

    this.weatherService.getHistoricalData('5402', startStr, endStr)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
