import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  CheckCircle, 
  Clock, 
  Droplets,
  MessageSquare,
  Bell,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user = null } = useAuth() || {};
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const statsRes = await api.get('/user/stats');
        setStats(statsRes.data || { total: 0, resolved: 0, pending: 0 });

        const complRes = await api.get('/user/complaints');
        setRecentComplaints(complRes.data.content?.slice(0, 5) || complRes.data?.slice(0, 5) || [
          { id: 1001, issueType: 'Water contamination', status: 'Pending', createdDate: '2026-03-21' },
          { id: 1002, issueType: 'Leakage', status: 'Resolved', createdDate: '2026-03-18' }
        ]);

        const notifRes = await api.get('/notifications/user');
        setNotifications(notifRes.data || [
          { id: 1, message: 'Status updated to In Progress', type: 'INFO', createdAt: '2 hours ago' },
          { id: 2, message: 'High risk area alert for Block A', type: 'WARNING', createdAt: '1 day ago' }
        ]);
        
      } catch (err) {
        console.error("Failed to fetch user dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getStatusColor = (status) => {
    if (status === 'Pending') return 'status-gold';
    if (status === 'In Progress') return 'status-blue';
    if (status === 'Resolved') return 'status-green';
    if (status === 'Overdue') return 'status-red';
    return 'status-gray';
  };

  const getNotifIcon = (type) => {
    if (type === 'WARNING') return <AlertCircle size={16} className="text-warning" />;
    if (type === 'HIGH_RISK') return <Zap size={16} className="text-danger" />;
    return <Bell size={16} className="text-primary" />;
  };

  return (
    <div className="user-dashboard-wrapper">
      <div className="welcome-banner glass-card">
        <div className="banner-content">
          <h1>Hello {user?.name || 'Citizen'}, here's your complaint summary</h1>
          <p>Track your submitted issues and monitor water quality alerts in your area.</p>
        </div>
        <button className="submit-quick-btn" onClick={() => navigate('/user/submit')}>
          <PlusCircle size={20} />
          <span>Submit New Complaint</span>
        </button>
      </div>

      <div className="stats-row">
        <div className="user-kpi glass">
          <div className="kpi-icon total"><MessageSquare size={20} /></div>
          <div className="kpi-info">
             <span className="val">{stats.total}</span>
             <span className="label">Total Filed</span>
          </div>
        </div>
        <div className="user-kpi glass">
          <div className="kpi-icon resolved"><CheckCircle size={20} /></div>
          <div className="kpi-info">
             <span className="val">{stats.resolved}</span>
             <span className="label">Resolved</span>
          </div>
        </div>
        <div className="user-kpi glass">
          <div className="kpi-icon pending"><Clock size={20} /></div>
          <div className="kpi-info">
             <span className="val">{stats.pending}</span>
             <span className="label">Pending</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid user-grid">
         <div className="recent-activity-panel glass-card">
            <div className="card-header">
               <h2>Recent Activity Feed</h2>
               <button className="text-btn" onClick={() => navigate('/user/complaints')}>View All</button>
            </div>
            
            <div className="recent-list">
               {recentComplaints.length > 0 ? recentComplaints.map(c => (
                 <div key={c.id} className="recent-item glass-mini hide-border">
                    <div className="complaint-brief">
                       <span className="c-id">#{c.id}</span>
                       <span className="c-type">{c.issueType}</span>
                    </div>
                    <div className="complaint-meta">
                       <span className="c-date">{new Date(c.createdDate).toLocaleDateString()}</span>
                       <span className={`status-badge ${getStatusColor(c.status)}`}>{c.status}</span>
                    </div>
                 </div>
               )) : (
                 <div className="empty-state">No complaints filed yet.</div>
               )}
            </div>
         </div>

         <div className="notifications-panel glass-card">
            <div className="card-header">
               <h2>Notifications</h2>
               <Bell size={18} className="text-muted" />
            </div>

            <div className="notif-list">
               {notifications.length > 0 ? notifications.map(n => (
                 <div key={n.id} className="notif-item">
                    <div className="notif-icon-wrap">
                       {getNotifIcon(n.type)}
                    </div>
                    <div className="notif-content">
                       <p>{n.message}</p>
                       <span>{n.createdAt}</span>
                    </div>
                 </div>
               )) : (
                 <div className="empty-state">No new notifications.</div>
               )}
            </div>
            <button className="view-all-btn mt-auto" onClick={() => navigate('/user/notifications')}>See All Notifications</button>
         </div>
      </div>
    </div>
  );
};

export default UserDashboard;
