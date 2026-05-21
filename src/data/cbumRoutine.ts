// Rutina Chris Bumstead (CBum) — 6× Mr. Olympia Classic Physique
// Filosofía: 2 series efectivas al fallo · sobrecarga progresiva ·
// salud articular · conexión mente-músculo · FST-7 al final.
// Split de 9 días (7 entreno + 2 descanso) — ciclo rotativo, no semanal.

import type { FullWRoutine, FullWDay, FullWExercise } from './fullwRoutines';

// ─── Tipos públicos ─────────────────────────────────────────────────────────
export type CbumPhase = 'offseason' | 'prep';
export type CbumIntensity = 'principiante' | 'intermedio' | 'avanzado';

export interface CbumPrinciple {
  titulo: string;
  descripcion: string;
}

export const CBUM_PRINCIPLES: CbumPrinciple[] = [
  {
    titulo: 'Intensidad sobre volumen',
    descripcion: '2 series efectivas por ejercicio llevadas al fallo o muy cerca. La técnica no se sacrifica.',
  },
  {
    titulo: 'Sobrecarga progresiva',
    descripcion: 'Cada semana intenta sumar 1 rep más o subir el peso 2.5 kg en las series principales.',
  },
  {
    titulo: 'Salud articular',
    descripcion: 'Mancuernas antes que máquinas rígidas para rango natural. Apoyo en pecho para proteger lumbar.',
  },
  {
    titulo: 'FST-7 al final',
    descripcion: '7 series × 10–12 reps con descansos de 30–45s para máximo bombeo y estiramiento de fascia.',
  },
  {
    titulo: 'Mente-músculo',
    descripcion: 'Sentir la contracción y el estiramiento en cada repetición. No mover peso por moverlo.',
  },
];

export const CBUM_NUTRITION = {
  offseason: {
    calorias: 6000,
    proteinas: '300g',
    cardio: 'Mínimo (10-15 min LISS post-entreno opcional)',
    fuentes: ['Huevos', 'Carne de res', 'Pavo', 'Pollo', 'Whey isolate'],
  },
  prep: {
    calorias: 3500,
    proteinas: '370g',
    cardio: '40-60 min LISS diario + 2× HIIT/sem',
    fuentes: ['Pollo', 'Pavo', 'Pescado blanco', 'Claras', 'Whey isolate', 'Boniato/arroz medido'],
  },
};

// ─── Plan base (off-season, intensidad avanzada) ────────────────────────────
const BASE_PLAN: FullWDay[] = [
  // Día 1: Cuádriceps y Pantorrillas
  {
    nombre: 'Día 1 — Cuádriceps y Pantorrillas',
    grupos: ['Cuádriceps', 'Pantorrillas'],
    ejercicios: [
      { nombre: 'Extensiones de Pierna',            series: 3, reps: '15-20', descanso: '60 s',   notas: 'Pre-agotamiento. Calienta rodillas antes de cualquier compuesto. Último set con drop set.', isDropSet: true },
      { nombre: 'Sentadilla con Barra o Smith',     series: 4, reps: '6-15',  descanso: '3 min',  notas: 'Descalzo para base sólida. Profundidad máxima. Trabaja hasta un top set pesado, baja ~5% en la segunda serie.' },
      { nombre: 'Prensa de Piernas',                series: 3, reps: '8-12',  descanso: '2 min',  notas: 'Ha llegado a 810 lbs × 10. Excéntrica controlada 3 segundos.' },
      { nombre: 'Hack Squat',                       series: 4, reps: '12-20', descanso: '90 s',   notas: 'Rodilleras y cinturón. Rango completo de movimiento.' },
      { nombre: 'Elevación de Pantorrillas Sentado', series: 3, reps: '12-15', descanso: '60 s',  notas: 'Talones lo más abajo posible en el estiramiento. Apretar 1s arriba.' },
    ],
  },
  // Día 2: Pecho y Tríceps
  {
    nombre: 'Día 2 — Pecho y Tríceps',
    grupos: ['Pecho', 'Tríceps'],
    ejercicios: [
      { nombre: 'Press Inclinado con Mancuernas',       series: 4, reps: '8-15',  descanso: '2-3 min', notas: 'Pirámide: 15, 15, 12, 10. Excéntrica 3-4 segundos + pausa 1s abajo. Banco a 45°.' },
      { nombre: 'Aperturas Inclinadas (Mancuernas/Cable)', series: 2, reps: '12-15', descanso: '90 s', notas: 'Estiramiento máximo en la apertura. "Empuja hacia afuera antes de juntar".' },
      { nombre: 'Press en Máquina Plana (GVT)',          series: 10, reps: '10',   descanso: '45 s',   notas: 'German Volume Training: 10×10 con descansos cortos. Mantiene el bombeo constante.' },
      { nombre: 'Pec Deck Flyes (Inclinado)',             series: 3, reps: '8-12',  descanso: '60 s',   notas: 'Énfasis en pecho clavicular. Parciales al fallo para extender la serie.' },
      { nombre: 'Skullcrushers con Barra EZ',             series: 3, reps: '10-12', descanso: '90 s',   notas: 'Tríceps finisher. Banco declinado para mayor tensión en el estiramiento.' },
      { nombre: 'Pushdowns en Polea',                    series: 3, reps: '10-12', descanso: '60 s',   notas: 'Agarre semi-pronado para enfatizar las tres cabezas.' },
    ],
  },
  // Día 3: Espalda Grosor + Bíceps
  {
    nombre: 'Día 3 — Espalda (Grosor) y Bíceps',
    grupos: ['Espalda', 'Bíceps'],
    ejercicios: [
      { nombre: 'Jalón al Pecho (agarre supino o neutro)', series: 4, reps: '10-15', descanso: '90 s', notas: 'Brazos completamente extendidos arriba antes de cada rep. Squeeze abajo.' },
      { nombre: 'Remo con Barra Agarre Supino',           series: 4, reps: '8-12',  descanso: '2 min', notas: 'Estilo Dorian Yates. Barra baja hacia caderas. Retracción total arriba.' },
      { nombre: 'Remo en Barra T (apoyo en pecho)',       series: 4, reps: '10-12', descanso: '2 min', notas: 'Elimina fatiga lumbar. Drop set en la última serie.', isDropSet: true },
      { nombre: 'Remo con Mancuernas (GVT)',              series: 10, reps: '10',   descanso: '45 s',  notas: 'German Volume Training sobre banco inclinado. Agarre neutro, codos pegados al cuerpo.' },
      { nombre: 'Curl en Banco Inclinado',                series: 3, reps: '10-12', descanso: '90 s',  notas: 'Máximo estiramiento. Pausa 0.5s abajo. Sin balanceo.' },
      { nombre: 'Curl Predicador en Máquina',             series: 2, reps: '10-12', descanso: '60 s',  notas: 'Aislamiento total. Controla la bajada 3 segundos.' },
    ],
  },
  // Día 4: Descanso
  { nombre: 'Día 4 — Descanso activo', grupos: [], ejercicios: [] },
  // Día 5: Hombros
  {
    nombre: 'Día 5 — Hombros',
    grupos: ['Hombros'],
    ejercicios: [
      { nombre: 'Cable Rear Delt Fly (unilateral)',       series: 3, reps: '15-20', descanso: '60 s',   notas: 'Abre la sesión trabajando el deltoides posterior PRIMERO — diferencia clave de CBum vs. otros.' },
      { nombre: 'Press de Hombros Hammer Strength',       series: 4, reps: '8-12',  descanso: '2 min',  notas: 'Principal compuesto. Drop set en la 3ª serie para volumen extra.', isDropSet: true },
      { nombre: 'Press de Hombros en Máquina / Smith',   series: 3, reps: '8-12',  descanso: '2 min',  notas: 'Segundo compuesto de hombro. Escápulas retraídas en todo momento.' },
      { nombre: 'Elevaciones Laterales con Mancuernas',  series: 4, reps: '8-20',  descanso: '45 s',   notas: 'Pirámide inversa: 20 con 20kg → 15 con 30kg → 10 con 35kg → fallo con 40kg. Drop sets.', isDropSet: true },
      { nombre: 'Elevaciones Laterales en Máquina',      series: 3, reps: '10-12', descanso: '45 s',   notas: 'Control estricto — sin balanceo. Tensión constante en cabeza medial.' },
      { nombre: 'Remo al Mentón en Smith',               series: 3, reps: '10-12', descanso: '60 s',   notas: 'Trabaja deltoides anterior y medial. Codos por encima de la barra.' },
      { nombre: 'Superserie: Pec Deck Inverso',          series: 3, reps: '10-12', descanso: '0 s',    notas: 'Superserie → sin descanso hacia Cable Rear Delt Fly. Cierra con deltoides posterior.', isSuperset: true },
      { nombre: 'Cable Rear Delt Fly bilateral',         series: 3, reps: '10-12', descanso: '60 s',   notas: 'Finaliza la superserie de deltoides posterior.' },
      { nombre: 'Elevaciones Laterales Sentado',         series: 7, reps: '8-10',  descanso: '30-45 s', notas: 'FST-7 final. Máximo bombeo para estirar la fascia del deltoides.', isFST7: true },
    ],
  },
  // Día 6: Brazos (Tríceps + Bíceps)
  {
    nombre: 'Día 6 — Brazos (Tríceps + Bíceps)',
    grupos: ['Tríceps', 'Bíceps'],
    ejercicios: [
      { nombre: 'Pushdowns con Cuerda (pre-agotamiento)', series: 3, reps: '15-20', descanso: '45 s',   notas: 'Pre-agotamiento y calentamiento de codos. "Hago muchos hasta que me duelan los brazos."', isSuperset: true },
      { nombre: 'Extensión de Tríceps en Polea Alta',    series: 3, reps: '8-10',  descanso: '60 s',   notas: 'Superserie con pushdowns: 2 rondas de cuerda + 2 rondas de extensión aérea.' },
      { nombre: 'Press Cerrado con Barra',               series: 2, reps: '8-10',  descanso: '90 s',   notas: 'Compuesto de tríceps. Codos pegados al cuerpo.' },
      { nombre: 'Skullcrushers Inclinados con Mancuernas', series: 3, reps: '8-10', descanso: '90 s',  notas: 'Estiramiento profundo del tríceps largo. Banco inclinado.' },
      { nombre: 'Curl Predicador con Barra EZ',          series: 4, reps: '4-10',  descanso: '90 s',   notas: '1 calentamiento + 2 series pesadas (4-6 reps) + 1 burndown. Negativa 3 segundos.', isDropSet: true },
      { nombre: 'Curl con Mancuernas Alterno',           series: 3, reps: '10-12', descanso: '60 s',   notas: 'Supinación completa al subir. Parte del triset con curl predicador.' },
      { nombre: 'Curl en Polea Baja',                    series: 3, reps: '10-12', descanso: '45 s',   notas: 'Tercer movimiento del triset de bíceps.' },
      { nombre: 'Curl Martillo (Cable o Mancuerna)',     series: 3, reps: '8-12',  descanso: '60 s',   notas: '2 series pesadas + 1 drop set. Trabaja braquial para dar grosor al brazo.', isDropSet: true },
      { nombre: 'Pushdowns FST-7',                       series: 7, reps: '8-10',  descanso: '30-45 s', notas: 'FST-7 de tríceps. Máximo bombeo fascia.', isFST7: true },
      { nombre: 'Curl en Polea Baja (FST-7)',            series: 7, reps: '8-10',  descanso: '30-45 s', notas: 'FST-7 de bíceps. El doble FST-7 (tri+bi) es la firma del día de brazos de CBum.', isFST7: true },
    ],
  },
  // Día 7: Isquiotibiales y Glúteos
  {
    nombre: 'Día 7 — Isquiotibiales y Glúteos',
    grupos: ['Femorales/Glúteos'],
    ejercicios: [
      { nombre: 'Curl de Pierna Acostado',         series: 3, reps: '10-15', descanso: '90 s',  notas: 'Pre-agotamiento ANTES del peso muerto. Pies en punta. Excéntrica 3s + pausa en el estiramiento.' },
      { nombre: 'Peso Muerto Rumano (RDL)',         series: 4, reps: '8-12',  descanso: '2 min', notas: 'Principal movimiento de cadera. Estiramiento máximo abajo — no redondear lumbar.' },
      { nombre: 'Curl de Pierna Sentado',          series: 3, reps: '10-15', descanso: '90 s',  notas: 'Post-RDL: maximiza tiempo bajo tensión en los femorales.' },
      { nombre: 'Sentadilla Búlgara (Split)',      series: 3, reps: '8-12',  descanso: '2 min', notas: 'Mancuerna de 70kg en una mano. Rodilla trasera toca el suelo. Pausa arriba y abajo.' },
      { nombre: 'Hip Thrust en Máquina',           series: 4, reps: '12-15', descanso: '90 s',  notas: 'Pausa y contracción fuerte 1s arriba. Trabaja glúteo máximo y bíceps femoral.' },
      { nombre: 'Elevación de Pantorrillas de Pie', series: 3, reps: '12-15', descanso: '60 s', notas: 'Rango completo. Squeeze 1s arriba con rodillas bloqueadas.' },
    ],
  },
  // Día 8: Espalda Amplitud
  {
    nombre: 'Día 8 — Espalda (Amplitud)',
    grupos: ['Espalda'],
    ejercicios: [
      { nombre: 'Jalón al Pecho Agarre Ancho',            series: 4, reps: '12-15', descanso: '90 s',  notas: 'Enfoque en amplitud de dorsales. Brazos 100% extendidos arriba antes de cada rep.' },
      { nombre: 'Pullover en Máquina',                    series: 4, reps: '10-12', descanso: '0 s',   notas: 'Superserie con Remo máquina. Énfasis en conexión dorsal-serrato.', isSuperset: true },
      { nombre: 'Remo en Máquina (apoyo pecho)',          series: 4, reps: '12-15', descanso: '60 s',  notas: 'Cierra la superserie de grosor/amplitud. Codos pegados al cuerpo.' },
      { nombre: 'Straight-Arm Pulldown en Cable',        series: 4, reps: '10-12', descanso: '0 s',   notas: 'Superserie con remo en polea. Máximo estiramiento del dorsal arriba.', isSuperset: true },
      { nombre: 'Remo en Polea Baja (cable)',             series: 4, reps: '12-15', descanso: '60 s',  notas: 'Cierra la superserie de cables. Codos bajos para enfatizar dorsales bajos.' },
      { nombre: 'Cable Rear Delt Fly Cruzado',           series: 3, reps: '12-15', descanso: '60 s',  notas: 'Deltoides posterior desde la sesión de espalda para mejor simetría.' },
      { nombre: 'Jalón al Pecho Overhand',               series: 7, reps: '8-10',  descanso: '30-45 s', notas: 'FST-7 final. Máximo bombeo y estiramiento del dorsal ancho para amplitud.', isFST7: true },
    ],
  },
  // Día 9: Descanso
  { nombre: 'Día 9 — Descanso total', grupos: [], ejercicios: [] },
];

// ─── Transformaciones de fase ───────────────────────────────────────────────
/**
 * Aplica los ajustes de fase Off-Season (default) o Prep al plan.
 *
 * - Off-Season: el plan tal cual (foco en masa).
 * - Prep: añade un FST-7 extra al final de pecho y espalda, sube reps en
 *   aislamientos (más volumen metabólico para definir), reduce descansos.
 */
function applyPhase(plan: FullWDay[], phase: CbumPhase): FullWDay[] {
  if (phase === 'offseason') return plan.map(d => ({ ...d, ejercicios: d.ejercicios.map(e => ({ ...e })) }));

  // PREP: clonar y modificar (índices del nuevo plan de 9 días)
  const cloned = plan.map(d => ({ ...d, ejercicios: d.ejercicios.map(e => ({ ...e })) }));

  // Día 2 (idx 1): añadir Pec Deck Flyes FST-7 al final de pecho
  cloned[1].variante = 'Fase Prep — FST-7 de pecho añadido';
  cloned[1].ejercicios.push({
    nombre: 'Pec Deck Flyes',
    series: 7, reps: '10-12', descanso: '30-45 s',
    notas: 'FST-7 prep — bombeo y estriaciones de pecho. Hany Rambod lo incorpora 12 semanas antes del Olympia.',
    isFST7: true,
  });

  // Día 3 (idx 2): añadir Pullover FST-7 para separación dorsal-serrato en prep
  cloned[2].variante = 'Fase Prep — FST-7 de dorsales añadido';
  cloned[2].ejercicios.push({
    nombre: 'Pullover con Cable',
    series: 7, reps: '10-12', descanso: '30-45 s',
    notas: 'FST-7 prep — separación visual dorsal-serrato. Fundamental para el "back width" de concurso.',
    isFST7: true,
  });

  // Día 5 (idx 4): subir reps en elevaciones y acortar descansos para más detalle
  const day5 = cloned[4];
  day5.variante = 'Fase Prep — reps subidas en laterales para detallar deltoides';
  for (const ej of day5.ejercicios) {
    if (ej.nombre.includes('Elevaciones')) {
      ej.reps = '12-15';
      ej.descanso = '30-45 s';
    }
  }

  // Día 7 (idx 6): añadir Curl Femoral FST-7 al final
  cloned[6].variante = 'Fase Prep — FST-7 de femorales añadido';
  cloned[6].ejercicios.push({
    nombre: 'Curl Femoral Sentado',
    series: 7, reps: '10-12', descanso: '30-45 s',
    notas: 'FST-7 prep — separación y detalle del bíceps femoral. El gran secreto para piernas estriadas en escenario.',
    isFST7: true,
  });

  return cloned;
}

/**
 * Escala el volumen de la rutina según el nivel del usuario.
 *
 * - Principiante: 50% de las series (mín 1) y elimina los drop sets de las notas.
 * - Intermedio: 75% de las series (redondeo hacia arriba).
 * - Avanzado: tal cual (default — la rutina ya es para nivel pro).
 *
 * Los FST-7 se mantienen siempre en 7 series — son el corazón de la técnica.
 */
function applyIntensity(plan: FullWDay[], intensity: CbumIntensity): FullWDay[] {
  if (intensity === 'avanzado') return plan;

  const factor = intensity === 'principiante' ? 0.5 : 0.75;
  return plan.map(d => ({
    ...d,
    ejercicios: d.ejercicios.map(e => {
      if (e.isFST7) return e;  // FST-7 siempre 7 series
      const newSeries = Math.max(1, Math.round(e.series * factor));
      // En principiante, limpiar menciones de drop sets
      const nuevasNotas = intensity === 'principiante' && e.notas
        ? e.notas.replace(/\bdrop sets?\b/gi, '').replace(/\.\s*\./g, '.').trim()
        : e.notas;
      return { ...e, series: newSeries, notas: nuevasNotas };
    }),
  }));
}

/**
 * Construye la rutina CBum según fase + intensidad solicitadas.
 */
export function buildCbumRoutine(phase: CbumPhase, intensity: CbumIntensity): FullWRoutine {
  let plan = BASE_PLAN.map(d => ({ ...d, ejercicios: d.ejercicios.map(e => ({ ...e })) }));
  plan = applyPhase(plan, phase);
  plan = applyIntensity(plan, intensity);

  const phaseLabel = phase === 'offseason' ? 'Off-Season' : 'Prep';
  const intLabel = intensity === 'principiante' ? 'Principiante' : intensity === 'intermedio' ? 'Intermedio' : 'Avanzado';

  return {
    id: `cbum-${phase}-${intensity}`,
    nombre: `CBum — ${phaseLabel} (${intLabel})`,
    dias: 7,
    semanas: 12,
    descripcion: phase === 'offseason'
      ? 'Off-season: hipertrofia máxima. Ciclo de 9 días, espalda 2×/ciclo, GVT y FST-7.'
      : 'Prep Olympia: definición + detalle muscular. FST-7 doble en brazos, elevaciones con más reps.',
    distribucion: 'Cuádriceps · Pecho/Tri · Espalda Grosor/Bi · Off · Hombros · Brazos · Isquios/Glúteos · Espalda Amplitud · Off',
    plan,
  };
}

// Backward compat: la rutina default sigue siendo Off-Season + Avanzado
export const CBUM_ROUTINE: FullWRoutine = buildCbumRoutine('offseason', 'avanzado');

// Re-export por si alguien quiere consumir el tipo
export type { FullWExercise };
