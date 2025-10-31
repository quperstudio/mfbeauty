import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { Spinner } from './components/ui/spinner';

// --- SOLUCIÓN: Importaciones Corregidas ---
import Login from './pages/Login';
import Register from './pages/Register'; // Corregido: La ruta era './pages.Register'
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients'; // El componente se llama 'Clients'
import ComingSoon from './pages/ComingSoon';

// (Se eliminan las importaciones de Services, Finances, etc.)

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <main className="flex h-dvh w-full">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<Clients />} /> 
          <Route path="/agenda" element={<ComingSoon />} />
          <Route path="/servicios" element={<ComingSoon />} /> 
          <Route path="/inventario" element={<ComingSoon />} /> 
          <Route path="/finanzas" element={<ComingSoon />} /> 
          <Route path="/mercadotecnia" element={<ComingSoon />} /> 
        </Route>
      </Routes>
    </main>
  );
}

export default App;