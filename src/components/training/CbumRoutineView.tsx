import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  buildCbumRoutine, CBUM_PRINCIPLES, CBUM_NUTRITION,
  type CbumPhase, type CbumIntensity,
} from '@/data/cbumRoutine';
import type { FullWRoutine } from '@/data/fullwRoutines';
import {
  ChevronDown, ChevronUp, Trophy, Calendar, Clock, ArrowRight,
  Dumbbell, Sparkles, Salad, Brain, Moon, Flame, Zap, Link2, RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/store';

interface Props {
  onUseRoutine: (rutina: FullWRoutine) => void;
}

export default function CbumRoutineView({ onUseRoutine }: Props) {
  const [phase, setPhase] = useState<CbumPhase>('offseason');
  const [intensity, setIntensity] = useState<CbumIntensity>('avanzado');
  const [openDay, setOpenDay] = useState<number | null>(0);
  const { cbumCycleDay, setCbumCycleDay, advanceCbumCycleDay } = useAppStore();

  const rutina = useMemo(() => buildCbumRoutine(phase, intensity), [phase, intensity]);
  const nutricion = CBUM_NUTRITION[phase];
  const totalEjercicios = rutina.plan.reduce((s, d) => s + d.ejercicios.length, 0);

  return (
    <div className="space-y-4">
      {/* Header dorado */}
      <Card className="border-amber-300 dark:border-amber-700/40 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-orange-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="w-5 h-5 text-amber-500" />
                CBum — Classic Physique
              </CardTitle>
              <CardDescription>
                Chris Bumstead · 6× Mr. Olympia · Split de 9 días (ciclo rotativo)
              </CardDescription>
            </div>
            <Badge variant="default" className="bg-amber-500 hover:bg-amber-500/90 text-white shrink-0">
              {phase === 'offseason' ? 'Off-Season' : 'Prep'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Toggle Off-Season ↔ Prep */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">Fase</p>
            <div className="grid grid-cols-2 gap-1 p-1 bg-background/50 rounded-lg border">
              <button
                type="button"
                onClick={() => setPhase('offseason')}
                className={`py-1.5 px-2 rounded text-xs font-medium transition-all ${
                  phase === 'offseason'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                💪 Off-Season (masa)
              </button>
              <button
                type="button"
                onClick={() => setPhase('prep')}
                className={`py-1.5 px-2 rounded text-xs font-medium transition-all ${
                  phase === 'prep'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🔥 Prep (definición)
              </button>
            </div>
          </div>

          {/* Toggle intensidad */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">Intensidad</p>
            <div className="grid grid-cols-3 gap-1 p-1 bg-background/50 rounded-lg border">
              {(['principiante', 'intermedio', 'avanzado'] as CbumIntensity[]).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setIntensity(level)}
                  className={`py-1.5 px-2 rounded text-xs font-medium capitalize transition-all ${
                    intensity === level
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            {intensity === 'principiante' && (
              <p className="text-[10px] text-muted-foreground mt-1 italic">
                Volumen reducido al 50% — perfecto si llevas menos de 1 año entrenando.
              </p>
            )}
            {intensity === 'intermedio' && (
              <p className="text-[10px] text-muted-foreground mt-1 italic">
                Volumen al 75% — base sólida sin saturar la recuperación.
              </p>
            )}
          </div>

          {/* Cycle day tracker */}
          {(() => {
            const rutinaTmp = buildCbumRoutine(phase, intensity);
            const todayDia = rutinaTmp.plan[cbumCycleDay];
            const isRest = todayDia?.ejercicios.length === 0;
            return (
              <div className={`rounded-lg border px-3 py-2 flex items-center justify-between gap-2 ${isRest ? 'bg-muted/30 border-border' : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/50'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">{isRest ? '😴' : '🏋️'}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      Posición en el ciclo: Día {cbumCycleDay + 1}/9
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {isRest ? 'Descanso — recuperación activa' : todayDia?.nombre}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    title="Avanzar al siguiente día del ciclo"
                    onClick={advanceCbumCycleDay}
                    className="p-1.5 rounded-md hover:bg-amber-200/60 dark:hover:bg-amber-800/40 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </button>
                  <select
                    title="Cambiar día del ciclo manualmente"
                    value={cbumCycleDay}
                    onChange={e => setCbumCycleDay(Number(e.target.value))}
                    className="text-[11px] bg-background border border-border rounded px-1 py-0.5 cursor-pointer"
                  >
                    {rutinaTmp.plan.map((d, i) => (
                      <option key={i} value={i}>
                        Día {i + 1}{d.ejercicios.length === 0 ? ' 😴' : ` — ${d.grupos[0] ?? d.nombre.split('—')[1]?.trim() ?? ''}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })()}

          {/* Stats strip */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-background/70 rounded-lg p-2">
              <Calendar className="w-4 h-4 mx-auto mb-1 text-amber-500" />
              <p className="font-bold text-sm">9 días</p>
              <p className="text-[10px] text-muted-foreground">ciclo rotativo</p>
            </div>
            <div className="bg-background/70 rounded-lg p-2">
              <Dumbbell className="w-4 h-4 mx-auto mb-1 text-orange-500" />
              <p className="font-bold text-sm">{totalEjercicios}</p>
              <p className="text-[10px] text-muted-foreground">ejercicios</p>
            </div>
            <div className="bg-background/70 rounded-lg p-2">
              <Sparkles className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
              <p className="font-bold text-sm">2× espalda</p>
              <p className="text-[10px] text-muted-foreground">por ciclo</p>
            </div>
            <div className="bg-background/70 rounded-lg p-2">
              <Clock className="w-4 h-4 mx-auto mb-1 text-amber-600" />
              <p className="font-bold text-sm">
                {phase === 'prep' ? '100+' : '80-100'}
              </p>
              <p className="text-[10px] text-muted-foreground">min/sesión</p>
            </div>
          </div>

          <div className="bg-background/70 border rounded-lg px-3 py-2 text-xs text-muted-foreground">
            <strong className="text-foreground">Distribución:</strong> {rutina.distribucion}
          </div>
        </CardContent>
      </Card>

      {/* Filosofía */}
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="w-4 h-4 text-amber-600" />
            Filosofía CBum
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {CBUM_PRINCIPLES.map((p, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="text-amber-500 font-bold shrink-0">·</span>
              <div>
                <strong className="text-foreground">{p.titulo}.</strong>{' '}
                <span className="text-muted-foreground">{p.descripcion}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Días */}
      {rutina.plan.map((dia, idx) => {
        const isRest = dia.ejercicios.length === 0;
        const isOpen = openDay === idx;
        return (
          <Card
            key={idx}
            className={`${isOpen ? 'ring-1 ring-amber-400/60' : ''} ${isRest ? 'opacity-70' : ''}`}
          >
            <button
              type="button"
              className="w-full text-left"
              onClick={() => !isRest && setOpenDay(isOpen ? null : idx)}
              disabled={isRest}
            >
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      {isRest && <Moon className="w-3.5 h-3.5 text-muted-foreground" />}
                      {dia.nombre}
                    </CardTitle>
                    {!isRest && dia.grupos.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {dia.grupos.map(g => (
                          <Badge key={g} variant="outline" className="text-[10px]">{g}</Badge>
                        ))}
                      </div>
                    )}
                    {dia.variante && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 italic">
                        ✦ {dia.variante}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isRest ? (
                      <Badge variant="secondary" className="text-[10px]">Descanso</Badge>
                    ) : (
                      <>
                        <Badge variant="secondary" className="text-[10px]">{dia.ejercicios.length} ej.</Badge>
                        {isOpen
                          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
            </button>

            {isOpen && !isRest && (
              <CardContent className="pt-0 space-y-2">
                {dia.ejercicios.map((ej, ei) => {
                  const isPairedTop = ej.isSuperset;
                  const isPairedBottom = ei > 0 && dia.ejercicios[ei - 1]?.isSuperset;

                  return (
                    <div key={ei} className={isPairedTop ? 'pb-0' : ''}>
                      {/* Superserie label — encima del primer ejercicio del par */}
                      {isPairedTop && (
                        <div className="flex items-center gap-1 mb-1 px-1">
                          <Link2 className="w-3 h-3 text-violet-500" />
                          <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                            Superserie — sin descanso entre ejercicios
                          </span>
                        </div>
                      )}

                      <div
                        className={`rounded-xl p-3 ${
                          ej.isFST7
                            ? 'bg-gradient-to-r from-orange-100/60 to-red-100/40 dark:from-orange-950/40 dark:to-red-950/30 border border-orange-300 dark:border-orange-800/60'
                            : isPairedTop
                            ? 'bg-violet-50/60 dark:bg-violet-950/30 border border-violet-300/60 dark:border-violet-700/40 rounded-b-none border-b-0'
                            : isPairedBottom
                            ? 'bg-violet-50/60 dark:bg-violet-950/30 border border-violet-300/60 dark:border-violet-700/40 rounded-t-none'
                            : 'bg-muted/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm flex items-center gap-1.5 flex-wrap">
                              <span>{ei + 1}. {ej.nombre}</span>
                              {ej.isFST7 && (
                                <Badge className="bg-orange-500 hover:bg-orange-500 text-white text-[9px] px-1.5 py-0 h-4 gap-0.5">
                                  <Flame className="w-2.5 h-2.5" />
                                  FST-7
                                </Badge>
                              )}
                              {ej.isDropSet && (
                                <Badge className="bg-blue-500 hover:bg-blue-500 text-white text-[9px] px-1.5 py-0 h-4 gap-0.5">
                                  <Zap className="w-2.5 h-2.5" />
                                  Drop Set
                                </Badge>
                              )}
                              {(isPairedTop || isPairedBottom) && (
                                <Badge className="bg-violet-500 hover:bg-violet-500 text-white text-[9px] px-1.5 py-0 h-4 gap-0.5">
                                  <Link2 className="w-2.5 h-2.5" />
                                  {isPairedTop ? 'A' : 'B'}
                                </Badge>
                              )}
                            </p>
                            {ej.notas && !ej.isSuperset && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                ✦ {ej.notas}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 shrink-0 items-end">
                            <Badge
                              variant="outline"
                              className={`text-[10px] whitespace-nowrap ${
                                ej.isFST7 ? 'border-orange-400 text-orange-700 dark:text-orange-300' :
                                (isPairedTop || isPairedBottom) ? 'border-violet-400 text-violet-700 dark:text-violet-300' : ''
                              }`}
                            >
                              {ej.series} × {ej.reps}
                            </Badge>
                            {!isPairedTop && (
                              <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
                                {ej.descanso}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Conector visual entre A y B de la superserie */}
                      {isPairedTop && (
                        <div className="flex justify-center -my-0.5 relative z-10">
                          <div className="w-px h-3 bg-violet-400 dark:bg-violet-600" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Nutrición */}
      <Card className={`${
        phase === 'offseason'
          ? 'border-green-200 dark:border-green-900/40 bg-green-50/50 dark:bg-green-950/20'
          : 'border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20'
      }`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Salad className={`w-4 h-4 ${phase === 'offseason' ? 'text-green-600' : 'text-blue-600'}`} />
            Nutrición CBum — {phase === 'offseason' ? 'Off-Season' : 'Prep'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-xs">
          <p>
            <strong>Calorías:</strong> {nutricion.calorias.toLocaleString()} kcal/día
          </p>
          <p>
            <strong>Proteína:</strong> {nutricion.proteinas}
          </p>
          <p>
            <strong>Cardio:</strong> {nutricion.cardio}
          </p>
          <p className="text-muted-foreground">
            <strong>Fuentes:</strong> {nutricion.fuentes.join(', ')}.
          </p>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="text-xs text-muted-foreground text-center px-4 italic">
        Esta rutina es de un atleta profesional. El selector de intensidad ya escala el volumen —
        elige <strong>Principiante</strong> si llevas &lt;1 año entrenando, <strong>Intermedio</strong> si
        llevas 1-3 años, <strong>Avanzado</strong> si tienes técnica sólida y &gt;3 años.
      </div>

      {/* CTA principal */}
      <Button
        size="lg"
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        onClick={() => onUseRoutine(rutina)}
      >
        <Trophy className="w-4 h-4 mr-2" />
        Usar la rutina CBum {phase === 'offseason' ? 'Off-Season' : 'Prep'}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
