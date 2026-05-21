import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Home,
  Dumbbell,
  BookOpen,
  TrendingUp,
  User,
  Moon,
  Sun,
  Menu,
  X,
  Utensils,
  GraduationCap,
  LogOut,
  Camera,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import GymBroAssistant from '@/components/GymBroAssistant';
import { SyncIndicator } from '@/components/SyncIndicator';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useAppStore();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/exercises', label: 'Ejercicios', icon: BookOpen },
    { path: '/workout', label: 'Entrenar', icon: Dumbbell },
    { path: '/progress', label: 'Progreso', icon: TrendingUp },
    { path: '/education', label: 'Educación', icon: GraduationCap },
    { path: '/nutrition', label: 'Nutrición', icon: Utensils },
    { path: '/machines', label: 'Máquinas', icon: Camera },
    { path: '/profile', label: 'Perfil', icon: User },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="GymBro" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-xl font-bold">GymBro</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? 'default' : 'ghost'}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* User name - desktop only */}
            {user && (
              <span className="hidden md:block text-sm text-muted-foreground mr-2">
                {user.name}
              </span>
            )}

            <SyncIndicator />

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Logout button - desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="hidden md:flex"
            >
              <LogOut className="h-5 w-5" />
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <nav className="container mx-auto py-4 px-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                        isActive(item.path)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}

              {/* Logout button - mobile */}
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-accent cursor-pointer text-destructive"
              >
                <LogOut className="h-5 w-5" />
                <span>Cerrar Sesión</span>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            GymBro - Aplicación de Entrenamiento Personalizado
          </p>
          <p className="mt-2">
            100% Gratuito y Open Source
          </p>
        </div>
      </footer>

      {/* GymBro Assistant - disponible en todas las páginas */}
      <GymBroAssistant />
    </div>
  );
}
