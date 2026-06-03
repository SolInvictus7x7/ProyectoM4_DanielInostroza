import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../services/auth';
import { db } from '../../services/firebase';
import '../LoginForm/LoginForm.css';

// Maps Firebase error codes to friendly Spanish messages
function getSignupError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este correo ya tiene una cuenta asociada.';
    case 'auth/invalid-email':
      return 'El formato del correo no es válido.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento.';
    default:
      return 'Ocurrió un error inesperado. Intenta de nuevo.';
  }
}

type Feedback = { type: 'error'; message: string } | null;

interface SignupFormProps {
  /** Called after a successful email/password registration. */
  onSuccess?: (message: string) => void;
}

function SignupForm({ onSuccess }: SignupFormProps) {
  const { signUp, signInWithGoogle } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading]         = useState(false);
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

      // Save uid + username to Firestore users collection
      await setDoc(doc(db, 'users', credential.user.uid), {
        uid: credential.user.uid,
        username: username.trim() || '',
      });

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
      // Google sign-in logs the user in directly — auth context handles redirect
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

export default SignupForm;
