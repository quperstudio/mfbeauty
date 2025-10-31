import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signUpError } = await signUp(email, password, fullName, 'administrator');

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setSuccess(true);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-primary-600 rounded-2xl mb-3 sm:mb-4">
            <UserPlus className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Crear Cuenta de Administrador
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Registra el primer usuario del sistema
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-strong p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
          {success ? (
            <div className="text-center py-6 sm:py-8">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-success-100 dark:bg-success-900 rounded-full mb-3 sm:mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                ¡Cuenta Creada!
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Redirigiendo al login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
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

              {error && (
                <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={loading}
              >
                Crear Cuenta de Administrador
              </Button>
            </form>
          )}

          <div className="mt-5 sm:mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </div>
        </div>

        <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-6 sm:mt-8">
          Nota: Esta página es solo para crear el primer usuario administrador
        </p>
      </div>
    </div>
  );
}
