import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { WeatherRecord } from '../../../../core/models/weather.interface';

@Component({
  selector: 'app-temperature-section',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, NgxEchartsDirective],
  templateUrl: './temperature-section.html',
  styleUrl: './temperature-section.scss'
})
export class TemperatureSection {
  data = input.required<WeatherRecord[]>();

  maxTemp = computed(() => {
    const records = this.data().map(d => d.tmax).filter(t => t !== null) as number[];
    return records.length ? Math.max(...records).toFixed(1) : null;
  });

  minTemp = computed(() => {
    const records = this.data().map(d => d.tmin).filter(t => t !== null) as number[];
    return records.length ? Math.min(...records).toFixed(1) : null;
  });

  avgTemp = computed(() => {
    const records = this.data().map(d => d.tmed).filter(t => t !== null) as number[];
    if (!records.length) return null;
    const sum = records.reduce((a, b) => a + b, 0);
    return (sum / records.length).toFixed(1);
  });

  chartOption = computed<EChartsOption>(() => {
    const records = this.data();
    return {
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          if (!Array.isArray(params)) params = [params];
          const date = params[0].axisValue;
          let html = `<strong>${date}</strong><br/>`;
          params.forEach((p: any) => {
            html += `${p.marker} ${p.seriesName}: <b>${p.value ?? '--'} ºC</b><br/>`;
          });
          return html;
        }
      },
      legend: {
        top: '0%',
        left: 'center',
        data: ['Temp. Máxima', 'Temp. Media', 'Temp. Mínima']
      },
      grid: { left: 50, right: '5%', top: '15%', bottom: '15%' },
      xAxis: {
        type: 'category',
        data: records.map(r => r.fecha),
        boundaryGap: false
      },
      yAxis: { 
        type: 'value',
        name: 'Temp (ºC)',
        nameLocation: 'middle',
        nameGap: 35
      },
      dataZoom: [
        { type: 'inside' },
        { type: 'slider', bottom: '1%', height: 35 }
      ],
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
