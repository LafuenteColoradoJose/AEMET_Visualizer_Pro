import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ModelWeights {
  metadata: { inputs: string[]; outputs: string[]; };
  scaler: { x_mean: number[]; x_scale: number[]; y_mean: number[]; y_scale: number[]; };
  network: { weights: number[][][]; biases: number[][]; };
}

export interface ForwardPassResult {
  prediction: number;
  activations: number[][]; // Cada array representa las salidas de una capa (Input -> Hidden1 -> ... -> Output)
}

@Injectable({
  providedIn: 'root'
})
export class AiPredictionService {
  private modelData = signal<ModelWeights | null>(null);
  public isModelLoaded = computed(() => this.modelData() !== null);

  constructor(private http: HttpClient) {}

  async loadModel(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<ModelWeights>('/model-weights.json'));
      this.modelData.set(data);
    } catch (error) {
      console.error('Error al cargar los pesos del modelo', error);
      throw error;
    }
  }
  
  public getModel(): ModelWeights | null {
    return this.modelData();
  }

  predictAndTrace(tmax: number, tmin: number, prec: number): ForwardPassResult {
    const model = this.modelData();
    if (!model) throw new Error('El modelo aún no está cargado');

    const inputs = [tmax, tmin, prec];
    const scaledInputs = inputs.map((val, idx) => (val - model.scaler.x_mean[idx]) / model.scaler.x_scale[idx]);
    
    const allActivations: number[][] = [scaledInputs];
    let currentActivations = scaledInputs;
    
    // Capas ocultas
    for (let i = 0; i < model.network.weights.length - 1; i++) {
      currentActivations = this.matrixMultiplyAndAdd(currentActivations, model.network.weights[i], model.network.biases[i]);
      currentActivations = currentActivations.map(val => Math.tanh(val));
      allActivations.push(currentActivations);
    }

    // Capa de salida
    const outIdx = model.network.weights.length - 1;
    let finalOutput = this.matrixMultiplyAndAdd(currentActivations, model.network.weights[outIdx], model.network.biases[outIdx]);
    
    // Desescalar salida real, pero mantenemos la activacion raw en la traza para ECharts
    const predictedTemp = (finalOutput[0] * model.scaler.y_scale[0]) + model.scaler.y_mean[0];
    
    // Añadir a las activaciones el output final SIN desescalar (para los colores de nodos que van de -1 a 1)
    allActivations.push(finalOutput);

    return {
      prediction: Math.round(predictedTemp * 10) / 10,
      activations: allActivations
    };
  }

  private matrixMultiplyAndAdd(inputVector: number[], weightsMatrix: number[][], biasesVector: number[]): number[] {
    const numOutputs = weightsMatrix[0].length;
    const result = new Array(numOutputs).fill(0);
    for (let j = 0; j < numOutputs; j++) {
      let sum = 0;
      for (let i = 0; i < inputVector.length; i++) {
        sum += inputVector[i] * weightsMatrix[i][j];
      }
      result[j] = sum + biasesVector[j];
    }
    return result;
  }
}
