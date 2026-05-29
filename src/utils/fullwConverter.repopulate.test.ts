import { describe, it, expect } from 'vitest';
import { fullWToRutinaSemanal, populateRoutineExercises, slimExerciseForStorage } from './fullwConverter';
import { CBUM_ROUTINE } from '@/data/cbumRoutine';
import type { RutinaSemanal } from '@/types';

// Simulates the DB save step: keep the lightweight fields (incl. nombre) and
// drop only the heavy ones, exactly as the persistence layer does. We also
// JSON round-trip so the test matches what actually hits the database.
function saveAndReload(rutina: RutinaSemanal): RutinaSemanal {
  const dias = (rutina.dias || []).map(dia => ({
    ...dia,
    ejercicios: dia.ejercicios.map(slimExerciseForStorage),
  }));
  return JSON.parse(JSON.stringify({ ...rutina, dias, diasRutina: dias }));
}

// Legacy save format (pre-fix): the entire `ejercicio` object was stripped.
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

  it('preserves the EXACT original name through a save/reload round-trip', () => {
    const built = fullWToRutinaSemanal(CBUM_ROUTINE, 'user-123');
    const originalNames = new Map<string, string>();
    for (const d of built.dias!) for (const e of d.ejercicios) originalNames.set(e.ejercicioId, e.ejercicio!.nombre);

    const restored = populateRoutineExercises(saveAndReload(built));

    for (const dia of restored.dias!) {
      for (const ej of dia.ejercicios) {
        expect(ej.ejercicio?.nombre, `name changed for ${ej.ejercicioId}`).toBe(originalNames.get(ej.ejercicioId));
      }
    }
  });

  it('rehydrates heavy catalog fields (técnica) after the slim save', () => {
    const built = fullWToRutinaSemanal(CBUM_ROUTINE, 'user-123');
    const restored = populateRoutineExercises(saveAndReload(built));
    const all = restored.dias!.flatMap(d => d.ejercicios);
    // Real catalog exercises must regain their technique content on load.
    const withTecnica = all.filter(e => (e.ejercicio?.tecnica?.posicionInicial?.length ?? 0) > 0);
    expect(withTecnica.length).toBe(all.length);
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
