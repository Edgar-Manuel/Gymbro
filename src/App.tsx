import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initializeDatabase } from '@/utils/seedData';
import { dbHelpers } from '@/db';
import { useAppStore } from '@/store';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import ExerciseLibrary from '@/pages/ExerciseLibrary';
import RoutineGenerator from '@/pages/RoutineGenerator';
import WorkoutHub from '@/pages/WorkoutHub';
import WorkoutSession from '@/pages/WorkoutSession';
import WorkoutSummary from '@/pages/WorkoutSummary';
import Progress from '@/pages/Progress';
import Education from '@/pages/Education';
import Nutrition from '@/pages/Nutrition';
import Profile from '@/pages/Profile';
import SharedRoutineView from '@/pages/SharedRoutineView';
import WorkoutDetail from '@/pages/WorkoutDetail';
import GymMachineLibrary from '@/pages/GymMachineLibrary';

import { notificationManager } from '@/utils/notificationManager';
import { Toaster } from 'sonner';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const { setCurrentUser, isDarkMode } = useAppStore();

  useEffect(() => {
    // Aplicar modo oscuro
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const initApp = async () => {
    try {
      notificationManager.init();

      // Inicializar base de datos
      await initializeDatabase();

      // Cargar usuario actual
      const user = await dbHelpers.getCurrentUser();
      if (user) {
        setCurrentUser(user);
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Error inicializando app:', error);
      setIsInitialized(true); // Continuar de todas formas
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <img src="/logo.png" alt="GymBro" className="w-20 h-20 mx-auto mb-4 rounded-2xl object-cover animate-pulse shadow-lg" />
          <h2 className="text-2xl font-bold mb-2">GymBro</h2>
          <p className="text-muted-foreground">Inicializando tu gimnasio virtual...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/split/:slug" element={<SharedRoutineView />} />

          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="exercises" element={<ExerciseLibrary />} />
            <Route path="workout" element={<WorkoutHub />} />
            <Route path="workout-session" element={<WorkoutSession />} />
            <Route path="workout/summary" element={<WorkoutSummary />} />
            <Route path="workout/:id" element={<WorkoutDetail />} />
            <Route path="routine-generator" element={<RoutineGenerator />} />
            <Route path="progress" element={<Progress />} />
            <Route path="education" element={<Education />} />
            <Route path="nutrition" element={<Nutrition />} />
            <Route path="profile" element={<Profile />} />
            <Route path="machines" element={<GymMachineLibrary />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors closeButton />
    </AuthProvider>
  );
}

export default App;
