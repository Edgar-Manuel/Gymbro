import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RestTimer from '@/components/RestTimer';
import DaySelector from '@/components/DaySelector';
import SwapExerciseModal from '@/components/SwapExerciseModal';
import AchievementUnlocked from '@/components/AchievementUnlocked';
import { checkAndAwardAchievements, type EarnedAchievement } from '@/utils/achievementChecker';
import { notificationManager } from '@/utils/notificationManager';
import { useAppStore } from '@/store';
import { dbHelpers } from '@/db';
import type { WorkoutLog, ExerciseLog, SerieLog, DiaRutina, Lesion, GrupoMuscular, MachinePhoto, EjercicioEnRutina, ExerciseKnowledge, WorkoutSetType } from '@/types';

// Item sortable de ejercicio en la pre-sesión
function SortableSessionExercise({ id, nombre, index, series, reps }: {
  id: string;
  nombre: string;
  index: number;
  series: number;
  reps: number | [number, number];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 5 : 'auto' as const,
  };
  const repsStr = Array.isArray(reps) ? `${reps[0]}-${reps[1]}` : String(reps);
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 rounded-lg border bg-background"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="touch-none p-1 -ml-1 rounded hover:bg-accent cursor-grab active:cursor-grabbing shrink-0"
        aria-label="Arrastrar para reordenar"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{index + 1}. {nombre}</p>
        <p className="text-xs text-muted-foreground">{series} series × {repsStr} reps</p>
      </div>
    </div>
  );
}

// Detecta el tipo de set basándose en tags y equipamiento del ejercicio
function detectSetType(ej: { tags?: string[]; equipamiento?: string[] } | undefined): WorkoutSetType {
  if (!ej) return 'WEIGHT';
  const tags = ej.tags ?? [];
  if (tags.some(t => /isometr|cardio|tiempo|plancha/i.test(t))) return 'TIME';
  const eq = ej.equipamiento ?? [];
  if (eq.length === 1 && eq[0] === 'peso_corporal') return 'BODYWEIGHT';
  return 'WEIGHT';
}

function isUnilateral(ej: { nombre?: string; tags?: string[] } | undefined): boolean {
  if (!ej) return false;
  if (ej.tags?.includes('unilateral')) return true;
  return /unilateral/i.test(ej.nombre ?? '');
}
import { inferirSiguienteDia } from '@/utils/workoutInference';
import { getVideoForExercise, getVolumenSesion } from '@/utils/exerciseUtils';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import EditSerieDialog from '@/components/EditSerieDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { INJURY_AFFECTS, LESION_ZONA_LABELS, REHAB_EXERCISES } from '@/utils/injuryData';
import { CARDIO_RECOMENDACIONES } from '@/utils/cardioData';
import { getRoutineTheme } from '@/utils/routineTheme';
import CardioPanel from '@/components/CardioPanel';
import MachinePhotoCard from '@/components/MachinePhotoCard';
import MachinePhotoCapture from '@/components/MachinePhotoCapture';
import MachinePhotoViewer from '@/components/MachinePhotoViewer';
import GymSelector from '@/components/GymSelector';
import { exerciseAgent } from '@/services/agents';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Save,
  Lightbulb,
  ArrowLeftRight,
  AlertTriangle,
  Heart,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  Building2,
  Camera,
  Plus,
  Search,
  Bot,
  Send,
} from 'lucide-react';

export default function WorkoutSession() {
  const navigate = useNavigate();
  const { currentUser, activeRoutine, startWorkout, finishWorkout, activeWorkout } = useAppStore();
  const theme = getRoutineTheme(activeRoutine?.id);

  // Estado para selector de día
  const [selectedDay, setSelectedDay] = useState<DiaRutina | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [editingSerie, setEditingSerie] = useState<SerieLog | null>(null);
  const [confirmDeleteSerie, setConfirmDeleteSerie] = useState<SerieLog | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [startTime, setStartTime] = useState(new Date());

  // Formulario de serie actual
  const [reps, setReps] = useState('');
  const [repsDer, setRepsDer] = useState('');
  const [peso, setPeso] = useState('');
  const [tiempoSegundos, setTiempoSegundos] = useState('');
  const [rir, setRir] = useState<number>(2);

  // Estado del entrenamiento
  const [ejercicioLogs, setEjercicioLogs] = useState<Map<string, ExerciseLog>>(new Map());

  // Sugerencias de peso basadas en historial
  const [pesoSugerido, setPesoSugerido] = useState<number | null>(null);

  const [showSwapModal, setShowSwapModal] = useState(false);
  const [estimated1RM, setEstimated1RM] = useState<number | null>(null);
  const [earnedAchievements, setEarnedAchievements] = useState<EarnedAchievement[]>([]);
  const [showWellnessCheck, setShowWellnessCheck] = useState(false);
  const [wellnessScore, setWellnessScore] = useState<1 | 2 | 3 | 4 | 5 | null>(null);

  const [showTechModal, setShowTechModal] = useState(false);

  // Injury awareness
  const [activeInjuries, setActiveInjuries] = useState<Lesion[]>([]);
  const [affectedInjuries, setAffectedInjuries] = useState<Lesion[]>([]);
  const [showRehabSection, setShowRehabSection] = useState(false);

  // Machine photo guide
  const [machinePhoto, setMachinePhoto] = useState<MachinePhoto | null>(null);
  const [machineTodasFotos, setMachineTodasFotos] = useState<MachinePhoto[]>([]);
  const [machinePhotoViewerOpen, setMachinePhotoViewerOpen] = useState(false);
  const [machinePhotoCaptureOpen, setMachinePhotoCaptureOpen] = useState(false);
  // gymSesion: gym selected for this workout session (independent of user.gymActual)
  const [gymSesion, setGymSesion] = useState<{ gymId: string; gymNombre: string } | null>(null);
  const [gymSelectorOpen, setGymSelectorOpen] = useState(false);
  const [dismissedMachineKey, setDismissedMachineKey] = useState<string | null>(null);

  // Add-exercise picker
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [allExercises, setAllExercises] = useState<ExerciseKnowledge[]>([]);
  const [addExerciseSearch, setAddExerciseSearch] = useState('');
  const [ejerciciosExtra, setEjerciciosExtra] = useState<EjercicioEnRutina[]>([]);

  // AI question inside tech modal
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!currentUser || !activeRoutine) {
      navigate('/');
    }
  }, [currentUser, activeRoutine, navigate]);

  const [previousRef, setPreviousRef] = useState<{
    peso: number;
    reps: number;
    rir: number;
    fecha: Date;
    best1RM: number;
    pesoMaxHistorico: number;
  } | null>(null);

  const loadPesoSugerido = useCallback(async () => {
    if (!currentUser || !selectedDay) return;

    const ejercicioActual = selectedDay.ejercicios[currentExerciseIndex];
    if (!ejercicioActual) return;

    try {
      const workouts = await dbHelpers.getWorkoutsByUser(currentUser.id, 30);
      const sorted = [...workouts].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      // Última sesión con este ejercicio
      let lastLog: typeof workouts[0]['ejercicios'][0] | null = null;
      let lastFecha: Date | null = null;
      let pesoMaxHistorico = 0;
      let best1RM = 0;

      for (const workout of sorted) {
        const ejercicioLog = workout.ejercicios.find(e => e.ejercicioId === ejercicioActual.ejercicioId);
        if (!ejercicioLog || ejercicioLog.series.length === 0) continue;
        if (!lastLog) {
          lastLog = ejercicioLog;
          lastFecha = new Date(workout.fecha);
        }
        for (const s of ejercicioLog.series) {
          if (s.peso > pesoMaxHistorico) pesoMaxHistorico = s.peso;
          const e1rm = s.peso * (1 + s.repeticiones / 30);
          if (e1rm > best1RM) best1RM = e1rm;
        }
      }

      if (!lastLog || !lastFecha) {
        setPesoSugerido(null);
        setPreviousRef(null);
        return;
      }

      // Pesos representativos de la primera serie
      const firstSerie = lastLog.series[0];
      setPesoSugerido(firstSerie.peso);
      setPeso(firstSerie.peso.toString());
      setPreviousRef({
        peso: firstSerie.peso,
        reps: firstSerie.repeticiones,
        rir: firstSerie.RIR,
        fecha: lastFecha,
        best1RM: Math.round(best1RM),
        pesoMaxHistorico,
      });
    } catch (error) {
      console.error('Error cargando peso sugerido:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, selectedDay, currentExerciseIndex]);

  // Cargar peso sugerido cuando cambia el ejercicio
  useEffect(() => {
    if (selectedDay && hasStarted) {
      loadPesoSugerido();
    }
  }, [currentExerciseIndex, selectedDay, hasStarted, loadPesoSugerido]);

  // Load machine photo for current exercise
  useEffect(() => {
    const loadMachinePhoto = async () => {
      if (!currentUser || !selectedDay || !hasStarted || !gymSesion) {
        setMachinePhoto(null);
        setMachineTodasFotos([]);
        return;
      }
      const ejercicioActual = selectedDay.ejercicios[currentExerciseIndex];
      if (!ejercicioActual) return;
      try {
        const active = await dbHelpers.getActiveMachinePhoto(currentUser.id, ejercicioActual.ejercicioId, gymSesion.gymId);
        const todas = await dbHelpers.getMachinePhotos(currentUser.id, ejercicioActual.ejercicioId, gymSesion.gymId);
        setMachinePhoto(active ?? null);
        setMachineTodasFotos(todas);
      } catch (err) {
        console.error('Error cargando foto de máquina:', err);
        setMachinePhoto(null);
      }
    };
    loadMachinePhoto();
  }, [currentExerciseIndex, selectedDay, hasStarted, gymSesion]);

  // Load active injuries
  useEffect(() => {
    if (!currentUser) return;
    dbHelpers.getActiveInjuries(currentUser.id)
      .then(setActiveInjuries)
      .catch(err => console.error('Error cargando lesiones:', err));
  }, [currentUser]);

  // Compute which injuries affect the selected day
  useEffect(() => {
    if (!selectedDay || activeInjuries.length === 0) {
      setAffectedInjuries([]);
      return;
    }
    const affected = activeInjuries.filter(l =>
      INJURY_AFFECTS[l.zona].some(m => (selectedDay.grupos ?? []).includes(m as GrupoMuscular))
    );
    setAffectedInjuries(affected);
  }, [selectedDay, activeInjuries]);

  // Auto-preselect day by muscle overlap — works across routine changes
  useEffect(() => {
    const autoSelectDay = async () => {
      if (!currentUser || !activeRoutine?.dias?.length) return;
      const activeDias = activeRoutine.dias.filter(d => d.ejercicios.length > 0);
      if (!activeDias.length) return;

      const workouts = await dbHelpers.getWorkoutsByUser(currentUser.id, 10);
      const completados = workouts
        .filter(w => w.completado)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      if (!completados.length) return;

      const nextDay = inferirSiguienteDia(activeDias, completados);
      setSelectedDay(nextDay);
    };
    autoSelectDay();
  }, [activeRoutine, currentUser]);

  // Drag and drop pre-sesión: reordena ejercicios del día seleccionado
  const reorderSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleReorderExerciseInDay = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedDay) return;
    // IDs are "slot-0", "slot-1", etc.
    const oldIdx = parseInt(String(active.id).replace('slot-', ''), 10);
    const newIdx = parseInt(String(over.id).replace('slot-', ''), 10);
    if (isNaN(oldIdx) || isNaN(newIdx)) return;
    setSelectedDay({
      ...selectedDay,
      ejercicios: arrayMove(selectedDay.ejercicios, oldIdx, newIdx),
    });
  };

  const handleSelectDay = (dia: DiaRutina) => {
    setSelectedDay(dia);
  };

  const handleStartWorkout = (score: 1 | 2 | 3 | 4 | 5 = 3) => {
    if (!currentUser || !selectedDay) return;

    const workoutLog: WorkoutLog = {
      id: `workout-${Date.now()}`,
      userId: currentUser.id,
      fecha: new Date(),
      diaRutina: selectedDay.nombre,
      diaRutinaId: selectedDay.id,
      ejercicios: [],
      duracionReal: 0,
      sensacionGeneral: score,
      completado: false
    };

    startWorkout(workoutLog);
    setStartTime(new Date());
    setHasStarted(true);
    setShowWellnessCheck(false);
  };

  if (!activeRoutine || !currentUser) {
    return null;
  }

  // Si no ha seleccionado día o no ha empezado, mostrar selector
  if (!selectedDay || !hasStarted) {
    const wellnessOptions: { score: 1 | 2 | 3 | 4 | 5; emoji: string; label: string; hint: string; color: string }[] = [
      { score: 2, emoji: '😴', label: 'Cansado', hint: 'Considera bajar el peso un 10%', color: 'border-orange-400 bg-orange-50 dark:bg-orange-950/30' },
      { score: 3, emoji: '😐', label: 'Normal', hint: '¡Listo para entrenar!', color: 'border-blue-400 bg-blue-50 dark:bg-blue-950/30' },
      { score: 5, emoji: '💪', label: 'Con energía', hint: '¡Día perfecto para superar marcas!', color: 'border-green-400 bg-green-50 dark:bg-green-950/30' },
    ];

    return (
      <>
        {/* Routine identity banner */}
        <div className={`${theme.headerGradient} text-white px-4 py-2.5 flex items-center gap-2`}>
          <span className="text-sm font-semibold">{theme.badge}</span>
          <span className="text-white/60 text-xs">·</span>
          <span className="text-xs text-white/80 truncate">{activeRoutine.nombre}</span>
        </div>
        <DaySelector
          dias={activeRoutine.dias.filter(d => d.ejercicios.length > 0)}
          onSelectDay={handleSelectDay}
          selectedDayId={selectedDay?.id}
        />

        {selectedDay && !hasStarted && affectedInjuries.length > 0 && (
          <div className="mx-4 mt-4 p-4 rounded-xl border-2 border-orange-400 bg-orange-50 dark:bg-orange-950/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-orange-800 dark:text-orange-200">
                  Modo Lesión Activo
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  {affectedInjuries.map(l => LESION_ZONA_LABELS[l.zona]).join(', ')} afecta a ejercicios de hoy.
                  Los pesos se ajustarán automáticamente. Al terminar verás tu plan de rehabilitación.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {affectedInjuries.map(l => (
                    <span key={l.id} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200 font-medium capitalize">
                      {l.severidad}: {LESION_ZONA_LABELS[l.zona]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedDay && !hasStarted && currentUser && (() => {
          const somatotipo = currentUser.somatotipo ?? 'mesomorfo';
          const rec = CARDIO_RECOMENDACIONES[somatotipo];
          if (rec.momento !== 'antes') return null;
          return (
            <div className="mx-4 mt-4">
              <CardioPanel
                userId={currentUser.id}
                somatotipo={somatotipo}
                momento="antes"
              />
            </div>
          );
        })()}

        {/* Lista de ejercicios reordenable (pre-sesión) */}
        {selectedDay && !hasStarted && selectedDay.ejercicios.length > 0 && (
          <div className="mx-4 mt-4 mb-32">
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <GripVertical className="w-3.5 h-3.5" />
              <span>Arrastra para reordenar antes de empezar</span>
            </div>
            <DndContext
              sensors={reorderSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleReorderExerciseInDay}
            >
              <SortableContext
                items={selectedDay.ejercicios.map((_, idx) => `slot-${idx}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {selectedDay.ejercicios.map((ej, idx) => (
                    <SortableSessionExercise
                      key={`slot-${idx}`}
                      id={`slot-${idx}`}
                      nombre={ej.ejercicio?.nombre ?? ej.ejercicioId}
                      index={idx}
                      series={ej.seriesObjetivo}
                      reps={ej.repsObjetivo}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {selectedDay && !hasStarted && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg">
            <div className="container mx-auto max-w-4xl space-y-2">
              {/* Gym indicator */}
              <button
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors text-sm"
                onClick={() => setGymSelectorOpen(true)}
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  {gymSesion ? gymSesion.gymNombre : 'Seleccionar gym…'}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                className={`w-full h-14 text-lg font-semibold rounded-xl ${theme.headerGradient} text-white flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform`}
                onClick={() => {
                  if (!gymSesion) { setGymSelectorOpen(true); return; }
                  setShowWellnessCheck(true);
                }}
              >
                <Check className="w-5 h-5" />
                Comenzar: {selectedDay.nombre}
              </button>
            </div>
          </div>
        )}

        {/* Wellness check-in modal */}
        {showWellnessCheck && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border rounded-2xl p-6 w-full max-w-sm space-y-5">
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">
                  Check-in
                </p>
                <h2 className="text-xl font-bold">¿Cómo te sientes hoy?</h2>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {wellnessOptions.map(opt => (
                  <button
                    key={opt.score}
                    onClick={() => setWellnessScore(opt.score)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      wellnessScore === opt.score
                        ? opt.color + ' scale-105'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <span className="text-3xl">{opt.emoji}</span>
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>

              {wellnessScore && (
                <p className="text-center text-sm text-muted-foreground">
                  {wellnessOptions.find(o => o.score === wellnessScore)?.hint}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowWellnessCheck(false)}
                >
                  Volver
                </Button>
                <Button
                  className="flex-1"
                  disabled={!wellnessScore}
                  onClick={() => handleStartWorkout(wellnessScore!)}
                >
                  Empezar →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Gym selector — must be in pre-start return too */}
        <GymSelector
          open={gymSelectorOpen}
          required={!gymSesion}
          onSelect={(gymId, gymNombre) => {
            setGymSesion({ gymId, gymNombre });
            setGymSelectorOpen(false);
            if (selectedDay) setShowWellnessCheck(true);
          }}
          onClose={() => setGymSelectorOpen(false)}
        />
      </>
    );
  }

  const ejerciciosDelDia = [...selectedDay.ejercicios, ...ejerciciosExtra];
  const ejercicioActual = ejerciciosDelDia[currentExerciseIndex];

  if (!ejercicioActual) {
    return null;
  }

  const currentSlotKey = `slot-${currentExerciseIndex}`;
  const ejercicioLog = ejercicioLogs.get(currentSlotKey);
  const seriesCompletadas = ejercicioLog?.series.length || 0;
  const totalSeries = ejercicioActual.seriesObjetivo;

  const handleRegistrarSerie = () => {
    const setType = detectSetType(ejercicioActual.ejercicio);
    const unilateral = isUnilateral(ejercicioActual.ejercicio);

    // Validación según tipo
    if (setType === 'TIME') {
      if (!tiempoSegundos || parseInt(tiempoSegundos) <= 0) {
        alert('Introduce la duración en segundos');
        return;
      }
    } else if (setType === 'BODYWEIGHT') {
      if (!reps) {
        alert('Introduce las repeticiones');
        return;
      }
    } else if (unilateral) {
      if (!reps || !repsDer || !peso) {
        alert('Introduce las repeticiones de cada lado y el peso');
        return;
      }
    } else {
      if (!reps || !peso) {
        alert('Por favor completa repeticiones y peso');
        return;
      }
    }

    const nuevaSerie: SerieLog = {
      numero: currentSetNumber,
      repeticiones: setType === 'TIME' ? 0 : parseInt(reps || '0'),
      peso: setType === 'WEIGHT' ? parseFloat(peso || '0') : 0,
      RIR: rir,
      tiempoDescanso: ejercicioActual.ejercicio?.descansoSugerido || 90,
      completada: true,
      tipo: setType,
      tiempoSegundos: setType === 'TIME' ? parseInt(tiempoSegundos) : undefined,
      repsDerecha: unilateral && repsDer ? parseInt(repsDer) : undefined,
    };

    // Actualizar o crear ejercicio log
    const logActual = ejercicioLog || {
      ejercicioId: ejercicioActual.ejercicioId,
      ejercicio: ejercicioActual.ejercicio,
      series: [],
      tecnicaCorrecta: true,
      sensacionMuscular: 3
    };

    const seriesActualizadas = [...logActual.series, nuevaSerie];
    const logActualizado = { ...logActual, series: seriesActualizadas };

    setEjercicioLogs(prev => new Map(prev.set(currentSlotKey, logActualizado)));

    // Calcular 1RM estimado (fórmula de Epley)
    const repsNum = parseInt(reps);
    const pesoNum = parseFloat(peso);
    if (repsNum > 0 && repsNum <= 12 && pesoNum > 0) {
      setEstimated1RM(Math.round(pesoNum * (1 + repsNum / 30)));
    }

    // Limpiar formulario
    setReps('');
    setRepsDer('');
    setTiempoSegundos('');
    setRir(2);

    // Incrementar número de serie
    setCurrentSetNumber(prev => prev + 1);

    // Mostrar timer de descanso si no es la última serie
    if (seriesCompletadas + 1 < totalSeries) {
      setShowTimer(true);
    } else {
      // Última serie del ejercicio completada
      // Auto-avanzar al siguiente ejercicio
      setTimeout(() => {
        handleSiguienteEjercicio();
      }, 500);
    }
  };

  // Aplica una transformación al log del ejercicio actual.
  const updateExerciseLog = (transform: (log: ExerciseLog) => ExerciseLog) => {
    setEjercicioLogs(prev => {
      const next = new Map(prev);
      const existing = next.get(currentSlotKey);
      if (!existing) return prev;
      next.set(currentSlotKey, transform(existing));
      return next;
    });
  };

  const handleEditSerie = (updated: SerieLog) => {
    updateExerciseLog(log => ({
      ...log,
      series: log.series.map(s => (s.numero === updated.numero ? updated : s)),
    }));
    toast.success('Serie actualizada');
  };

  const performDeleteSerie = () => {
    if (!confirmDeleteSerie) return;
    const num = confirmDeleteSerie.numero;
    updateExerciseLog(log => ({
      ...log,
      // Filtra la serie y renumera las restantes para evitar gaps
      series: log.series
        .filter(s => s.numero !== num)
        .map((s, i) => ({ ...s, numero: i + 1 })),
    }));
    // Reajusta el contador de la próxima serie
    const log = ejercicioLogs.get(currentSlotKey);
    const remaining = (log?.series.length ?? 1) - 1;
    setCurrentSetNumber(remaining + 1);
    setConfirmDeleteSerie(null);
    toast.success('Serie eliminada');
  };

  // Calcula el próximo número de serie de un ejercicio basándose en las
  // series ya registradas. Evita duplicar "Serie 1" al volver atrás.
  const nextSetNumberForExercise = (slotKey: string) => {
    const log = ejercicioLogs.get(slotKey);
    if (!log || log.series.length === 0) return 1;
    return Math.max(...log.series.map(s => s.numero)) + 1;
  };

  const handleSiguienteEjercicio = () => {
    if (currentExerciseIndex < ejerciciosDelDia.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSetNumber(nextSetNumberForExercise(`slot-${currentExerciseIndex + 1}`));
      setShowTimer(false);
      setPeso('');
      setEstimated1RM(null);
      setShowTechModal(false);
    } else {
      // Último ejercicio, finalizar entrenamiento
      handleFinalizarEntrenamiento();
    }
  };

  const handleAnteriorEjercicio = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setCurrentSetNumber(nextSetNumberForExercise(`slot-${currentExerciseIndex - 1}`));
      setShowTimer(false);
      setPeso('');
    }
  };

  const handleFinalizarEntrenamiento = async () => {
    if (!activeWorkout || !currentUser) return;

    const duracionMinutos = Math.round((new Date().getTime() - startTime.getTime()) / 60000);

    const workoutFinal: WorkoutLog = {
      ...activeWorkout,
      ejercicios: Array.from(ejercicioLogs.values()),
      duracionReal: duracionMinutos,
      completado: true
    };

    try {
      await dbHelpers.logWorkout(workoutFinal);
      notificationManager.markTrained();

      // Actualizar estadísticas
      const stats = await dbHelpers.getUserStatistics(currentUser.id);
      if (stats) {
        const volumenSesion = workoutFinal.ejercicios.reduce((total, ej) => {
          return total + ej.series.reduce((sum, serie) => {
            return sum + (serie.peso * serie.repeticiones);
          }, 0);
        }, 0);

        await dbHelpers.updateStatistics({
          ...stats,
          totalEntrenamientos: (stats.totalEntrenamientos ?? stats.totalWorkouts ?? 0) + 1,
          totalWorkouts: (stats.totalWorkouts ?? stats.totalEntrenamientos ?? 0) + 1,
          volumenEsteMes: (stats.volumenEsteMes ?? 0) + volumenSesion,
          volumenTotalMovido: (stats.volumenTotalMovido ?? 0) + volumenSesion,
        });
      }

      // Comprobar logros
      const updatedStats = await dbHelpers.getUserStatistics(currentUser.id);
      if (updatedStats) {
        const newAchievements = await checkAndAwardAchievements(
          currentUser.id,
          workoutFinal,
          updatedStats,
        );
        if (newAchievements.length > 0) {
          setEarnedAchievements(newAchievements);
          // La navegación ocurrirá tras cerrar el modal de logros
          finishWorkout();
          return;
        }
      }

      finishWorkout();
      navigate('/workout/summary', { state: { workout: workoutFinal } });
    } catch (error) {
      console.error('Error guardando entrenamiento:', error);
      toast.error('Error al guardar el entrenamiento. Por favor, intenta de nuevo.');
    }
  };

  const handleCancelarEntrenamiento = () => {
    if (confirm('¿Seguro que quieres cancelar este entrenamiento? Se perderá el progreso.')) {
      finishWorkout();
      navigate('/');
    }
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim() || aiLoading) return;
    setAiLoading(true);
    setAiAnswer('');
    try {
      const resp = await exerciseAgent.process(aiQuestion, {
        currentExercise: ejercicioActual?.ejercicio,
      });
      setAiAnswer(resp.content);
    } catch {
      setAiAnswer('No se pudo obtener respuesta. Verifica tu conexión.');
    } finally {
      setAiLoading(false);
      setAiQuestion('');
    }
  };

  const handleAddExercicio = (ejercicio: ExerciseKnowledge) => {
    const nuevo: EjercicioEnRutina = {
      ejercicioId: ejercicio.id,
      ejercicio,
      seriesObjetivo: 3,
      repsObjetivo: [8, 12],
    };
    setEjerciciosExtra(prev => [...prev, nuevo]);
    setAddExerciseOpen(false);
  };

  const handleSwap = (nuevo: typeof ejercicioActual) => {
    if (!selectedDay) return;
    const ejerciciosActualizados = selectedDay.ejercicios.map((ej, idx) =>
      idx === currentExerciseIndex ? nuevo : ej
    );
    setSelectedDay({ ...selectedDay, ejercicios: ejerciciosActualizados });
    setCurrentSetNumber(1);
    setPesoSugerido(null);
    setPeso('');
    setReps('');
  };

  const progreso = ((currentExerciseIndex + 1) / ejerciciosDelDia.length) * 100;
  const repsObjetivo = Array.isArray(ejercicioActual.repsObjetivo)
    ? `${ejercicioActual.repsObjetivo[0]}-${ejercicioActual.repsObjetivo[1]}`
    : ejercicioActual.repsObjetivo;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header con progreso */}
      <div className={`sticky top-0 z-40 ${theme.headerGradient} text-white p-4 shadow-lg`}>
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">{theme.badge}</span>
              </div>
              <h1 className="text-xl font-bold leading-tight mt-0.5">{selectedDay.nombre}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelarEntrenamiento}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Progress value={progreso} className="h-2 bg-white/20" />
          <div className="flex items-center justify-between mt-2 text-sm opacity-90">
            <p>
              Ejercicio {currentExerciseIndex + 1} de {ejerciciosDelDia.length}
              {ejerciciosExtra.length > 0 && (
                <span className="ml-1 opacity-70 text-xs">(+{ejerciciosExtra.length} extra)</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              {(() => {
                const currentVolumen = getVolumenSesion({
                  id: '', userId: '', fecha: new Date(),
                  ejercicios: Array.from(ejercicioLogs.values()),
                  completado: false,
                });
                if (currentVolumen <= 0) return null;
                return (
                  <span className="font-semibold tabular-nums">
                    {currentVolumen >= 1000 ? `${(currentVolumen / 1000).toFixed(1)}t` : `${Math.round(currentVolumen)} kg`}
                  </span>
                );
              })()}
              <button
                onClick={async () => {
                  if (allExercises.length === 0) {
                    const all = await dbHelpers.getAllExercises();
                    setAllExercises(all);
                  }
                  setAddExerciseSearch('');
                  setAddExerciseOpen(true);
                }}
                className="flex items-center gap-1 text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-full transition-colors"
              >
                <Plus className="w-3 h-3" /> Añadir
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-4xl">
        {/* Tarjeta del ejercicio actual */}
        <Card className="mb-4 border-primary">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-2xl">
                    {ejercicioActual.ejercicio?.nombre ?? ejercicioActual.ejercicioId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </CardTitle>
                  {ejercicioActual.ejercicio?.tecnica && (
                    <button
                      onClick={() => setShowTechModal(true)}
                      className="w-7 h-7 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center shrink-0 transition-colors"
                      title="Ver técnica"
                    >
                      <Info className="w-4 h-4 text-primary" />
                    </button>
                  )}
                </div>
                <CardDescription className="text-base">
                  {ejercicioActual.ejercicio?.grupoMuscular} • {ejercicioActual.ejercicio?.categoria}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={ejercicioActual.ejercicio?.tier === 'S' ? 'success' : 'default'} className="text-lg px-3 py-1">
                  Tier {ejercicioActual.ejercicio?.tier}
                </Badge>
                {(() => {
                  const hits = affectedInjuries.filter(l =>
                    INJURY_AFFECTS[l.zona].includes(ejercicioActual.ejercicio?.grupoMuscular as GrupoMuscular)
                  );
                  if (hits.length === 0) return null;
                  const worst = hits.find(l => l.severidad === 'grave') ?? hits.find(l => l.severidad === 'moderada') ?? hits[0];
                  return (
                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium ${
                      worst.severidad === 'grave'    ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' :
                      worst.severidad === 'moderada' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' :
                                                       'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300'
                    }`}>
                      <AlertTriangle className="w-3 h-3" />
                      {LESION_ZONA_LABELS[worst.zona]}
                    </div>
                  );
                })()}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSwapModal(true)}
                  className="text-xs h-7 px-2 text-orange-600 border-orange-300 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-700 dark:hover:bg-orange-950"
                >
                  <ArrowLeftRight className="w-3 h-3 mr-1" />
                  Máquina ocupada
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Machine photo card — shown for ALL exercises when gym is selected */}
            {gymSesion && (() => {
              const ej = selectedDay?.ejercicios[currentExerciseIndex];
              const key = `${ej?.ejercicioId ?? ''}-dismissed`;
              const dismissed = dismissedMachineKey === key;
              if (machinePhoto && !dismissed) {
                return (
                  <MachinePhotoCard
                    photo={machinePhoto}
                    todasFotos={machineTodasFotos}
                    ejercicioNombre={ej?.ejercicio?.nombre ?? ''}
                    gymNombre={gymSesion.gymNombre}
                    onVerDetalle={() => setMachinePhotoViewerOpen(true)}
                    onAñadirFoto={() => setMachinePhotoCaptureOpen(true)}
                    onDismiss={() => setDismissedMachineKey(key)}
                  />
                );
              }
              if (!dismissed) {
                return (
                  <button
                    className="w-full mb-4 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-muted-foreground/25 hover:border-primary/40 hover:bg-muted/10 transition-colors text-left group"
                    onClick={() => setMachinePhotoCaptureOpen(true)}
                  >
                    <Camera className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary/60 shrink-0" />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground">
                      Añadir foto de referencia
                    </span>
                    <button
                      className="ml-auto text-muted-foreground/40 hover:text-muted-foreground p-1"
                      onClick={e => { e.stopPropagation(); setDismissedMachineKey(key); }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </button>
                );
              }
              return null;
            })()}

            {/* Objetivo */}
            <div className="bg-accent/50 p-4 rounded-lg mb-4">
              <p className="text-sm font-medium mb-1">Objetivo:</p>
              <p className="text-2xl font-bold">
                {totalSeries} series × {repsObjetivo} reps
              </p>
            </div>

            {/* Peso sugerido — ajustado por lesión si aplica */}
            {pesoSugerido && (() => {
              const hits = affectedInjuries.filter(l =>
                INJURY_AFFECTS[l.zona].includes(ejercicioActual.ejercicio?.grupoMuscular as GrupoMuscular)
              );
              const worst = hits.find(l => l.severidad === 'grave') ?? hits.find(l => l.severidad === 'moderada') ?? hits[0];
              const factor = worst?.severidad === 'grave' ? 0.4 : worst?.severidad === 'moderada' ? 0.55 : worst ? 0.7 : 1;
              const adjusted = factor < 1 ? Math.round(pesoSugerido * factor * 4) / 4 : pesoSugerido;
              const isInjured = factor < 1;
              return (
                <div className={`p-3 rounded-lg mb-4 border ${
                  isInjured
                    ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
                    : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                }`}>
                  <p className={`text-sm font-medium ${isInjured ? 'text-orange-900 dark:text-orange-100' : 'text-blue-900 dark:text-blue-100'}`}>
                    💡 Peso sugerido: <span className="font-bold">{adjusted}kg</span>
                    {isInjured && <span className="ml-2 text-xs font-normal line-through opacity-50">{pesoSugerido}kg</span>}
                  </p>
                  {isInjured && (
                    <p className="text-xs mt-0.5 text-orange-700 dark:text-orange-300">
                      Reducido {Math.round((1 - factor) * 100)}% por lesión activa
                    </p>
                  )}
                </div>
              );
            })()}

            {/* 1RM estimado */}
            {estimated1RM !== null && (
              <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg mb-4 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  ⚡ 1RM estimado: <span className="font-bold text-lg">{estimated1RM} kg</span>
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-300">
                  Hipertrofia: ~{Math.round(estimated1RM * 0.75)}kg
                </p>
              </div>
            )}

            {/* Referencia última sesión */}
            {previousRef && (
              <div className="bg-muted/50 p-3 rounded-lg mb-4 border text-sm flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-xs text-muted-foreground">Última vez ({(() => {
                    const days = Math.round((Date.now() - previousRef.fecha.getTime()) / (24 * 60 * 60 * 1000));
                    return days === 0 ? 'hoy' : days === 1 ? 'ayer' : `hace ${days}d`;
                  })()})</p>
                  <p className="font-semibold">
                    {previousRef.peso}kg × {previousRef.reps} reps
                    <span className="text-xs text-muted-foreground ml-1">RIR {previousRef.rir}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {previousRef.best1RM > 0 && (
                    <Badge variant="outline" className="text-xs">
                      ⚡ Mejor 1RM: {previousRef.best1RM}kg
                    </Badge>
                  )}
                  {peso && parseFloat(peso) > previousRef.pesoMaxHistorico && previousRef.pesoMaxHistorico > 0 && (
                    <Badge variant="success" className="text-xs animate-pulse">
                      🏆 ¡Nuevo PR!
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Consejo clave */}
            {ejercicioActual.notas && (
              <div className="bg-primary/10 p-4 rounded-lg mb-4 flex gap-3">
                <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm mb-1">Consejo Clave:</p>
                  <p className="text-sm">{ejercicioActual.notas}</p>
                </div>
              </div>
            )}

            {/* Formulario de serie */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">
                  Serie {currentSetNumber} de {totalSeries}
                </h3>
                <Badge variant="outline">
                  {seriesCompletadas} completadas
                </Badge>
              </div>

              {(() => {
                const setType = detectSetType(ejercicioActual.ejercicio);
                const unilateral = isUnilateral(ejercicioActual.ejercicio);
                if (setType === 'TIME') {
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="tiempo" className="text-xs">Duración (segundos)</Label>
                        <Input
                          id="tiempo"
                          type="number"
                          inputMode="numeric"
                          value={tiempoSegundos}
                          onChange={(e) => setTiempoSegundos(e.target.value)}
                          placeholder="60"
                          className="text-lg font-semibold text-center h-14"
                          min="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rir" className="text-xs">RIR</Label>
                        <Select value={rir.toString()} onValueChange={(v) => setRir(parseInt(v))}>
                          <SelectTrigger id="rir" className="h-14">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">RIR 0 (fallo)</SelectItem>
                            <SelectItem value="1">RIR 1</SelectItem>
                            <SelectItem value="2">RIR 2</SelectItem>
                            <SelectItem value="3">RIR 3</SelectItem>
                            <SelectItem value="4">RIR 4+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                }
                if (setType === 'BODYWEIGHT') {
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="reps" className="text-xs">Repeticiones</Label>
                        <Input
                          id="reps"
                          type="number"
                          inputMode="numeric"
                          value={reps}
                          onChange={(e) => setReps(e.target.value)}
                          placeholder={repsObjetivo.toString()}
                          className="text-lg font-semibold text-center h-14"
                          min="1"
                          max="50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rir" className="text-xs">RIR</Label>
                        <Select value={rir.toString()} onValueChange={(v) => setRir(parseInt(v))}>
                          <SelectTrigger id="rir" className="h-14">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">RIR 0 (fallo)</SelectItem>
                            <SelectItem value="1">RIR 1</SelectItem>
                            <SelectItem value="2">RIR 2</SelectItem>
                            <SelectItem value="3">RIR 3</SelectItem>
                            <SelectItem value="4">RIR 4+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                }
                // UNILATERAL: Izq | Der | Peso | RIR
                if (unilateral) {
                  return (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="reps-izq" className="text-xs text-blue-400">Reps Izquierda</Label>
                          <Input
                            id="reps-izq"
                            type="number"
                            inputMode="numeric"
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                            placeholder={repsObjetivo.toString()}
                            className="text-lg font-semibold text-center h-14 border-blue-400/40"
                            min="1" max="50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="reps-der" className="text-xs text-orange-400">Reps Derecha</Label>
                          <Input
                            id="reps-der"
                            type="number"
                            inputMode="numeric"
                            value={repsDer}
                            onChange={(e) => setRepsDer(e.target.value)}
                            placeholder={repsObjetivo.toString()}
                            className="text-lg font-semibold text-center h-14 border-orange-400/40"
                            min="1" max="50"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="peso" className="text-xs">Peso (kg)</Label>
                          <Input
                            id="peso"
                            type="number"
                            step="0.25"
                            inputMode="decimal"
                            value={peso}
                            onChange={(e) => setPeso(e.target.value)}
                            placeholder={pesoSugerido?.toString() || "0"}
                            className="text-lg font-semibold text-center h-14"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="rir" className="text-xs">RIR</Label>
                          <Select value={rir.toString()} onValueChange={(v) => setRir(parseInt(v))}>
                            <SelectTrigger id="rir" className="h-14">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">RIR 0 (fallo)</SelectItem>
                              <SelectItem value="1">RIR 1</SelectItem>
                              <SelectItem value="2">RIR 2</SelectItem>
                              <SelectItem value="3">RIR 3</SelectItem>
                              <SelectItem value="4">RIR 4+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                }
                // WEIGHT: comportamiento por defecto (3 columnas)
                return (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="reps" className="text-xs">Repeticiones</Label>
                      <Input
                        id="reps"
                        type="number"
                        inputMode="numeric"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        placeholder={repsObjetivo.toString()}
                        className="text-lg font-semibold text-center h-14"
                        min="1"
                        max="50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="peso" className="text-xs">Peso (kg)</Label>
                      <Input
                        id="peso"
                        type="number"
                        step="0.25"
                        inputMode="decimal"
                        value={peso}
                        onChange={(e) => setPeso(e.target.value)}
                        placeholder={pesoSugerido?.toString() || "0"}
                        className="text-lg font-semibold text-center h-14"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rir" className="text-xs">RIR</Label>
                      <Select value={rir.toString()} onValueChange={(v) => setRir(parseInt(v))}>
                        <SelectTrigger id="rir" className="h-14">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">RIR 0 (fallo)</SelectItem>
                          <SelectItem value="1">RIR 1</SelectItem>
                          <SelectItem value="2">RIR 2</SelectItem>
                          <SelectItem value="3">RIR 3</SelectItem>
                          <SelectItem value="4">RIR 4+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })()}

              <Button
                onClick={handleRegistrarSerie}
                size="lg"
                className="w-full h-14 text-lg"
                disabled={(() => {
                  const t = detectSetType(ejercicioActual.ejercicio);
                  if (t === 'TIME') return !tiempoSegundos || parseInt(tiempoSegundos) <= 0;
                  if (t === 'BODYWEIGHT') return !reps;
                  if (isUnilateral(ejercicioActual.ejercicio)) return !reps || !repsDer || !peso;
                  return !reps || !peso;
                })()}
              >
                <Check className="w-5 h-5 mr-2" />
                Completar Serie {currentSetNumber}
              </Button>
            </div>

            {/* Series completadas */}
            {ejercicioLog && ejercicioLog.series.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-2 text-sm text-muted-foreground">Series Completadas:</h4>
                <div className="space-y-2">
                  {ejercicioLog.series.map((serie) => (
                    <div
                      key={serie.numero}
                      className="flex items-center justify-between gap-2 p-3 rounded-lg bg-accent/30 border"
                    >
                      <span className="font-medium shrink-0">Serie {serie.numero}</span>
                      <div className="text-sm flex-1 text-right">
                        {serie.tipo === 'TIME' ? (
                          <span className="font-semibold">{serie.tiempoSegundos}s</span>
                        ) : serie.tipo === 'BODYWEIGHT' ? (
                          <span className="font-semibold">{serie.repeticiones} reps (PC)</span>
                        ) : serie.repsDerecha !== undefined ? (
                          <>
                            <span className="text-blue-400 font-semibold">{serie.repeticiones}</span>
                            <span className="text-muted-foreground mx-0.5">/</span>
                            <span className="text-orange-400 font-semibold">{serie.repsDerecha}</span>
                            <span className="text-muted-foreground text-xs ml-1">reps</span>
                            {' × '}
                            <span className="font-semibold">{serie.peso}kg</span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold">{serie.repeticiones} reps</span>
                            {' × '}
                            <span className="font-semibold">{serie.peso}kg</span>
                          </>
                        )}
                        {' • '}
                        <span className="text-muted-foreground">RIR {serie.RIR}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditingSerie(serie)}
                          title="Editar serie"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setConfirmDeleteSerie(serie)}
                          title="Borrar serie"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notas del ejercicio */}
            <div className="mt-6">
              <details className="group">
                <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none flex items-center gap-1">
                  <span className="group-open:hidden">+ Añadir notas</span>
                  <span className="hidden group-open:inline">− Notas del ejercicio</span>
                  {ejercicioLog?.notas && <span className="text-primary">●</span>}
                </summary>
                <textarea
                  className="mt-2 w-full text-sm p-2 rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                  placeholder="Sensaciones, ajustes técnicos, etc."
                  value={ejercicioLog?.notas ?? ''}
                  onChange={(e) => {
                    const notasValue = e.target.value;
                    setEjercicioLogs(prev => {
                      const next = new Map(prev);
                      const existing = next.get(currentSlotKey) ?? {
                        ejercicioId: ejercicioActual.ejercicioId,
                        ejercicio: ejercicioActual.ejercicio,
                        series: [],
                        tecnicaCorrecta: true,
                        sensacionMuscular: 3 as const,
                      };
                      next.set(currentSlotKey, { ...existing, notas: notasValue });
                      return next;
                    });
                  }}
                />
              </details>
            </div>
          </CardContent>
        </Card>

        {/* Navegación */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleAnteriorEjercicio}
            disabled={currentExerciseIndex === 0}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          {currentExerciseIndex === ejerciciosDelDia.length - 1 ? (
            <Button
              onClick={handleFinalizarEntrenamiento}
              className="flex-1"
              size="lg"
            >
              <Save className="w-4 h-4 mr-2" />
              Finalizar
            </Button>
          ) : (
            <Button
              onClick={handleSiguienteEjercicio}
              className="flex-1"
            >
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Rehabilitación */}
      {affectedInjuries.length > 0 && (
        <div className="mt-4">
          <button
            className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400 w-full justify-center py-2 border border-orange-200 dark:border-orange-800 rounded-xl bg-orange-50/50 dark:bg-orange-950/20"
            onClick={() => setShowRehabSection(!showRehabSection)}
          >
            <Heart className="w-4 h-4" />
            Plan de Rehabilitación
            {showRehabSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showRehabSection && (
            <div className="space-y-3 mt-3">
              {affectedInjuries.map(lesion => (
                <div key={lesion.id}>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    {LESION_ZONA_LABELS[lesion.zona]}
                  </p>
                  {REHAB_EXERCISES[lesion.zona].map((ex, idx) => (
                    <Card key={idx} className="mb-2 border-orange-200 dark:border-orange-800">
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm">{ex.nombre}</p>
                          <span className="text-xs text-muted-foreground font-medium">{ex.series}×{ex.reps}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{ex.musculo}</p>
                        <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-2.5">
                          <p className="text-xs leading-relaxed">{ex.notas}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cardio post-entreno */}
      {currentUser && (() => {
        const somatotipo = currentUser.somatotipo ?? 'mesomorfo';
        const rec = CARDIO_RECOMENDACIONES[somatotipo];
        if (rec.momento !== 'despues') return null;
        return (
          <div className="mt-4">
            <CardioPanel
              userId={currentUser.id}
              workoutId={activeWorkout?.id}
              somatotipo={somatotipo}
              momento="despues"
            />
          </div>
        );
      })()}

      {/* Modal técnica del ejercicio */}
      {showTechModal && ejercicioActual.ejercicio?.tecnica && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-t-2xl max-h-[85vh] flex flex-col shadow-xl">
            {/* Handle + header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b shrink-0">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Técnica</p>
                <h2 className="font-bold text-lg leading-tight">{ejercicioActual.ejercicio.nombre}</h2>
              </div>
              <button
                onClick={() => setShowTechModal(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
              {/* Video de YouTube si está disponible */}
              {(() => {
                const video = getVideoForExercise(ejercicioActual.ejercicioId, ejercicioActual.ejercicio);
                if (!video?.youtubeId) return null;
                return (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                      🎥 {video.title}
                    </p>
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0`}
                        title={video.title}
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Posición inicial */}
              {ejercicioActual.ejercicio.tecnica.posicionInicial && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    Posición inicial
                  </p>
                  <p className="text-sm leading-relaxed">{ejercicioActual.ejercicio.tecnica.posicionInicial}</p>
                </div>
              )}

              {/* Ejecución paso a paso */}
              {ejercicioActual.ejercicio.tecnica.ejecucion?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    Ejecución
                  </p>
                  <ol className="space-y-2">
                    {ejercicioActual.ejercicio.tecnica.ejecucion.map((paso, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{paso}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Errores comunes */}
              {ejercicioActual.ejercicio.tecnica.erroresComunes?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    Errores comunes
                  </p>
                  <ul className="space-y-1.5">
                    {ejercicioActual.ejercicio.tecnica.erroresComunes.map((err, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed text-muted-foreground">{err}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Consejos clave */}
              {ejercicioActual.ejercicio.tecnica.consejosClave?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    Consejos clave
                  </p>
                  <ul className="space-y-1.5">
                    {ejercicioActual.ejercicio.tecnica.consejosClave.map((tip, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Músculos enfocados */}
              {ejercicioActual.ejercicio.enfoqueMuscular?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    Músculos trabajados
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ejercicioActual.ejercicio.enfoqueMuscular.map(m => (
                      <span key={m} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ask AI section */}
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" /> Preguntar a la IA
              </p>
              {aiAnswer && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm leading-relaxed whitespace-pre-wrap">
                  {aiAnswer}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={aiQuestion}
                  onChange={e => setAiQuestion(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && aiQuestion.trim() && !aiLoading) {
                      e.preventDefault();
                      handleAskAI();
                    }
                  }}
                  placeholder={`Pregunta sobre ${ejercicioActual.ejercicio?.nombre ?? 'este ejercicio'}…`}
                  className="flex-1 h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={handleAskAI}
                  disabled={!aiQuestion.trim() || aiLoading}
                  className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0"
                >
                  {aiLoading
                    ? <span className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                    : <Send className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
          </div>

          <div className="px-5 pb-5 pt-3 border-t shrink-0">
            <button
              onClick={() => { setShowTechModal(false); setAiQuestion(''); setAiAnswer(''); }}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
            >
              Entendido, a entrenar
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Timer de descanso */}
      {showTimer && (
        <RestTimer
          duration={ejercicioActual.ejercicio?.descansoSugerido || 90}
          onComplete={() => setShowTimer(false)}
          onClose={() => setShowTimer(false)}
        />
      )}

      {/* Modal de logros */}
      {earnedAchievements.length > 0 && (
        <AchievementUnlocked
          achievements={earnedAchievements}
          onClose={() => {
            setEarnedAchievements([]);
            navigate('/workout/summary', { state: { workout: activeWorkout } });
          }}
        />
      )}

      {/* Modal de swap */}
      <SwapExerciseModal
        open={showSwapModal}
        onClose={() => setShowSwapModal(false)}
        ejercicioActual={ejercicioActual}
        onSwap={handleSwap}
      />

      {/* Editar serie */}
      <EditSerieDialog
        open={editingSerie !== null}
        onOpenChange={(open) => { if (!open) setEditingSerie(null); }}
        serie={editingSerie}
        onSave={handleEditSerie}
      />

      {/* Confirmar borrado de serie */}
      <ConfirmDialog
        open={confirmDeleteSerie !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteSerie(null); }}
        title={`¿Borrar Serie ${confirmDeleteSerie?.numero ?? ''}?`}
        description={confirmDeleteSerie ? (
          confirmDeleteSerie.tipo === 'TIME'
            ? <>Vas a borrar la serie de <strong>{confirmDeleteSerie.tiempoSegundos}s</strong>. Las restantes se renumeran automáticamente.</>
            : <>Vas a borrar la serie de <strong>{confirmDeleteSerie.repeticiones} reps × {confirmDeleteSerie.peso}kg</strong>. Las restantes se renumeran automáticamente.</>
        ) : null}
        confirmLabel="Borrar"
        onConfirm={performDeleteSerie}
      />
      {/* Machine photo modals */}
      {gymSesion && selectedDay && currentUser && (() => {
        const ej = selectedDay.ejercicios[currentExerciseIndex];
        const refreshPhotos = async () => {
          const active = await dbHelpers.getActiveMachinePhoto(currentUser.id, ej?.ejercicioId ?? '', gymSesion.gymId);
          const todas = await dbHelpers.getMachinePhotos(currentUser.id, ej?.ejercicioId ?? '', gymSesion.gymId);
          setMachinePhoto(active ?? null);
          setMachineTodasFotos(todas);
        };
        return (
          <>
            <MachinePhotoCapture
              open={machinePhotoCaptureOpen}
              ejercicioId={ej?.ejercicioId ?? ''}
              ejercicioNombre={ej?.ejercicio?.nombre ?? ''}
              gymId={gymSesion.gymId}
              gymNombre={gymSesion.gymNombre}
              onGuardar={async (data) => {
                const photo: MachinePhoto = {
                  id: `mp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                  userId: currentUser.id,
                  ejercicioId: ej?.ejercicioId ?? '',
                  ejercicioNombre: ej?.ejercicio?.nombre ?? '',
                  gymId: gymSesion.gymId,
                  gymNombre: gymSesion.gymNombre,
                  url: data.url,
                  tipo: data.tipo,
                  ajustes: data.ajustes,
                  notas: data.notas || undefined,
                  fecha: new Date(),
                  esActiva: true,
                  syncStatus: 'pending_create',
                  lastUpdated: Date.now(),
                };
                await dbHelpers.addMachinePhoto(photo);
                await refreshPhotos();
              }}
              onClose={() => setMachinePhotoCaptureOpen(false)}
            />
            <MachinePhotoViewer
              open={machinePhotoViewerOpen}
              fotos={machineTodasFotos}
              ejercicioNombre={ej?.ejercicio?.nombre ?? ''}
              gymNombre={gymSesion.gymNombre}
              onEditar={() => {}}
              onEliminar={async (id) => {
                await dbHelpers.deleteMachinePhoto(id);
                await refreshPhotos();
              }}
              onAñadirFoto={() => { setMachinePhotoViewerOpen(false); setMachinePhotoCaptureOpen(true); }}
              onClose={() => setMachinePhotoViewerOpen(false)}
            />
          </>
        );
      })()}

      {/* Gym selector */}
      <GymSelector
        open={gymSelectorOpen}
        required={!gymSesion}
        onSelect={(gymId, gymNombre) => {
          setGymSesion({ gymId, gymNombre });
          setGymSelectorOpen(false);
          // If coming from start button, proceed to wellness
          if (!hasStarted && selectedDay) setShowWellnessCheck(true);
        }}
        onClose={() => setGymSelectorOpen(false)}
      />

      {/* Add exercise picker */}
      {addExerciseOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-t-2xl max-h-[80vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b shrink-0">
              <h2 className="font-bold text-base">Añadir ejercicio</h2>
              <button onClick={() => setAddExerciseOpen(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 pt-3 pb-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={addExerciseSearch}
                  onChange={e => setAddExerciseSearch(e.target.value)}
                  placeholder="Buscar ejercicio…"
                  className="w-full h-10 pl-9 pr-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
              {allExercises
                .filter(e => {
                  const q = addExerciseSearch.toLowerCase();
                  return !q || e.nombre.toLowerCase().includes(q) || e.grupoMuscular?.toLowerCase().includes(q);
                })
                .slice(0, 40)
                .map(e => (
                  <button
                    key={e.id}
                    onClick={() => handleAddExercicio(e)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border hover:border-primary/50 hover:bg-primary/5 text-left transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{e.nombre}</p>
                      <p className="text-xs text-muted-foreground">{e.grupoMuscular} · {e.categoria}</p>
                    </div>
                    <Plus className="w-4 h-4 text-primary shrink-0" />
                  </button>
                ))}
              {allExercises.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Cargando ejercicios…</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
