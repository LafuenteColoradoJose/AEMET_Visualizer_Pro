import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AiPredictionService, ModelWeights } from './ai-prediction.service';

describe('AiPredictionService', () => {
  let service: AiPredictionService;
  let httpMock: HttpTestingController;

  const mockModelWeights: ModelWeights = {
    metadata: {
      architecture: [25, 2, 3],
      stations: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      historical_means: {
        'A': { '227': { tmax: 30, tmin: 20, prec: 0 } } // 2030-08-15 es ~227
      }
    },
    scaler: {
      x_mean: new Array(25).fill(0),
      x_scale: new Array(25).fill(1),
    },
    // 25 inputs -> 2 hidden -> 3 outputs
    weights: [
      [ // Capa Oculta 1 (25 inputs x 2 neurons)
        ...new Array(25).fill([0.1, 0.2])
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

  it('should predict values and return network trace properly', async () => {
    const loadPromise = service.loadModel();
    const req = httpMock.expectOne('/model-weights.json');
    req.flush(mockModelWeights);
    await loadPromise;

    const d = new Date('2030-08-15');
    const result = service.predictAndTrace(d, 'A');

    expect(result.predictions).toBeDefined();
    expect(result.activations.length).toBe(3);
    expect(result.activations[0].length).toBe(25);
    expect(result.activations[1].length).toBe(2);
    expect(result.activations[2].length).toBe(3);
  });
});
