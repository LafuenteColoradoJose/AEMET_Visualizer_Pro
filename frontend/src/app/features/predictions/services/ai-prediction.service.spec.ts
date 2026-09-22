import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AiPredictionService, ModelWeights } from './ai-prediction.service';

describe('AiPredictionService', () => {
  let service: AiPredictionService;
  let httpMock: HttpTestingController;

  const mockWeights: ModelWeights = {
    metadata: { inputs: ['tmax', 'tmin', 'prec'], outputs: ['tmax_manana'] },
    scaler: {
      x_mean: [20, 10, 5],
      x_scale: [5, 5, 2],
      y_mean: [22],
      y_scale: [5]
    },
    network: {
      // 3 inputs -> 2 hidden -> 1 output
      weights: [
        [ // Capa 1: 3x2
          [0.1, 0.2],
          [0.3, 0.4],
          [0.5, 0.6]
        ],
        [ // Capa Salida: 2x1
          [0.7],
          [0.8]
        ]
      ],
      biases: [
        [0.1, 0.2], // Sesgos Capa 1
        [0.3]       // Sesgos Capa Salida
      ]
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AiPredictionService]
    });
    service = TestBed.inject(AiPredictionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load model weights via HTTP and update signal', async () => {
    expect(service.isModelLoaded()).toBeFalse();
    
    const loadPromise = service.loadModel();
    
    const req = httpMock.expectOne('/model-weights.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockWeights);
    
    await loadPromise;
    
    expect(service.isModelLoaded()).toBeTrue();
  });

  it('should throw error if predicting before loading model', () => {
    expect(() => service.predictTomorrowTemp(25, 15, 0)).toThrowError('El modelo aún no está cargado');
  });

  it('should perform forward pass correctly with mock data', async () => {
    const loadPromise = service.loadModel();
    httpMock.expectOne('/model-weights.json').flush(mockWeights);
    await loadPromise;

    // Entradas a probar: tmax=25, tmin=15, prec=0
    // Escaladas: (25-20)/5 = 1, (15-10)/5 = 1, (0-5)/2 = -2.5
    // Capa 1 (Inputs = [1, 1, -2.5]):
    // N1 = (1*0.1) + (1*0.3) + (-2.5*0.5) + 0.1(bias) = 0.1 + 0.3 - 1.25 + 0.1 = -0.75
    // N2 = (1*0.2) + (1*0.4) + (-2.5*0.6) + 0.2(bias) = 0.2 + 0.4 - 1.5 + 0.2 = -0.7
    // Tanh de la Capa 1:
    // A1 = tanh(-0.75) ≈ -0.635
    // A2 = tanh(-0.7) ≈ -0.604
    // Capa de Salida:
    // Out = (A1*0.7) + (A2*0.8) + 0.3(bias) = (-0.635*0.7) + (-0.604*0.8) + 0.3 = -0.4445 - 0.4832 + 0.3 = -0.6277
    // Desescalar:
    // Pred = Out * y_scale + y_mean = -0.6277 * 5 + 22 = -3.1385 + 22 = 18.8615
    // Redondeado a 1 decimal = 18.9

    const prediction = service.predictTomorrowTemp(25, 15, 0);
    expect(prediction).toBe(18.9);
  });
});
