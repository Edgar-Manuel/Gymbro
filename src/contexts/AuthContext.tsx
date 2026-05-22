import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { account } from '@/services/appwrite';
import { setStorageMode, dbHelpers } from '@/db';
import { useAppStore } from '@/store';
import { OAuthProvider } from 'appwrite';

// Tipo para el usuario de Appwrite
interface AppwriteUser {
  $id: string;
  name: string;
  email: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: AppwriteUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppwriteUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar sesión actual al cargar
  useEffect(() => {
    checkSession();
  }, []);

  // Cambiar modo de almacenamiento según autenticación
  useEffect(() => {
    let cancelled = false;

    const handleUserChange = async () => {
      if (user) {
        // Usuario autenticado: usar Appwrite (cloud)
        setStorageMode('cloud');

        try {
          const store = useAppStore.getState();
          const localUser = store.currentUser;

          // Limpiar datos solo si hay un cambio real de cuenta: el userId de Appwrite
          // ($id) no coincide con el ID local guardado. Comparar solo por email es
          // peligroso porque puede dar falsos positivos al renovar sesión.
          const accountIdMismatch = localUser && localUser.id !== 'user-1' && localUser.id !== user.$id;
          if (accountIdMismatch) {
            console.log('🔄 Cambio de cuenta detectado. Limpiando base de datos local...');

            await dbHelpers.clearAllData();
            if (cancelled) return;

            store.setCurrentUser(null);
            store.setActiveRoutine(null);
            store.setStatistics(null);
            store.finishWorkout();

            const { initializeDatabase } = await import('@/utils/seedData');
            await initializeDatabase();
            if (cancelled) return;
          }

          const { appwriteDbHelpers } = await import('@/db/appwriteDb');
          const cloudUser = await appwriteDbHelpers.getCurrentUser();
          if (cancelled) return;

          if (cloudUser) {
            // Preserve local-only fields (gymActual, gymActualNombre, tiempoSesion, etc.)
            // that are NOT stored in Appwrite. The store already has the local user loaded
            // by App.tsx, so we can use it as the base and let cloud override shared fields.
            const localUser = store.currentUser;
            const merged = { ...localUser, ...cloudUser };
            await dbHelpers.createOrUpdateUser(merged);
            if (cancelled) return;
            store.setCurrentUser(merged);
          }
        } catch (error) {
          if (!cancelled) console.error('Error sincronizando usuario tras login:', error);
        }
      } else {
        // Sin autenticación: usar IndexedDB (local)
        setStorageMode('local');
      }
    };

    handleUserChange().catch(err => { if (!cancelled) console.error('Error in handleUserChange:', err); });
    return () => { cancelled = true; };
  }, [user]);

  const checkSession = async () => {
    try {
      const session = await account.get();
      setUser(session);
    } catch (err) {
      const code = (err as { code?: number }).code;
      if (code !== 401 && code !== 403) {
        // Network/server error — don't wipe session state, just log
        console.warn('[Auth] checkSession falló (posible error de red):', err);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const session = await account.get();
      setUser(session);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  };

  // Helper para esperar un tiempo
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper para intentar login con retries
  const loginWithRetry = async (email: string, password: string, maxRetries: number = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Intento de login ${attempt}/${maxRetries}...`);
        await account.createEmailPasswordSession(email, password);
        const session = await account.get();
        setUser(session);
        console.log('✅ Login exitoso');
        return; // Éxito, salir
      } catch (error) {
        console.warn(`Intento ${attempt} falló:`, (error as Error).message);
        if (attempt < maxRetries) {
          // Esperar antes de reintentar (incrementalmente más tiempo)
          const waitTime = attempt * 500; // 500ms, 1000ms, 1500ms
          console.log(`Esperando ${waitTime}ms antes de reintentar...`);
          await delay(waitTime);
        } else {
          // Último intento falló
          throw error;
        }
      }
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      // Crear cuenta
      console.log('Creando cuenta en Appwrite...');
      await account.create('unique()', email, password, name);
      console.log('✅ Cuenta creada exitosamente');

      // Pequeño delay para que Appwrite procese la cuenta
      await delay(300);

      // Iniciar sesión automáticamente con retry
      await loginWithRetry(email, password);
    } catch (error) {
      console.error('Error al registrarse:', error);
      // Si el error es que la cuenta ya existe, intentar login directamente
      if ((error as { code?: number }).code === 409) {
        console.log('La cuenta ya existe, intentando login...');
        await loginWithRetry(email, password);
      } else {
        throw error;
      }
    }
  };

  const loginWithGoogle = () => {
    try {
      // Para Appwrite web, redirige directamente
      account.createOAuth2Session(
        OAuthProvider.Google, // provider
        `${window.location.origin}/`, // success URL
        `${window.location.origin}/login?error=oauth` // failure URL
      );
    } catch (error) {
      console.error('Error al iniciar con Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      
      console.log('Cerrando sesión. Limpiando datos locales...');
      // Limpiar base de datos local
      await dbHelpers.clearAllData();
      
      // Volver a cargar ejercicios por defecto
      const { initializeDatabase } = await import('@/utils/seedData');
      await initializeDatabase();
      
      // Limpiar estado de Zustand
      const store = useAppStore.getState();
      store.setCurrentUser(null);
      store.setActiveRoutine(null);
      store.setStatistics(null);
      store.finishWorkout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
