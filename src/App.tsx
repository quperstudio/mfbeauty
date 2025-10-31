import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { Spinner } from './components/ui/spinner';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ComingSoon from './pages/ComingSoon';

/**
 * Componente principal que maneja el estado de carga de la autenticación.
 * Muestra un Spinner mientras el contexto de autenticación está cargando
 * o renderiza las rutas de la aplicación si ya terminó.
 */
function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return <AppRoutes />;
}

/**
 * Componente que define todas las rutas de la aplicación.
 * Solo se renderiza una vez que el estado de autenticación (isLoading) está resuelto.
 */
function AppRoutes() {
  return (
    <main className="flex h-dvh w-full">
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rutas Protegidas */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/services" element={<ComingSoon />} />
          {/* Aquí estaban los errores de escritura, ya corregidos. */}
          <Route path="/finances" element={<ComingSoon />} />
          <Route path="/agenda" element={<ComingSoon />} />
          <Route path="/marketing" element={<ComingSoon />} />
          <Route path="/inventory" element={<ComingSoon />} />
        </Route>
      </Routes>
    </main>
  );
}

export default App;

