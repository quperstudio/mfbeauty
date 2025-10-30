import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { queryClient } from './lib/queryClient';
import AppLayout from './components/layout/AppLayout';
import Clients from './pages/Clients';
import ComingSoon from './pages/ComingSoon';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Clients />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calendario"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ComingSoon pageName="Calendario" />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/servicios"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ComingSoon pageName="Servicios" />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agentes"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ComingSoon pageName="Agentes" />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finanzas"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ComingSoon pageName="Finanzas" />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/caja"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ComingSoon pageName="Caja" />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/comisiones"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ComingSoon pageName="Comisiones" />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reportes"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ComingSoon pageName="Reportes" />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ComingSoon pageName="Usuarios" />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
          <Toaster /> 
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;