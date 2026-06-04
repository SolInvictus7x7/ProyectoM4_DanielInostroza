import { useState, useEffect } from 'react';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../../services/auth';
import { db } from '../../../services/firebase';

type Feedback = { type: 'success' | 'error'; message: string } | null;

function ProfileView() {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    let active = true;
    if (user) {
      const fetchProfile = async () => {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (active && userDoc.exists()) {
            const data = userDoc.data();
            setUsername(data.username || '');
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          if (active) setLoadingProfile(false);
        }
      };
      fetchProfile();
    } else {
      setLoadingProfile(false);
    }
    return () => {
      active = false;
    };
  }, [user]);

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar tu cuenta permanentemente? Se borrará tu perfil de usuario y no podrás recuperar tu información."
    );
    if (!confirmDelete) return;

    setDeleting(true);
    setFeedback(null);
    try {
      // 1. Delete user document in Firestore users collection
      const userDocRef = doc(db, 'users', user.uid);
      await deleteDoc(userDocRef);

      // 2. Delete Firebase Auth user
      await user.delete();

      // The onAuthStateChanged listener will automatically redirect the user to "/"
    } catch (err: unknown) {
      console.error("Error deleting account:", err);
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/requires-recent-login') {
        setFeedback({
          type: 'error',
          message: 'Por seguridad, debes cerrar sesión y volver a ingresar antes de eliminar tu cuenta.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Ocurrió un error inesperado al eliminar la cuenta. Intenta de nuevo.',
        });
      }
      setDeleting(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="page-loading" aria-label="Cargando perfil">
        <span className="page-spinner" />
      </div>
    );
  }

  const initial = username ? username.charAt(0) : (user?.email ? user.email.charAt(0) : 'U');

  return (
    <div className="dashboard-subview">
      <h2>Perfil de Usuario</h2>

      <div className="profile-container">
        {feedback && (
          <div className={`profile-feedback ${feedback.type}`} role="alert">
            ✕ {feedback.message}
          </div>
        )}

        <div className="profile-card">
          <div className="profile-avatar">
            {initial}
          </div>

          <div className="profile-details">
            <div className="profile-row">
              <span className="profile-label">Nombre de usuario</span>
              <span className="profile-value">{username || 'No registrado'}</span>
            </div>

            <div className="profile-row">
              <span className="profile-label">Correo Electrónico</span>
              <span className="profile-value">{user?.email || 'No disponible'}</span>
            </div>
          </div>
        </div>

        <div className="danger-zone">
          <h3 className="danger-zone-title">Zona de Peligro</h3>
          <p className="danger-zone-description">
            Una vez que elimines tu cuenta, no podrás recuperar tus datos ni las tareas creadas. Esta acción es definitiva.
          </p>
          <button
            type="button"
            className="btn-danger"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? 'Eliminando cuenta…' : 'Eliminar Cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileView;
