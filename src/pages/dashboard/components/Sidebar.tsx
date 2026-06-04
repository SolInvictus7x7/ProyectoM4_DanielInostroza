import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../services/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout } = useAuth();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}

      <aside className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>TODO List</h2>
          <button className="btn-close-sidebar" onClick={onClose} aria-label="Cerrar menú">
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard/profile"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            Mi Perfil
          </NavLink>
          <NavLink
            to="/dashboard/groups"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            Mis Grupos
          </NavLink>
          <NavLink
            to="/dashboard/tasks"
            className={({ isActive }) => `sidebar-link sidebar-link--with-sub ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            Ver Tareas
            <span className="sidebar-link-sub">Listado de mis tareas</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout-sidebar" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
