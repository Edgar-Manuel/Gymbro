import { db } from '../schema';
import { appwriteDbHelpers } from '../appwriteDb';
import type { RutinaSemanal } from '@/types';
import type { WithSync } from '../types';
import { getStorageMode } from '../config';
import { populateRoutineExercises } from '@/utils/fullwConverter';

export const RoutineRepository = {
    async getActiveRoutine(userId: string): Promise<WithSync<RutinaSemanal> | undefined> {
        const local = await db.rutinas.where('userId').equals(userId).and(r => r.activa === true).first();

        if (navigator.onLine && getStorageMode() === 'cloud') {
            if (!local) {
                try {
                    const routine = await appwriteDbHelpers.getActiveRoutine(userId);
                    if (routine) {
                        await db.rutinas.put({ ...routine, syncStatus: 'synced', lastUpdated: Date.now() });
                        return { ...populateRoutineExercises(routine), syncStatus: 'synced' };
                    }
                } catch (error) {
                    console.warn('[Repo] Error fetching active routine from cloud:', error);
                }
            } else if (local.syncStatus === 'synced') {
                appwriteDbHelpers.getActiveRoutine(userId)
                    .then(routine => {
                        if (routine) db.rutinas.put({ ...routine, syncStatus: 'synced', lastUpdated: Date.now() });
                    })
                    .catch(err => console.warn('[Repo] background routine refresh failed', err));
            }
        }

        return local ? populateRoutineExercises(local) as WithSync<RutinaSemanal> : undefined;
    },

    async getUserRoutines(userId: string) {
        const local = await db.rutinas.where('userId').equals(userId).toArray();

        if (navigator.onLine) {
            if (local.length === 0) {
                try {
                    const routines = await appwriteDbHelpers.getUserRoutines(userId);
                    await db.rutinas.bulkPut(routines.map(r => ({ ...r, syncStatus: 'synced' as const, lastUpdated: Date.now() })));
                    return routines.map(populateRoutineExercises);
                } catch (error) {
                    console.warn('[Repo] Error fetching routines from cloud:', error);
                }
            } else {
                const hasPending = local.some(r => r.syncStatus !== 'synced');
                if (!hasPending) {
                    appwriteDbHelpers.getUserRoutines(userId)
                        .then(routines => db.rutinas.bulkPut(routines.map(r => ({ ...r, syncStatus: 'synced' as const, lastUpdated: Date.now() }))))
                        .catch(err => console.warn('[Repo] background routines refresh failed', err));
                }
            }
        }

        return local.map(r => populateRoutineExercises(r) as typeof r);
    },

    async createRoutine(rutina: RutinaSemanal) {
        const timestamp = Date.now();

        // Handle active flag locally first to ensure consistency
        if (rutina.activa) {
            const activeRoutines = await db.rutinas
                .where('userId').equals(rutina.userId)
                .and(r => r.activa === true)
                .toArray();

            for (const r of activeRoutines) {
                await db.rutinas.update(r.id, { activa: false, syncStatus: 'pending_update', lastUpdated: timestamp });
            }
        }

        if (navigator.onLine) {
            try {
                const id = await appwriteDbHelpers.createRoutine(rutina);
                await db.rutinas.put({ ...rutina, id, syncStatus: 'synced', lastUpdated: timestamp });
                return id;
            } catch (error) {
                console.error('Error creating routine in cloud:', error);
                await db.rutinas.put({ ...rutina, syncStatus: 'pending_create', lastUpdated: timestamp });
                return rutina.id;
            }
        } else {
            await db.rutinas.put({ ...rutina, syncStatus: 'pending_create', lastUpdated: timestamp });
            return rutina.id;
        }
    },

    async getPendingSync() {
        return await db.rutinas
            .filter(r => r.syncStatus !== 'synced' && r.syncStatus !== undefined)
            .toArray();
    }
};
