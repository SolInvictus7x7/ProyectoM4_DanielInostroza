import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../services/auth';
import { db } from '../../services/firebase';
import './dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState<string | null>(null);
  const [usernameLoading, setUsernameLoading] = useState(true);

  // Fetch username from Firestore users/{uid}
  useEffect(() => {
    if (!user) return;

    const fetchUsername = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setUsername(data.username?.trim() || null);
        }
      } catch {
        // Firestore error — fall back to "unknown"
      } finally {
        setUsernameLoading(false);
      }
    };

    fetchUsername();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const displayName = usernameLoading
    ? null                          // render shimmer skeleton
    : (username || 'unknown');

  return (
    <div className="dashboard-page">
      {/* ── Top bar with logout ── */}
      <header className="dashboard-topbar">
        <button
          className="btn-logout"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
        >
          <LogoutIcon />
          Cerrar sesión
        </button>
      </header>

      {/* ── Main content ── */}
      <main className="dashboard-content">
        <h1 className="dashboard-welcome">
          Bienvenido,{' '}
          {displayName === null ? (
            <span className="dashboard-loading-name" aria-label="Cargando nombre" />
          ) : (
            <span>{displayName}</span>
          )}
        </h1>
        <p className="dashboard-subtitle">Tu lista de tareas está lista.</p>
      </main>
    </div>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default Dashboard;
