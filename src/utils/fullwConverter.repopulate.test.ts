import { describe, it, expect } from 'vitest';
import { fullWToRutinaSemanal, populateRoutineExercises } from './fullwConverter';
import { CBUM_ROUTINE } from '@/data/cbumRoutine';
import type { RutinaSemanal } from '@/types';

// Simulates the DB save step that strips the full `ejercicio` object,
// leaving only the fields that survive serialization.
function stripEjercicio(rutina: RutinaSemanal): RutinaSemanal {
  const dias = (rutina.dias || []).map(dia => ({
    ...dia,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ejercicios: dia.ejercicios.map(({ ejercicio, ...rest }) => rest),
  }));
  return { ...rutina, dias, diasRutina: dias };
}

describe('populateRoutineExercises (DB round-trip)', () => {
  it('restores exercise names after the ejercicio object is stripped', () => {
    const built = fullWToRutinaSemanal(CBUM_ROUTINE, 'user-123');
    const stripped = stripEjercicio(built);

    // Sanity: stripping removed the populated objects
    const anyStillPopulated = stripped.dias!.some(d =>
      d.ejercicios.some(e => e.ejercicio !== undefined)
    );
    expect(anyStillPopulated).toBe(false);

    const restored = populateRoutineExercises(stripped);

    for (const dia of restored.dias!) {
      for (const ej of dia.ejercicios) {
        expect(ej.ejercicio?.nombre, `missing name for ${ej.ejercicioId}`).toBeTruthy();
      }
    }
  });

  it('restores the Bulgarian split squat specifically', () => {
    const built = fullWToRutinaSemanal(CBUM_ROUTINE, 'user-123');
    const stripped = stripEjercicio(built);
    const restored = populateRoutineExercises(stripped);

    const all = restored.dias!.flatMap(d => d.ejercicios);
    const bulgara = all.find(e => e.ejercicioId === 'sentadilla-bulgara-split');
    expect(bulgara).toBeDefined();
    expect(bulgara!.ejercicio?.nombre).toBeTruthy();
  });

  it('falls back to a readable name for ids missing from the catalog', () => {
    const rutina: RutinaSemanal = {
      id: 'r1',
      userId: 'u1',
      nombre: 'Custom',
      fechaCreacion: new Date(),
      activa: true,
      dias: [{
        id: 'd1',
        nombre: 'Día 1',
        grupos: [],
        ejercicios: [{ ejercicioId: 'ejercicio-totalmente-inventado', seriesObjetivo: 3, repsObjetivo: 10 }],
        duracionEstimada: 30,
        orden: 1,
      }],
    };

    const restored = populateRoutineExercises(rutina);
    const ej = restored.dias![0].ejercicios[0];
    expect(ej.ejercicio?.nombre).toBe('Ejercicio Totalmente Inventado');
  });
});
