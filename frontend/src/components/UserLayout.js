import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  Home, 
  PlusCircle, 
  ListOrdered, 
  Search, 
  User, 
  LogOut,
  Droplets
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './UserLayout.css';

const UserLayout = () => {
  const { user = null, logout = () => {} } = useAuth() || {};
  const navigate = useNavigate();

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
              <span>New Complaint</span>
            </NavLink>
            <NavLink to="/user/complaints" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
              <ListOrdered size={18} />
              <span>My Reports</span>
            </NavLink>
            <NavLink to="/user/track" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
              <Search size={18} />
              <span>Track Status</span>
            </NavLink>
          </nav>

          <div className="navbar-actions">
            <div className="user-profile-menu">
              <NavLink to="/user/profile" className="profile-trigger glass">
                <User size={18} />
                <span className="profile-name">{user?.name || 'Citizen'}</span>
              </NavLink>
            </div>
            <button className="navbar-logout-btn" onClick={logout} title="Logout">
              <LogOut size={18} />
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
