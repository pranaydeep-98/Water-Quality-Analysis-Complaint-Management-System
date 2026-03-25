import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  Home, 
  PlusCircle, 
  List,
  Bell,
  User, 
  LogOut,
  Droplets
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './UserLayout.css';

const UserLayout = () => {
  const { user = null, logout = () => {} } = useAuth() || {};
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count || 0);
    } catch (err) {
      console.error("Failed to fetch unread count");
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 20000); // 20s refresh for bell
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="user-app-container">
      <header className="user-navbar glass">
        <div className="navbar-content">
          <div className="navbar-brand" onClick={() => navigate('/user/dashboard')}>
            <Droplets size={24} className="brand-icon-aqua" />
            <span>AquaWatch</span>
          </div>

          <nav className="navbar-links">
            <NavLink to="/user/dashboard" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
              <Home size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/user/submit" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
              <PlusCircle size={18} />
              <span>Report Issue</span>
            </NavLink>
            <NavLink to="/user/complaints" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
              <List size={18} />
              <span>Operational logs</span>
            </NavLink>
            <NavLink to="/user/notifications" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
              <div className="nav-icon-wrapper">
                 <Bell size={18} />
                 {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
              </div>
              <span>Alerts</span>
            </NavLink>
          </nav>

          <div className="navbar-actions">
            <div className="user-profile-menu">
              <span className="profile-trigger glass">
                <User size={18} />
                <span className="profile-name">{user?.name || 'Citizen'}</span>
              </span>
            </div>
            <button className="navbar-logout-btn" onClick={logout} title="Logout">
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="user-main">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="user-footer">
        <p>© 2026 AquaWatch Intelligent Water Quality Management System</p>
      </footer>
    </div>
  );
};

export default UserLayout;
