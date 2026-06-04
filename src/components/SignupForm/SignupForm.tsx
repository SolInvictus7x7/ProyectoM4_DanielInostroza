import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../services/auth';
import { db } from '../../services/firebase';
import '../LoginForm/LoginForm.css';

import { getSignupError } from '../../utils/authErrors';
import GoogleIcon from '../icons/GoogleIcon';

type Feedback = { type: 'error'; message: string } | null;

interface SignupFormProps {
  /** Called after a successful email/password registration. */
  onSuccess?: (message: string) => void;
}

function SignupForm({ onSuccess }: SignupFormProps) {
  const { signUp, signInWithGoogle, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (password !== confirm) {
      setFeedback({ type: 'error', message: 'Las contraseñas no coinciden.' });
      return;
    }

    setLoading(true);
    try {
      const credential = await signUp(email, password);

      // Save uid + username + email to Firestore users collection
      await setDoc(doc(db, 'users', credential.user.uid), {
        uid: credential.user.uid,
        username: username.trim() || '',
        email: email.trim(),
      });

      // Sign out immediately so they are not auto-logged in and redirected
      await logout();

      // Notify parent (Home) to show success and switch to signin tab
      onSuccess?.('¡Usuario creado exitosamente! Ya puedes iniciar sesión.');

      // Clear fields
      setEmail('');
      setPassword('');
      setConfirm('');
      setUsername('');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setFeedback({ type: 'error', message: getSignupError(code) });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setFeedback(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code !== 'auth/popup-closed-by-user') {
        setFeedback({ type: 'error', message: getSignupError(code) });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const isDisabled = loading || googleLoading;

  return (
    <div className="auth-card">
      <h2>Crear Cuenta</h2>

      {/* Only errors are shown locally — success is lifted to Home */}
      {feedback && (
        <div className="auth-feedback error" role="alert">
          ✕ {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="signup-username">Nombre de usuario</label>
          <input
            id="signup-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ej: juanperez"
            autoComplete="username"
            disabled={isDisabled}
          />
        </div>

        <div className="form-group">
          <label htmlFor="signup-email">Correo Electrónico</label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-password">Contraseña</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            required
            disabled={isDisabled}
          />
        </div>

        <div className="form-group">
          <label htmlFor="signup-confirm">Confirmar Contraseña</label>
          <input
            id="signup-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
            required
            disabled={isDisabled}
          />
        </div>

        <button type="submit" className="btn-submit" disabled={isDisabled}>
          {loading ? <span className="spinner" aria-hidden="true" /> : null}
          {loading ? 'Creando cuenta…' : 'Crear Cuenta'}
        </button>
      </form>

      <div className="auth-divider">o continúa con</div>

      <button
        type="button"
        className="btn-google"
        onClick={handleGoogle}
        disabled={isDisabled}
        aria-label="Registrarse con Google"
      >
        {googleLoading ? (
          <span className="spinner spinner-dark" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        {googleLoading ? 'Conectando…' : 'Registrarse con Google'}
      </button>
    </div>
  );
}


export default SignupForm;
