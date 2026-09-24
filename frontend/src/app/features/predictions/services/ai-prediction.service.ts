import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ModelWeights {
  metadata: { 
    architecture: number[]; 
    stations: string[]; 
    historical_means: { [station: string]: { [doy: string]: { tmax: number; tmin: number; prec: number; } } };
  };
  scaler: { x_mean: number[]; x_scale: number[]; };
  weights: number[][][]; 
  biases: number[][];
}

export interface ForwardPassResult {
  predictions: {
    tmax: number;
    tmin: number;
    prec: number;
  };
  activations: number[][];
}

@Injectable({
  providedIn: 'root'
})
export class AiPredictionService {
  private modelData = signal<ModelWeights | null>(null);
  public isModelLoaded = computed(() => this.modelData() !== null);

  // Historial reciente para inercia térmica
  private recentHistory = signal<any[]>([]);

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

  private formatDateLocal(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Carga los últimos 15 días de la estación para alimentar la red
  async loadRecentHistory(stationId: string): Promise<void> {
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 15);
      
      const startStr = this.formatDateLocal(start);
      const endStr = this.formatDateLocal(end);
      
      const records = await firstValueFrom(
        this.http.get<any[]>(`https://aemet-visualizer-pro-backend.onrender.com/api/v1/weather/historical?estacion=${stationId}&start_date=${startStr}&end_date=${endStr}`)
      );
      this.recentHistory.set(records);
    } catch (error) {
      console.error('Error al cargar historial reciente:', error);
      this.recentHistory.set([]);
    }
  }
  
  public getModel(): ModelWeights | null {
    return this.modelData();
  }

  private getHistoricalMean(stationId: string, dayOfYear: number) {
    const model = this.modelData();
    if (!model) return { tmax: 0, tmin: 0, prec: 0 };
    
    if (stationId === 'ANDALUCIA') {
      let tmax = 0, tmin = 0, prec = 0;
      let count = 0;
      for (const st of model.metadata.stations) {
         const means = model.metadata.historical_means[st]?.[dayOfYear.toString()];
         if (means) { tmax += means.tmax; tmin += means.tmin; prec += means.prec; count++; }
      }
      return count > 0 ? { tmax: tmax/count, tmin: tmin/count, prec: prec/count } : { tmax: 0, tmin: 0, prec: 0 };
    }
    
    const means = model.metadata.historical_means[stationId]?.[dayOfYear.toString()];
    return means || { tmax: 0, tmin: 0, prec: 0 };
  }

  // Calcula qué día del año es una fecha
  private getDayOfYear(d: Date): number {
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = d.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  predictAndTrace(targetDate: Date, stationId: string): ForwardPassResult {
    const model = this.modelData();
    if (!model) throw new Error('El modelo aún no está cargado');

    const dayOfYear = this.getDayOfYear(targetDate);
    const sinDay = Math.sin(dayOfYear * (2 * Math.PI / 365.25));
    const cosDay = Math.cos(dayOfYear * (2 * Math.PI / 365.25));

    const inputs = [sinDay, cosDay];
    for (const st of model.metadata.stations) {
      if (stationId === 'ANDALUCIA') {
        inputs.push(1.0 / model.metadata.stations.length);
      } else {
        inputs.push(st === stationId ? 1 : 0);
      }
    }
    
    // Calcular Lags de Anomalías reales (5 días)
    const history = this.recentHistory();
    const lagAnomalies = [];
    
    for (let i = 1; i <= 5; i++) {
      const lagDate = new Date(targetDate);
      lagDate.setDate(targetDate.getDate() - i);
      const lagDateStr = this.formatDateLocal(lagDate);
      
      const record = history.find(r => r.fecha === lagDateStr);
      if (record && record.tmax !== null && record.tmin !== null && record.prec !== null) {
        // Encontramos el dato real. Calculamos su anomalía restándole la media histórica de ese día lagDate.
        const lagDoy = this.getDayOfYear(lagDate);
        const baseline = this.getHistoricalMean(stationId, lagDoy);
        lagAnomalies.push(record.tmax - baseline.tmax);
        lagAnomalies.push(record.tmin - baseline.tmin);
        lagAnomalies.push(record.prec - baseline.prec);
      } else {
        // Si no tenemos el dato (ej. predecimos 2030, o falta dato), asumimos 0 anomalía
        lagAnomalies.push(0, 0, 0);
      }
    }

    inputs.push(...lagAnomalies);

    const scaledInputs = inputs.map((val, idx) => (val - model.scaler.x_mean[idx]) / model.scaler.x_scale[idx]);
    
    const allActivations: number[][] = [scaledInputs];
    let currentActivations = scaledInputs;
    
    // Forward pass con ReLU
    for (let i = 0; i < model.weights.length - 1; i++) {
      currentActivations = this.matrixMultiplyAndAdd(currentActivations, model.weights[i], model.biases[i]);
      currentActivations = currentActivations.map(val => Math.max(0, val));
      allActivations.push(currentActivations);
    }

    const outIdx = model.weights.length - 1;
    let finalOutput = this.matrixMultiplyAndAdd(currentActivations, model.weights[outIdx], model.biases[outIdx]);
    allActivations.push(finalOutput);
    
    const baseline = this.getHistoricalMean(stationId, dayOfYear);
    
    const outTmax = baseline.tmax + finalOutput[0];
    const outTmin = baseline.tmin + finalOutput[1];
    const outPrec = baseline.prec + finalOutput[2];

    return {
      predictions: {
        tmax: Math.round(outTmax * 10) / 10,
        tmin: Math.round(outTmin * 10) / 10,
        prec: Math.round(Math.max(0, outPrec) * 10) / 10
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
