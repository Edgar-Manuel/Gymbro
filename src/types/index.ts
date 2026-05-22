// Grupo Muscular
export const GrupoMuscular = {
  PECHO: 'pecho',
  ESPALDA: 'espalda',
  PIERNAS: 'piernas',
  HOMBROS: 'hombros',
  BICEPS: 'biceps',
  TRICEPS: 'triceps',
  ANTEBRAZOS: 'antebrazos',
  ABDOMINALES: 'abdominales',
  FEMORALES_GLUTEOS: 'femorales_gluteos'
} as const;

export type GrupoMuscular = typeof GrupoMuscular[keyof typeof GrupoMuscular];

export type Tier = 'S' | 'A' | 'B' | 'C' | 'F';
export type Categoria = 'compuesto' | 'aislamiento';
export type Nivel = 'principiante' | 'intermedio' | 'avanzado';
export type Objetivo = 'fuerza' | 'hipertrofia' | 'resistencia' | 'perdida_grasa';
export type ObjetivoCalorico = 'superavit' | 'mantenimiento' | 'deficit';
export type Equipamiento = 'barra' | 'mancuerna' | 'polea' | 'peso_corporal' | 'maquina';
export type Somatotipo = 'ectomorfo' | 'mesomorfo' | 'endomorfo';

// Exercise Knowledge Base
export interface ExerciseTecnica {
  posicionInicial: string;
  ejecucion: string[];
  erroresComunes: string[];
  consejosClave: string[];
}

export interface ExerciseVariante {
  nombre: string;
  cuando: string;
  tier: Tier;
}

export interface ExerciseImagenes {
  posicionInicial: string;
  ejecucion: string[];
  errores: string[];
}

export interface ExerciseKnowledge {
  id: string;
  nombre: string;
  grupoMuscular: GrupoMuscular;
  /** Músculos secundarios trabajados (cuentan al 0.5× en volumen por grupo) */
  musculosSecundarios?: GrupoMuscular[];
  categoria: Categoria;
  tier: Tier;

  tecnica: ExerciseTecnica;

  equipamiento: Equipamiento[];
  dificultad: Nivel;
  enfoqueMuscular: string[];

  imagenes: ExerciseImagenes;

  variantes: ExerciseVariante[];
  descansoSugerido: number; // segundos
  tags?: string[]; // ej: ["tiron_vertical", "tiron_horizontal"]
  /** Id del video del catálogo exerciseVideos (alternativa a relatedExercises) */
  videoId?: string;
  /** Id del ejercicio canónico del que esta variante hereda técnica/imágenes/videos. Solo se usa cuando `id` es un slug generado de una rutina externa (CBum, FullW, etc.). */
  baseExerciseId?: string;
}

// User Profile
export interface EvaluacionFisica {
  fecha: string; // ISO date
  estrategia: 'volumen' | 'definicion' | 'recomposicion';
  prioridades: string[]; // muscle groups to prioritize, e.g. ['espalda', 'brazos']
  proteinaMeta: number; // grams/day
  caloriasExtra: number; // surplus (+) or deficit (-) in kcal
  puntosFuertes: string[];
  areasMejora: string[];
  notas: string; // full assessment text
}

export interface UserProfile {
  id: string;
  nombre: string;
  email?: string; // Para Appwrite
  nivel: Nivel;
  objetivo: Objetivo;
  diasDisponibles: number;
  equipamiento: Equipamiento[];
  lesiones?: string[];
  tiempoSesion?: number; // minutos
  preferencias?: Record<string, unknown>; // Para Appwrite
  restricciones?: string[]; // Para Appwrite

  // Datos físicos
  pesoActual: number; // kg
  peso?: number; // Alias para pesoActual
  altura: number; // cm
  edad: number;
  sexo?: 'masculino' | 'femenino';
  somatotipo?: Somatotipo; // Tipo de cuerpo
  intolerancias?: string[]; // Ej: ['lactosa', 'gluten']

  // Objetivos nutricionales
  objetivoCalorico?: ObjetivoCalorico;
  factorActividad?: number; // 1.2 - 1.9

  // Configuración
  horaPreferida?: string; // "08:00"
  notificacionesActivas?: boolean;

  // Progreso
  fechaInicio?: Date;
  pesoInicial?: number;
  rachaActual?: number; // días consecutivos

  gymActual?: string;
  gymActualNombre?: string;
  evaluacionFisica?: EvaluacionFisica;
}

// Workout Planning
export interface EjercicioEnRutina {
  ejercicioId: string;
  ejercicio?: ExerciseKnowledge; // populated
  seriesObjetivo: number;
  repsObjetivo: number | [number, number]; // número fijo o rango [min, max]
  pesoSugerido?: number;
  notas?: string;
}

export interface DiaRutina {
  id?: string;
  nombre: string;
  grupos: GrupoMuscular[];
  gruposMusculares?: GrupoMuscular[]; // Alias para grupos
  ejercicios: EjercicioEnRutina[];
  duracionEstimada: number; // minutos
  orden: number; // día 1, 2, 3, etc
}

export interface RutinaSemanal {
  id: string;
  userId: string;
  nombre: string;
  descripcion?: string;
  objetivo?: Objetivo; // Para Appwrite
  nivel?: Nivel; // Para Appwrite
  diasPorSemana?: number; // Para Appwrite
  diasRutina?: DiaRutina[]; // Para Appwrite
  dias?: DiaRutina[]; // Alias para diasRutina
  duracionTotal?: number; // Para Appwrite
  fechaCreacion: Date;
  activa: boolean;
}

export interface SharedRoutine {
  id: string;
  userId: string;
  userName: string;
  routineId: string;
  slug: string;
  nombre: string;
  datos: RutinaSemanal;
  createdAt: Date;
}

// Workout Logging
export type WorkoutSetType = 'WEIGHT' | 'REPS' | 'TIME' | 'BODYWEIGHT';

export interface SerieLog {
  numero: number;
  repeticiones: number;
  peso: number; // kg (0 para BODYWEIGHT y TIME)
  RIR: number; // Reps In Reserve (0-3)
  tiempoDescanso: number; // segundos
  completada: boolean;
  /** Tipo de set. Default WEIGHT para retrocompatibilidad. */
  tipo?: WorkoutSetType;
  /** Para sets tipo TIME (plancha, isometricos): duración en segundos */
  tiempoSegundos?: number;
  /** Para ejercicios unilaterales: reps del lado derecho. `repeticiones` = lado izquierdo. */
  repsDerecha?: number;
}

export interface ExerciseLog {
  ejercicioId: string;
  ejercicio?: ExerciseKnowledge; // populated
  series: SerieLog[];
  tecnicaCorrecta: boolean;
  sensacionMuscular: 1 | 2 | 3 | 4 | 5;
  notas?: string;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  fecha: Date;
  rutinaId?: string; // Para Appwrite
  diaRutinaId?: string;
  diaRutina?: string; // nombre del día, ej: "Pecho y Tríceps"
  ejercicios: ExerciseLog[];
  duracion?: number; // Para Appwrite (alias de duracionReal)
  duracionReal?: number; // minutos
  sensacionGeneral?: 1 | 2 | 3 | 4 | 5;
  notas?: string;
  completado: boolean;
  volumenTotal?: number; // Para Appwrite
  caloriaQuemadas?: number; // Para Appwrite (sin 's' para Appwrite)
  caloriasQuemadas?: number; // Alias con 's'
}

// Progress Analysis
export interface VolumeData {
  semanaActual: number;
  semanaAnterior: number;
  cambio: number; // %
}

export interface PesoMaximoData {
  actual: number;
  hace4Semanas: number;
  cambio: number;
}

export type RecomendacionProgresion = 'subir_peso' | 'subir_reps' | 'mantener' | 'deload';

export interface ProgressAnalysis {
  ejercicioId: string;
  nombre: string;

  volumenTotal: VolumeData;
  pesoMaximo: PesoMaximoData;

  recomendacion: RecomendacionProgresion;
  proximoObjetivo: string;

  // Extended analytics
  estimacion1RM: { actual: number; hace4Semanas: number; cambio: number };
  sesionesTotales: number;
  frecuenciaSemanal: number; // average sessions per week for this exercise
  intensidadPromedio?: number; // % of estimated 1RM
}

// Nutrition Tracking
export interface Macros {
  proteina: number; // gramos
  carbohidratos: number;
  grasas: number;
}

export interface Meal {
  id: string;
  nombre: string;
  tipo: 'desayuno' | 'almuerzo' | 'cena' | 'snack';
  calorias: number;
  macros: Macros;
  hora: Date;
}

export interface NutritionTracker {
  userId: string;
  fecha: Date;
  calorias?: number; // Para Appwrite
  caloriasDiarias?: number; // Alias
  proteinas?: number; // Para Appwrite
  carbohidratos?: number; // Para Appwrite
  grasas?: number; // Para Appwrite
  macrosObjetivo?: Macros;
  comidas?: Meal[]; // Para Appwrite (sin 'Registradas')
  comidasRegistradas?: Meal[]; // Alias
  agua?: number; // Para Appwrite (en ml)
}

export interface NutritionNeeds {
  calorias: number;
  proteina: number;
  carbohidratos: number;
  grasas: number;
}

// Progress Charts
export interface ProgressDataPoint {
  semana: string;
  fecha: Date;
  pesoMaximo: number;
  volumenTotal: number;
  repeticionesPromedio: number;
  estimated1RM: number;
  numSeries: number;
}

// Achievements
export interface Achievement {
  id: string;
  userId: string;
  tipo: 'weight' | 'streak' | 'volume' | 'consistency' | 'custom';
  nombre?: string; // Para Appwrite
  titulo?: string; // Alias de nombre
  descripcion: string;
  icono: string;
  fecha: Date;
  valor?: number;
  detalles?: string; // Para Appwrite
}

// Statistics
export interface UserStatistics {
  userId: string;
  totalWorkouts?: number; // Para Appwrite
  totalEntrenamientos?: number; // Alias
  currentStreak?: number; // Para Appwrite
  rachaActual?: number; // Alias
  longestStreak?: number; // Para Appwrite
  rachaMasLarga?: number; // Alias
  totalVolume?: number; // Para Appwrite
  volumenTotalMovido?: number; // kg total en toda la historia
  volumenEsteMes?: number;
  totalCalories?: number; // Para Appwrite
  totalMinutes?: number; // Para Appwrite
  favoriteExercises?: Record<string, number>; // Para Appwrite
  muscleGroupStats?: Record<string, number>; // Para Appwrite
  ejercicioFavorito?: string;
  grupoMuscularMasEntrenado?: GrupoMuscular;
  progresoGeneral?: number; // % de mejora desde inicio
  lastWorkoutDate?: Date; // Para Appwrite
}

// Body Goals (almacenados en UserProfile.preferencias.bodyGoals)
export interface BodyGoal {
  /** Clave de la métrica: peso, grasaCorporal, cintura, etc. */
  metric: string;
  /** Valor objetivo (en la unidad nativa de la métrica) */
  target: number;
  /** Fecha límite YYYY-MM-DD (opcional) */
  deadline?: string;
  /** Valor de la métrica cuando se creó el objetivo, para la barra de progreso */
  startValue?: number;
  /** ISO timestamp de creación */
  createdAt: string;
}

// Body Measurements & Tracking
export interface BodyMeasurement {
  id: string;
  userId: string;
  fecha: Date;
  peso: number; // kg
  grasaCorporal?: number; // %
  masaMuscular?: number; // Para Appwrite
  // Campos individuales para Appwrite (además del objeto medidas)
  pecho?: number;
  cintura?: number;
  cadera?: number;
  brazoDerecho?: number;
  brazoIzquierdo?: number;
  musloDerecho?: number;
  musloIzquierdo?: number;
  pantorrillaDerecha?: number;
  pantorrillaIzquierda?: number;
  medidas?: {
    pecho?: number; // cm
    cintura?: number;
    cadera?: number;
    brazoDerecho?: number;
    brazoIzquierdo?: number;
    musloDerecho?: number;
    musloIzquierdo?: number;
    pantorrillaDerecha?: number;
    pantorrillaIzquierda?: number;
  };
  notas?: string;
}

// Injury Management
export type LesionZona =
  | 'hombro_derecho' | 'hombro_izquierdo'
  | 'rodilla_derecha' | 'rodilla_izquierda'
  | 'muneca_derecha' | 'muneca_izquierda'
  | 'codo_derecho' | 'codo_izquierdo'
  | 'lumbar' | 'cervical'
  | 'tobillo_derecho' | 'tobillo_izquierdo'
  | 'cadera';

export type LesionSeveridad = 'leve' | 'moderada' | 'grave';

export interface Lesion {
  id: string;
  userId: string;
  zona: LesionZona;
  severidad: LesionSeveridad;
  fechaInicio: Date;
  fechaFin?: Date;
  activa: boolean;
  dolorActual?: number; // 0-10
  notas?: string;
}

// Cardio
export type CardioTipo = 'hiit' | 'liss' | 'moderado';
export type CardioEquipo = 'cinta' | 'bici' | 'eliptica' | 'remo' | 'sin_equipo';
export type CardioMomento = 'antes' | 'despues';

export interface CardioSession {
  id: string;
  userId: string;
  workoutId?: string;
  tipo: CardioTipo;
  equipo: CardioEquipo;
  momento: CardioMomento;
  duracionObjetivo: number; // minutos
  duracionReal: number; // minutos completados
  fecha: Date;
  completado: boolean;
  notas?: string;
}

export interface ProgressPhoto {
  id: string;
  userId: string;
  fecha: Date;
  tipo: 'frente' | 'espalda' | 'lado_derecho' | 'lado_izquierdo' | 'frontal' | 'lateral' | 'trasera';
  fileId?: string; // Para Appwrite Storage
  url: string; // base64 o blob URL
  peso?: number; // peso en el momento de la foto
  notas?: string;
}

// ─── Machine Photo Guide ────────────────────────────────────────────────────

export interface MachineAjustes {
  asiento?: string;
  respaldo?: string;
  rodilleras?: string;
  palanca?: string;
  cable?: string;
  cargaReferencia?: string;
  notasAjuste?: string;
}

export interface MachinePhoto {
  id: string;
  userId: string;
  ejercicioId: string;
  ejercicioNombre: string;
  gymNombre: string;
  gymId: string;
  gymLat?: number;
  gymLng?: number;
  url: string;
  tipo: 'general' | 'ajustes' | 'posicion' | 'referencia' | 'pantalla';
  ajustes?: MachineAjustes;
  notas?: string;
  fecha: Date;
  esActiva: boolean;
  syncStatus?: 'pending_create' | 'synced' | 'pending_delete' | 'pending_update';
  lastUpdated?: number;
}

export interface GymRecord {
  id: string;        // gymId = slugifyGym(userId, nombre)
  userId: string;
  nombre: string;
  lat?: number;
  lng?: number;
  syncStatus?: 'pending_create' | 'synced' | 'pending_update' | 'pending_delete';
  lastUpdated?: number;
}
