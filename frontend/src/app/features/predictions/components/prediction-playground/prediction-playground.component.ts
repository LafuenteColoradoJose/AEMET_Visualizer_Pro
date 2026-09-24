import { Component, OnInit, signal, computed, effect, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { AiPredictionService } from '../../services/ai-prediction.service';
import { EChartsOption } from 'echarts';
import { StationService } from '../../../../core/services/station.service';
import { WeatherService } from '../../../../core/services/weather.service';

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
    MatSliderModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule,
    MatProgressSpinnerModule,
    NgxEchartsModule
  ],
  templateUrl: './prediction-playground.component.html',
  styleUrls: ['./prediction-playground.component.scss']
})
export class PredictionPlaygroundComponent implements OnInit {
  public aiService = inject(AiPredictionService);
  private stationService = inject(StationService);
  private weatherService = inject(WeatherService);

  tmax = signal<number>(25);
  tmin = signal<number>(15);
  prec = signal<number>(0);

  isLoading = signal<boolean>(true);
  isFetchingData = signal<boolean>(false);
  
  // Detección responsive inicial
  isMobile = signal<boolean>(typeof window !== 'undefined' ? window.innerWidth < 992 : false);

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile.set(event.target.innerWidth < 992);
  }

  forwardPass = computed(() => {
    if (!this.aiService.isModelLoaded()) return null;
    return this.aiService.predictAndTrace(this.tmax(), this.tmin(), this.prec());
  });

  chartOption = computed<EChartsOption>(() => {
    const data = this.forwardPass();
    const model = this.aiService.getModel();
    
    if (!data || !model) return {};

    const mobile = this.isMobile();
    
    // Tamaños responsivos
    const inputSize = mobile ? 25 : 40;
    const hiddenSizeBase = mobile ? 15 : 30;
    const outputSize = mobile ? 45 : 70;
    const labelFontSize = mobile ? 11 : 14;

    const nodes: any[] = [];
    const graphLinks: any[] = [];
    const animatedLines: any[] = [];
    
    let nodeIndex = 0;
    const nodeMapping: number[][] = []; 
    const nodeCoords = new Map<number, [number, number]>();

    // 1. Crear Nodos
    data.activations.forEach((layerActivations, layerIdx) => {
      nodeMapping[layerIdx] = [];
      const numNeurons = layerActivations.length;
      const xSpacing = 100 / (data.activations.length - 1);
      const xPos = layerIdx * xSpacing;
      
      layerActivations.forEach((activation, neuronIdx) => {
        const absAct = Math.abs(activation);
        
        const color = activation > 0 ? '#ff3d00' : '#00e5ff';
        const shadowColor = activation > 0 ? 'rgba(255, 61, 0, 0.8)' : 'rgba(0, 229, 255, 0.8)';
        
        let nodeName = `N_${layerIdx}_${neuronIdx}`;
        let symbol = 'circle';
        let labelShow = false;
        let symbolSize = hiddenSizeBase + (absAct * hiddenSizeBase);

        if (layerIdx === 0) {
           const inputNames = ['T. Máxima', 'T. Mínima', 'Lluvia'];
           const inputIcons = [ICONS.tmax, ICONS.tmin, ICONS.prec];
           nodeName = inputNames[neuronIdx];
           symbol = inputIcons[neuronIdx];
           // En móvil ocultamos las etiquetas de entrada para no colapsar, dejamos los iconos
           labelShow = !mobile;
           symbolSize = inputSize;
        } else if (layerIdx === data.activations.length - 1) {
           // Etiqueta de salida con salto de línea si es móvil
           nodeName = mobile ? `Predicción:\n${data.prediction} ºC` : `T. Máx Mañana:\n${data.prediction} ºC`;
           labelShow = true;
           symbolSize = outputSize;
        }

        const ySpacing = 100 / (Math.max(numNeurons, 1) + 1);
        const yPos = 100 - ((neuronIdx + 1) * ySpacing);
        
        nodeCoords.set(nodeIndex, [xPos, yPos]);
        
        nodes.push({
          id: nodeIndex.toString(),
          name: nodeName,
          value: [xPos, yPos],
          symbol: symbol,
          symbolSize: symbolSize,
          itemStyle: {
            color: color,
            shadowBlur: 20 * absAct,
            shadowColor: shadowColor,
            opacity: 0.2 + (absAct * 0.8)
          },
          label: {
            show: labelShow,
            position: layerIdx === 0 ? 'left' : (layerIdx === data.activations.length - 1 ? (mobile ? 'bottom' : 'right') : 'top'),
            fontWeight: 'bold',
            fontSize: labelFontSize,
            color: 'var(--text-primary)'
          },
          tooltip: {
            formatter: layerIdx > 0 && layerIdx < data.activations.length - 1 
              ? `Neurona Oculta<br/>Activación: ${activation.toFixed(3)}` 
              : '{b}'
          }
        });
        
        nodeMapping[layerIdx].push(nodeIndex);
        nodeIndex++;
      });
    });

    // 2. Crear Enlaces y Líneas Animadas
    model.network.weights.forEach((weightMatrix, layerIdx) => {
      for (let i = 0; i < weightMatrix.length; i++) {
        for (let j = 0; j < weightMatrix[i].length; j++) {
          const weight = weightMatrix[i][j];
          const absWeight = Math.abs(weight);
          const sourceId = nodeMapping[layerIdx][i];
          const targetId = nodeMapping[layerIdx + 1][j];
          
          const sourceCoord = nodeCoords.get(sourceId);
          const targetCoord = nodeCoords.get(targetId);
          
          const edgeColor = weight > 0 ? '#ff9800' : '#03a9f4';
          
          const lineWidth = mobile ? Math.max(0.1, absWeight * 1.5) : Math.max(0.2, absWeight * 2);
          
          graphLinks.push({
            source: sourceId.toString(),
            target: targetId.toString(),
            lineStyle: {
              width: lineWidth,
              color: edgeColor,
              opacity: 0.15,
              curveness: 0.3
            },
            tooltip: {
              formatter: `<strong>Peso:</strong> ${weight.toFixed(3)}<br/>
              ${weight > 0 ? 'POSITIVA (Calienta)' : 'NEGATIVA (Enfría)'}`
            }
          });

          if (absWeight > 0.1) {
            const particleSize = mobile ? Math.max(1.5, absWeight * 2) : Math.max(2, absWeight * 3);
            animatedLines.push({
              coords: [sourceCoord, targetCoord],
              lineStyle: { color: edgeColor, width: 0, curveness: 0.3 },
              effect: {
                show: true,
                period: 4 / Math.max(0.5, absWeight),
                trailLength: 0.4,
                symbolSize: particleSize,
                color: edgeColor,
                loop: true
              }
            });
          }
        }
      }
    });

    return {
      tooltip: { trigger: 'item' },
      xAxis: { type: 'value', show: false, min: -10, max: 110 },
      yAxis: { type: 'value', show: false, min: -10, max: 110 },
      animationDurationUpdate: 300,
      roam: mobile, // Permitir zoom y scroll en móviles para exploración libre
      series: [
        {
          name: 'Arquitectura',
          type: 'graph',
          coordinateSystem: 'cartesian2d',
          layout: 'none',
          roam: false,
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: mobile ? [0, 4] : [0, 6],
          data: nodes,
          links: graphLinks,
          z: 2
        },
        {
          name: 'Flujo de Datos',
          type: 'lines',
          coordinateSystem: 'cartesian2d',
          polyline: false,
          effect: { show: true },
          data: animatedLines,
          z: 3
        }
      ]
    };
  });

  constructor() {
    effect(() => {
      const station = this.stationService.selectedStation();
      if (station && station.id) {
        this.fetchLastWeatherRecord(station.id);
      }
    });
  }

  ngOnInit() {
    this.aiService.loadModel().then(() => {
      this.isLoading.set(false);
    });
  }

  private fetchLastWeatherRecord(stationId: string) {
    this.isFetchingData.set(true);
    this.weatherService.getHistoricalData(stationId).subscribe({
      next: (records) => {
        if (records && records.length > 0) {
          const lastRecord = records[records.length - 1];
          if (lastRecord.tmax != null) this.tmax.set(Math.round(lastRecord.tmax));
          if (lastRecord.tmin != null) this.tmin.set(Math.round(lastRecord.tmin));
          if (lastRecord.prec != null) this.prec.set(Math.round(lastRecord.prec));
        }
        this.isFetchingData.set(false);
      },
      error: () => {
        this.isFetchingData.set(false);
      }
    });
  }
}
