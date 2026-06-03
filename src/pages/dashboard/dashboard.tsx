import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import './dashboard.css';

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      {/* ── Mobile Header ── */}
      <header className="mobile-header">
        <button 
          className="btn-menu" 
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menú"
        >
          ☰
        </button>
        <h1 className="mobile-title">TODO List</h1>
      </header>

      {/* ── Sidebar ── */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Main Content Area (Nested Routes) ── */}
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}

export default Dashboard;
