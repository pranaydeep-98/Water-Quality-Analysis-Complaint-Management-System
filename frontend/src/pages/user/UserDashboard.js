import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  CheckCircle, 
  Clock, 
  Droplets,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user = null } = useAuth() || {};
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });
  const [activeComplaints, setActiveComplaints] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const statsRes = await api.get('/user/stats');
        setStats(statsRes.data || { total: 4, resolved: 2, pending: 2 });

        const complaintsRes = await api.get('/complaints?status=Open');
        setActiveComplaints(complaintsRes.data.content?.slice(0, 2) || [
          { id: 4398, issueType: 'Discoloration', area: 'Central Park', severity: 'Medium', status: 'Under Review', slaCountdown: '4h left', step: 2 },
          { id: 4312, issueType: 'Pressure', area: 'Lakeside', severity: 'Low', status: 'In Progress', slaCountdown: 'Breached', step: 3 }
        ]);

        setActivity([
          { id: 1, type: 'status', msg: 'Complaint #4398 moved to "Under Review"', time: '2 hours ago' },
          { id: 2, type: 'comment', msg: 'Officer assigned to your report #4312', time: 'Yesterday' },
          { id: 3, type: 'resolved', msg: 'Complaint #4255 has been marked as Resolved', time: '3 days ago' }
        ]);
      } catch (err) {
        console.error("Failed to fetch user dashboard data", err);
      }
    };
    fetchUserData();
  }, []);

  return (
    <div className="user-dashboard-wrapper">
      <div className="welcome-banner glass-card">
        <div className="banner-content">
          <h1>Hello {user?.name || 'Citizen'},</h1>
          <p>Welcome back to AquaWatch. Here's your water complaint summary and active report status.</p>
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

      <div className="dashboard-layout">
        <div className="active-complaints-section">
          <div className="section-header">
            <h2>Active Tracking</h2>
            <button className="text-btn" onClick={() => navigate('/user/complaints')}>View All</button>
          </div>
          <div className="complaint-cards-list">
            {activeComplaints.map(c => (
              <div key={c.id} className="active-complaint-card glass-card">
                 <div className="card-top">
                    <div className="id-badge">#{c.id}</div>
                    <span className={`badge badge-${c.severity?.toLowerCase()}`}>{c.severity}</span>
                 </div>
                 <div className="card-middle">
                    <h3>{c.issueType}</h3>
                    <p>{c.area}</p>
                 </div>
                 <div className="sla-banner">
                    <Clock size={14} />
                    <span>Estimated Resolution: <strong>{c.slaCountdown}</strong></span>
                 </div>
                 
                 <div className="stepper">
                    <Step index={1} active={c.step >= 1} label="Submitted" />
                    <Step index={2} active={c.step >= 2} label="Assigned" />
                    <Step index={3} active={c.step >= 3} label="Progress" />
                    <Step index={4} active={c.step >= 4} label="Resolved" />
                 </div>
              </div>
            ))}
          </div>
        </div>

        <div className="side-panel">
          <div className="activity-feed glass-card">
            <h3>Recent Activity</h3>
            <div className="activity-list">
               {activity.map(act => (
                 <div key={act.id} className="activity-item">
                   <div className="activity-dot"></div>
                   <div className="activity-info">
                      <p>{act.msg}</p>
                      <span>{act.time}</span>
                   </div>
                 </div>
               ))}
            </div>
          </div>
          
          <div className="quick-info glass-card">
             <Droplets size={24} className="text-primary" />
             <h4>Need immediate help?</h4>
             <p>For emergency water leaks or structural damage, call our 24/7 hotline at <strong>1-800-AQUA</strong>.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Step = ({ index, active, label }) => (
  <div className={`step-item ${active ? 'active' : ''}`}>
    <div className="step-circle">{active ? <CheckCircle size={14} /> : index}</div>
    <span className="step-label">{label}</span>
  </div>
);

export default UserDashboard;
