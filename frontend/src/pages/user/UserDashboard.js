import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  CheckCircle, 
  Clock, 
  MessageSquare,
  Bell,
  AlertCircle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user = null } = useAuth() || {};
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, inProgress: 0, escalated: 0, overdue: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await api.get('/complaints/metrics');
      setStats(statsRes.data || { total: 0, resolved: 0, pending: 0, inProgress: 0, escalated: 0, overdue: 0 });

      const complRes = await api.get('/complaints/user');
      setRecentComplaints(complRes.data?.slice(0, 5) || []);
      
    } catch (err) {
      console.error("Failed to fetch user dashboard data", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusClass = (status) => {
    if (status === 'Pending') return 'status-gold';
    if (status === 'In Progress') return 'status-blue';
    if (status === 'Resolved') return 'status-green';
    if (status === 'Escalated') return 'status-red';
    return 'status-gray';
  };



  return (
    <div className="user-dashboard-wrapper">
      <div className="welcome-banner glass-card">
        <div className="banner-content">
          <h1>Hello {user?.name || 'Citizen'}, here's your operational summary</h1>
          <p>Real-time tracking of your filed complaints and critical water quality alerts.</p>
        </div>
        <button className="submit-quick-btn" onClick={() => navigate('/user/submit')}>
          <PlusCircle size={20} />
          <span>New Complaint</span>
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
             <span className="val">{stats.pending + stats.inProgress + stats.escalated}</span>
             <span className="label">Active Issues</span>
          </div>
        </div>
        <div className="user-kpi glass">
          <div className="kpi-icon overdue"><AlertCircle size={20} /></div>
          <div className="kpi-info">
             <span className="val">{stats.overdue}</span>
             <span className="label">Overdue</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid user-logs-only">
         <div className="recent-activity-panel glass-card full-width-panel">
            <div className="card-header">
               <h2>Action Log</h2>
               <button className="text-btn" onClick={() => navigate('/user/complaints')}>View All Logs <ArrowRight size={14} /></button>
            </div>
            
            <div className="recent-list">
               {recentComplaints.length > 0 ? recentComplaints.map(c => (
                 <div key={c.id} className="recent-item glass-mini">
                    <div className="complaint-brief">
                       <span className="c-id">#{c.id}</span>
                       <span className="c-type">{c.issueType}</span>
                    </div>
                    <div className="complaint-meta">
                       <span className="c-date">{new Date(c.createdDate).toLocaleDateString()}</span>
                       <span className={`status-badge ${getStatusClass(c.status)}`}>{c.status}</span>
                    </div>
                 </div>
               )) : (
                 <div className="empty-state">No active operational logs.</div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default UserDashboard;
