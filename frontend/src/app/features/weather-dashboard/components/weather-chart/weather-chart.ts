import { Component, input, computed } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { WeatherRecord } from '../../../../core/models/weather.interface';

/**
 * Componente presentacional encargado de renderizar una gráfica interactiva de temperaturas
 * utilizando Apache ECharts. Muestra 3 series (tmax, tmed, tmin) en el tiempo.
 */
@Component({
  selector: 'app-weather-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  templateUrl: './weather-chart.html',
  styleUrl: './weather-chart.css'
})
export class WeatherChart {
  /**
   * Signal de entrada obligatorio que recibe el listado de registros meteorológicos.
   * Utiliza la nueva API de Signals (Angular 17+).
   */
  data = input.required<WeatherRecord[]>();

  /**
   * Signal derivado (computado) que construye las opciones de configuración de la gráfica
   * basándose en los datos recibidos. Se recalcula automáticamente cuando cambian los datos.
   */
  chartOption = computed<EChartsOption>(() => {
    const records = this.data();
    
    return {
      tooltip: { 
        trigger: 'axis' 
      },
      legend: {
        data: ['Temp. Máxima', 'Temp. Media', 'Temp. Mínima']
      },
      xAxis: {
        type: 'category',
        data: records.map(r => r.fecha)
      },
      yAxis: { 
        type: 'value',
        name: 'Temperatura (ºC)'
      },
      series: [
        {
          name: 'Temp. Máxima',
          type: 'line',
          color: '#e74c3c',
          data: records.map(r => r.tmax),
          showSymbol: false
        },
        {
          name: 'Temp. Media',
          type: 'line',
          color: '#f39c12',
          data: records.map(r => r.tmed),
          showSymbol: false
        },
        {
          name: 'Temp. Mínima',
          type: 'line',
          color: '#3498db',
          data: records.map(r => r.tmin),
          showSymbol: false
        }
      ]
    };
  });
}
