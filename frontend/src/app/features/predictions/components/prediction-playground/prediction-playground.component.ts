import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxEchartsModule } from 'ngx-echarts';
import { AiPredictionService } from '../../services/ai-prediction.service';
import { StationService } from '../../../../core/services/station.service';
import { StationSelectorComponent } from '../../../../shared/components/station-selector/station-selector.component';

const ICONS = {
  tmax: 'path://M12 5.5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zM6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8 8h-2v3h2v-3zm-7.45-3.91l1.41 1.41 1.79-1.79-1.41-1.41-1.79 1.79z',
  tmin: 'path://M22 11h-4.17l3.24-3.24-1.41-1.42L15 11h-2V9l4.66-4.66-1.42-1.41L13 6.17V2h-2v4.17L7.76 2.93 6.34 4.34 11 9v2H9L4.34 6.34 2.93 7.76 6.17 11H2v2h4.17l-3.24 3.24 1.41 1.42L9 13h2v2l-4.66 4.66 1.42 1.41L11 17.83V22h2v-4.17l3.24 3.24 1.42-1.41L13 15v-2h2l4.66 4.66 1.41-1.42L17.83 13H22v-2z',
  prec: 'path://M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z'
};

const STATION_NAMES: Record<string, string> = {
  '3195': 'Cádiz',
  '4642E': 'Huelva',
  '5270B': 'Jaén',
  '5402': 'Córdoba',
  '5530E': 'Granada',
  '5783': 'Sevilla',
  '6155A': 'Málaga',
  '6325O': 'Almería'
};

/**
 * Componente principal interactivo ("Laboratorio IA") que permite a los usuarios
 * experimentar con la red neuronal climática. Renderiza controles y la topología
 * interactiva del modelo generada dinámicamente con ECharts.
 */
@Component({
  selector: 'app-prediction-playground',
  standalone: true,
  imports: [
    CommonModule, 
    StationSelectorComponent,
    FormsModule, 
    MatCardModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatSliderModule,
    MatSelectModule,
    MatFormFieldModule, 
    NgxEchartsModule
  ],
  templateUrl: './prediction-playground.component.html',
  styleUrl: './prediction-playground.component.scss'
})
export class PredictionPlaygroundComponent implements OnInit {
  aiService = inject(AiPredictionService);
  stationService = inject(StationService);

  /** Indica si los pesos de la red están siendo descargados/cargados */
  isLoading = signal<boolean>(true);
  
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  /** Año seleccionado en el deslizador (slider) por el usuario */
  selectedYear = signal<number>(this.currentYear);
  /** Mes seleccionado (1-12) en el deslizador por el usuario */
  selectedMonth = signal<number>(this.currentMonth);
  
  /** 
   * Determina si la vista actual se encuentra en un dispositivo móvil 
   * (pantalla < 992px). Se actualiza vía ResizeObserver/HostListener.
   */
  isMobile = signal<boolean>(typeof window !== 'undefined' ? window.innerWidth < 992 : false);

  /** Constante de meses para el selector iterativo de Enero a Diciembre */
  readonly months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  /** Maneja el cambio de tamaño de pantalla para ajustar el layout interactivo */
  @HostListener('window:resize')
  onResize() {
    this.isMobile.set(window.innerWidth < 992);
  }

  /** Función helper usada por el componente MatSlider para formatear los "ticks" */
  formatYear(value: number): string {
    return `${value}`;
  }

  /**
   * Computed que reacciona a los cambios en estación, año o mes, invocando el 
   * `predictAndTrace` de la IA. Si la red no está cargada retorna nulo.
   */
  forwardPass = computed(() => {
    if (!this.aiService.isModelLoaded()) return null;
    const st = this.stationService.selectedStation();
    if (!st || !st.id) return null;
    const year = this.selectedYear();
    const month = this.selectedMonth();
    if (!year || !month) return null;
    return this.aiService.predictAndTrace(year, month, st.id);
  });

  /**
   * Computed que genera dinámicamente las configuraciones visuales del gráfico
   * ECharts a partir de la matriz de activaciones y predicciones generadas por la IA.
   */
  chartOption = computed(() => {
    const data = this.forwardPass();
    if (!data) return {};

    const mobile = this.isMobile();
    const nodes: any[] = [];
    const links: any[] = [];
    
    // Inputs (11 neuronas)
    const inputLayer = data.activations[0];
    const inputSpacing = 90 / Math.max(1, inputLayer.length - 1);
    
    // Nombres semánticos para las 11 neuronas de entrada
    const stationKeys = ['3195', '4642E', '5270B', '5402', '5530E', '5783', '6155A', '6325O'];
    const currentMonthObj = this.months.find(m => m.value === this.selectedMonth());
    const monthName = currentMonthObj ? currentMonthObj.label : `Mes ${this.selectedMonth()}`;

    inputLayer.forEach((val, i) => {
      const yPos = 5 + (i * inputSpacing);
      let neuronLabel = `Entrada ${i}`;
      let neuronFullTitle = `Entrada ${i}`;
      const isHighActivation = Math.abs(val) > 0.3;
      
      if (i === 0) {
        neuronLabel = `Año: ${this.selectedYear()}`;
        neuronFullTitle = `Año Objetivo: ${this.selectedYear()}`;
      } else if (i === 1) {
        neuronLabel = `Mes (sen)`;
        neuronFullTitle = `Mes: ${monthName} (Componente Cíclica Seno)`;
      } else if (i === 2) {
        neuronLabel = `Mes (cos)`;
        neuronFullTitle = `Mes: ${monthName} (Componente Cíclica Coseno)`;
      } else {
        const stCode = stationKeys[i - 3];
        const cityName = STATION_NAMES[stCode] || `Est. ${stCode}`;
        neuronLabel = cityName;
        neuronFullTitle = `Estación: ${cityName} (${stCode})`;
      }

      nodes.push({
        id: `in_${i}`,
        name: `${neuronFullTitle}\nNormalizado: ${val.toFixed(2)}`,
        value: [10, yPos],
        symbolSize: mobile ? 12 : 18,
        itemStyle: { color: isHighActivation ? '#00d2ff' : '#4a6572' },
        label: {
          show: !mobile,
          position: 'left',
          fontSize: 10,
          color: '#888888',
          formatter: neuronLabel
        },
        emphasis: { label: { show: true, position: 'left' } }
      });
    });

    // Hidden 1 (16 neuronas en el modelo actual)
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
      { 
        id: 'out_0', 
        name: mobile ? `Máx:\n${data.predictions.tmax} ºC` : `T. Máxima Promedio:\n${data.predictions.tmax} ºC`, 
        icon: ICONS.tmax, 
        color: '#ff0055' 
      },
      { 
        id: 'out_1', 
        name: mobile ? `Mín:\n${data.predictions.tmin} ºC` : `T. Mínima Promedio:\n${data.predictions.tmin} ºC`, 
        icon: ICONS.tmin, 
        color: '#00d2ff' 
      },
      { 
        id: 'out_2', 
        name: mobile ? `Prec:\n${data.predictions.prec} mm` : `Precipitación Estimada:\n${data.predictions.prec} mm`, 
        icon: ICONS.prec, 
        color: '#00b377' 
      }
    ];
    
    outputs.forEach((out, i) => {
      const yPos = 20 + (i * 30);
      nodes.push({
        id: out.id,
        name: out.name,
        value: [85, yPos], // Movido ligeramente a la izquierda para dar espacio al texto a la derecha
        symbol: out.icon,
        symbolSize: mobile ? 28 : 45,
        itemStyle: { color: out.color },
        label: {
          show: true,
          position: mobile ? 'bottom' : 'right', // En desktop a la derecha para no pisar la capa oculta
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
      xAxis: { type: 'value', show: false, min: -10, max: mobile ? 95 : 120 }, // En desktop se expande a 120 para el texto, en móvil a 95
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
