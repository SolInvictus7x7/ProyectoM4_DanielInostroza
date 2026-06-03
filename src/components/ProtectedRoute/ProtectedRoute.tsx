import { Navigate } from 'react-router-dom';
import { useAuth } from '../../services/auth';
import '../../pages/home/home.css'; // reuse page-loading spinner

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps a route so only authenticated users can access it.
 * - While Firebase resolves the session: shows a full-page spinner (prevents redirect flicker on refresh)
 * - If unauthenticated: redirects to "/" with `replace`, so the browser back-button
 *   cannot return to the protected URL from the history stack.
 */
function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loading" aria-label="Verificando sesión">
        <span className="page-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
