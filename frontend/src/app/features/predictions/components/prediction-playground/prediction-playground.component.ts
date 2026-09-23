import { Component, OnInit, signal, computed, effect, inject } from '@angular/core';
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

// SVG Paths para los iconos
const ICONS = {
  tmax: 'path://M12 2v6.17c-1.16.41-2 1.52-2 2.83 0 1.66 1.34 3 3 3s3-1.34 3-3c0-1.31-.84-2.42-2-2.83V2h-2zM12 4v4h2V4h-2zM4.1 6.1c-.39.39-.39 1.02 0 1.4l1.4 1.4c.39.39 1.02.39 1.4 0 .39-.39.39-1.02 0-1.4L5.5 6.1c-.39-.39-1.02-.39-1.4 0zM19.9 6.1c-.39-.39-1.02-.39-1.4 0l-1.4 1.4c-.39.39-.39 1.02 0 1.4.39.39 1.02.39 1.4 0l1.4-1.4c.39-.39.39-1.02 0-1.4z', // Termómetro + sol
  tmin: 'path://M11 2v4h2V2h-2zm4.3 2.3l-1.4 1.4 1.4 1.4 1.4-1.4-1.4-1.4zm-8.6 0l-1.4 1.4 1.4 1.4 1.4-1.4-1.4-1.4zM11 20v4h2v-4h-2z', // Copo de nieve
  prec: 'path://M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-3-3 1.41-1.41L12 15.17l3.59-3.59L17 13z' // Nube
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

  forwardPass = computed(() => {
    if (!this.aiService.isModelLoaded()) return null;
    return this.aiService.predictAndTrace(this.tmax(), this.tmin(), this.prec());
  });

  chartOption = computed<EChartsOption>(() => {
    const data = this.forwardPass();
    const model = this.aiService.getModel();
    
    if (!data || !model) return {};

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
        // Tanh suele estar entre -1 y 1. Normalizamos para la intensidad visual.
        const absAct = Math.abs(activation);
        
        // Colores Neón: Naranja/Rojo para positivo, Cian/Azul para negativo
        const color = activation > 0 ? '#ff3d00' : '#00e5ff';
        const shadowColor = activation > 0 ? 'rgba(255, 61, 0, 0.8)' : 'rgba(0, 229, 255, 0.8)';
        
        let nodeName = `N_${layerIdx}_${neuronIdx}`;
        let symbol = 'circle';
        let labelShow = false;

        if (layerIdx === 0) {
           const inputNames = ['T. Máxima', 'T. Mínima', 'Lluvia'];
           const inputIcons = [ICONS.tmax, ICONS.tmin, ICONS.prec];
           nodeName = inputNames[neuronIdx];
           symbol = inputIcons[neuronIdx];
           labelShow = true;
        } else if (layerIdx === data.activations.length - 1) {
           nodeName = `T. Máx Mañana:\n${data.prediction} ºC`;
           labelShow = true;
        }

        const ySpacing = 100 / (Math.max(numNeurons, 1) + 1);
        const yPos = 100 - ((neuronIdx + 1) * ySpacing); // Invertir Y para que empiece de arriba hacia abajo
        
        nodeCoords.set(nodeIndex, [xPos, yPos]);
        
        // Tamaño base 30, crece hasta 60 dependiendo de la activación
        const dynamicSize = 30 + (absAct * 30);
        
        nodes.push({
          id: nodeIndex.toString(),
          name: nodeName,
          value: [xPos, yPos],
          symbol: symbol,
          symbolSize: layerIdx === 0 ? 40 : (layerIdx === data.activations.length - 1 ? 70 : dynamicSize),
          itemStyle: {
            color: color,
            shadowBlur: 20 * absAct, // Más brillante cuanto más activada
            shadowColor: shadowColor,
            opacity: 0.2 + (absAct * 0.8) // Se vuelve casi invisible si es 0
          },
          label: {
            show: labelShow,
            position: layerIdx === 0 ? 'left' : (layerIdx === data.activations.length - 1 ? 'right' : 'top'),
            fontWeight: 'bold',
            fontSize: 14,
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

    // 2. Crear Enlaces (Links estáticos) y Líneas Animadas (Data Flow)
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
          
          // Link estático de fondo para el Tooltip
          graphLinks.push({
            source: sourceId.toString(),
            target: targetId.toString(),
            lineStyle: {
              width: Math.max(0.2, absWeight * 2),
              color: edgeColor,
              opacity: 0.15,
              curveness: 0.3
            },
            tooltip: {
              formatter: `<strong>Peso de Conexión:</strong> ${weight.toFixed(3)}<br/>
              ${weight > 0 ? 'Influencia POSITIVA (Calienta)' : 'Influencia NEGATIVA (Enfría)'}`
            }
          });

          // Solo dibujamos rastro si el peso es relevante
          if (absWeight > 0.1) {
            animatedLines.push({
              coords: [sourceCoord, targetCoord],
              lineStyle: {
                color: edgeColor,
                width: 0,
                curveness: 0.3
              },
              effect: {
                show: true,
                period: 4 / Math.max(0.5, absWeight), // Más rápido cuanto más peso
                trailLength: 0.4,
                symbolSize: Math.max(2, absWeight * 3), // Partícula más gorda si más peso
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
      animationDurationUpdate: 500,
      series: [
        {
          name: 'Arquitectura',
          type: 'graph',
          coordinateSystem: 'cartesian2d',
          layout: 'none',
          roam: false,
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: [0, 6],
          data: nodes,
          links: graphLinks,
          z: 2
        },
        {
          name: 'Flujo de Datos',
          type: 'lines',
          coordinateSystem: 'cartesian2d',
          polyline: false,
          effect: {
            show: true
          },
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
