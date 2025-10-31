import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Redirige a la página principal si el usuario ya está logueado
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 'administrator' es el rol
      const { error: signUpError } = await signUp(email, password, fullName, 'administrator', businessName);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setSuccess(true);
      // Redirige al login después de un mensaje de éxito
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError('Ocurrió un error. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Usa bg-background para asegurar el modo claro/oscuro
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8"> 
      <div className="w-full max-w-md">
        {/* Cabecera del Formulario */}
        <div className="text-center mb-6 sm:mb-8">
          {/* Ícono de Registro usando color primary */}
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-2xl mb-3 sm:mb-4">
            <UserPlus className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" /> 
          </div>
          <h1 className="text-xl sm:text-3xl font-serif text-foreground mb-2"> 
            Crear Cuenta de Administrador
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground"> 
            Registra el primer usuario del sistema
          </p>
        </div>

        {/* Contenedor del Formulario - USANDO CLASE CARD PERSONALIZADA */}
        <div className="card p-6 sm:p-8"> 
          {success ? (
            // Mensaje de Éxito
            <div className="text-center py-6 sm:py-8">
              {/* Círculo de Éxito usando color success */}
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-success/10 rounded-full mb-3 sm:mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                ¡Cuenta Creada!
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Redirigiendo al login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Todos los Inputs ahora usan la clase 'input-field' gracias al componente Input */}
              <Input
                label="Nombre Completo"
                type="text"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />

              <Input
                label="Nombre del Negocio (Opcional)"
                type="text"
                placeholder="Salón de Belleza María"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                disabled={loading}
              />

              <Input
                label="Email"
                type="email"
                placeholder="admin@salon.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />

              <Input
                label="Contraseña"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />

              {/* Mensaje de Error usando colores semánticos 'error' */}
              {error && (
                <div className="bg-error/10 border border-error/50 text-error-foreground px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
                  {error}
                </div>
              )}

              {/* Botón de Submit usando variant="primary" para usar btn-primary */}
              <Button
                type="submit"
                variant="primary" // Esta variante debe aplicar tu clase 'btn-primary'
                className="w-full"
                isLoading={loading}
              >
                Crear Cuenta de Administrador
              </Button>
            </form>
          )}

          {/* Enlace a Login */}
          <div className="mt-5 sm:mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              // Usando text-primary y hover para el enlace
              className="text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors" 
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </div>
        </div>

        {/* Texto informativo inferior */}
        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6 sm:mt-8">
          Tu negocio será creado automáticamente al registrarte
        </p>
      </div>
    </div>
  );
}