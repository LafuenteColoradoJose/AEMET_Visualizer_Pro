import { Component, computed, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { WeatherRecord } from '../../../../core/models/weather.interface';
import { ThemeService } from '../../../../core/services/theme.service';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-historical-precipitation-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule, MatCardModule],
  templateUrl: './historical-precipitation-chart.html',
  styleUrl: './historical-precipitation-chart.scss'
})
export class HistoricalPrecipitationChart {
  weatherData = input.required<WeatherRecord[]>();
  themeService = inject(ThemeService);

  chartOption = computed<EChartsOption>(() => {
    const data = this.weatherData();
    if (!data.length) return {};

    // Group precipitation by year
    const yearlyMap = new Map<number, number>();
    
    for (const record of data) {
      if (typeof record.prec === 'number' && record.prec >= 0) {
        const year = parseInt(record.fecha.split('-')[0], 10);
        if (!yearlyMap.has(year)) {
          yearlyMap.set(year, 0);
        }
        yearlyMap.set(year, yearlyMap.get(year)! + record.prec);
      }
    }

    const yearlyValues = Array.from(yearlyMap.entries())
      .map(([year, val]) => ({ year, val: Math.round(val * 10) / 10 }))
      .sort((a, b) => a.year - b.year);

    if (!yearlyValues.length) return {};

    const xAxisData = yearlyValues.map(item => item.year.toString());
    const barData = yearlyValues.map(item => item.val);
    
    // Calculate 5-year moving average
    const movingAverageData = [];
    for (let i = 0; i < yearlyValues.length; i++) {
      if (i < 4) {
        movingAverageData.push(null); // Not enough data for the first 4 years
      } else {
        let sum = 0;
        for (let j = 0; j < 5; j++) {
          sum += yearlyValues[i - j].val;
        }
        movingAverageData.push(Math.round((sum / 5) * 10) / 10);
      }
    }

    // Historical mean
    const totalPrec = barData.reduce((acc, curr) => acc + curr, 0);
    const historicalMean = Math.round((totalPrec / barData.length) * 10) / 10;

    const isDark = this.themeService.isDark();
    const textColor = isDark ? '#e0e0e0' : '#424242';

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['Precipitación Total (mm)', 'Media Móvil (5 años)'],
        bottom: 0,
        textStyle: { color: textColor }
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: 70
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLine: { lineStyle: { color: textColor } }
      },
      yAxis: {
        type: 'value',
        name: 'Milímetros (mm)',
        nameTextStyle: { color: textColor },
        axisLine: { lineStyle: { color: textColor } },
        splitLine: { lineStyle: { color: isDark ? '#424242' : '#e0e0e0' } }
      },
      series: [
        {
          name: 'Precipitación Total (mm)',
          type: 'bar',
          data: barData,
          itemStyle: {
            color: '#0288d1' // Solid blue for precipitation
          },
          markLine: {
            data: [
              { type: 'average', name: 'Media Histórica', yAxis: historicalMean }
            ],
            lineStyle: {
              color: '#e53935',
              type: 'dashed',
              width: 2
            },
            label: {
              formatter: `Media: ${historicalMean} mm`,
              position: 'insideEndTop'
            }
          }
        },
        {
          name: 'Media Móvil (5 años)',
          type: 'line',
          smooth: true,
          data: movingAverageData,
          lineStyle: {
            color: '#fbc02d', // Yellow/Orange for trend
            width: 3
          },
          itemStyle: { color: '#fbc02d' },
          symbol: 'none'
        }
      ]
    };
  });
}
