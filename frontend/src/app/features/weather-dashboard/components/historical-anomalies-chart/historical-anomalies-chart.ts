import { Component, computed, input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { WeatherRecord } from '../../../../core/models/weather.interface';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ThemeService } from '../../../../core/services/theme.service';

import { MatCardModule } from '@angular/material/card';

/**
 * Componente que muestra las anomalías (desviaciones respecto a la media histórica)
 * de temperatura o precipitación año tras año.
 */
@Component({
  selector: 'app-historical-anomalies-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule, MatButtonToggleModule, MatCardModule],
  templateUrl: './historical-anomalies-chart.html',
  styleUrl: './historical-anomalies-chart.scss'
})
export class HistoricalAnomaliesChart {
  /** Registros históricos completos pasados desde la página padre. */
  weatherData = input.required<WeatherRecord[]>();
  
  themeService = inject(ThemeService);
  
  /** Toggle para alternar entre temperatura o precipitación. */
  activeMetric = signal<'temp' | 'prec'>('temp');

  /**
   * Calcula la media histórica y agrupa las desviaciones año a año.
   */
  chartOption = computed<EChartsOption>(() => {
    const data = this.weatherData();
    if (!data.length) return {};

    const metric = this.activeMetric();
    const isTemp = metric === 'temp';

    // Agrupar por años para sacar promedios (temp) o sumas (precip)
    const yearlyMap = new Map<number, { sum: number; count: number }>();
    
    for (const record of data) {
      const val = isTemp ? record.tmed : record.prec;
      if (val === null || val === undefined) continue;

      const year = new Date(record.fecha).getFullYear();
      if (!yearlyMap.has(year)) {
        yearlyMap.set(year, { sum: 0, count: 0 });
      }
      const entry = yearlyMap.get(year)!;
      entry.sum += val;
      entry.count += 1;
    }

    // Calcular valores anuales
    const yearlyValues = Array.from(yearlyMap.entries()).map(([year, entry]) => {
      const val = isTemp ? entry.sum / entry.count : entry.sum;
      return { year, val };
    }).sort((a, b) => a.year - b.year);

    if (!yearlyValues.length) return {};

    // Calcular "Normal Climatológica" (media de todos los años disponibles)
    const totalVal = yearlyValues.reduce((acc, curr) => acc + curr.val, 0);
    const historicalMean = totalVal / yearlyValues.length;

    // Calcular anomalías
    const xAxisData = [];
    const seriesData = [];

    for (const item of yearlyValues) {
      xAxisData.push(item.year.toString());
      const anomaly = item.val - historicalMean;
      seriesData.push({
        value: anomaly,
        itemStyle: {
          color: isTemp 
            ? (anomaly > 0 ? '#e53935' : '#1e88e5') // Rojo si hace calor, azul si hace frío
            : (anomaly > 0 ? '#00897b' : '#fb8c00') // Verde/Azul si llueve más, Naranja si hay sequía
        }
      });
    }

    const unit = isTemp ? '°C' : 'mm';
    const titleText = isTemp ? 'Anomalías de Temperatura Media' : 'Anomalías de Precipitación Anual';

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const val = params[0].value;
          const sign = val > 0 ? '+' : '';
          return `<b>${params[0].name}</b><br/>Desviación: ${sign}${val.toFixed(2)} ${unit}`;
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%'
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLine: { onZero: true }
      },
      yAxis: {
        type: 'value',
        name: `Desviación (${unit})`
      },
      series: [
        {
          name: 'Anomalía',
          type: 'bar',
          data: seriesData
        }
      ]
    };
  });
}
