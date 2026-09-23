import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { loginTraccar } from '../../../services/auth/traccarAuth';

export interface UseLoginReturn {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  error: string | null;
  sesionExpirada: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * Hook modular para controlar la lógica, validación y envío del Login contra Traccar.
 */
export function useLogin(): UseLoginReturn {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const sesionExpirada = searchParams.get('expirada') === '1';

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailLimpio = email.trim();
    if (!emailLimpio || !password) {
      setError('Por favor complete su correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const resultado = await loginTraccar({
        email: emailLimpio,
        password,
      });

      authLogin(resultado.token, resultado.user);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Credenciales no válidas en Traccar. Verifique sus datos.'
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    sesionExpirada,
    handleSubmit,
  };
}

export default useLogin;
