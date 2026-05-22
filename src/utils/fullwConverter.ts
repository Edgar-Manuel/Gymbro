import { exercisesData } from '@/data/exercises';
import type { FullWRoutine, FullWExercise } from '@/data/fullwRoutines';
import type { RutinaSemanal, DiaRutina, EjercicioEnRutina, ExerciseKnowledge, GrupoMuscular } from '@/types';

// Mapa de nombre Full W → id en exercises.ts
const NAME_TO_ID: Record<string, string> = {
  'press de banca con barra':              'press-banca-barra',
  'press de banca con mancuernas':         'press-banca-mancuernas',
  'press inclinado con barra':             'press-inclinado-barra',
  'press inclinado con mancuernas':        'press-banca-mancuernas',
  'press de banca inclinado con barra':    'press-inclinado-barra',
  'aperturas con mancuernas':              'aperturas-mancuernas',
  'aperturas en polea':                    'aperturas-mancuernas',
  'aperturas en polea (cable fly)':        'aperturas-mancuernas',
  'fondos en paralelas':                   'fondos-triceps',
  'fondos en paralelas (tríceps)':         'fondos-triceps',
  'fondos en paralelas (triceps)':         'fondos-triceps',
  'dominadas':                             'dominadas',
  'dominadas o jalón al pecho':            'dominadas',
  'dominadas lastradas':                   'dominadas',
  'dominadas agarre ancho':                'dominadas',
  'remo con barra':                        'remo-barra',
  'remo con barra (pronado)':              'remo-barra',
  'remo con mancuerna':                    'remo-mancuerna-unilateral',
  'remo con mancuerna (unilateral)':       'remo-mancuerna-unilateral',
  'remo en polea baja':                    'remo-bilateral-apoyo',
  'remo en polea baja (agarre neutro)':    'remo-bilateral-apoyo',
  'jalón al pecho':                        'lat-pulldown',
  'jalón al pecho agarre ancho':           'lat-pulldown',
  'jalón neutro al pecho':                 'lat-pulldown',
  'jalón al pecho (agarre ancho)':         'lat-pulldown',
  'press militar con barra':               'press-militar',
  'press de hombros con mancuernas':       'press-militar',
  'elevaciones laterales':                 'elevaciones-laterales',
  'elevaciones laterales en polea':        'elevaciones-laterales',
  'face pull en polea':                    'pajaros-deltoides-posterior',
  'pájaros (deltoides posterior)':         'pajaros-deltoides-posterior',
  'curl de bíceps con barra':              'curl-barra',
  'curl bíceps con barra':                 'curl-barra',
  'curl con barra z':                      'curl-barra',
  'curl de biceps con barra':              'curl-barra',
  'curl inclinado con mancuernas':         'curl-inclinado',
  'curl concentrado':                      'curl-concentrado',
  'curl concentrado scott':                'curl-concentrado',
  'curl de scott':                         'curl-concentrado',
  'curl martillo':                         'curl-martillo',
  'curl en polea':                         'curl-polea',
  'extensiones en polea (tríceps)':        'pushdowns-polea',
  'extensiones tríceps en polea':          'pushdowns-polea',
  'extensiones tríceps polea':             'pushdowns-polea',
  'extensiones en polea':                  'pushdowns-polea',
  'extensiones tríceps sobre la cabeza':   'extensiones-overhead',
  'extensiones overhead':                  'extensiones-overhead',
  'patadas de tríceps':                    'patadas-triceps',
  'sentadilla con barra':                  'sentadilla-barra',
  'sentadilla frontal':                    'sentadilla-barra',
  'sentadilla frontal o goblet':           'sentadilla-barra',
  'sentadilla goblet':                     'sentadilla-barra',
  'prensa de piernas':                     'prensa-pierna',
  'prensa de piernas (pies altos)':        'prensa-pierna',
  'peso muerto convencional':              'peso-muerto-convencional',
  'peso muerto sumo':                      'peso-muerto-convencional',
  'peso muerto rumano':                    'peso-muerto-rumano',
  'curl femoral':                          'curl-femoral',
  'curl femoral tumbado':                  'curl-femoral',
  'curl femoral en máquina':               'curl-femoral',
  'curl femoral (máquina)':                'curl-femoral',
  'hip thrust':                            'hip-thrust',
  'hip thrust con barra':                  'hip-thrust',
  'zancadas con mancuernas':               'zancadas',
  'zancadas':                              'zancadas',
  'elevaciones de gemelos':                'elevaciones-talones',
  'elevaciones de gemelos de pie':         'elevaciones-talones',
  'elevaciones de gemelos sentado':        'elevaciones-talones',
  'elevaciones de gemelos (de pie)':       'elevaciones-talones',
  'elevaciones de gemelos (sentado)':      'elevaciones-talones',
  'elevaciones de talones':                'elevaciones-talones',
  'extensiones de cuádriceps':             'prensa-pierna',
  'hack squat':                            'hack-squat',
  'abdominales':                           'crunch-polea',
  'abdominales colgado':                   'elevaciones-piernas-flexion',
  'abdominales decline':                   'crunch-polea',
  'abdominales (rueda o decline)':         'crunch-polea',
  'plancha':                               'plancha',
  'plancha abdominal':                     'plancha',
  'plancha lateral':                       'plancha',
  'abducción de cadera en máquina':        'hip-thrust',

  // ─── CBum routine mappings ──────────────────────────────────────────────
  'prensa de piernas (unilateral)':        'prensa-pierna',
  'sentadilla con barra o smith':          'sentadilla-barra',
  'sentadilla sissy o búlgara':            'zancadas',
  'sentadilla sissy':                      'zancadas',
  'sentadilla búlgara':                    'zancadas',
  'sentadilla bulgara':                    'zancadas',
  'aperturas inclinadas con mancuernas':   'aperturas-mancuernas',
  'aperturas inclinadas (mancuernas o cable)': 'aperturas-mancuernas',
  'aperturas inclinadas en cable':         'aperturas-mancuernas',
  'press en máquina (hammer strength)':    'press-banca-mancuernas',
  'press en maquina':                      'press-banca-mancuernas',
  'press inclinado en máquina':            'press-banca-mancuernas',
  'pec deck':                              'aperturas-mancuernas',
  'pec deck flyes':                        'aperturas-mancuernas',
  'pec deck inverso':                      'pajaros-deltoides-posterior',
  'skullcrushers':                         'extensiones-overhead',
  'skullcrushers (press francés)':         'extensiones-overhead',
  'press francés':                         'extensiones-overhead',
  'press frances':                         'extensiones-overhead',
  'pushdowns':                             'pushdowns-polea',
  'pushdowns en polea':                    'pushdowns-polea',
  'pushdowns de tríceps con cuerda':       'pushdowns-polea',
  'pushdowns de triceps con cuerda':       'pushdowns-polea',
  'tríceps cruzado en polea':              'pushdowns-polea',
  'triceps cruzado en polea':              'pushdowns-polea',
  'jalón al pecho (agarre supino o neutro)': 'lat-pulldown',
  'jalón al pecho (agarre supino/neutro)': 'lat-pulldown',
  'jalon al pecho (agarre supino o neutro)': 'lat-pulldown',
  'remo con barra (agarre supino)':        'remo-barra',
  'remo en barra t (apoyado en pecho)':    'remo-bilateral-apoyo',
  'remo en barra t':                       'remo-bilateral-apoyo',
  'remo en t apoyado':                     'remo-bilateral-apoyo',
  'pullover con cable':                    'lat-pulldown',
  'pullover':                              'lat-pulldown',
  'curl de bíceps en banco inclinado':     'curl-inclinado',
  'curl de biceps en banco inclinado':     'curl-inclinado',
  'curl predicador en máquina':            'curl-concentrado',
  'curl predicador en maquina':            'curl-concentrado',
  'curl predicador con barra ez':          'curl-barra',
  'curl predicador':                       'curl-concentrado',
  'curl con mancuernas alterno':           'curl-inclinado',
  'curl alterno':                          'curl-inclinado',
  'curl en polea baja':                    'curl-polea',
  'curl en polea baja (fst-7)':            'curl-polea',
  'press de hombros en máquina':           'press-militar',
  'press de hombros en maquina':           'press-militar',
  'elevaciones laterales en maquina':      'elevaciones-laterales-maquina',
  'curl de pierna acostado':               'curl-femoral',
  'peso muerto':                           'peso-muerto-convencional',
  'sentadilla en máquina de cinturón':     'hack-squat',
  'sentadilla en maquina de cinturon':     'hack-squat',
  'hip thrust en máquina':                 'hip-thrust',
  'hip thrust en maquina':                 'hip-thrust',
  'elevación de pantorrillas de pie':      'elevaciones-talones',
  'elevacion de pantorrillas de pie':      'elevaciones-talones',

  // ─── CBum 9-day authentic routine ─────────────────────────────────────────
  // Day 1 — Cuádriceps y Pantorrillas
  'extensiones de pierna':                 'extension-pierna',      // ≠ prensa-pierna (different machine)
  'elevación de pantorrillas sentado':     'elevaciones-talones',
  'elevacion de pantorrillas sentado':     'elevaciones-talones',

  // Day 2 — Pecho y Tríceps
  'press en máquina plana (gvt)':          'press-banca-barra',
  'press en maquina plana (gvt)':          'press-banca-barra',
  'pec deck flyes (inclinado)':            'fondos-pecho',          // ≠ aperturas-mancuernas (different machine)
  'skullcrushers con barra ez':            'extensiones-overhead',

  // Day 3 — Espalda Grosor y Bíceps (no duplicates)
  'remo con barra agarre supino':          'remo-barra',
  'remo en barra t (apoyo en pecho)':      'remo-bilateral-apoyo',
  'remo con mancuernas (gvt)':             'remo-mancuerna-unilateral',
  'curl en banco inclinado':               'curl-inclinado',

  // Day 5 — Hombros (3 press variants, 3 rear-delt variants, 3 lateral-raise variants)
  'cable rear delt fly (unilateral)':      'pajaros-deltoides-posterior',
  'press de hombros hammer strength':      'press-militar',
  'press de hombros en máquina / smith':   'press-banca-mancuernas', // ≠ press-militar (machine variant)
  'remo al mentón en smith':               'remo-gironda',           // ≠ press-militar (upright-row pattern)
  'elevaciones laterales con mancuernas':  'elevaciones-laterales',
  'elevaciones laterales en máquina':      'elevaciones-laterales-maquina',
  'superserie: pec deck inverso':          'aperturas-mancuernas',   // ≠ pajaros (reverse pec deck — chest machine reversed)
  'cable rear delt fly bilateral':         'remo-mancuerna-unilateral', // ≠ pajaros-deltoides-posterior
  'elevaciones laterales sentado':         'elevaciones-laterales-sentado', // FST-7 finisher

  // Day 6 — Brazos (FST-7 finishers intentionally repeat same movement — slot key isolates logs)
  'pushdowns con cuerda (pre-agotamiento)':'pushdowns-polea',
  'extensión de tríceps en polea alta':    'extensiones-overhead',
  'extension de triceps en polea alta':    'extensiones-overhead',
  'press cerrado con barra':               'fondos-triceps',          // ≠ extensiones-overhead (close-grip bench ≈ dips)
  'skullcrushers inclinados con mancuernas': 'extensiones-unilaterales', // ≠ extensiones-overhead (dumbbell skull)
  'curl martillo (cable o mancuerna)':     'curl-martillo',
  'pushdowns fst-7':                       'pushdowns-polea',        // same exercise as slot 1 — slot key isolates

  // Day 7 — Isquiotibiales y Glúteos
  'peso muerto rumano (rdl)':              'peso-muerto-rumano',
  'curl de pierna sentado':                'curl-femoral-sentado',   // ≠ curl-femoral (acostado)
  'sentadilla búlgara (split)':            'zancadas',
  'sentadilla bulgara (split)':            'zancadas',

  // Day 8 — Espalda Amplitud
  'pullover en máquina':                   'pullover-mancuerna',
  'pullover en maquina':                   'pullover-mancuerna',
  'remo en máquina (apoyo pecho)':         'remo-bilateral-apoyo',
  'remo en maquina (apoyo pecho)':         'remo-bilateral-apoyo',
  'straight-arm pulldown en cable':        'dominadas',              // ≠ pullover-mancuerna (straight-arm lat isolation)
  'remo en polea baja (cable)':            'remo-mancuerna-unilateral', // ≠ remo-bilateral-apoyo (cable seated row)
  'cable rear delt fly cruzado':           'pajaros-deltoides-posterior',
  'jalón al pecho overhand':               'chin-ups',               // ≠ lat-pulldown (FST-7 finisher, overhand close-grip)
  'jalon al pecho overhand':               'chin-ups',

  'aperturas inclinadas (mancuernas/cable)': 'aperturas-mancuernas',
};

/** Convierte "6-8" → [6,8]  |  "Al fallo" → [10,20]  |  "12" → 12 */
function parseReps(reps: string): number | [number, number] {
  const clean = reps.toLowerCase().trim();
  if (clean === 'al fallo') return [10, 20];
  const seg = clean.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (seg) return [parseInt(seg[1]), parseInt(seg[2])];
  const single = clean.match(/^(\d+)/);
  if (single) return parseInt(single[1]);
  return [8, 12];
}

function lookupExercise(nombre: string): ExerciseKnowledge | undefined {
  const key = nombre.toLowerCase().trim();
  const id = NAME_TO_ID[key];
  if (id) return exercisesData.find(e => e.id === id);
  // Fallback: buscar por nombre parcial
  return exercisesData.find(e => e.nombre.toLowerCase().includes(key.split(' ').slice(0, 2).join(' ')));
}

function inferGrupo(nombre: string): GrupoMuscular {
  const n = nombre.toLowerCase();
  if (/espalda|dorsal|remo|jalón|jalon|pulldown|dominada|pullover/.test(n)) return 'espalda';
  if (/hombro|deltoid|press militar|elevacion|elevación|face.?pull|rear delt/.test(n)) return 'hombros';
  if (/pierna|sentadilla|prensa|cuádricep|cuadricep|femoral|glúteo|gluteo|hip thrust|zancada|búlgara|bulgara|rdl|peso muerto rumano/.test(n)) return 'piernas';
  if (/bícep|bicep|curl/.test(n)) return 'biceps';
  if (/trícep|tricep|pushdown|skullcrusher|press franc/.test(n)) return 'triceps';
  if (/pantorrilla|gemelo|talón|talon/.test(n)) return 'piernas';
  if (/abdomen|abdominal|plancha|crunch|core/.test(n)) return 'abdominales';
  return 'pecho';
}

function makeStubExercise(nombre: string, idx: number): ExerciseKnowledge {
  return {
    id: `fullw-stub-${idx}`,
    nombre,
    grupoMuscular: inferGrupo(nombre),
    categoria: 'compuesto',
    tier: 'A',
    dificultad: 'intermedio',
    equipamiento: [],
    enfoqueMuscular: [],
    tecnica: {
      posicionInicial: '',
      ejecucion: [],
      erroresComunes: [],
      consejosClave: [],
    },
    imagenes: { posicionInicial: '', ejecucion: [], errores: [] },
    variantes: [],
    descansoSugerido: 120,
  };
}

function shuffleSecondary<T>(arr: T[]): T[] {
  if (arr.length <= 2) return arr;
  const [first, ...rest] = arr;
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [first, ...rest];
}

/**
 * Convierte un nombre de ejercicio (p.ej. "Pec Deck Flyes (Inclinado)") en un
 * slug estable y único para usar como `ejercicioId`. Los IDs basados en nombre
 * garantizan que cada variante distinta tenga su propio historial de pesos en
 * lugar de mezclarse con otras variantes que comparten el mismo ejercicio
 * canónico de `exercises.ts`.
 */
function makeExerciseId(nombre: string): string {
  const slug = nombre.toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug;
}

export function fullWToRutinaSemanal(
  rutina: FullWRoutine,
  userId: string
): RutinaSemanal {
  let stubIdx = 0;
  const dias: DiaRutina[] = rutina.plan.map((dia, orden) => {
    // Shuffle secondary exercises (keep the primary compound first)
    const ejerciciosOrden = shuffleSecondary([...dia.ejercicios]);
    const ejercicios: EjercicioEnRutina[] = ejerciciosOrden.map((ej: FullWExercise) => {
      const found = lookupExercise(ej.nombre);
      const baseExercise = found ?? makeStubExercise(ej.nombre, stubIdx++);
      // ID único basado en el nombre original — garantiza nombre correcto en la
      // UI y historial de pesos independiente por variante.
      const uniqueId = makeExerciseId(ej.nombre) || baseExercise.id;
      const ejercicio: ExerciseKnowledge = {
        ...baseExercise,
        id: uniqueId,
        nombre: ej.nombre,
        baseExerciseId: baseExercise.id,
      };
      return {
        ejercicioId: uniqueId,
        ejercicio,
        seriesObjetivo: ej.series,
        repsObjetivo: parseReps(ej.reps),
        notas: ej.notas,
      };
    });

    return {
      id: `${rutina.id}-d${orden + 1}`,
      nombre: dia.nombre,
      grupos: Array.from(new Set(ejercicios.map(ej => inferGrupo(ej.ejercicio?.nombre ?? '')))) as GrupoMuscular[],
      ejercicios,
      duracionEstimada: Math.round(ejercicios.length * 12 + 15),
      orden: orden + 1,
    };
  });

  return {
    id: makeRoutineId(rutina.id, userId),
    userId,
    nombre: rutina.nombre,
    descripcion: rutina.descripcion,
    dias,
    fechaCreacion: new Date(),
    activa: true,
  };
}

/** Genera un ID de rutina estable, único por usuario y válido para Appwrite (≤36 chars, a-z0-9-_). */
function makeRoutineId(routineBaseId: string, userId: string): string {
  const safeBase = routineBaseId.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const safeUser = userId.replace(/[^a-zA-Z0-9]/g, '').slice(-8);
  const combined = `${safeBase}-${safeUser}`;
  return combined.slice(0, 36);
}
