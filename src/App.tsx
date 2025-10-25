import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { queryClient } from './lib/queryClient';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ComingSoon from './pages/ComingSoon';
import { Toaster } from 'sonner';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="bottom-left" />
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/clientes" element={<Clients />} />
                      <Route
                        path="/servicios"
                        element={
                          <ComingSoon
                            title="Catálogo de Servicios"
                            description="Gestiona servicios, categorías y precios"
                          />
                        }
                      />
                      <Route
                        path="/agentes"
                        element={
                          <ComingSoon
                            title="Agentes de Comisión"
                            description="Administra tu equipo y sus comisiones"
                          />
                        }
                      />
                      <Route
                        path="/citas"
                        element={
                          <ComingSoon
                            title="Calendario de Citas"
                            description="Programa y gestiona las citas de tus clientes"
                          />
                        }
                      />
                      <Route
                        path="/finanzas"
                        element={
                          <ComingSoon
                            title="Gestión Financiera"
                            description="Controla ingresos, gastos y transacciones"
                          />
                        }
                      />
                      <Route
                        path="/caja"
                        element={
                          <ComingSoon
                            title="Control de Caja"
                            description="Administra la caja registradora y cortes de efectivo"
                          />
                        }
                      />
                      <Route
                        path="/comisiones"
                        element={
                          <ComingSoon
                            title="Sistema de Comisiones"
                            description="Rastrea y paga comisiones a tu equipo"
                          />
                        }
                      />
                      <Route
                        path="/reportes"
                        element={
                          <ComingSoon
                            title="Reportes y Análisis"
                            description="Visualiza el desempeño de tu negocio"
                          />
                        }
                      />
                      <Route
                        path="/usuarios"
                        element={
                          <ComingSoon
                            title="Gestión de Usuarios"
                            description="Administra el acceso al sistema"
                          />
                        }
                      />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
