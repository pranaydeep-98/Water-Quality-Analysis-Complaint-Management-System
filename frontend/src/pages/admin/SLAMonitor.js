import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  ShieldCheck,
  CheckCircle,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './SLAMonitor.css';

const SLAMonitor = () => {
  const [complaints, setComplaints] = useState([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data || []);
    } catch (err) {
      console.error("Failed to fetch SLA data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const now = new Date();
  
  const overdue = complaints.filter(c => 
    c.status !== 'Resolved' && c.deadline && new Date(c.deadline) < now
  );

  const nearing = complaints.filter(c => {
    if (c.status === 'Resolved' || !c.deadline) return false;
    const deadline = new Date(c.deadline);
    const diff = (deadline - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 1.5; // Within 36 hours
  });

  const onTrack = complaints.filter(c => 
    c.status !== 'Resolved' && c.deadline && (new Date(c.deadline) - now) / (1000 * 60 * 60 * 24) > 1.5
  );

  return (
    <div className="admin-page-content sla-monitor-simple">
      <div className="sla-summary-row glass-card">
         <div className="summary-item red">
            <span className="count">{overdue.length}</span>
            <label>Breached SLA</label>
         </div>
         <div className="summary-item orange">
            <span className="count">{nearing.length}</span>
            <label>Nearing Breach</label>
         </div>
         <div className="summary-item green">
            <span className="count">{onTrack.length}</span>
            <label>On Track</label>
         </div>
      </div>

      <div className="sla-lists-grid">
         {/* OVERDUE LIST */}
         <div className="sla-list-box glass-card danger-zone">
            <div className="list-header">
               <AlertTriangle size={20} />
               <h3>Critical SLA Breaches</h3>
            </div>
            <div className="task-items scrollable">
               {overdue.map(c => (
                 <div key={c.id} className="task-item glass-mini" onClick={() => navigate('/admin/complaints')}>
                    <div className="task-main">
                       <strong>#{c.id} - {c.area}</strong>
                       <span>{c.issueType}</span>
                    </div>
                    <div className="task-meta text-danger">
                       <Clock size={14} />
                       <span>Overdue</span>
                    </div>
                    <button className="view-link"><Eye size={16} /></button>
                 </div>
               ))}
               {overdue.length === 0 && <div className="empty-task">No critical breaches detected.</div>}
            </div>
         </div>

         {/* NEARING LIST */}
         <div className="sla-list-box glass-card warning-zone">
            <div className="list-header">
               <Clock size={20} />
               <h3>Nearing Deadline (24h)</h3>
            </div>
            <div className="task-items scrollable">
               {nearing.map(c => (
                 <div key={c.id} className="task-item glass-mini" onClick={() => navigate('/admin/complaints')}>
                    <div className="task-main">
                       <strong>#{c.id} - {c.area}</strong>
                       <span>{c.issueType}</span>
                    </div>
                    <div className="task-meta text-warning">
                       <Activity size={14} />
                       <span>{c.deadline}</span>
                    </div>
                    <button className="view-link"><Eye size={16} /></button>
                 </div>
               ))}
               {nearing.length === 0 && <div className="empty-task">No complaints nearing breach.</div>}
            </div>
         </div>
      </div>

      <div className="sla-footer-info glass-card">
         <ShieldCheck size={20} />
         <div className="footer-text">
            <h4>Operational SLA Enforcement</h4>
            <p>Escalated complaints are prioritized automatically. System logs any manual SLA overrides by field officers.</p>
         </div>
         <button className="action-btn" onClick={() => navigate('/admin/complaints')}>
            Deploy Response Team <ChevronRight size={16} />
         </button>
      </div>
    </div>
  );
};

export default SLAMonitor;
