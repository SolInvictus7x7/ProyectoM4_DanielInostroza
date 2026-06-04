import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';
import { LoginForm, SignupForm } from '../../components';
import { useAuth } from '../../services/auth';

type AuthTab = 'signin' | 'signup';

function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  // Lifted success message — survives the auto-tab-switch after signup
  const [signupSuccessMsg, setSignupSuccessMsg] = useState<string | null>(null);

  // Redirect already-authenticated users straight to the dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Called by SignupForm on successful registration
  const handleSignupSuccess = (message: string) => {
    setSignupSuccessMsg(message);
    setActiveTab('signin'); // auto-switch to Sign In tab
  };

  // Clear the signup success banner when the user manually changes tabs
  const handleTabChange = (tab: AuthTab) => {
    if (tab !== 'signin') setSignupSuccessMsg(null);
    setActiveTab(tab);
  };

  // Show nothing while Firebase resolves the session (avoids flash)
  if (loading) {
    return (
      <div className="page-loading" aria-label="Cargando">
        <span className="page-spinner" />
      </div>
    );
  }

  return (
    <main className="home-page">
      <section className="home-hero">
        <h1>TODO List</h1>
        <p>Inicia sesión para continuar.</p>
      </section>

      <div className="auth-container">
        {/* ── Tab switcher ── */}
        <div className="auth-tabs" role="tablist" aria-label="Modo de acceso">
          <button
            role="tab"
            aria-selected={activeTab === 'signin'}
            aria-controls="panel-signin"
            id="tab-signin"
            className={`auth-tab ${activeTab === 'signin' ? 'active' : ''}`}
            onClick={() => handleTabChange('signin')}
          >
            Iniciar Sesión
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'signup'}
            aria-controls="panel-signup"
            id="tab-signup"
            className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => handleTabChange('signup')}
          >
            Crear Cuenta
          </button>
        </div>

        {/* ── Success banner (stays visible after auto-switch to signin) ── */}
        {activeTab === 'signin' && signupSuccessMsg && (
          <div className="auth-feedback success" role="status">
            ✓ {signupSuccessMsg}
          </div>
        )}

        {/* ── Active form panel ── */}
        {activeTab === 'signin' ? (
          <div role="tabpanel" id="panel-signin" aria-labelledby="tab-signin">
            <LoginForm />
          </div>
        ) : (
          <div role="tabpanel" id="panel-signup" aria-labelledby="tab-signup">
            <SignupForm onSuccess={handleSignupSuccess} />
          </div>
        )}
      </div>
    </main>
  );
}

export default Home;
