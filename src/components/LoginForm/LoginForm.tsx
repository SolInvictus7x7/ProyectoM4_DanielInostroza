import { useState } from 'react';
import { useAuth } from '../../services/auth';
import './LoginForm.css';

import { getLoginError } from '../../utils/authErrors';
import GoogleIcon from '../icons/GoogleIcon';

type Feedback = { type: 'success' | 'error'; message: string } | null;

function LoginForm() {
  const { signIn, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);
    try {
      await signIn(email, password);
      setFeedback({ type: 'success', message: '¡Sesión iniciada correctamente!' });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setFeedback({ type: 'error', message: getLoginError(code) });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setFeedback(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      setFeedback({ type: 'success', message: '¡Sesión iniciada con Google!' });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code !== 'auth/popup-closed-by-user') {
        setFeedback({ type: 'error', message: getLoginError(code) });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const isDisabled = loading || googleLoading;

  return (
    <div className="auth-card">
      <h2>Iniciar Sesión</h2>

      {feedback && (
        <div className={`auth-feedback ${feedback.type}`} role="alert">
          {feedback.type === 'success' ? '✓' : '✕'} {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="login-email">Correo Electrónico</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@correo.com"
            autoComplete="email"
            required
            disabled={isDisabled}
          />
        </div>

        <div className="form-group">
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            disabled={isDisabled}
          />
        </div>

        <button type="submit" className="btn-submit" disabled={isDisabled}>
          {loading ? <span className="spinner" aria-hidden="true" /> : null}
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <div className="auth-divider">o continúa con</div>

      <button
        type="button"
        className="btn-google"
        onClick={handleGoogle}
        disabled={isDisabled}
        aria-label="Iniciar sesión con Google"
      >
        {googleLoading ? (
          <span className="spinner spinner-dark" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        {googleLoading ? 'Conectando…' : 'Iniciar sesión con Google'}
      </button>
    </div>
  );
}


export default LoginForm;