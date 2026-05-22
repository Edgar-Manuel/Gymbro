// Full W — Plantillas de entrenamiento Low Volume / High Intensity
// Filosofía: 2 series efectivas, 2-3 min descanso, progresión 8 semanas

export interface FullWExercise {
  nombre: string;
  series: number;
  reps: string;          // "8-10", "Al fallo", "12-15"
  descanso: string;      // "2-3 min", "1 min"
  notas?: string;
  calentamiento?: boolean;
  pesoInicial?: number;  // kg sugerido para S1
  /** Marca el ejercicio como FST-7 (Fascia Stretch Training) — 7 series cortas. */
  isFST7?: boolean;
  /** La última serie (o todas) se realizan con drop set. */
  isDropSet?: boolean;
  /** Este ejercicio forma superserie con el siguiente. */
  isSuperset?: boolean;
}

export interface FullWDay {
  nombre: string;
  grupos: string[];
  ejercicios: FullWExercise[];
  /** Texto opcional describiendo variantes (Día A vs B, prep vs off, etc.). */
  variante?: string;
}

export interface FullWRoutine {
  id: string;
  nombre: string;
  dias: number;
  descripcion: string;
  distribucion: string;   // ej: "Push / Pull / Legs"
  semanas: number;        // 8
  plan: FullWDay[];
}

// ─── 3 días: Push / Pull / Legs ──────────────────────────────────────────────
const FULLW_3: FullWRoutine = {
  id: 'fullw-3',
  nombre: 'Full W — 3 Días',
  dias: 3,
  semanas: 8,
  descripcion: 'Push / Pull / Legs. Ideal para comenzar o cuando el tiempo escasea.',
  distribucion: 'Lunes · Miércoles · Viernes',
  plan: [
    {
      nombre: 'Día 1 — Empuje (Pecho · Hombro · Tríceps)',
      grupos: ['Pecho', 'Hombros', 'Tríceps'],
      ejercicios: [
        { nombre: 'Press de Banca con Barra', series: 3, reps: '6-8',  descanso: '3 min', notas: 'Ejercicio principal. Retracción escapular.' },
        { nombre: 'Press Inclinado con Mancuernas', series: 2, reps: '8-10', descanso: '2 min', notas: 'Ángulo 30°, énfasis pectoral superior.' },
        { nombre: 'Press Militar con Barra', series: 3, reps: '6-8',  descanso: '2-3 min' },
        { nombre: 'Elevaciones Laterales', series: 2, reps: '12-15', descanso: '1 min', notas: 'Aislamiento. Codos ligeramente flexionados.' },
        { nombre: 'Extensiones en Polea (Tríceps)', series: 2, reps: '10-12', descanso: '1 min' },
        { nombre: 'Abdominales', series: 3, reps: 'Al fallo', descanso: '1 min' },
      ],
    },
    {
      nombre: 'Día 2 — Tirón (Espalda · Bíceps)',
      grupos: ['Espalda', 'Bíceps'],
      ejercicios: [
        { nombre: 'Remo con Barra', series: 3, reps: '6-8', descanso: '3 min', notas: 'Tirón horizontal principal.' },
        { nombre: 'Dominadas o Jalón al Pecho', series: 3, reps: '6-8', descanso: '2-3 min', notas: 'Si no puedes hacer dominadas, usa jalón.' },
        { nombre: 'Remo con Mancuerna (unilateral)', series: 2, reps: '8-10', descanso: '1-2 min' },
        { nombre: 'Curl de Bíceps con Barra', series: 2, reps: '8-10', descanso: '1-2 min' },
        { nombre: 'Curl Martillo', series: 2, reps: '10-12', descanso: '1 min' },
        { nombre: 'Face Pull en Polea', series: 2, reps: '15-20', descanso: '1 min', notas: 'Salud del manguito rotador. Codos altos, tirón hacia la frente.' },
      ],
    },
    {
      nombre: 'Día 3 — Piernas (Cuádriceps · Femorales · Gemelos)',
      grupos: ['Piernas', 'Glúteos'],
      ejercicios: [
        { nombre: 'Sentadilla con Barra', series: 3, reps: '6-8', descanso: '3 min', notas: 'Ejercicio rey. Profundidad paralela o mayor.' },
        { nombre: 'Prensa de Piernas', series: 2, reps: '10-12', descanso: '2 min' },
        { nombre: 'Peso Muerto Rumano', series: 3, reps: '8-10', descanso: '2-3 min', notas: 'Énfasis femoral. Cadera atrás.' },
        { nombre: 'Curl Femoral en Máquina', series: 2, reps: '10-12', descanso: '1-2 min' },
        { nombre: 'Elevaciones de Gemelos', series: 3, reps: '12-15', descanso: '1 min' },
        { nombre: 'Abdominales', series: 3, reps: 'Al fallo', descanso: '1 min' },
      ],
    },
  ],
};

// ─── 4 días: Upper A · Lower A · Upper B · Lower B ───────────────────────────
const FULLW_4: FullWRoutine = {
  id: 'fullw-4',
  nombre: 'Full W — 4 Días',
  dias: 4,
  semanas: 8,
  descripcion: 'Upper / Lower x2. Óptimo para ganar masa y fuerza con alta frecuencia.',
  distribucion: 'Lunes · Martes · Jueves · Viernes',
  plan: [
    {
      nombre: 'Día 1 — Upper A (Fuerza)',
      grupos: ['Pecho', 'Espalda', 'Hombros'],
      ejercicios: [
        { nombre: 'Press de Banca con Barra', series: 4, reps: '4-6', descanso: '3 min', notas: 'Semana pesada.' },
        { nombre: 'Remo con Barra', series: 4, reps: '4-6', descanso: '3 min' },
        { nombre: 'Press Militar con Barra', series: 3, reps: '6-8', descanso: '2-3 min' },
        { nombre: 'Remo con Mancuerna', series: 2, reps: '8-10', descanso: '1-2 min' },
        { nombre: 'Curl de Bíceps con Barra', series: 2, reps: '8-10', descanso: '1 min' },
        { nombre: 'Extensiones en Polea', series: 2, reps: '8-10', descanso: '1 min' },
      ],
    },
    {
      nombre: 'Día 2 — Lower A (Cuádriceps)',
      grupos: ['Cuádriceps', 'Glúteos', 'Core'],
      ejercicios: [
        { nombre: 'Sentadilla con Barra', series: 4, reps: '4-6', descanso: '3-4 min', notas: 'Semana pesada. Máxima profundidad.' },
        { nombre: 'Prensa de Piernas', series: 3, reps: '8-10', descanso: '2-3 min' },
        { nombre: 'Extensiones de Cuádriceps', series: 2, reps: '12-15', descanso: '1-2 min' },
        { nombre: 'Elevaciones de Gemelos (de pie)', series: 3, reps: '10-15', descanso: '1 min' },
        { nombre: 'Plancha Abdominal', series: 3, reps: '45-60 seg', descanso: '1 min' },
        { nombre: 'Hip Thrust con Barra', series: 3, reps: '10-12', descanso: '2 min', notas: 'Contracción máxima de glúteo en la posición superior.' },
      ],
    },
    {
      nombre: 'Día 3 — Upper B (Hipertrofia)',
      grupos: ['Pecho', 'Espalda', 'Bíceps', 'Tríceps'],
      ejercicios: [
        { nombre: 'Press Inclinado con Mancuernas', series: 3, reps: '8-12', descanso: '2 min' },
        { nombre: 'Dominadas o Jalón al Pecho', series: 3, reps: '8-12', descanso: '2 min' },
        { nombre: 'Aperturas en Polea (Cable Fly)', series: 2, reps: '12-15', descanso: '1 min', notas: 'Contracción completa.' },
        { nombre: 'Elevaciones Laterales', series: 3, reps: '12-15', descanso: '1 min' },
        { nombre: 'Curl Concentrado o Scott', series: 2, reps: '10-12', descanso: '1 min' },
        { nombre: 'Fondos en Paralelas (Tríceps)', series: 2, reps: '8-12', descanso: '1-2 min' },
      ],
    },
    {
      nombre: 'Día 4 — Lower B (Femorales + Glúteos)',
      grupos: ['Femorales', 'Glúteos', 'Core'],
      ejercicios: [
        { nombre: 'Peso Muerto Convencional', series: 4, reps: '4-6', descanso: '3-4 min', notas: 'Ejercicio rey de femorales.' },
        { nombre: 'Peso Muerto Rumano', series: 3, reps: '8-10', descanso: '2-3 min' },
        { nombre: 'Curl Femoral Tumbado', series: 3, reps: '10-12', descanso: '1-2 min' },
        { nombre: 'Hip Thrust con Barra', series: 3, reps: '10-12', descanso: '2 min', notas: 'Contracción máxima de glúteo.' },
        { nombre: 'Elevaciones de Gemelos (sentado)', series: 3, reps: '12-15', descanso: '1 min' },
        { nombre: 'Abdominales Colgado', series: 3, reps: 'Al fallo', descanso: '1 min' },
      ],
    },
  ],
};

// ─── 5 días: PPL + Upper / Lower ─────────────────────────────────────────────
const FULLW_5: FullWRoutine = {
  id: 'fullw-5',
  nombre: 'Full W — 5 Días',
  dias: 5,
  semanas: 8,
  descripcion: 'Push · Pull · Legs + Upper · Lower. Máximo volumen con recuperación.',
  distribucion: 'Lun · Mar · Mié · Jue · Vie',
  plan: [
    {
      nombre: 'Día 1 — Push (Pecho · Hombros · Tríceps)',
      grupos: ['Pecho', 'Hombros', 'Tríceps'],
      ejercicios: [
        { nombre: 'Press de Banca con Barra', series: 4, reps: '5-8', descanso: '3 min' },
        { nombre: 'Press Inclinado con Mancuernas', series: 3, reps: '8-10', descanso: '2 min' },
        { nombre: 'Press Militar con Barra', series: 3, reps: '6-8', descanso: '2-3 min' },
        { nombre: 'Elevaciones Laterales', series: 3, reps: '12-15', descanso: '1 min' },
        { nombre: 'Extensiones Tríceps en Polea', series: 3, reps: '10-12', descanso: '1 min' },
        { nombre: 'Fondos en Paralelas', series: 2, reps: 'Al fallo', descanso: '1-2 min' },
      ],
    },
    {
      nombre: 'Día 2 — Pull (Espalda · Bíceps · Trapecios)',
      grupos: ['Espalda', 'Bíceps', 'Trapecios'],
      ejercicios: [
        { nombre: 'Peso Muerto Convencional', series: 3, reps: '4-6', descanso: '3-4 min', notas: 'Semana pesada.' },
        { nombre: 'Remo con Barra', series: 3, reps: '6-8', descanso: '2-3 min' },
        { nombre: 'Dominadas o Jalón al Pecho', series: 3, reps: '6-10', descanso: '2-3 min' },
        { nombre: 'Remo en Polea Baja', series: 2, reps: '10-12', descanso: '1-2 min' },
        { nombre: 'Curl de Bíceps con Barra', series: 3, reps: '8-10', descanso: '1-2 min' },
        { nombre: 'Curl Martillo', series: 2, reps: '10-12', descanso: '1 min' },
      ],
    },
    {
      nombre: 'Día 3 — Legs (Completo)',
      grupos: ['Cuádriceps', 'Femorales', 'Glúteos', 'Gemelos'],
      ejercicios: [
        { nombre: 'Sentadilla con Barra', series: 4, reps: '5-8', descanso: '3 min' },
        { nombre: 'Prensa de Piernas', series: 3, reps: '8-12', descanso: '2-3 min' },
        { nombre: 'Peso Muerto Rumano', series: 3, reps: '8-10', descanso: '2-3 min' },
        { nombre: 'Curl Femoral Tumbado', series: 2, reps: '10-12', descanso: '1-2 min' },
        { nombre: 'Hip Thrust', series: 3, reps: '10-12', descanso: '2 min' },
        { nombre: 'Elevaciones de Gemelos', series: 4, reps: '12-15', descanso: '1 min' },
        { nombre: 'Abdominales', series: 3, reps: 'Al fallo', descanso: '1 min' },
      ],
    },
    {
      nombre: 'Día 4 — Upper (Fuerza)',
      grupos: ['Pecho', 'Espalda', 'Hombros'],
      ejercicios: [
        { nombre: 'Press de Banca Inclinado con Barra', series: 4, reps: '5-6', descanso: '3 min' },
        { nombre: 'Remo con Mancuerna', series: 4, reps: '6-8', descanso: '2-3 min' },
        { nombre: 'Press de Hombros con Mancuernas', series: 3, reps: '8-10', descanso: '2 min' },
        { nombre: 'Aperturas en Polea', series: 2, reps: '12-15', descanso: '1 min' },
        { nombre: 'Jalón Neutro al Pecho', series: 2, reps: '10-12', descanso: '1-2 min' },
        { nombre: 'Elevaciones Laterales', series: 3, reps: '12-15', descanso: '1 min', notas: 'Cabeza medial del deltoides. Codos ligeramente flexionados.' },
      ],
    },
    {
      nombre: 'Día 5 — Lower (Fuerza + Core)',
      grupos: ['Cuádriceps', 'Femorales', 'Core'],
      ejercicios: [
        { nombre: 'Sentadilla Frontal o Goblet', series: 3, reps: '6-8', descanso: '3 min', notas: 'Alternativa a sentadilla trasera.' },
        { nombre: 'Zancadas con Mancuernas', series: 3, reps: '10-12 c/pierna', descanso: '2 min' },
        { nombre: 'Peso Muerto Sumo', series: 3, reps: '6-8', descanso: '3 min' },
        { nombre: 'Extensiones de Cuádriceps', series: 2, reps: '12-15', descanso: '1 min' },
        { nombre: 'Abdominales Decline', series: 3, reps: 'Al fallo', descanso: '1 min' },
        { nombre: 'Plancha Lateral', series: 2, reps: '30-45 seg', descanso: '45 seg' },
      ],
    },
  ],
};

// ─── 6 días: Push/Pull/Legs × 2 ──────────────────────────────────────────────
const FULLW_6: FullWRoutine = {
  id: 'fullw-6',
  nombre: 'Full W — 6 Días',
  dias: 6,
  semanas: 8,
  descripcion: 'Push · Pull · Legs × 2. Para intermedios-avanzados con alta capacidad de recuperación.',
  distribucion: 'Lun · Mar · Mié · Jue · Vie · Sáb',
  plan: [
    {
      nombre: 'Día 1 — Push A (Fuerza)',
      grupos: ['Pecho', 'Hombros', 'Tríceps'],
      ejercicios: [
        { nombre: 'Press de Banca con Barra', series: 5, reps: '4-6', descanso: '3-4 min' },
        { nombre: 'Press Militar con Barra', series: 4, reps: '4-6', descanso: '3 min' },
        { nombre: 'Press Inclinado con Mancuernas', series: 3, reps: '8-10', descanso: '2 min' },
        { nombre: 'Fondos en Paralelas', series: 3, reps: '8-10', descanso: '2 min' },
        { nombre: 'Extensiones Tríceps Polea', series: 2, reps: '10-12', descanso: '1 min' },
        { nombre: 'Elevaciones Laterales', series: 3, reps: '12-15', descanso: '1 min', notas: 'Cierre del día de empuje. Cabeza medial del deltoides.' },
      ],
    },
    {
      nombre: 'Día 2 — Pull A (Fuerza)',
      grupos: ['Espalda', 'Bíceps'],
      ejercicios: [
        { nombre: 'Peso Muerto Convencional', series: 4, reps: '3-5', descanso: '4 min', notas: 'Fuerza máxima.' },
        { nombre: 'Remo con Barra (Pronado)', series: 4, reps: '4-6', descanso: '3 min' },
        { nombre: 'Dominadas Lastradas', series: 3, reps: '4-6', descanso: '3 min' },
        { nombre: 'Curl con Barra Z', series: 3, reps: '6-8', descanso: '2 min' },
        { nombre: 'Curl Martillo', series: 2, reps: '8-10', descanso: '1 min' },
        { nombre: 'Face Pull en Polea', series: 3, reps: '15-20', descanso: '1 min', notas: 'Salud articular del hombro. Indispensable en días de tirón pesado.' },
      ],
    },
    {
      nombre: 'Día 3 — Legs A (Cuádriceps)',
      grupos: ['Cuádriceps', 'Glúteos', 'Gemelos'],
      ejercicios: [
        { nombre: 'Sentadilla con Barra', series: 5, reps: '4-6', descanso: '3-4 min' },
        { nombre: 'Prensa de Piernas (pies altos)', series: 3, reps: '8-10', descanso: '2-3 min' },
        { nombre: 'Extensiones de Cuádriceps', series: 3, reps: '12-15', descanso: '1-2 min' },
        { nombre: 'Hip Thrust con Barra', series: 3, reps: '8-12', descanso: '2 min' },
        { nombre: 'Elevaciones de Gemelos de Pie', series: 4, reps: '12-15', descanso: '1 min' },
        { nombre: 'Abdominales Colgado', series: 3, reps: 'Al fallo', descanso: '1 min' },
      ],
    },
    {
      nombre: 'Día 4 — Push B (Hipertrofia)',
      grupos: ['Pecho', 'Hombros', 'Tríceps'],
      ejercicios: [
        { nombre: 'Press Inclinado con Barra', series: 4, reps: '8-10', descanso: '2-3 min' },
        { nombre: 'Aperturas en Polea (Cable Fly)', series: 3, reps: '12-15', descanso: '1-2 min' },
        { nombre: 'Press de Hombros con Mancuernas', series: 3, reps: '10-12', descanso: '2 min' },
        { nombre: 'Elevaciones Laterales en Polea', series: 3, reps: '12-15', descanso: '1 min' },
        { nombre: 'Extensiones Tríceps sobre la Cabeza', series: 3, reps: '10-12', descanso: '1 min' },
        { nombre: 'Extensiones en Polea (Tríceps)', series: 3, reps: '12-15', descanso: '1 min', notas: 'Cierre de tríceps con tensión constante en la polea.' },
      ],
    },
    {
      nombre: 'Día 5 — Pull B (Hipertrofia)',
      grupos: ['Espalda', 'Bíceps', 'Trapecios'],
      ejercicios: [
        { nombre: 'Jalón al Pecho Agarre Ancho', series: 4, reps: '8-12', descanso: '2 min' },
        { nombre: 'Remo en Polea Baja (agarre neutro)', series: 3, reps: '10-12', descanso: '2 min' },
        { nombre: 'Remo con Mancuerna', series: 3, reps: '10-12', descanso: '1-2 min' },
        { nombre: 'Curl Concentrado Scott', series: 2, reps: '10-12', descanso: '1 min' },
        { nombre: 'Face Pull en Polea', series: 3, reps: '12-15', descanso: '1 min', notas: 'Salud de hombros.' },
        { nombre: 'Curl Inclinado con Mancuernas', series: 3, reps: '10-12', descanso: '1 min', notas: 'Máximo estiramiento del bíceps en banco inclinado a 45°.' },
      ],
    },
    {
      nombre: 'Día 6 — Legs B (Femorales + Core)',
      grupos: ['Femorales', 'Glúteos', 'Core'],
      ejercicios: [
        { nombre: 'Peso Muerto Rumano', series: 4, reps: '6-8', descanso: '3 min' },
        { nombre: 'Curl Femoral Tumbado', series: 3, reps: '10-12', descanso: '2 min' },
        { nombre: 'Zancadas con Mancuernas', series: 3, reps: '10-12 c/pierna', descanso: '2 min' },
        { nombre: 'Abducción de Cadera en Máquina', series: 3, reps: '12-15', descanso: '1 min' },
        { nombre: 'Elevaciones de Gemelos Sentado', series: 4, reps: '12-15', descanso: '1 min' },
        { nombre: 'Abdominales (rueda o decline)', series: 3, reps: 'Al fallo', descanso: '1 min' },
        { nombre: 'Plancha', series: 3, reps: '45-60 seg', descanso: '1 min' },
      ],
    },
  ],
};

export const FULLW_ROUTINES: Record<number, FullWRoutine> = {
  3: FULLW_3,
  4: FULLW_4,
  5: FULLW_5,
  6: FULLW_6,
};

// Progresión semanal sugerida (% de aumento de peso)
export const PROGRESION_SEMANAL = [
  { semana: 1, label: 'S1', descripcion: 'Base — aprende el peso' },
  { semana: 2, label: 'S2', descripcion: '+2.5 kg en compuestos' },
  { semana: 3, label: 'S3', descripcion: '+2.5 kg en compuestos' },
  { semana: 4, label: 'S4', descripcion: 'Deload — -20% del peso' },
  { semana: 5, label: 'S5', descripcion: 'Carga S3 + 2.5 kg' },
  { semana: 6, label: 'S6', descripcion: '+2.5 kg' },
  { semana: 7, label: 'S7', descripcion: '+2.5 kg — PR attempt' },
  { semana: 8, label: 'S8', descripcion: 'Test de fuerza máxima' },
];
