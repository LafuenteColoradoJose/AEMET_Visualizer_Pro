import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AiPredictionService, ModelWeights } from './ai-prediction.service';

describe('AiPredictionService', () => {
  let service: AiPredictionService;
  let httpMock: HttpTestingController;

  const mockModelWeights: ModelWeights = {
    metadata: {
      architecture: [11, 2, 3], // 1 (Year) + 2 (Month) + 8 (Stations)
      stations: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    },
    scaler: {
      x_mean: new Array(11).fill(0),
      x_scale: new Array(11).fill(1),
      y_mean: [20, 10, 50],
      y_scale: [5, 5, 20]
    },
    weights: [
      [ // Capa Oculta 1 (11 inputs x 2 neurons)
        ...new Array(11).fill([0.1, 0.2])
      ],
      [ // Salida (2 hidden x 3 outputs)
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6]
      ]
    ],
    biases: [
      [0.1, 0.2], // Sesgo oculta 1
      [0.1, 0.1, 0.1] // Sesgo salida
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AiPredictionService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AiPredictionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should predict values and return network trace properly for monthly data', async () => {
    const loadPromise = service.loadModel();
    const req = httpMock.expectOne('/model-weights.json');
    req.flush(mockModelWeights);
    await loadPromise;

    const result = service.predictAndTrace(2050, 8, 'A');

    expect(result.predictions).toBeDefined();
    expect(result.activations.length).toBe(3); // Input, Hidden, Output
    expect(result.activations[0].length).toBe(11); // 11 inputs
    expect(result.activations[1].length).toBe(2);  // 2 hidden neurons
    expect(result.activations[2].length).toBe(3);  // 3 outputs
    
    expect(result.predictions.tmax).not.toBeNaN();
    expect(result.predictions.tmin).not.toBeNaN();
    expect(result.predictions.prec).not.toBeNaN();
  });
});
