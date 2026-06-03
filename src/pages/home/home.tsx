import { useState } from 'react';
import './home.css';
import { Nav } from '../../index';
import LoginForm from '../../components/LoginForm/LoginForm';
import SignupForm from '../../components/SignupForm/SignupForm';

type AuthTab = 'signin' | 'signup';

function Home() {
    // Sign In is the default tab
    const [activeTab, setActiveTab] = useState<AuthTab>('signin');

    return (
        <main className="home-page">
            <Nav />

            <section className="home-hero">
                <h1>TODO List</h1>
                <p>Inicia Sesión.</p>
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
                        onClick={() => setActiveTab('signin')}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'signup'}
                        aria-controls="panel-signup"
                        id="tab-signup"
                        className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
                        onClick={() => setActiveTab('signup')}
                    >
                        Crear Cuenta
                    </button>
                </div>

                {/* ── Active form panel ── */}
                {activeTab === 'signin' ? (
                    <div role="tabpanel" id="panel-signin" aria-labelledby="tab-signin">
                        <LoginForm />
                    </div>
                ) : (
                    <div role="tabpanel" id="panel-signup" aria-labelledby="tab-signup">
                        <SignupForm />
                    </div>
                )}
            </div>
        </main>
    );
}

export default Home;
