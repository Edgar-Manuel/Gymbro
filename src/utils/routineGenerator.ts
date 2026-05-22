import type {
  UserProfile,
  ExerciseKnowledge,
  RutinaSemanal,
  DiaRutina,
  EjercicioEnRutina,
  GrupoMuscular
} from '@/types';
import { GrupoMuscular as GM } from '@/types';

// Configuración de splits según días disponibles
export const SPLITS_CONFIG = {
  3: [
    { nombre: 'Empuje (Pecho, Hombros, Tríceps)', grupos: [GM.PECHO, GM.HOMBROS, GM.TRICEPS] },
    { nombre: 'Tirón (Espalda, Bíceps)', grupos: [GM.ESPALDA, GM.BICEPS] },
    { nombre: 'Pierna Completa', grupos: [GM.PIERNAS, GM.FEMORALES_GLUTEOS, GM.ABDOMINALES] }
  ],
  4: [
    { nombre: 'Pecho y Tríceps', grupos: [GM.PECHO, GM.TRICEPS] },
    { nombre: 'Espalda y Bíceps', grupos: [GM.ESPALDA, GM.BICEPS] },
    { nombre: 'Piernas y Abs', grupos: [GM.PIERNAS, GM.FEMORALES_GLUTEOS, GM.ABDOMINALES] },
    { nombre: 'Hombros y Brazos Extra', grupos: [GM.HOMBROS, GM.BICEPS, GM.TRICEPS] }
  ],
  5: [
    { nombre: 'Pecho', grupos: [GM.PECHO] },
    { nombre: 'Espalda', grupos: [GM.ESPALDA] },
    { nombre: 'Pierna', grupos: [GM.PIERNAS, GM.FEMORALES_GLUTEOS] },
    { nombre: 'Hombros y Brazos', grupos: [GM.HOMBROS, GM.BICEPS, GM.TRICEPS] },
    { nombre: 'Pierna (Énfasis Femorales) y Abs', grupos: [GM.FEMORALES_GLUTEOS, GM.ABDOMINALES] }
  ],
  6: [
    { nombre: 'Pecho y Tríceps', grupos: [GM.PECHO, GM.TRICEPS] },
    { nombre: 'Espalda y Bíceps', grupos: [GM.ESPALDA, GM.BICEPS] },
    { nombre: 'Pierna (Cuádriceps)', grupos: [GM.PIERNAS] },
    { nombre: 'Hombros y Abs', grupos: [GM.HOMBROS, GM.ABDOMINALES] },
    { nombre: 'Brazos (Bíceps y Tríceps)', grupos: [GM.BICEPS, GM.TRICEPS] },
    { nombre: 'Pierna (Femorales y Glúteos)', grupos: [GM.FEMORALES_GLUTEOS, GM.PIERNAS] }
  ]
};

export const DIAS_SEMANA_RECOMENDADOS: Record<number, string> = {
  3: 'Lunes, Miércoles y Viernes',
  4: 'Lunes, Martes, Jueves y Viernes',
  5: 'Lunes a Viernes (Descanso fines de semana)',
  6: 'Lunes a Sábado (Descanso Domingo)'
};

// Configuración de volumen según objetivo
export const OBJETIVO_CONFIG = {
  fuerza: {
    series: [3, 5], // rango de series
    reps: [4, 6],   // rango de repeticiones
    descanso: 180,  // segundos
    ejerciciosPorGrupo: 2
  },
  hipertrofia: {
    series: [3, 4],
    reps: [8, 12],
    descanso: 90,
    ejerciciosPorGrupo: 3
  },
  resistencia: {
    series: [2, 3],
    reps: [12, 15],
    descanso: 60,
    ejerciciosPorGrupo: 3
  },
  perdida_grasa: {
    series: [3, 4],
    reps: [10, 15],
    descanso: 45,
    ejerciciosPorGrupo: 3
  }
};

/**
 * Genera una rutina personalizada basada en el perfil del usuario
 */
export function generarRutinaPersonalizada(
  user: UserProfile,
  exercises: ExerciseKnowledge[]
): RutinaSemanal {
  const dias = user.diasDisponibles >= 3 && user.diasDisponibles <= 6
    ? user.diasDisponibles
    : 4;

  const split = SPLITS_CONFIG[dias as keyof typeof SPLITS_CONFIG];
  const config = OBJETIVO_CONFIG[user.objetivo];

  const diasRutina: DiaRutina[] = split.map((dia, index) => {
    if (dia.grupos.length === 0) {
      // Día de descanso
      return {
        nombre: dia.nombre,
        grupos: [],
        ejercicios: [],
        duracionEstimada: 0,
        orden: index + 1
      };
    }

    // Adaptar ejercicios por nivel
    let nivelEjercicios = config.ejerciciosPorGrupo;
    if (user.nivel === 'avanzado') nivelEjercicios += 1;
    if (user.nivel === 'principiante') nivelEjercicios = Math.max(1, nivelEjercicios - 1);

    // Boost extra exercises for priority muscle groups from assessment
    const prioridades = user.evaluacionFisica?.prioridades ?? [];
    const hasPriorityGroup = prioridades.length > 0 && dia.grupos.some(g =>
      prioridades.some(p => g.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(g.toLowerCase()))
    );
    if (hasPriorityGroup) nivelEjercicios = Math.min(nivelEjercicios + 1, 5);

    const ejercicios = seleccionarEjerciciosParaDia(
      dia.grupos,
      exercises,
      user,
      nivelEjercicios,
      prioridades
    );

    const ejerciciosEnRutina: EjercicioEnRutina[] = ejercicios.map(ex => ({
      ejercicioId: ex.id,
      ejercicio: ex,
      seriesObjetivo: determinarSeries(ex, user.objetivo, user.somatotipo, prioridades),
      repsObjetivo: determinarReps(ex, user.objetivo, user.somatotipo),
      pesoSugerido: undefined as number | undefined,
      notas: ex.tecnica.consejosClave[0] || 'Enfócate en la técnica'
    }));

    // Adaptar descanso según somatotipo
    let descansoAdaptado = config.descanso;
    if (user.somatotipo === 'ectomorfo') descansoAdaptado += 30; // Más descanso para recuperación ATP
    if (user.somatotipo === 'endomorfo') descansoAdaptado = Math.max(30, descansoAdaptado - 15); // Más estrés metabólico

    const duracionEstimada = calcularDuracionEstimada(ejerciciosEnRutina, descansoAdaptado);

    return {
      nombre: dia.nombre,
      grupos: dia.grupos,
      ejercicios: ejerciciosEnRutina,
      duracionEstimada,
      orden: index + 1
    };
  }).filter(dia => dia.ejercicios.length > 0); // Remover días vacíos (descanso) por si acaso

  const rutina: RutinaSemanal = {
    id: `rutina-${Date.now()}`,
    userId: user.id,
    nombre: `Rutina ${dias} Días - ${user.objetivo.charAt(0).toUpperCase() + user.objetivo.slice(1)}`,
    descripcion: `Rutina personalizada para ${user.nivel} enfocada en ${user.objetivo}. Días recomendados: ${DIAS_SEMANA_RECOMENDADOS[dias as keyof typeof DIAS_SEMANA_RECOMENDADOS]}.`,
    dias: diasRutina,
    fechaCreacion: new Date(),
    activa: true
  };

  return rutina;
}

/**
 * Selecciona los mejores ejercicios para un día específico
 */
function seleccionarEjerciciosParaDia(
  gruposMusculares: GrupoMuscular[],
  todosEjercicios: ExerciseKnowledge[],
  user: UserProfile,
  ejerciciosPorGrupo: number,
  prioridades: string[] = []
): ExerciseKnowledge[] {
  // Process priority groups first so they get the extra slot
  const gruposOrdenados = [...gruposMusculares].sort((a, b) => {
    const aPrio = prioridades.some(p => a.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(a.toLowerCase()));
    const bPrio = prioridades.some(p => b.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(b.toLowerCase()));
    if (aPrio && !bPrio) return -1;
    if (!aPrio && bPrio) return 1;
    return 0;
  });
  const ejerciciosSeleccionados: ExerciseKnowledge[] = [];

  gruposOrdenados.forEach(grupo => {
    const isPriority = prioridades.some(p => grupo.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(grupo.toLowerCase()));
    const slotsPorGrupo = isPriority ? Math.min(ejerciciosPorGrupo + 1, 5) : ejerciciosPorGrupo;
    // Filtrar ejercicios disponibles para este grupo
    const disponibles = todosEjercicios.filter(ex => {
      // Debe ser del grupo muscular correcto
      if (ex.grupoMuscular !== grupo) return false;

      // Debe tener equipamiento disponible
      const userEquipo = Array.isArray(user.equipamiento) ? user.equipamiento : [];
      const tieneEquipamiento = ex.equipamiento.some(eq =>
        userEquipo.includes(eq)
      );
      if (!tieneEquipamiento) return false;

      // No debe involucrar músculos lesionados
      const userLesiones = Array.isArray(user.lesiones) ? user.lesiones : [];
      const involucraLesion = userLesiones.some(lesion =>
        ex.nombre.toLowerCase().includes(lesion.toLowerCase()) ||
        ex.enfoqueMuscular.some(m => m.toLowerCase().includes(lesion.toLowerCase()))
      );
      if (involucraLesion) return false;

      // Filtrar por nivel
      if (user.nivel === 'principiante' && ex.dificultad === 'avanzado') return false;

      return true;
    });

    // Ordenar por tier y mezclar los del mismo tier para dar variedad
    const ordenados = disponibles.sort((a, b) => {
      const tierOrder = { 'S': 0, 'A': 1, 'B': 2, 'C': 3, 'F': 4 };
      const diff = tierOrder[a.tier] - tierOrder[b.tier];
      if (diff !== 0) return diff;

      // Si tienen el mismo tier, priorizar compuestos
      if (a.categoria === 'compuesto' && b.categoria === 'aislamiento') return -1;
      if (a.categoria === 'aislamiento' && b.categoria === 'compuesto') return 1;

      // Añadir algo de aleatoriedad para evitar rutinas clónicas (shuffle determinístico)
      return Math.random() - 0.5;
    });

    // Seleccionar ejercicios para este grupo
    let seleccionados = 0;

    // Necesidades especiales para ciertos grupos
    if (grupo === GM.ESPALDA) {
      // Espalda necesita 1 vertical + 1 horizontal
      const vertical = ordenados.find(e => e.tags?.includes('tiron_vertical'));
      const horizontal = ordenados.find(e => e.tags?.includes('tiron_horizontal'));

      if (vertical) {
        ejerciciosSeleccionados.push(vertical);
        seleccionados++;
      }
      if (horizontal && seleccionados < slotsPorGrupo) {
        ejerciciosSeleccionados.push(horizontal);
        seleccionados++;
      }
    }

    // Completar con los mejores ejercicios restantes
    for (const ejercicio of ordenados) {
      if (seleccionados >= slotsPorGrupo) break;
      if (!ejerciciosSeleccionados.includes(ejercicio)) {
        ejerciciosSeleccionados.push(ejercicio);
        seleccionados++;
      }
    }
  });

  return ejerciciosSeleccionados;
}

/**
 * Determina el número de series según el ejercicio, objetivo y somatotipo
 */
function determinarSeries(ejercicio: ExerciseKnowledge, objetivo: string, somatotipo?: string, prioridades: string[] = []): number {
  const config = OBJETIVO_CONFIG[objetivo as keyof typeof OBJETIVO_CONFIG];
  let [min, max] = config.series;

  // Ectomorfos responden mejor a menos volumen y más intensidad
  if (somatotipo === 'ectomorfo') {
    max = Math.max(min, max - 1);
  }
  // Endomorfos toleran y necesitan más volumen
  if (somatotipo === 'endomorfo') {
    min = Math.min(max, min + 1);
  }

  // Priority groups from assessment get an extra set
  const isPriority = prioridades.some(p =>
    ejercicio.grupoMuscular?.toLowerCase().includes(p.toLowerCase()) ||
    p.toLowerCase().includes(ejercicio.grupoMuscular?.toLowerCase() ?? '')
  );
  if (isPriority) max = Math.min(max + 1, 5);

  // Ejercicios tier S y compuestos: más series
  if (ejercicio.tier === 'S' || ejercicio.categoria === 'compuesto') {
    return max;
  }

  // Ejercicios de aislamiento: menos series
  return isPriority ? max : min;
}

/**
 * Determina el rango de repeticiones según el ejercicio, objetivo y somatotipo
 */
function determinarReps(_ejercicio: ExerciseKnowledge, objetivo: string, somatotipo?: string): [number, number] {
  const config = OBJETIVO_CONFIG[objetivo as keyof typeof OBJETIVO_CONFIG];
  const reps = [...config.reps] as [number, number];

  // Ectomorfos se benefician de reps ligeramente más bajas (más peso)
  if (somatotipo === 'ectomorfo') {
    reps[0] = Math.max(1, reps[0] - 1);
    reps[1] = Math.max(reps[0], reps[1] - 1);
  }
  
  return reps;
}

/**
 * Calcula la duración estimada del entrenamiento
 */
function calcularDuracionEstimada(ejercicios: EjercicioEnRutina[], descansoPromedio: number): number {
  let duracion = 0;

  ejercicios.forEach(ej => {
    // Tiempo por serie (aprox 30-45 segundos de ejecución)
    const tiempoPorSerie = 40; // segundos
    const series = ej.seriesObjetivo;

    // Tiempo de ejecución + tiempo de descanso
    duracion += (tiempoPorSerie * series) + (descansoPromedio * (series - 1));
  });

  // Agregar tiempo de calentamiento y transiciones (10 minutos)
  duracion += 600;

  // Convertir a minutos y redondear
  return Math.round(duracion / 60);
}

/**
 * Valida si una rutina es válida para el usuario
 */
export function validarRutina(rutina: RutinaSemanal, user: UserProfile): { valid: boolean; errores: string[] } {
  const errores: string[] = [];

  // Verificar que hay al menos un día con ejercicios
  const diasConEjercicios = rutina.dias.filter(d => d.ejercicios.length > 0);
  if (diasConEjercicios.length === 0) {
    errores.push('La rutina debe tener al menos un día con ejercicios');
  }

  // Verificar que no exceda el tiempo disponible
  rutina.dias.forEach(dia => {
    if (dia.duracionEstimada > (user.tiempoSesion || 60) + 15) { // +15 min de margen
      errores.push(`El día "${dia.nombre}" excede el tiempo disponible (${dia.duracionEstimada} min)`);
    }
  });

  // Verificar balance de grupos musculares
  const frecuenciaPorGrupo: Record<string, number> = {};
  rutina.dias.forEach(dia => {
    dia.grupos.forEach(grupo => {
      frecuenciaPorGrupo[grupo] = (frecuenciaPorGrupo[grupo] || 0) + 1;
    });
  });

  // Advertir si algún grupo se entrena muy poco
  const gruposPrincipales = [GM.PECHO, GM.ESPALDA, GM.PIERNAS];
  gruposPrincipales.forEach(grupo => {
    if ((frecuenciaPorGrupo[grupo] || 0) < 1) {
      errores.push(`Advertencia: El grupo muscular "${grupo}" no está incluido en la rutina`);
    }
  });

  return {
    valid: errores.length === 0,
    errores
  };
}

/**
 * Obtiene un resumen de la rutina para mostrar al usuario
 */
export function obtenerResumenRutina(rutina: RutinaSemanal): {
  totalDias: number;
  totalEjercicios: number;
  duracionPromedio: number;
  gruposMusculares: string[];
  ejerciciosTierS: number;
} {
  const diasActivos = rutina.dias.filter(d => d.ejercicios.length > 0);
  const todosEjercicios = diasActivos.flatMap(d => d.ejercicios);

  const gruposUnicos = new Set<string>();
  rutina.dias.forEach(dia => {
    dia.grupos.forEach(g => gruposUnicos.add(g));
  });

  const ejerciciosTierS = todosEjercicios.filter(e => e.ejercicio?.tier === 'S').length;

  const duracionPromedio = diasActivos.length > 0
    ? Math.round(diasActivos.reduce((sum, d) => sum + d.duracionEstimada, 0) / diasActivos.length)
    : 0;

  return {
    totalDias: diasActivos.length,
    totalEjercicios: todosEjercicios.length,
    duracionPromedio,
    gruposMusculares: Array.from(gruposUnicos),
    ejerciciosTierS
  };
}
