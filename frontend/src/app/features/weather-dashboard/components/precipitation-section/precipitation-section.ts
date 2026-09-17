import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { WeatherRecord } from '../../../../core/models/weather.interface';

@Component({
  selector: 'app-precipitation-section',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, NgxEchartsDirective],
  templateUrl: './precipitation-section.html',
  styleUrl: './precipitation-section.scss'
})
export class PrecipitationSection {
  data = input.required<WeatherRecord[]>();

  totalRain = computed(() => {
    const records = this.data().map(d => d.prec).filter(p => p != null) as number[];
    if (!records.length) return null;
    const sum = records.reduce((a, b) => a + b, 0);
    return sum.toFixed(1);
  });

  rainyDays = computed(() => {
    const records = this.data().map(d => d.prec).filter(p => p != null && p > 0);
    return records.length;
  });

  monthlyData = computed(() => {
    const records = this.data();
    const map = new Map<string, number>();
    
    records.forEach(r => {
      if (r.prec != null && r.fecha) {
        const monthKey = r.fecha.substring(0, 7); // 'YYYY-MM'
        map.set(monthKey, (map.get(monthKey) || 0) + r.prec);
      }
    });

    const sortedKeys = Array.from(map.keys()).sort();
    const formatMonth = (yyyyMM: string) => {
      const [y, m] = yyyyMM.split('-');
      const date = new Date(parseInt(y), parseInt(m) - 1, 1);
      return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    };

    return {
      labels: sortedKeys.map(formatMonth),
      values: sortedKeys.map(k => Number(map.get(k)?.toFixed(1)))
    };
  });

  chartOption = computed<EChartsOption>(() => {
    const mData = this.monthlyData();
    return {
      tooltip: { 
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          if (!Array.isArray(params)) params = [params];
          const date = params[0].axisValue;
          return `<strong>${date}</strong><br/>${params[0].marker} Precipitación: <b>${params[0].value} mm</b>`;
        }
      },
      legend: {
        top: '0%',
        left: 'center',
        data: ['Precipitación']
      },
      grid: { left: 50, right: '5%', top: '15%', bottom: '20%' },
      xAxis: {
        type: 'category',
        data: mData.labels,
        axisLabel: { rotate: 45 }
      },
      yAxis: { 
        type: 'value',
        name: 'Lluvia (mm)',
        nameLocation: 'middle',
        nameGap: 35
      },
      dataZoom: [
        { type: 'inside' },
        { type: 'slider', bottom: '1%', height: 35 }
      ],
      series: [
        {
          name: 'Precipitación',
          type: 'bar',
          color: '#0288d1',
          data: mData.values,
          barMaxWidth: 60,
          itemStyle: {
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    };
  });
}
