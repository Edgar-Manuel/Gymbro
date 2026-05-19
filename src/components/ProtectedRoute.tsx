import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';


interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <img src="/logo.png" alt="GymBro" className="w-20 h-20 mx-auto mb-4 rounded-2xl object-cover animate-pulse shadow-lg" />
          <h2 className="text-2xl font-bold mb-2">GymBro</h2>
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Redirigir a landing si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  // Renderizar contenido protegido
  return <>{children}</>;
}
