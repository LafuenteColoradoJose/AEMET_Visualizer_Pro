/**
 * Representa un registro histórico diario del clima.
 * Refleja directamente la estructura de datos que devuelve la API de FastAPI.
 */
export interface WeatherRecord {
  /** Identificador único (Primary Key en la DB) opcional desde el cliente */
  id?: number;
  /** Identificador de la estación meteorológica (ej: '5402') */
  estacion?: string;
  /** Fecha del registro en formato ISO YYYY-MM-DD */
  fecha: string;
  /** Temperatura media diaria en grados Celsius */
  tmed: number | null;
  /** Temperatura máxima diaria en grados Celsius */
  tmax: number | null;
  /** Temperatura mínima diaria en grados Celsius */
  tmin: number | null;
  /** Precipitación acumulada en mm */
  prec?: number | null;
  /** Velocidad media del viento en m/s o km/h */
  velmedia?: number | null;
  /** Racha máxima del viento */
  racha?: number | null;
  /** Horas de sol */
  sol?: number | null;
  /** Presión máxima */
  presMax?: number | null;
  /** Presión mínima */
  presMin?: number | null;
}
