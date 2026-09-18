import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption, graphic } from 'echarts';
import { WeatherRecord } from '../../../../core/models/weather.interface';
import { ThemeService } from '../../../../core/services/theme.service';

/**
 * Componente visual que dibuja un Mapa de Calor (estilo GitHub).
 * Diseñado para renderizar las Temperaturas Máximas diarias de un año completo.
 */
@Component({
  selector: 'app-yearly-calendar-heatmap',
  standalone: true,
  imports: [CommonModule, MatCardModule, NgxEchartsModule],
  templateUrl: './yearly-calendar-heatmap.html',
  styleUrl: './yearly-calendar-heatmap.scss'
})
export class YearlyCalendarHeatmap {
  /** 
   * Array reactivo con los datos meteorológicos.
   * Se requiere que los datos vengan limpios y listos para ser procesados.
   */
  data = input.required<WeatherRecord[]>();
  
  /** Año seleccionado a visualizar (ej. 2024). Usado para configurar los ejes en ECharts. */
  year = input.required<number>();
  
  themeService = inject(ThemeService);

  /**
   * Signal computada que transforma el `data()` bruto de AEMET
   * al formato de tupla `[fecha, temperatura]` que exige el gráfico de calendario de ECharts.
   */
  chartOption = computed<EChartsOption>(() => {
    const rawData = this.data();
    
    // Map data for calendar heatmap: [date, value]
    const heatmapData: [string, number][] = rawData
      .filter(d => d.tmax !== null && d.fecha.startsWith(this.year().toString()))
      .map(d => [d.fecha, d.tmax as number]);

    return {
      tooltip: {
        position: 'top',
        formatter: function (p: any) {
          return p.data[0] + ': ' + p.data[1] + ' °C';
        }
      },
      visualMap: {
        min: -5,
        max: 45,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: {
          color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
        }
      },
      calendar: [{
        top: 30,
        bottom: 60,
        left: 40,
        right: 40,
        range: this.year().toString(),
        cellSize: ['auto', 20],
        itemStyle: {
          borderWidth: 1,
          borderColor: this.themeService.isDark() ? '#333' : '#eee'
        },
        yearLabel: { show: false },
        monthLabel: {
          nameMap: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        },
        dayLabel: {
          firstDay: 1,
          nameMap: ['D', 'L', 'M', 'X', 'J', 'V', 'S']
        }
      }],
      series: [{
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: heatmapData
      }]
    };
  });
}
