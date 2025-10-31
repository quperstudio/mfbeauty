import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react'; // Añadido Loader2 para el botón
import { useAuth } from '../contexts/AuthContext';
// Importaciones de shadcn/ui
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label'; // Agregado para mejor estructura del formulario
import { Alert, AlertDescription } from '@/components/ui/alert'; // Usaremos Alert para los errores

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Redireccionar si el usuario ya está logueado
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        // Usar un mensaje más amigable o la descripción del error si está disponible
        setError('Email o contraseña incorrectos. Por favor, verifica tus datos.');
        return;
      }

      navigate('/');
    } catch (err) {
      setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // CAMBIO DE ESTILOS: Fondo del cuerpo usando los colores definidos
    // El fondo completo usará el color 'background' del <body> (definido en index.css)
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          {/* CAMBIO DE ESTILOS: Icono usando bg-primary y texto-primary-foreground */}
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-xl mb-3 sm:mb-4">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
          </div>
          {/* CAMBIO DE ESTILOS: Usando text-foreground y font-serif por la clase base */}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Salón de Belleza
          </h1>
          {/* CAMBIO DE ESTILOS: Usando text-muted-foreground */}
          <p className="text-sm sm:text-base text-muted-foreground">
            Ingresa para gestionar tu negocio
          </p>
        </div>

        <div className="card shadow-strong p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email-input">Email</Label>
              <Input
                id="email-input"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-input">Contraseña</Label>
              <Input
                id="password-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-5 sm:mt-6 text-center">
            <button
              onClick={() => navigate('/register')}
              className="text-xs sm:text-sm text-primary hover:text-primary/90 transition-colors underline-offset-4 hover:underline"
              disabled={loading}
            >
              ¿Primera vez? Crear cuenta de administrador
            </button>
          </div>
        </div>

        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6 sm:mt-8">
          Sistema de Gestión Profesional
        </p>
      </div>
    </div>
  );
}