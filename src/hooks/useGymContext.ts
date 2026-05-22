import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { dbHelpers } from '@/db';
import { slugifyGym, getCurrentLocation, detectarGymCercano } from '@/utils/gymUtils';
import type { GymRecord } from '@/types';

export type GymInfo = { gymId: string; gymNombre: string; lat?: number; lng?: number; count?: number };

export function useGymContext() {
  const { currentUser, setCurrentUser } = useAppStore();
  const [gymsConocidos, setGymsConocidos] = useState<GymInfo[]>([]);
  const [gymActual, setGymActualState] = useState<GymInfo | null>(null);
  const [detectandoGym, setDetectandoGym] = useState(false);

  const cargarGyms = async (userId: string) => {
    // Merge gym records (with coords) with photo counts
    const [gymRecords, fotoCounts] = await Promise.all([
      dbHelpers.getAll ? dbHelpers.getAll(userId) : [] as GymRecord[],
      dbHelpers.getAllGyms(userId),
    ]);
    const countMap = new Map(fotoCounts.map(g => [g.gymId, g.count]));
    // Union: start from GymRecord (has coords), enrich with photo counts, also include gyms only known from photos
    const fromRecords: GymInfo[] = (gymRecords as GymRecord[]).map(r => ({
      gymId: r.id,
      gymNombre: r.nombre,
      lat: r.lat,
      lng: r.lng,
      count: countMap.get(r.id) ?? 0,
    }));
    // Add gyms that exist in photos but not in gymRecords
    for (const fc of fotoCounts) {
      if (!fromRecords.find(g => g.gymId === fc.gymId)) {
        fromRecords.push({ gymId: fc.gymId, gymNombre: fc.gymNombre, count: fc.count });
      }
    }
    setGymsConocidos(fromRecords);
    return fromRecords;
  };

  useEffect(() => {
    if (!currentUser) return;
    cargarGyms(currentUser.id).then(gyms => {
      if (currentUser.gymActual) {
        const found = gyms.find(g => g.gymId === currentUser.gymActual);
        setGymActualState(found ?? (currentUser.gymActualNombre
          ? { gymId: currentUser.gymActual, gymNombre: currentUser.gymActualNombre }
          : null));
      } else {
        setGymActualState(null);
      }
    });
  // Re-run when gymActual changes (e.g. after cloud sync restores or clears gym selection)
  }, [currentUser?.id, currentUser?.gymActual]);

  const detectarGymPorUbicacion = async (): Promise<GymInfo | null> => {
    setDetectandoGym(true);
    try {
      const coords = await getCurrentLocation();
      if (!coords) return null;
      const gymsConCoords = gymsConocidos.filter(g => g.lat != null && g.lng != null) as { gymId: string; gymNombre: string; lat: number; lng: number }[];
      const found = detectarGymCercano(coords, gymsConCoords);
      if (found) {
        setGymActualState({ ...found, lat: coords.lat, lng: coords.lng });
        return { ...found };
      }
      return null;
    } finally {
      setDetectandoGym(false);
    }
  };

  const seleccionarGym = async (gymId: string, gymNombre: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, gymActual: gymId, gymActualNombre: gymNombre };
    setCurrentUser(updated);
    const info = gymsConocidos.find(g => g.gymId === gymId) ?? { gymId, gymNombre };
    setGymActualState(info);
    try { await dbHelpers.updateUser?.(updated); } catch {}
  };

  const crearNuevoGym = async (gymNombre: string, coordsArg?: { lat: number; lng: number }): Promise<GymInfo> => {
    if (!currentUser) throw new Error('No user');
    const coords = coordsArg ?? await getCurrentLocation() ?? undefined;
    const gymId = slugifyGym(currentUser.id, gymNombre);
    const gymRecord: GymRecord = {
      id: gymId,
      userId: currentUser.id,
      nombre: gymNombre,
      lat: coords?.lat,
      lng: coords?.lng,
      syncStatus: 'pending_create',
      lastUpdated: Date.now(),
    };
    await dbHelpers.upsert?.(gymRecord);
    await seleccionarGym(gymId, gymNombre);
    const info: GymInfo = { gymId, gymNombre, lat: coords?.lat, lng: coords?.lng, count: 0 };
    setGymsConocidos(prev => [...prev.filter(g => g.gymId !== gymId), info]);
    return info;
  };

  return { gymActual, gymsConocidos, detectandoGym, detectarGymPorUbicacion, seleccionarGym, crearNuevoGym };
}
