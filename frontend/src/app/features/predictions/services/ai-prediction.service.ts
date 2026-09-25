import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * Representa la estructura de los pesos y configuraciones de la red neuronal pre-entrenada
 * importada desde Python.
 */
export interface ModelWeights {
  /** Metadatos de la arquitectura y variables de entrada (estaciones) */
  metadata: { 
    architecture: number[]; 
    stations: string[]; 
  };
  /** Parámetros del StandardScaler exportados de scikit-learn */
  scaler: { 
    x_mean: number[]; 
    x_scale: number[];
    y_mean: number[];
    y_scale: number[];
  };
  /** Matriz 3D de los pesos para cada capa neuronal */
  weights: number[][][]; 
  /** Vectores de sesgo (biases) para cada capa neuronal */
  biases: number[][];
}

/**
 * Resultado completo de un pase hacia adelante (forward pass) de la red neuronal.
 */
export interface ForwardPassResult {
  /** Predicciones finales destransformadas a sus unidades originales */
  predictions: {
    tmax: number;
    tmin: number;
    prec: number;
  };
  /** Matriz de activaciones de cada capa (incluyendo input y output), usada para visualización */
  activations: number[][];
}

/**
 * Servicio encargado de cargar el modelo de IA y ejecutar inferencias locales 
 * de red neuronal multicapa (Perceptrón) enteramente en el cliente usando TypeScript.
 */
@Injectable({
  providedIn: 'root'
})
export class AiPredictionService {
  private modelData = signal<ModelWeights | null>(null);
  
  /** Signal computado que expone si el modelo ha sido cargado satisfactoriamente en memoria */
  public isModelLoaded = computed(() => this.modelData() !== null);

  constructor(private http: HttpClient) {}

  /**
   * Carga asíncronamente los pesos del modelo pre-entrenado desde los assets estáticos.
   * @throws Error si falla la petición HTTP
   */
  async loadModel(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<ModelWeights>('/model-weights.json'));
      this.modelData.set(data);
    } catch (error) {
      console.error('Error al cargar los pesos del modelo', error);
      throw error;
    }
  }

  /**
   * Obtiene la estructura interna del modelo si está cargado.
   */
  public getModel(): ModelWeights | null {
    return this.modelData();
  }

  /**
   * Ejecuta el pase hacia adelante (Forward Pass) con la red neuronal para estimar
   * las variables meteorológicas de una región en un momento futuro.
   * 
   * @param targetYear Año objetivo de la predicción (ej. 2040)
   * @param targetMonth Mes objetivo (1 al 12)
   * @param stationId ID de la estación o 'ANDALUCIA' para promedio regional
   * @returns El resultado incluyendo predicciones y la topología de activaciones
   */
  predictAndTrace(targetYear: number, targetMonth: number, stationId: string): ForwardPassResult {
    const model = this.modelData();
    if (!model) throw new Error('El modelo aún no está cargado');

    const sinMonth = Math.sin(targetMonth * (2 * Math.PI / 12));
    const cosMonth = Math.cos(targetMonth * (2 * Math.PI / 12));

    const inputs = [targetYear, sinMonth, cosMonth];
    for (const st of model.metadata.stations) {
      if (stationId === 'ANDALUCIA') {
        inputs.push(1.0 / model.metadata.stations.length);
      } else {
        inputs.push(st === stationId ? 1 : 0);
      }
    }
    
    // Escalar los inputs usando el StandardScaler exportado
    const scaledInputs = inputs.map((val, idx) => (val - model.scaler.x_mean[idx]) / model.scaler.x_scale[idx]);
    
    const allActivations: number[][] = [scaledInputs];
    let currentActivations = scaledInputs;
    
    // Forward pass con ReLU para capas ocultas
    for (let i = 0; i < model.weights.length - 1; i++) {
      currentActivations = this.matrixMultiplyAndAdd(currentActivations, model.weights[i], model.biases[i]);
      currentActivations = currentActivations.map(val => Math.max(0, val));
      allActivations.push(currentActivations);
    }

    // Capa de salida (Sin activación ReLU para permitir temperaturas negativas si fuese el caso)
    const outIdx = model.weights.length - 1;
    let finalOutput = this.matrixMultiplyAndAdd(currentActivations, model.weights[outIdx], model.biases[outIdx]);
    allActivations.push(finalOutput);
    
    // Des-escalar la salida: y = (y_scaled * scale) + mean
    const outTmax = (finalOutput[0] * model.scaler.y_scale[0]) + model.scaler.y_mean[0];
    const outTmin = (finalOutput[1] * model.scaler.y_scale[1]) + model.scaler.y_mean[1];
    const outPrec = (finalOutput[2] * model.scaler.y_scale[2]) + model.scaler.y_mean[2];

    return {
      predictions: {
        tmax: Math.round(outTmax * 10) / 10,
        tmin: Math.round(outTmin * 10) / 10,
        prec: Math.round(Math.max(0, outPrec) * 10) / 10 // La precipitación acumulada no puede ser negativa
      },
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
