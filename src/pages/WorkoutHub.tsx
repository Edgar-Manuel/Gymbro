import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';


/**
 * WorkoutHub - Punto de entrada inteligente para entrenamientos
 *
 * Lógica:
 * - Si NO hay rutina activa → redirige a generador de rutinas
 * - Si HAY rutina → redirige a WorkoutSession (selector de día)
 */
export default function WorkoutHub() {
  const navigate = useNavigate();
  const { currentUser, activeRoutine } = useAppStore();

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    // Si no hay rutina activa, redirigir a crear una
    if (!activeRoutine) {
      navigate('/routine-generator');
      return;
    }

    // Si hay rutina, ir directo a la sesión de entrenamiento
    navigate('/workout-session');
  }, [currentUser, activeRoutine, navigate]);

  // Mostrar loading mientras se hace la redirección
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <img src="/logo.png" alt="GymBro" className="w-16 h-16 mx-auto mb-4 rounded-2xl object-cover animate-pulse shadow-lg" />
        <p className="text-muted-foreground">Preparando entrenamiento...</p>
      </div>
    </div>
  );
}
