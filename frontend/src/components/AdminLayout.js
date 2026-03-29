
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Activity,
  LogOut,
  AlertTriangle,
  Clock,
  Info,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './AdminLayout.css';

/* ------------------------------------------------------------------ */
/* AdminLayout                                                          */
/* ------------------------------------------------------------------ */
const AdminLayout = () => {
  const { user = null, logout = () => { } } = useAuth() || {};
  const [stats, setStats] = useState({ complaints: 0, slaBreaches: 0 });

  // Fetch sidebar badges
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const response = await api.get('/complaints/metrics');
        setStats({
          complaints: response.data.pending || 0,
          slaBreaches: response.data.overdue || 0,
        });
      } catch (err) {
        console.error('Failed to fetch badges', err);
      }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 15000);
    return () => clearInterval(interval);
  }, []);



  const navItems = [
    { name: 'Dashboard',    icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { name: 'Complaints',   icon: <MessageSquare size={20} />,   path: '/admin/complaints', badge: stats.complaints },
    { name: 'SLA Monitor',  icon: <Activity size={20} />,        path: '/admin/sla', badge: stats.slaBreaches },
  ];

  const navigate = useNavigate();

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">A</div>
          <span>AquaWatch</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">COMMAND CENTER</div>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              {item.icon}
              <span>{item.name}</span>
              {item.badge > 0 && <span className={`nav-badge ${item.name === 'SLA Monitor' ? 'danger' : ''}`}>{item.badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-pill glass">
            <div className="user-avatar">{user?.name?.charAt(0) || 'A'}</div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'Admin'}</span>
              <span className="user-role">Administrator</span>
            </div>
            <button className="logout-button" onClick={logout}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="admin-content">
        <header className="admin-header glass">
          <div className="header-left">
            <h1>{navItems.find(item => window.location.pathname.startsWith(item.path))?.name || 'Dashboard'}</h1>
          </div>

          <div className="header-right">
            {/* Notifications Removed */}
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>


    </div>
  );
};

export default AdminLayout;
