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
    
    // Group precipitation by month and calculate total
    const monthlyPrec = new Array(12).fill(0);
    let totalPrec = 0;
    
    for (const record of rawData) {
      // Filtrar valores nulos o negativos (AEMET usa a veces -1 o similares para errores)
      if (typeof record.prec === 'number' && record.prec >= 0 && record.fecha.startsWith(this.year().toString())) {
        const month = parseInt(record.fecha.split('-')[1], 10) - 1;
        monthlyPrec[month] += record.prec;
        totalPrec += record.prec;
      }
    }
    
    totalPrec = Math.round(totalPrec * 10) / 10;
    const maxPrec = Math.max(...monthlyPrec);

    return {
      title: {
        text: `Total\n${totalPrec} mm`,
        left: 'center',
        top: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 'bold',
          color: this.themeService.isDark() ? '#e0e0e0' : '#424242',
          lineHeight: 20
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const val = params.value;
          const perc = totalPrec > 0 ? ((val / totalPrec) * 100).toFixed(1) : '0';
          return `<div style="text-align: center;">
                    <strong>${params.name}</strong><br/>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 4px;">
                      <span class="material-icons" style="font-size: 16px; color: #0288d1;">water_drop</span>
                      <span>${val} mm</span>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 2px; font-size: 0.9em; color: #666;">
                      <span class="material-icons" style="font-size: 14px;">pie_chart</span>
                      <span>${perc}% del total anual</span>
                    </div>
                  </div>`;
        }
      },
      polar: {
        // Aumentamos el radio interior ('30%') para que las barras pequeñas no se amontonen en el centro
        radius: ['30%', '80%']
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
        data: monthlyPrec.map(value => {
          const rounded = Math.round(value * 10) / 10;
          const isSmall = rounded < (maxPrec * 0.2); // Si es menos del 20% de la barra más grande
          
          return {
            value: rounded,
            itemStyle: {
              color: '#0288d1' // Blue for rain
            },
            label: {
              show: rounded > 0, // Ocultar si es 0 exacto
              // Si es muy pequeña, escupimos la etiqueta fuera del borde de la barra para evitar solapamientos
              position: isSmall ? 'end' : 'inside',
              distance: isSmall ? 10 : 0,
              color: isSmall ? (this.themeService.isDark() ? '#e0e0e0' : '#424242') : '#fff',
              formatter: '{c}'
            }
          };
        }),
        coordinateSystem: 'polar',
        name: 'Precipitación'
      }
    };
  });
}
