import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store';
import { dbHelpers } from '@/db';
import { generarRutinaPersonalizada, obtenerResumenRutina, SPLITS_CONFIG } from '@/utils/routineGenerator';
import type { RutinaSemanal, ExerciseKnowledge, DiaRutina, EjercicioEnRutina } from '@/types';
import type { FullWRoutine } from '@/data/fullwRoutines';
import { Dumbbell, Target, Calendar, Clock, Sparkles, ArrowRight, Check, Brain, AlertCircle, GripVertical, Play, Repeat, Trophy } from 'lucide-react';
import ShareRoutineButton from '@/components/ShareRoutineButton';
import FullWRoutineView from '@/components/training/FullWRoutineView';
import CbumRoutineView from '@/components/training/CbumRoutineView';
import { fullWToRutinaSemanal } from '@/utils/fullwConverter';
import { generarRutinaFullWconIA } from '@/services/groq';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getVideoForExercise } from '@/utils/exerciseUtils';
import SwapExerciseModal from '@/components/SwapExerciseModal';
import RoutineStats from '@/components/RoutineStats';

type ModoEntrenamiento = 'basico' | 'fullw' | 'cbum' | 'ia_adaptativa';

function SortableExerciseRow({
  ej, index, dayId, doneCount, onSwap,
}: {
  ej: EjercicioEnRutina;
  index: number;
  dayId: string;
  doneCount?: number;
  onSwap: (nuevo: EjercicioEnRutina) => void;
}) {
  const id = `${dayId}::${ej.ejercicioId}::${index}`;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 5 : 'auto' as const,
  };

  const [showSwap, setShowSwap] = useState(false);
  const video = getVideoForExercise(ej.ejercicioId, ej.ejercicio);

  const equipamiento = ej.ejercicio?.equipamiento ?? [];
  const equipoVisibles = equipamiento.slice(0, 2);
  const equipoExtra = Math.max(0, equipamiento.length - 2);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 rounded-lg border bg-accent/30 flex items-start gap-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="touch-none p-1 mt-0.5 rounded hover:bg-accent cursor-grab active:cursor-grabbing shrink-0"
        aria-label="Arrastrar para reordenar este ejercicio"
      >
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{index + 1}. {ej.ejercicio?.nombre}</span>
          <Badge variant={
            ej.ejercicio?.tier === 'S' ? 'success' :
              ej.ejercicio?.tier === 'A' ? 'default' :
                'secondary'
          } className="text-xs">
            {ej.ejercicio?.tier}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {ej.seriesObjetivo} series × {Array.isArray(ej.repsObjetivo)
            ? `${ej.repsObjetivo[0]}-${ej.repsObjetivo[1]}`
            : ej.repsObjetivo} reps
        </p>
        {/* Badges enriquecidos */}
        <div className="flex flex-wrap items-center gap-1 mt-2">
          {ej.ejercicio?.grupoMuscular && (
            <Badge variant="outline" className="text-[10px] capitalize">
              {ej.ejercicio.grupoMuscular.replace('_', ' ')}
            </Badge>
          )}
          {ej.ejercicio?.categoria && (
            <Badge variant="outline" className="text-[10px] capitalize">
              {ej.ejercicio.categoria === 'compuesto' ? 'Compuesto' : 'Aislamiento'}
            </Badge>
          )}
          {equipoVisibles.map(e => (
            <Badge key={e} variant="outline" className="text-[10px] capitalize">
              {e.replace('_', ' ')}
            </Badge>
          ))}
          {equipoExtra > 0 && (
            <Badge variant="outline" className="text-[10px]">+{equipoExtra}</Badge>
          )}
          {doneCount != null && doneCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {doneCount}× hecho
            </Badge>
          )}
        </div>
      </div>
      {/* Acciones rápidas */}
      <div className="flex flex-col gap-1 shrink-0">
        {video?.youtubeId && (
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 rounded-md bg-background border flex items-center justify-center hover:bg-accent transition-colors"
            title={`Ver video: ${video.title}`}
          >
            <Play className="w-3 h-3" />
          </a>
        )}
        <button
          type="button"
          onClick={() => setShowSwap(true)}
          className="w-7 h-7 rounded-md bg-background border flex items-center justify-center hover:bg-accent transition-colors"
          title="Intercambiar ejercicio"
        >
          <Repeat className="w-3 h-3" />
        </button>
      </div>

      <SwapExerciseModal
        open={showSwap}
        onClose={() => setShowSwap(false)}
        ejercicioActual={ej}
        onSwap={(nuevo) => { onSwap(nuevo); setShowSwap(false); }}
      />
    </div>
  );
}

function SortableDayCard({
  dia, index, onReorderEjercicios, onSwapEjercicio, doneCounts,
}: {
  dia: DiaRutina;
  index: number;
  onReorderEjercicios: (dayId: string, oldIdx: number, newIdx: number) => void;
  onSwapEjercicio: (dayId: string, idx: number, nuevo: EjercicioEnRutina) => void;
  doneCounts: Record<string, number>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dia.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto' as const,
  };

  // Sensores aislados para el drag de ejercicios dentro del día
  const innerSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleInnerDrag = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const items = dia.ejercicios.map((ej, i) => `${dia.id}::${ej.ejercicioId}::${i}`);
    const oldIdx = items.indexOf(String(active.id));
    const newIdx = items.indexOf(String(over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    onReorderEjercicios(dia.id, oldIdx, newIdx);
  };

  const exerciseIds = dia.ejercicios.map((ej, i) => `${dia.id}::${ej.ejercicioId}::${i}`);

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                {...attributes}
                {...listeners}
                className="touch-none p-1.5 -ml-1 rounded hover:bg-accent cursor-grab active:cursor-grabbing shrink-0"
                aria-label="Arrastrar para reordenar el día"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="min-w-0">
                <CardTitle className="text-lg truncate">Día {index + 1}: {dia.nombre}</CardTitle>
                <CardDescription>
                  {dia.ejercicios.length} ejercicios • ~{dia.duracionEstimada} min
                </CardDescription>
              </div>
            </div>
            <Badge variant={dia.ejercicios.length > 0 ? 'default' : 'secondary'} className="shrink-0">
              {dia.ejercicios.length > 0 ? 'Activo' : 'Descanso'}
            </Badge>
          </div>
        </CardHeader>
        {dia.ejercicios.length > 0 && (
          <CardContent>
            <DndContext sensors={innerSensors} collisionDetection={closestCenter} onDragEnd={handleInnerDrag}>
              <SortableContext items={exerciseIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {dia.ejercicios.map((ej, idx) => (
                    <SortableExerciseRow
                      key={`${dia.id}::${ej.ejercicioId}::${idx}`}
                      ej={ej}
                      index={idx}
                      dayId={dia.id}
                      doneCount={doneCounts[ej.ejercicioId]}
                      onSwap={(nuevo) => onSwapEjercicio(dia.id, idx, nuevo)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function RoutineGenerator() {
  const navigate = useNavigate();
  const { currentUser, setActiveRoutine } = useAppStore();

  const [modo, setModo] = useState<ModoEntrenamiento>('basico');
  const [exercises, setExercises] = useState<ExerciseKnowledge[]>([]);
  const [generatedRoutine, setGeneratedRoutine] = useState<RutinaSemanal | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [iaError, setIaError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleReorderDias = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !generatedRoutine) return;
    const oldIdx = generatedRoutine.dias.findIndex(d => d.id === active.id);
    const newIdx = generatedRoutine.dias.findIndex(d => d.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = arrayMove(generatedRoutine.dias, oldIdx, newIdx).map((d, i) => ({
      ...d,
      orden: i + 1,
    }));
    setGeneratedRoutine({ ...generatedRoutine, dias: reordered });
  };

  const handleReorderEjercicios = (dayId: string, oldIdx: number, newIdx: number) => {
    if (!generatedRoutine) return;
    const reorderedDias = generatedRoutine.dias.map(d => {
      if (d.id !== dayId) return d;
      return { ...d, ejercicios: arrayMove(d.ejercicios, oldIdx, newIdx) };
    });
    setGeneratedRoutine({ ...generatedRoutine, dias: reorderedDias });
  };

  const handleSwapEjercicio = (dayId: string, idx: number, nuevo: EjercicioEnRutina) => {
    if (!generatedRoutine) return;
    const updatedDias = generatedRoutine.dias.map(d => {
      if (d.id !== dayId) return d;
      const nuevosEj = [...d.ejercicios];
      nuevosEj[idx] = nuevo;
      return { ...d, ejercicios: nuevosEj };
    });
    setGeneratedRoutine({ ...generatedRoutine, dias: updatedDias });
  };

  // Conteo de cuántas veces el usuario ha hecho cada ejercicio (para el badge)
  const [doneCounts, setDoneCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!currentUser) return;
    dbHelpers.getWorkoutsByUser(currentUser.id, 100)
      .then(workouts => {
        const counts: Record<string, number> = {};
        for (const w of workouts) {
          for (const ej of w.ejercicios ?? []) {
            counts[ej.ejercicioId] = (counts[ej.ejercicioId] ?? 0) + 1;
          }
        }
        setDoneCounts(counts);
      })
      .catch(() => {});
  }, [currentUser]);

  // Configuración personalizable
  const [diasDisponibles, setDiasDisponibles] = useState(currentUser?.diasDisponibles || 4);
  const [objetivo, setObjetivo] = useState(currentUser?.objetivo || 'hipertrofia');

  const loadExercises = async () => {
    const allExercises = await dbHelpers.getAllExercises();
    setExercises(allExercises);

  };

  useEffect(() => {
    loadExercises();
  }, []);

  const handleGenerate = async () => {
    if (!currentUser) return;

    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 600));

    const updatedUser = {
      ...currentUser,
      diasDisponibles,
      objetivo: objetivo as typeof currentUser.objetivo
    };

    const rutina = generarRutinaPersonalizada(updatedUser, exercises);
    setGeneratedRoutine(rutina);
    setIsGenerating(false);
  };

  const handleSaveRoutine = async () => {
    if (!generatedRoutine || !currentUser) return;

    try {
      await dbHelpers.createRoutine(generatedRoutine);
      setActiveRoutine(generatedRoutine);
      navigate('/');
    } catch (error) {
      console.error('Error guardando rutina:', error);
    }
  };

  // Convierte la plantilla Full W a RutinaSemanal y la manda a la vista de previsualización
  const handleUseFullW = (fullwRutina: FullWRoutine) => {
    if (!currentUser) return;
    const rutinaSemanal = fullWToRutinaSemanal(fullwRutina, currentUser.id);
    setGeneratedRoutine(rutinaSemanal);
  };

  const handleGenerateIA = async () => {
    if (!currentUser) return;
    setIsGenerating(true);
    setIaError(null);
    try {
      const workouts = await dbHelpers.getWorkoutsByUser(currentUser.id, 8);
      const historial = workouts
        .filter(w => w.completado)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 6)
        .map(w => ({
          fecha: new Date(w.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
          musculos: [...new Set((w.ejercicios ?? []).map(e => e.ejercicio?.grupoMuscular).filter(Boolean) as string[])],
          ejercicios: (w.ejercicios ?? []).map(e => e.ejercicio?.nombre).filter(Boolean) as string[],
        }));

      const fullwRutina = await generarRutinaFullWconIA(
        {
          nivel: currentUser.nivel,
          somatotipo: currentUser.somatotipo ?? 'mesomorfo',
          objetivo: currentUser.objetivo,
          equipamiento: currentUser.equipamiento as string[],
          lesiones: currentUser.lesiones,
          diasDisponibles,
          evaluacionFisica: currentUser.evaluacionFisica,
        },
        historial,
      );

      const rutinaSemanal = fullWToRutinaSemanal(fullwRutina, currentUser.id);
      setGeneratedRoutine(rutinaSemanal);
    } catch (err) {
      setIaError(err instanceof Error ? err.message : 'Error generando la rutina. Inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Perfil No Encontrado</CardTitle>
            <CardDescription>
              Necesitas configurar tu perfil primero
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/profile')}>
              Ir a Perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const splitPreview = SPLITS_CONFIG[diasDisponibles as keyof typeof SPLITS_CONFIG];
  const resumen = generatedRoutine ? obtenerResumenRutina(generatedRoutine) : null;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">

      {/* ── Selector de modo ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 p-1 bg-muted rounded-xl">
        <button
          onClick={() => setModo('basico')}
          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            modo === 'basico'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-1.5" />
          Básico IA
        </button>
        <button
          onClick={() => setModo('fullw')}
          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            modo === 'fullw'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Dumbbell className="w-4 h-4 inline mr-1.5" />
          Full W
        </button>
        <button
          onClick={() => setModo('cbum')}
          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            modo === 'cbum'
              ? 'bg-background shadow text-amber-600 dark:text-amber-400'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Trophy className="w-4 h-4 inline mr-1.5" />
          CBum
        </button>
        <button
          onClick={() => setModo('ia_adaptativa')}
          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            modo === 'ia_adaptativa'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Brain className="w-4 h-4 inline mr-1.5" />
          IA Adaptativa
        </button>
      </div>

      {/* ── Modo Full W: selector de plantilla ── */}
      {modo === 'fullw' && !generatedRoutine && <FullWRoutineView onUseRoutine={handleUseFullW} />}

      {/* ── Modo CBum: rutina de Chris Bumstead ── */}
      {modo === 'cbum' && !generatedRoutine && <CbumRoutineView onUseRoutine={handleUseFullW} />}

      {/* ── Modo IA Adaptativa ── */}
      {modo === 'ia_adaptativa' && !generatedRoutine && (
        <>
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
              <Brain className="w-8 h-8 text-primary" />
              Full W con IA Adaptativa
            </h1>
            <p className="text-muted-foreground">
              Llama 3.3 analiza tu historial real y diseña la rutina Full W óptima para ti
            </p>
          </div>

          {/* Perfil */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">Tu perfil</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div>Nivel: <span className="font-medium">{currentUser.nivel}</span></div>
              <div>Somatotipo: <span className="font-medium">{currentUser.somatotipo ?? 'mesomorfo'}</span></div>
              <div>Objetivo: <span className="font-medium">{currentUser.objetivo}</span></div>
              <div>
                Equipamiento:{' '}
                <span className="font-medium">
                  {Array.isArray(currentUser.equipamiento) ? currentUser.equipamiento.join(', ') : 'completo'}
                </span>
              </div>
              {currentUser.lesiones && currentUser.lesiones.length > 0 && (
                <div className="col-span-2 text-destructive">
                  Lesiones: {currentUser.lesiones.join(', ')}
                </div>
              )}
              {currentUser.evaluacionFisica && (
                <div className="col-span-2 mt-1 pt-2 border-t space-y-1">
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Brain className="w-3 h-3" /> Evaluación física activa
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Estrategia: <span className="font-medium capitalize">{currentUser.evaluacionFisica.estrategia}</span>
                    {' · '}Prioritarios: <span className="font-medium">{currentUser.evaluacionFisica.prioridades.join(', ')}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    La IA adaptará el volumen y ejercicios a tus áreas de mejora específicas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Días */}
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="dias-ia" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Días por semana
                </Label>
                <Select
                  value={diasDisponibles.toString()}
                  onValueChange={(value) => setDiasDisponibles(parseInt(value))}
                >
                  <SelectTrigger id="dias-ia">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 días — Push / Pull / Legs</SelectItem>
                    <SelectItem value="4">4 días — Upper / Lower</SelectItem>
                    <SelectItem value="5">5 días — PPL + Upper/Lower</SelectItem>
                    <SelectItem value="6">6 días — PPL × 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          {iaError && (
            <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10 mb-4 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {iaError}
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={handleGenerateIA}
            size="lg"
            className="w-full"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Brain className="w-4 h-4 mr-2 animate-pulse" />
                Llama 3.3 está diseñando tu rutina...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Generar con Llama 3.3
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-3">
            La IA recibe tu historial de entrenamientos real para optimizar la selección de ejercicios
          </p>
        </>
      )}

      {/* ── Modo Básico IA: formulario ── */}
      {modo === 'basico' && !generatedRoutine && (
        // Formulario de generación
        <>
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              Generador de Rutinas
            </h1>
            <p className="text-muted-foreground">
              Crea una rutina personalizada basada en ciencia y experiencia
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Configuración de tu Rutina</CardTitle>
              <CardDescription>
                Ajusta estos parámetros para generar tu rutina ideal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Días disponibles */}
              <div className="space-y-2">
                <Label htmlFor="dias" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Días por semana
                </Label>
                <Select
                  value={diasDisponibles.toString()}
                  onValueChange={(value) => setDiasDisponibles(parseInt(value))}
                >
                  <SelectTrigger id="dias">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 días (Empuje/Tirón/Pierna)</SelectItem>
                    <SelectItem value="4">4 días (Upper/Lower)</SelectItem>
                    <SelectItem value="5">5 días (Bro Split)</SelectItem>
                    <SelectItem value="6">6 días (Push/Pull/Legs 2x)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Objetivo */}
              <div className="space-y-2">
                <Label htmlFor="objetivo" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Objetivo principal
                </Label>
                <Select value={objetivo} onValueChange={(val) => setObjetivo(val as typeof objetivo)}>
                  <SelectTrigger id="objetivo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fuerza">Fuerza (4-6 reps, descansos largos)</SelectItem>
                    <SelectItem value="hipertrofia">Hipertrofia (8-12 reps)</SelectItem>
                    <SelectItem value="resistencia">Resistencia (12-15 reps)</SelectItem>
                    <SelectItem value="perdida_grasa">Pérdida de Grasa (10-15 reps, descansos cortos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preview del split */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4" />
                  Vista previa del split
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {splitPreview.map((dia, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border bg-accent/50 text-sm"
                    >
                      <span className="font-medium">Día {idx + 1}:</span> {dia.nombre}
                      {dia.grupos.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {dia.grupos.map(g => (
                            <Badge key={g} variant="outline" className="text-xs">
                              {g}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Información del perfil */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Tu perfil:</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>Nivel: <span className="text-foreground font-medium">{currentUser.nivel}</span></div>
                  <div>Tiempo/sesión: <span className="text-foreground font-medium">{currentUser.tiempoSesion || 60} min</span></div>
                  <div className="col-span-2">
                    Equipamiento: <span className="text-foreground font-medium">{Array.isArray(currentUser.equipamiento) ? currentUser.equipamiento.join(', ') : 'No especificado'}</span>
                  </div>
                  {currentUser.lesiones && currentUser.lesiones.length > 0 && (
                    <div className="col-span-2 text-destructive">
                      Lesiones: {currentUser.lesiones.join(', ')}
                    </div>
                  )}
                </div>
                {currentUser.evaluacionFisica && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mb-1">
                      <Brain className="w-3 h-3" /> Evaluación física — activa
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Estrategia <span className="font-medium capitalize">{currentUser.evaluacionFisica.estrategia}</span>
                      {' · '}Volumen extra en: <span className="font-medium">{currentUser.evaluacionFisica.prioridades.join(', ')}</span>
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleGenerate}
                size="lg"
                className="w-full"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                    Generando tu rutina...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generar Rutina con IA (10x)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Beneficios - Updated for 10x */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Motor Inteligente 10x
              </CardTitle>
              <CardDescription>
                Esta no es una plantilla genérica. La IA de GymBro analiza tu perfil completo:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full mt-0.5">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Adaptación Biológica ({currentUser.somatotipo})</p>
                  <p className="text-sm text-muted-foreground">
                    Ajustamos el volumen (series/reps) y los tiempos de descanso específicamente para metabolismos {currentUser.somatotipo}s.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full mt-0.5">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Escalado por Experiencia ({currentUser.nivel})</p>
                  <p className="text-sm text-muted-foreground">
                    Seleccionamos la cantidad exacta de ejercicios por grupo muscular para no sobreentrenar ni quedarte corto según tu nivel.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full mt-0.5">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Anti-Estancamiento (Shuffle Dinámico)</p>
                  <p className="text-sm text-muted-foreground">
                    Incluso si generas la misma rutina dos veces, la IA mezclará ejercicios del mismo Tier para darte variedad sin perder eficacia.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Previsualización (ambos modos) ── */}
      {generatedRoutine && (
        <>
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
              <Check className="w-8 h-8 text-primary" />
              Tu Rutina Está Lista
            </h1>
            <p className="text-muted-foreground">
              Revisa los detalles y guarda tu rutina personalizada
            </p>
          </div>

          {/* Resumen */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{generatedRoutine.nombre}</CardTitle>
              <CardDescription>{generatedRoutine.descripcion}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-primary/10 border border-primary/20 text-primary-foreground p-3 rounded-lg mb-6 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div className="text-sm">
                  <span className="font-semibold text-primary">Días recomendados para entrenar: </span>
                  <span className="text-foreground font-medium">
                    {diasDisponibles === 3 ? 'Lunes, Miércoles y Viernes' :
                     diasDisponibles === 4 ? 'Lunes, Martes, Jueves y Viernes' :
                     diasDisponibles === 5 ? 'Lunes a Viernes (Descanso fines de semana)' :
                     'Lunes a Sábado (Descanso Domingo)'}
                  </span>
                </div>
              </div>
              {resumen && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-accent/50">
                    <Calendar className="w-6 h-6 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold">{resumen.totalDias}</p>
                    <p className="text-xs text-muted-foreground">días/semana</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-accent/50">
                    <Dumbbell className="w-6 h-6 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold">{resumen.totalEjercicios}</p>
                    <p className="text-xs text-muted-foreground">ejercicios</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-accent/50">
                    <Clock className="w-6 h-6 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold">{resumen.duracionPromedio}</p>
                    <p className="text-xs text-muted-foreground">min promedio</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-accent/50">
                    <Sparkles className="w-6 h-6 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold">{resumen.ejerciciosTierS}</p>
                    <p className="text-xs text-muted-foreground">tier S</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estadísticas de la rutina */}
          <RoutineStats rutina={generatedRoutine} />

          {/* Hint para reordenar */}
          <div className="flex items-start gap-2 p-3 mb-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
            <GripVertical className="w-4 h-4 mt-0.5 text-primary shrink-0" />
            <span>
              Arrastra los días por el icono <span className="font-medium text-foreground">⋮⋮</span> para cambiar el orden antes de guardar
              {' '}— útil si entrenaste un grupo similar ayer.
            </span>
          </div>

          {/* Desglose por días (drag-and-drop) */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReorderDias}>
            <SortableContext
              items={generatedRoutine.dias.map(d => d.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4 mb-6">
                {generatedRoutine.dias.map((dia, idx) => (
                  <SortableDayCard
                    key={dia.id}
                    dia={dia}
                    index={idx}
                    onReorderEjercicios={handleReorderEjercicios}
                    onSwapEjercicio={handleSwapEjercicio}
                    doneCounts={doneCounts}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Acciones */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setGeneratedRoutine(null)}
              className="flex-1"
            >
              {modo === 'fullw' ? 'Elegir otra plantilla'
                : modo === 'cbum' ? 'Volver a CBum'
                : modo === 'ia_adaptativa' ? 'Regenerar con IA'
                : 'Generar Otra'}
            </Button>
            <Button
              onClick={handleSaveRoutine}
              size="lg"
              className="flex-1"
            >
              Guardar y Comenzar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            {generatedRoutine && currentUser && (
              <ShareRoutineButton
                rutina={generatedRoutine}
                userName={currentUser.nombre}
                size="default"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
