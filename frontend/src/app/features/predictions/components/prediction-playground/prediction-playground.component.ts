import { Component, OnInit, signal, computed, effect } from '@angular/core';
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
  // Inputs interactivos (Signals)
  tmax = signal<number>(25);
  tmin = signal<number>(15);
  prec = signal<number>(0);

  isLoading = signal<boolean>(true);

  // Computamos la predicción y las activaciones en tiempo real
  forwardPass = computed(() => {
    if (!this.aiService.isModelLoaded()) return null;
    return this.aiService.predictAndTrace(this.tmax(), this.tmin(), this.prec());
  });

  // Opciones de ECharts generadas dinámicamente según el forward pass
  chartOption = computed<EChartsOption>(() => {
    const data = this.forwardPass();
    const model = this.aiService.getModel();
    
    if (!data || !model) return {};

    const nodes: any[] = [];
    const links: any[] = [];
    const layerNames = ['Entrada (Hoy)', 'Capa Oculta 1', 'Capa Oculta 2', 'Salida (Mañana)'];
    
    let nodeIndex = 0;
    const nodeMapping: number[][] = []; // Para mapear enlaces: layerIndex -> neuronIndex -> globalNodeId

    // 1. Crear Nodos
    data.activations.forEach((layerActivations, layerIdx) => {
      nodeMapping[layerIdx] = [];
      const numNeurons = layerActivations.length;
      const xSpacing = 100 / (data.activations.length - 1);
      const xPos = layerIdx * xSpacing;
      
      layerActivations.forEach((activation, neuronIdx) => {
        // Normalizamos color (activation suele estar entre -1 y 1)
        const intensity = Math.min(Math.max((activation + 1) / 2, 0), 1); // 0 a 1
        const r = Math.round(255 * intensity);
        const b = Math.round(255 * (1 - intensity));
        
        let nodeName = `N_${layerIdx}_${neuronIdx}`;
        if (layerIdx === 0) {
           const inputNames = ['T. Máxima', 'T. Mínima', 'Lluvia'];
           nodeName = inputNames[neuronIdx];
        } else if (layerIdx === data.activations.length - 1) {
           nodeName = `T. Máx Mañana: ${data.prediction}ºC`;
        }
        
        const yPos = 50 + (neuronIdx - (numNeurons - 1) / 2) * (100 / Math.max(numNeurons, 1));
        
        nodes.push({
          id: nodeIndex.toString(),
          name: nodeName,
          x: xPos,
          y: yPos,
          symbolSize: layerIdx === data.activations.length - 1 ? 60 : 40,
          itemStyle: {
            color: `rgb(${r}, 100, ${b})`,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: layerIdx === 0 || layerIdx === data.activations.length - 1,
            position: layerIdx === 0 ? 'left' : 'right',
            fontWeight: 'bold',
            color: 'var(--text-primary)'
          }
        });
        
        nodeMapping[layerIdx].push(nodeIndex);
        nodeIndex++;
      });
    });

    // 2. Crear Enlaces (Weights)
    model.network.weights.forEach((weightMatrix, layerIdx) => {
      // weightMatrix es [neuronas_origen][neuronas_destino]
      for (let i = 0; i < weightMatrix.length; i++) {
        for (let j = 0; j < weightMatrix[i].length; j++) {
          const weight = weightMatrix[i][j];
          const sourceId = nodeMapping[layerIdx][i];
          const targetId = nodeMapping[layerIdx + 1][j];
          
          links.push({
            source: sourceId.toString(),
            target: targetId.toString(),
            lineStyle: {
              width: Math.max(0.5, Math.abs(weight) * 3), // Grosor según el peso absoluto
              color: weight > 0 ? '#ff5722' : '#2196f3', // Naranja positivo, Azul negativo
              opacity: 0.6,
              curveness: 0.2
            }
          });
        }
      }
    });

    return {
      title: { text: 'Arquitectura Neuronal (Playground)', left: 'center', textStyle: { color: '#757575', fontSize: 14 } },
      tooltip: {},
      animationDurationUpdate: 300,
      series: [
        {
          type: 'graph',
          layout: 'none',
          symbol: 'circle',
          roam: false,
          label: { show: true },
          edgeSymbol: ['circle', 'arrow'],
          edgeSymbolSize: [4, 8],
          data: nodes,
          links: links,
          lineStyle: { opacity: 0.9, width: 2, curveness: 0 }
        }
      ]
    };
  });

  constructor(public aiService: AiPredictionService) {}

  ngOnInit() {
    this.aiService.loadModel().then(() => {
      this.isLoading.set(false);
    });
  }
}
