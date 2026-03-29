import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Activity,
  Settings,
  LogOut,
  Bell,
  AlertTriangle,
  Clock,
  Info,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './AdminLayout.css';

/* ------------------------------------------------------------------ */
/* Notification type helpers                                            */
/* ------------------------------------------------------------------ */
const TYPE_CONFIG = {
  SYSTEM_ALERT: {
    icon: <AlertTriangle size={14} />,
    label: 'Critical',
    color: 'notif-critical',
  },
  SLA_ALERT: {
    icon: <Clock size={14} />,
    label: 'Warning',
    color: 'notif-warning',
  },
  ADMIN_NOTICE: {
    icon: <Info size={14} />,
    label: 'Info',
    color: 'notif-info',
  },
  STATUS_UPDATE: {
    icon: <Info size={14} />,
    label: 'Update',
    color: 'notif-info',
  },
  RESOLVED: {
    icon: <Info size={14} />,
    label: 'Resolved',
    color: 'notif-info',
  },
  ESCALATED: {
    icon: <AlertTriangle size={14} />,
    label: 'Escalated',
    color: 'notif-warning',
  },
  HIGH_RISK: {
    icon: <AlertTriangle size={14} />,
    label: 'Critical',
    color: 'notif-critical',
  },
  SLA_WARNING: {
    icon: <Clock size={14} />,
    label: 'Warning',
    color: 'notif-warning',
  },
  SLA_BREACH: {
    icon: <AlertTriangle size={14} />,
    label: 'Critical',
    color: 'notif-critical',
  },
  REPEAT_SUBMISSION: {
    icon: <Info size={14} />,
    label: 'Warning',
    color: 'notif-warning',
  },
  AREA_ALERT: {
    icon: <AlertTriangle size={14} />,
    label: 'Critical',
    color: 'notif-critical',
  },
};

function getConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG['ADMIN_NOTICE'];
}

function timeAgo(isoStr) {
  if (!isoStr) return '';
  const diff = Math.floor((Date.now() - new Date(isoStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ------------------------------------------------------------------ */
/* NotificationDropdown component                                       */
/* ------------------------------------------------------------------ */
const NotificationSidePanel = ({ onClose, navigate }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications/admin/all');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotifClick = async (notif) => {
    if (!notif.read) {
      try {
        await api.put(`/notifications/${notif.id}/read`);
      } catch (err) {
        console.error('Failed to mark notification as read', err);
      }
    }
    
    // Redirect if it's a complaint-related notification
    if (notif.complaintId) {
      navigate(`/admin/complaints?highlight=${notif.complaintId}`);
    }
    onClose();
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const clearAll = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications', err);
    }
  };

  return (
    <>
      <div className="notif-backdrop" onClick={onClose}></div>
      <div className="notif-sidepanel glass">
        <div className="notif-sidepanel-header">
          <div className="notif-header-title-box">
            <span className="notif-title">Notifications</span>
            {notifications.length > 0 && (
              <button className="notif-all-clear-top" onClick={clearAll}>All Clear</button>
            )}
          </div>
          <button className="notif-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="notif-list">
          {loading && (
            <div className="notif-empty">Loading…</div>
          )}
          {!loading && notifications.length === 0 && (
            <div className="notif-empty">No notifications yet.</div>
          )}
          {!loading && notifications.map(notif => {
            const cfg = getConfig(notif.type);
            return (
              <div
                key={notif.id}
                className={`notif-item ${cfg.color} ${!notif.read ? 'unread' : ''}`}
                onClick={() => handleNotifClick(notif)}
              >
                <div className="notif-item-icon">{cfg.icon}</div>
                <div className="notif-item-body">
                  <p className="notif-message">{notif.message}</p>
                  <div className="notif-meta">
                    <span className={`notif-badge ${cfg.color}`}>{cfg.label}</span>
                    <span className="notif-time">{timeAgo(notif.createdAt)}</span>
                  </div>
                </div>
                {!notif.read && <div className="notif-unread-dot" />}
                <button 
                  className="notif-delete-btn always-show" 
                  onClick={(e) => handleDelete(e, notif.id)}>
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* AdminLayout                                                          */
/* ------------------------------------------------------------------ */
const AdminLayout = () => {
  const { user = null, logout = () => {} } = useAuth() || {};
  const [stats, setStats] = useState({ complaints: 0, slaBreaches: 0 });
  const [bellOpen, setBellOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef(null);

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

  // Fetch unread notification count for bell badge
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications/admin/unread');
        setUnreadCount(res.data.length);
      } catch (err) {
        // silently ignore — badge is non-critical
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navItems = [
    { name: 'Dashboard',    icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { name: 'Complaints',   icon: <MessageSquare size={20} />,   path: '/admin/complaints', badge: stats.complaints },
    { name: 'SLA Monitor',  icon: <Activity size={20} />,        path: '/admin/sla', badge: stats.slaBreaches },
    { name: 'Settings',     icon: <Settings size={20} />,        path: '/admin/settings' },
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

          <div className="header-right" ref={bellRef}>
            <button
              id="bell-btn"
              className={`header-icon-btn glass ${bellOpen ? 'active' : ''}`}
              onClick={() => setBellOpen(prev => !prev)}
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            {/* Notification side panel is rendered at root to avoid stacking context issues */}
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>

      {bellOpen && (
        <NotificationSidePanel onClose={() => setBellOpen(false)} navigate={navigate} />
      )}
    </div>
  );
};

export default AdminLayout;
