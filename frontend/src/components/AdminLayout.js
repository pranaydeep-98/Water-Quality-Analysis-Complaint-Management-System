import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  ShieldAlert, 
  BarChart3, 
  Activity, 
  FileText, 
  Settings, 
  LogOut,
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './AdminLayout.css';

const AdminLayout = () => {
  const { user = null, logout = () => {} } = useAuth() || {};
  const [stats, setStats] = useState({ complaints: 0, slaBreaches: 0 });

  useEffect(() => {
    // Fetch initial badge counts
    const fetchBadges = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats({
          complaints: response.data.unresolvedCount || 0,
          slaBreaches: response.data.slaBreachCount || 0
        });
      } catch (err) {
        console.error("Failed to fetch badges", err);
      }
    };
    fetchBadges();
  }, []);

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { name: 'All Complaints', icon: <MessageSquare size={20} />, path: '/admin/complaints', badge: stats.complaints },
    { name: 'Risk Monitor', icon: <ShieldAlert size={20} />, path: '/admin/risk' },
    { name: 'Trend Analysis', icon: <BarChart3 size={20} />, path: '/admin/trends' },
    { name: 'SLA Monitor', icon: <Activity size={20} />, path: '/admin/sla', badge: stats.slaBreaches },
    { name: 'Reports', icon: <FileText size={20} />, path: '/admin/reports' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/admin/settings' },
  ];

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">A</div>
          <span>AquaWatch</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">OVERVIEW</div>
          {navItems.slice(0, 2).map(item => (
            <NavLink key={item.path} to={item.path} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              {item.icon}
              <span>{item.name}</span>
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          ))}

          <div className="nav-section-label">ANALYSIS</div>
          {navItems.slice(2, 4).map(item => (
            <NavLink key={item.path} to={item.path} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}

          <div className="nav-section-label">ACTIONS</div>
          {navItems.slice(4, 5).map(item => (
            <NavLink key={item.path} to={item.path} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              {item.icon}
              <span>{item.name}</span>
              {item.badge > 0 && <span className="nav-badge danger">{item.badge}</span>}
            </NavLink>
          ))}

          <div className="nav-section-label">ADMIN</div>
          {navItems.slice(5).map(item => (
            <NavLink key={item.path} to={item.path} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              {item.icon}
              <span>{item.name}</span>
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
          
          <div className="header-center">
            <div className="header-search">
                <LayoutDashboard size={18} className="search-icon" />
                <input type="text" placeholder="Global search for complaints, areas..." />
            </div>
          </div>

          <div className="header-right">
             <button className="header-icon-btn glass">
               <Bell size={20} />
               <span className="dot"></span>
             </button>
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
