import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { WeatherRecord } from '../../../../core/models/weather.interface';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-yearly-radial-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, NgxEchartsModule],
  templateUrl: './yearly-radial-chart.html',
  styleUrl: './yearly-radial-chart.scss'
})
export class YearlyRadialChart {
  data = input.required<WeatherRecord[]>();
  year = input.required<number>();
  themeService = inject(ThemeService);

  chartOption = computed<EChartsOption>(() => {
    const rawData = this.data();
    
    // Group precipitation by month
    const monthlyPrec = new Array(12).fill(0);
    for (const record of rawData) {
      if (record.prec !== null && record.fecha.startsWith(this.year().toString())) {
        const month = parseInt(record.fecha.split('-')[1], 10) - 1;
        monthlyPrec[month] += record.prec;
      }
    }

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} mm'
      },
      polar: {
        radius: [30, '80%']
      },
      radiusAxis: {
        max: 'dataMax'
      },
      angleAxis: {
        type: 'category',
        data: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        startAngle: 90
      },
      series: {
        type: 'bar',
        data: monthlyPrec.map((value, index) => {
          return {
            value: Math.round(value * 10) / 10,
            itemStyle: {
              color: '#0288d1' // Blue for rain
            }
          };
        }),
        coordinateSystem: 'polar',
        name: 'Precipitación',
        label: {
          show: true,
          position: 'middle',
          formatter: '{c}'
        }
      }
    };
  });
}
