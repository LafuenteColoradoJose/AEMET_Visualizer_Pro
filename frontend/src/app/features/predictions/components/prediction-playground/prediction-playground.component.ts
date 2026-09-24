import { Component, OnInit, inject, signal, computed, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter } from '@angular/material/core';
import { NgxEchartsModule } from 'ngx-echarts';
import { AiPredictionService } from '../../services/ai-prediction.service';
import { StationService } from '../../../../core/services/station.service';

const ICONS = {
  tmax: 'path://M12 5.5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zM6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8 8h-2v3h2v-3zm-7.45-3.91l1.41 1.41 1.79-1.79-1.41-1.41-1.79 1.79z',
  tmin: 'path://M22 11h-4.17l3.24-3.24-1.41-1.42L15 11h-2V9l4.66-4.66-1.42-1.41L13 6.17V2h-2v4.17L7.76 2.93 6.34 4.34 11 9v2H9L4.34 6.34 2.93 7.76 6.17 11H2v2h4.17l-3.24 3.24 1.41 1.42L9 13h2v2l-4.66 4.66 1.42 1.41L11 17.83V22h2v-4.17l3.24 3.24 1.42-1.41L13 15v-2h2l4.66 4.66 1.41-1.42L17.83 13H22v-2z',
  prec: 'path://M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z'
};

@Component({
  selector: 'app-prediction-playground',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatCardModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatDatepickerModule, 
    MatFormFieldModule, 
    MatInputModule,
    NgxEchartsModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './prediction-playground.component.html',
  styleUrl: './prediction-playground.component.scss'
})
export class PredictionPlaygroundComponent implements OnInit {
  private aiService = inject(AiPredictionService);
  private stationService = inject(StationService);

  isLoading = signal<boolean>(true);
  
  targetDate = signal<Date>(new Date());
  
  isMobile = signal<boolean>(typeof window !== 'undefined' ? window.innerWidth < 992 : false);

  constructor() {
    effect(() => {
      const st = this.stationService.selectedStation();
      if (st && st.id) {
        this.aiService.loadRecentHistory(st.id);
      }
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile.set(window.innerWidth < 992);
  }

  onDateChange(newDate: Date) {
    if (newDate) this.targetDate.set(new Date(newDate));
  }

  forwardPass = computed(() => {
    if (!this.aiService.isModelLoaded()) return null;
    const st = this.stationService.selectedStation();
    if (!st || !st.id) return null;
    if (!this.targetDate()) return null;
    return this.aiService.predictAndTrace(this.targetDate(), st.id);
  });

  chartOption = computed(() => {
    const data = this.forwardPass();
    if (!data) return {};

    const mobile = this.isMobile();
    const nodes: any[] = [];
    const links: any[] = [];
    
    // Inputs (10 neuronas)
    const inputLayer = data.activations[0];
    const inputSpacing = 90 / Math.max(1, inputLayer.length - 1);
    inputLayer.forEach((val, i) => {
      const yPos = 5 + (i * inputSpacing);
      nodes.push({
        id: `in_${i}`,
        name: `Entrada ${i}\nValor: ${val.toFixed(2)}`,
        value: [10, yPos],
        symbolSize: mobile ? 12 : 18,
        itemStyle: { color: '#00d2ff' },
        emphasis: { label: { show: false } }
      });
    });

    // Hidden 1 (12 neuronas)
    const h1Layer = data.activations[1];
    const h1Spacing = 90 / Math.max(1, h1Layer.length - 1);
    h1Layer.forEach((val, i) => {
      const yPos = 5 + (i * h1Spacing);
      nodes.push({
        id: `h1_${i}`,
        name: `Oculta 1 (N_${i})\nActivación: ${val.toFixed(2)}`,
        value: [40, yPos],
        symbolSize: mobile ? 10 : 16,
        itemStyle: { color: val > 0 ? '#ff0055' : '#00d2ff' },
        emphasis: { label: { show: false } }
      });
      inputLayer.forEach((_, j) => {
        links.push({ source: `in_${j}`, target: `h1_${i}` });
      });
    });

    // Hidden 2 (8 neuronas)
    const h2Layer = data.activations[2];
    const h2Spacing = 90 / Math.max(1, h2Layer.length - 1);
    h2Layer.forEach((val, i) => {
      const yPos = 5 + (i * h2Spacing);
      nodes.push({
        id: `h2_${i}`,
        name: `Oculta 2 (N_${i})\nActivación: ${val.toFixed(2)}`,
        value: [70, yPos],
        symbolSize: mobile ? 10 : 16,
        itemStyle: { color: val > 0 ? '#ff0055' : '#00d2ff' },
        emphasis: { label: { show: false } }
      });
      h1Layer.forEach((_, j) => {
        links.push({ source: `h1_${j}`, target: `h2_${i}` });
      });
    });

    // Outputs (3 neuronas)
    const outputs = [
      { id: 'out_0', name: mobile ? `Máx:\n${data.predictions.tmax}ºC` : `T. Máxima:\n${data.predictions.tmax}ºC`, icon: ICONS.tmax, color: '#ff0055' },
      { id: 'out_1', name: mobile ? `Mín:\n${data.predictions.tmin}ºC` : `T. Mínima:\n${data.predictions.tmin}ºC`, icon: ICONS.tmin, color: '#00d2ff' },
      { id: 'out_2', name: mobile ? `Prec:\n${data.predictions.prec}mm` : `Lluvia:\n${data.predictions.prec}mm`, icon: ICONS.prec, color: '#00b377' } // Verde ligeramente más oscuro para modo claro
    ];
    
    outputs.forEach((out, i) => {
      const yPos = 20 + (i * 30);
      nodes.push({
        id: out.id,
        name: out.name,
        value: [95, yPos],
        symbol: out.icon,
        symbolSize: mobile ? 28 : 45,
        itemStyle: { color: out.color },
        label: {
          show: true,
          position: mobile ? 'bottom' : 'left',
          color: out.color,
          fontSize: mobile ? 11 : 14,
          fontWeight: 'bold',
          formatter: out.name
        }
      });
      h2Layer.forEach((_, j) => {
        links.push({ source: `h2_${j}`, target: out.id });
      });
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        show: true,
        formatter: (params: any) => {
          return params.name ? params.name.replace(/\n/g, '<br/>') : '';
        },
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        textStyle: { color: '#fff', fontSize: 13 },
        borderWidth: 0,
        padding: [8, 12]
      },
      animationDurationUpdate: 500,
      xAxis: { type: 'value', show: false, min: 0, max: 100 },
      yAxis: { type: 'value', show: false, min: 0, max: 100 },
      series: [
        {
          type: 'graph',
          coordinateSystem: 'cartesian2d',
          roam: mobile, // Solo permite zoom/pan en móviles
          layout: 'none',
          emphasis: { label: { show: false } },
          edgeSymbol: ['none', 'none'],
          data: nodes,
          links: links,
          // Color gris semi-transparente que funciona perfecto tanto en fondo blanco como oscuro
          lineStyle: { color: '#888888', opacity: 0.3, width: 1 } 
        },
        {
          type: 'lines',
          coordinateSystem: 'cartesian2d',
          effect: { show: true, trailLength: 0.2, symbolSize: mobile ? 2 : 3, color: '#00d2ff' },
          lineStyle: { width: 0 },
          data: links.map(l => {
            const s = nodes.find(n => n.id === l.source);
            const t = nodes.find(n => n.id === l.target);
            return { coords: [s.value, t.value] };
          })
        }
      ]
    };
  });

  async ngOnInit() {
    await this.aiService.loadModel();
    this.isLoading.set(false);
  }
}
