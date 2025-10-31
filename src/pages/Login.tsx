import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  // ... (tus otros hooks: useState, useForm, etc.)
  const navigate = useNavigate();
  
  // 2. Obtén la sesión de tu contexto
  const { session } = useAuth();

  // 3. Agrega este useEffect
  useEffect(() => {
    // Si la sesión existe (ya sea por un login nuevo o uno previo),
    // redirige al dashboard.
    if (session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      // 4. ¡IMPORTANTE! Quita la línea 'navigate("/")' de aquí.
      // navigate('/'); <--- BORRAR ESTA LÍNEA

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ... (resto de tu componente y JSX)
};

export default Login;