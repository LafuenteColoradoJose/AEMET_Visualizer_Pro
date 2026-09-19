import { Component, computed, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { WeatherRecord } from '../../../../core/models/weather.interface';
import { ThemeService } from '../../../../core/services/theme.service';

import { MatCardModule } from '@angular/material/card';

/**
 * Componente que muestra la evolución de la temperatura (cajas de dispersión)
 * agrupada por décadas.
 */
@Component({
  selector: 'app-historical-boxplot-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule, MatCardModule],
  templateUrl: './historical-boxplot-chart.html',
  styleUrl: './historical-boxplot-chart.scss'
})
export class HistoricalBoxplotChart {
  /** Registros históricos completos pasados desde la página padre. */
  weatherData = input.required<WeatherRecord[]>();
  
  themeService = inject(ThemeService);

  /**
   * Agrupa los registros por década (ej. 1970, 1980) y calcula
   * los cuartiles necesarios para el Boxplot.
   */
  chartOption = computed<EChartsOption>(() => {
    const data = this.weatherData();
    if (!data.length) return {};

    const decadesMap = new Map<number, number[]>();

    for (const record of data) {
      if (record.tmed === null) continue;
      const year = new Date(record.fecha).getFullYear();
      const decade = Math.floor(year / 10) * 10;
      
      if (!decadesMap.has(decade)) {
        decadesMap.set(decade, []);
      }
      decadesMap.get(decade)!.push(record.tmed);
    }

    const sortedDecades = Array.from(decadesMap.keys()).sort();
    const boxplotData = [];
    const outliersData = [];

    for (let i = 0; i < sortedDecades.length; i++) {
      const decade = sortedDecades[i];
      let temps = decadesMap.get(decade)!;
      temps.sort((a, b) => a - b);
      
      const q1 = this.quantile(temps, 0.25);
      const median = this.quantile(temps, 0.5);
      const q3 = this.quantile(temps, 0.75);
      const iqr = q3 - q1;
      const lowerFence = q1 - 1.5 * iqr;
      const upperFence = q3 + 1.5 * iqr;

      let min = Infinity;
      let max = -Infinity;
      
      for (const t of temps) {
        if (t < lowerFence || t > upperFence) {
          outliersData.push([i, t]);
        } else {
          if (t < min) min = t;
          if (t > max) max = t;
        }
      }
      boxplotData.push([min, q1, median, q3, max]);
    }

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.seriesName === 'boxplot') {
            return `
              <b>Década de ${params.name}s</b><br/>
              Max: ${params.data[5].toFixed(1)} °C<br/>
              Q3: ${params.data[4].toFixed(1)} °C<br/>
              Mediana: ${params.data[3].toFixed(1)} °C<br/>
              Q1: ${params.data[2].toFixed(1)} °C<br/>
              Min: ${params.data[1].toFixed(1)} °C
            `;
          }
          if (params.seriesName === 'outlier') {
            return `<b>Década de ${sortedDecades[params.data[0]]}s</b><br/>Atípico: ${params.data[1].toFixed(1)} °C`;
          }
          return '';
        }
      },
      xAxis: {
        type: 'category',
        data: sortedDecades.map(d => `${d}s`),
        boundaryGap: true,
        nameGap: 30,
        splitArea: { show: false },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        name: 'Temperatura Media (°C)',
        splitArea: { show: true }
      },
      series: [
        {
          name: 'boxplot',
          type: 'boxplot',
          data: boxplotData,
          itemStyle: {
            color: '#1e88e5',
            borderColor: '#0d47a1'
          }
        },
        {
          name: 'outlier',
          type: 'scatter',
          data: outliersData,
          itemStyle: {
            color: '#e53935'
          }
        }
      ]
    };
  });

  private quantile(arr: number[], q: number): number {
    const pos = (arr.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (arr[base + 1] !== undefined) {
      return arr[base] + rest * (arr[base + 1] - arr[base]);
    } else {
      return arr[base];
    }
  }
}
